import { Router } from 'express'
import { pool } from '../db.js'
import { type AuthRequest } from '../auth.js'

const router = Router()

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { month } = req.query
    let sql = 'SELECT * FROM budget WHERE user_id = ? ORDER BY id ASC'
    const params: any[] = [userId]
    if (month) { sql = 'SELECT * FROM budget WHERE user_id = ? AND month = ? ORDER BY id ASC'; params.push(month) }
    const [rows] = await pool.query(sql, params)
    res.json((rows as any[]).map((r) => ({
      id: r.id,
      month: r.month,
      categoryId: r.category_id,
      amount: Number(r.amount),
    })))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { month, categoryId, amount } = req.body
    const [existing] = await pool.query(
      'SELECT id FROM budget WHERE user_id = ? AND month = ? AND category_id <=> ?',
      [userId, month, categoryId ?? null]
    )
    if ((existing as any[]).length > 0) {
      const id = (existing as any[])[0].id
      await pool.query('UPDATE budget SET amount = ? WHERE id = ?', [amount, id])
      res.json({ id })
    } else {
      const [result] = await pool.query(
        'INSERT INTO budget (month, category_id, amount, user_id) VALUES (?, ?, ?, ?)',
        [month, categoryId ?? null, amount, userId]
      )
      res.json({ id: (result as any).insertId })
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    await pool.query('DELETE FROM budget WHERE id = ? AND user_id = ?', [req.params.id, userId])
    res.json({ deleted: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router