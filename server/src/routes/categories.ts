import { Router } from 'express'
import { pool } from '../db.js'
import { type AuthRequest } from '../auth.js'

const router = Router()

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { type } = req.query
    let sql = 'SELECT * FROM category WHERE user_id = ? ORDER BY sort_order ASC'
    const params: any[] = [userId]
    if (type) {
      sql = 'SELECT * FROM category WHERE user_id = ? AND type = ? ORDER BY sort_order ASC'
      params.push(type)
    }
    const [rows] = await pool.query(sql, params)
    const categories = (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      type: r.type,
      isPreset: !!r.is_preset,
      isHidden: !!r.is_hidden,
      sortOrder: r.sort_order,
    }))
    res.json(categories)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { name, icon, type, isPreset, isHidden, sortOrder } = req.body
    const [result] = await pool.query(
      'INSERT INTO category (name, icon, type, is_preset, is_hidden, sort_order, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, icon, type, isPreset ? 1 : 0, isHidden ? 1 : 0, sortOrder ?? 0, userId]
    )
    res.json({ id: (result as any).insertId })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { id } = req.params
    const fields: string[] = []
    const values: any[] = []
    const map: Record<string, string> = {
      name: 'name', icon: 'icon', type: 'type', isPreset: 'is_preset',
      isHidden: 'is_hidden', sortOrder: 'sort_order',
    }
    for (const [key, col] of Object.entries(map)) {
      if (req.body[key] !== undefined) {
        fields.push(`${col} = ?`)
        values.push(key === 'isPreset' || key === 'isHidden' ? (req.body[key] ? 1 : 0) : req.body[key])
      }
    }
    if (fields.length === 0) return res.json({ updated: 0 })
    values.push(id)
    values.push(userId)
    await pool.query(`UPDATE category SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values)
    res.json({ updated: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    await pool.query('DELETE FROM category WHERE id = ? AND user_id = ?', [req.params.id, userId])
    res.json({ deleted: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router