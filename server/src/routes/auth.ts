import { Router, type Response } from 'express'
import { pool } from '../db.js'
import bcrypt from 'bcryptjs'
import { generateToken, authMiddleware, type AuthRequest } from '../auth.js'

const router = Router()
const SALT_ROUNDS = 12

router.post('/register', async (req, res: Response) => {
  try {
    const { username, password, nickname } = req.body
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' })
      return
    }
    if (username.length < 3 || username.length > 32) {
      res.status(400).json({ error: '用户名长度需在3-32个字符之间' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码长度不能少于6位' })
      return
    }

    const [existing] = await pool.query('SELECT id FROM user WHERE username = ?', [username])
    if ((existing as any[]).length > 0) {
      res.status(409).json({ error: '用户名已存在' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const displayName = nickname || username

    const [result] = await pool.query(
      'INSERT INTO user (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, displayName]
    )
    const userId = (result as any).insertId

    await initUserPresetData(userId)

    const token = generateToken({ userId, username })
    res.status(201).json({
      token,
      user: { id: userId, username, nickname: displayName, avatar: '' },
    })
  } catch (e: any) {
    console.error('Register error:', e)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

router.post('/login', async (req, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' })
      return
    }

    const [rows] = await pool.query(
      'SELECT id, username, password, nickname, avatar FROM user WHERE username = ?',
      [username]
    )
    const users = rows as any[]
    if (users.length === 0) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    const token = generateToken({ userId: user.id, username: user.username })
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar || '',
      },
    })
  } catch (e: any) {
    console.error('Login error:', e)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar, created_at FROM user WHERE id = ?',
      [req.userId]
    )
    const users = rows as any[]
    if (users.length === 0) {
      res.status(404).json({ error: '用户不存在' })
      return
    }
    const user = users[0]
    res.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar || '',
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { nickname, avatar } = req.body
    const fields: string[] = []
    const values: any[] = []
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname) }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar) }
    if (fields.length === 0) {
      res.json({ updated: 0 })
      return
    }
    values.push(req.userId)
    await pool.query(`UPDATE user SET ${fields.join(', ')} WHERE id = ?`, values)
    res.json({ updated: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

async function initUserPresetData(userId: number): Promise<void> {
  const presetCategories = [
    { name: '餐饮', icon: '🍜', type: 'expense', sort: 0 },
    { name: '交通', icon: '🚗', type: 'expense', sort: 1 },
    { name: '购物', icon: '🛍️', type: 'expense', sort: 2 },
    { name: '居住', icon: '🏠', type: 'expense', sort: 3 },
    { name: '娱乐', icon: '🎮', type: 'expense', sort: 4 },
    { name: '医疗', icon: '💊', type: 'expense', sort: 5 },
    { name: '教育', icon: '📚', type: 'expense', sort: 6 },
    { name: '通讯', icon: '📱', type: 'expense', sort: 7 },
    { name: '人情', icon: '🎁', type: 'expense', sort: 8 },
    { name: '其他', icon: '🐱', type: 'expense', sort: 9 },
    { name: '工资', icon: '💰', type: 'income', sort: 10 },
    { name: '奖金', icon: '🏆', type: 'income', sort: 11 },
    { name: '理财', icon: '📈', type: 'income', sort: 12 },
    { name: '兼职', icon: '💼', type: 'income', sort: 13 },
    { name: '红包', icon: '🧧', type: 'income', sort: 14 },
    { name: '其他', icon: '😺', type: 'income', sort: 15 },
  ]
  for (const cat of presetCategories) {
    await pool.query(
      'INSERT INTO category (name, icon, type, is_preset, sort_order, user_id) VALUES (?, ?, ?, 1, ?, ?)',
      [cat.name, cat.icon, cat.type, cat.sort, userId]
    )
  }

  const presetAccounts = [
    { name: '现金', icon: '💵' },
    { name: '微信', icon: '💚' },
    { name: '支付宝', icon: '🔵' },
    { name: '银行卡', icon: '💳' },
  ]
  for (const acc of presetAccounts) {
    await pool.query(
      'INSERT INTO account (name, icon, is_preset, user_id) VALUES (?, ?, 1, ?)',
      [acc.name, acc.icon, userId]
    )
  }
}

export default router