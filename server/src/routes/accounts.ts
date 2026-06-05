import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM account ORDER BY id ASC')
    const [billRows] = await pool.query('SELECT account_id, type, amount FROM bill')
    const balanceMap = new Map<number, number>()
    for (const b of billRows as any[]) {
      const cur = balanceMap.get(b.account_id) || 0
      balanceMap.set(b.account_id, cur + (b.type === 'income' ? Number(b.amount) : -Number(b.amount)))
    }
    const accounts = (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      isPreset: !!r.is_preset,
      balance: balanceMap.get(r.id) || 0,
    }))
    res.json(accounts)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, icon } = req.body
    const [result] = await pool.query(
      'INSERT INTO account (name, icon, is_preset) VALUES (?, ?, 0)',
      [name, icon]
    )
    res.json({ id: (result as any).insertId })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const fields: string[] = []
    const values: any[] = []
    if (req.body.name !== undefined) { fields.push('name = ?'); values.push(req.body.name) }
    if (req.body.icon !== undefined) { fields.push('icon = ?'); values.push(req.body.icon) }
    if (fields.length === 0) return res.json({ updated: 0 })
    values.push(id)
    await pool.query(`UPDATE account SET ${fields.join(', ')} WHERE id = ?`, values)
    res.json({ updated: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM account WHERE id = ?', [req.params.id])
    res.json({ deleted: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
