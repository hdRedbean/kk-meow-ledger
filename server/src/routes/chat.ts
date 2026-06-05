import { Router } from 'express'
import { pool } from '../db.js'
import { chat } from '../ai/index.js'

const router = Router()

router.get('/conversations', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM chat_message WHERE conversation_id = c.id) as message_count
       FROM chat_conversation c ORDER BY c.updated_at DESC`
    )
    res.json(rows)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/conversations', async (req, res) => {
  try {
    const { title } = req.body
    const [result] = await pool.query(
      'INSERT INTO chat_conversation (title) VALUES (?)',
      [title || '新对话']
    )
    res.json({ id: (result as any).insertId })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/conversations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_conversation WHERE id = ?', [req.params.id])
    res.json({ deleted: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/conversations/:id/messages', async (req, res) => {
  try {
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
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { message, conversationId } = req.body
    if (!message) return res.status(400).json({ error: 'message is required' })

    let convId = conversationId
    if (!convId) {
      const [result] = await pool.query('INSERT INTO chat_conversation (title) VALUES (?)', [message.slice(0, 50)])
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

    const { assistantContent } = await chat(message, history.slice(0, -1))

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
    console.error('Chat error:', e)
    res.status(500).json({ error: e.message || 'AI service error' })
  }
})

export default router
