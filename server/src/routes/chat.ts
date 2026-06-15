import { Router, type Request, type Response, type NextFunction } from 'express'
import { pool } from '../db.js'
import { chat, streamChat } from '../ai/index.js'
import { chatRateLimitMeta } from '../ai/limiter.js'
import { type AuthRequest } from '../auth.js'
import { logger } from '../logger.js'

const router = Router()

const ipMinuteMap = new Map<string, { count: number; resetAt: number }>()
const ipDayMap = new Map<string, { count: number; resetAt: number }>()

function ipRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()

  const minuteRecord = ipMinuteMap.get(ip)
  if (!minuteRecord || now > minuteRecord.resetAt) {
    ipMinuteMap.set(ip, { count: 1, resetAt: now + chatRateLimitMeta.windowMs })
  } else if (minuteRecord.count >= chatRateLimitMeta.max) {
    res.status(429).json({ error: '请求过于频繁，请稍后再试' })
    return
  } else {
    minuteRecord.count++
  }

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const endOfDay = startOfDay + 86_400_000
  const dayRecord = ipDayMap.get(ip)
  if (!dayRecord || now > dayRecord.resetAt) {
    ipDayMap.set(ip, { count: 1, resetAt: endOfDay })
  } else if (dayRecord.count >= chatRateLimitMeta.dailyMax) {
    res.status(429).json({ error: '今日对话次数已达上限，明天再来吧 🐱' })
    return
  } else {
    dayRecord.count++
  }

  next()
}

router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM chat_message WHERE conversation_id = c.id) as message_count
       FROM chat_conversation c WHERE c.user_id = ? ORDER BY c.updated_at DESC`,
      [userId]
    )
    res.json(rows)
  } catch (e: any) {
    logger.error(`对话列表异常: userId=${(req as AuthRequest).userId} ${e.message}`)
    res.status(500).json({ error: e.message })
  }
})

router.post('/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { title } = req.body
    const [result] = await pool.query(
      'INSERT INTO chat_conversation (title, user_id) VALUES (?, ?)',
      [title || '新对话', userId]
    )
    res.json({ id: (result as any).insertId })
  } catch (e: any) {
    logger.error(`创建对话异常: ${e.message}`)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/conversations/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    await pool.query('DELETE FROM chat_conversation WHERE id = ? AND user_id = ?', [req.params.id, userId])
    res.json({ deleted: 1 })
  } catch (e: any) {
    logger.error(`删除对话异常: ${e.message}`)
    res.status(500).json({ error: e.message })
  }
})

router.get('/conversations/:id/messages', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const [convRows] = await pool.query('SELECT id FROM chat_conversation WHERE id = ? AND user_id = ?', [req.params.id, userId])
    if ((convRows as any[]).length === 0) {
      res.status(404).json({ error: '对话不存在' })
      return
    }
    const [rows] = await pool.query(
      'SELECT id, role, content, created_at FROM chat_message WHERE conversation_id = ? ORDER BY id ASC',
      [req.params.id]
    )
    res.json((rows as any[]).map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      createdAt: new Date(r.created_at).getTime(),
    })))
  } catch (e: any) {
    logger.error(`获取消息异常: ${e.message}`)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', ipRateLimit, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { message, conversationId } = req.body
    if (!message) return res.status(400).json({ error: 'message is required' })

    let convId = conversationId
    if (!convId) {
      const [result] = await pool.query('INSERT INTO chat_conversation (title, user_id) VALUES (?, ?)', [message.slice(0, 50), userId])
      convId = (result as any).insertId
    }

    await pool.query(
      'INSERT INTO chat_message (conversation_id, role, content) VALUES (?, ?, ?)',
      [convId, 'user', message]
    )

    const [historyRows] = await pool.query(
      'SELECT role, content FROM chat_message WHERE conversation_id = ? ORDER BY id ASC',
      [convId]
    )
    const history = (historyRows as any[]).map((r) => ({ role: r.role, content: r.content }))

    const { assistantContent } = await chat(message, history.slice(0, -1), userId)

    await pool.query(
      'INSERT INTO chat_message (conversation_id, role, content) VALUES (?, ?, ?)',
      [convId, 'assistant', assistantContent]
    )

    await pool.query(
      'UPDATE chat_conversation SET title = ? WHERE id = ? AND (title = ? OR title = ?)',
      [message.slice(0, 50), convId, '新对话', '']
    )

    res.json({
      conversationId: convId,
      assistantMessage: { role: 'assistant', content: assistantContent, createdAt: Date.now() },
    })
  } catch (e: any) {
    logger.error(`对话异常: userId=${req.userId} ${e.message}`)
    res.status(500).json({ error: e.message || 'AI service error' })
  }
})

router.post('/stream', ipRateLimit, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { message, conversationId } = req.body
  if (!message) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    let convId = conversationId
    if (!convId) {
      const [result] = await pool.query('INSERT INTO chat_conversation (title, user_id) VALUES (?, ?)', [message.slice(0, 50), userId])
      convId = (result as any).insertId
      res.write(`data: ${JSON.stringify({ type: 'conversationId', conversationId: convId })}\n\n`)
    }

    await pool.query(
      'INSERT INTO chat_message (conversation_id, role, content) VALUES (?, ?, ?)',
      [convId, 'user', message],
    )

    const [historyRows] = await pool.query(
      'SELECT role, content FROM chat_message WHERE conversation_id = ? ORDER BY id ASC',
      [convId],
    )
    const history = (historyRows as any[]).slice(0, -1).map((r) => ({ role: r.role, content: r.content }))

    const fullContent = await streamChat(message, history, (text) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`)
    }, userId)

    await pool.query(
      'INSERT INTO chat_message (conversation_id, role, content) VALUES (?, ?, ?)',
      [convId, 'assistant', fullContent],
    )
    await pool.query(
      'UPDATE chat_conversation SET title = ? WHERE id = ? AND (title = ? OR title = ?)',
      [message.slice(0, 50), convId, '新对话', ''],
    )

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  } catch (e: any) {
    logger.error(`流式对话异常: userId=${req.userId} ${e.message}`)
    res.write(`data: ${JSON.stringify({ type: 'error', error: e.message || 'AI service error' })}\n\n`)
    res.end()
  }
})

export default router