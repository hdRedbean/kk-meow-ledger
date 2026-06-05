import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

function formatBill(r: any) {
  return {
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    categoryId: r.category_id,
    accountId: r.account_id,
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    note: r.note || '',
    createdAt: new Date(r.created_at).getTime(),
  }
}

router.get('/', async (req, res) => {
  try {
    const { month, type, categoryId, keyword } = req.query
    let sql = 'SELECT * FROM bill WHERE 1=1'
    const params: any[] = []
    if (month) {
      sql += ' AND date >= ? AND date <= ?'
      const [y, m] = String(month).split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      params.push(`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`)
    }
    if (type) { sql += ' AND type = ?'; params.push(type) }
    if (categoryId) { sql += ' AND category_id = ?'; params.push(categoryId) }
    if (keyword) { sql += ' AND note LIKE ?'; params.push(`%${keyword}%`) }
    sql += ' ORDER BY date DESC, created_at DESC'
    const [rows] = await pool.query(sql, params)
    res.json((rows as any[]).map(formatBill))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { type, amount, categoryId, accountId, date, note } = req.body
    const [result] = await pool.query(
      'INSERT INTO bill (type, amount, category_id, account_id, date, note) VALUES (?, ?, ?, ?, ?, ?)',
      [type, amount, categoryId, accountId, date, note || '']
    )
    res.json({ id: (result as any).insertId })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const map: Record<string, string> = {
      type: 'type', amount: 'amount', categoryId: 'category_id',
      accountId: 'account_id', date: 'date', note: 'note',
    }
    const fields: string[] = []
    const values: any[] = []
    for (const [key, col] of Object.entries(map)) {
      if (req.body[key] !== undefined) { fields.push(`${col} = ?`); values.push(req.body[key]) }
    }
    if (fields.length === 0) return res.json({ updated: 0 })
    values.push(id)
    await pool.query(`UPDATE bill SET ${fields.join(', ')} WHERE id = ?`, values)
    res.json({ updated: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bill WHERE id = ?', [req.params.id])
    res.json({ deleted: 1 })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/stats/monthly', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) return res.status(400).json({ error: 'month is required' })
    const [y, m] = String(month).split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`
    const [rows] = await pool.query(
      `SELECT type, SUM(amount) as total FROM bill WHERE date >= ? AND date <= ? GROUP BY type`,
      [start, end]
    )
    let income = 0, expense = 0
    for (const r of rows as any[]) {
      if (r.type === 'income') income = Number(r.total)
      else expense = Number(r.total)
    }
    res.json({ income, expense, balance: income - expense })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/stats/category', async (req, res) => {
  try {
    const { month, type } = req.query
    if (!month) return res.status(400).json({ error: 'month is required' })
    const [y, m] = String(month).split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`
    const [rows] = await pool.query(
      `SELECT c.id as categoryId, c.name as categoryName, c.icon as categoryIcon, SUM(b.amount) as amount
       FROM bill b JOIN category c ON b.category_id = c.id
       WHERE b.date >= ? AND b.date <= ? AND b.type = ?
       GROUP BY b.category_id ORDER BY amount DESC`,
      [start, end, type || 'expense']
    )
    const total = (rows as any[]).reduce((s, r) => s + Number(r.amount), 0)
    const result = (rows as any[]).map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      amount: Number(r.amount),
      percentage: total > 0 ? Math.round((Number(r.amount) / total) * 1000) / 10 : 0,
    }))
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/stats/daily', async (req, res) => {
  try {
    const { month } = req.query
    if (!month) return res.status(400).json({ error: 'month is required' })
    const [y, m] = String(month).split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`
    const [rows] = await pool.query(
      `SELECT date, type, SUM(amount) as total FROM bill WHERE date >= ? AND date <= ? GROUP BY date, type ORDER BY date`,
      [start, end]
    )
    const dailyMap = new Map<string, { date: string; income: number; expense: number }>()
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      dailyMap.set(dateStr, { date: String(d), income: 0, expense: 0 })
    }
    for (const r of rows as any[]) {
      const dateStr = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date)
      const entry = dailyMap.get(dateStr)
      if (entry) {
        if (r.type === 'income') entry.income = Number(r.total)
        else entry.expense = Number(r.total)
      }
    }
    res.json(Array.from(dailyMap.values()))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/stats/yearly', async (req, res) => {
  try {
    const { year } = req.query
    if (!year) return res.status(400).json({ error: 'year is required' })
    const y = Number(year)
    const [rows] = await pool.query(
      `SELECT MONTH(date) as m, type, SUM(amount) as total FROM bill WHERE YEAR(date) = ? GROUP BY MONTH(date), type ORDER BY m`,
      [y]
    )
    const monthMap = new Map<number, { month: string; income: number; expense: number }>()
    for (let i = 1; i <= 12; i++) {
      monthMap.set(i, { month: `${i}月`, income: 0, expense: 0 })
    }
    for (const r of rows as any[]) {
      const entry = monthMap.get(r.m)
      if (entry) {
        if (r.type === 'income') entry.income = Number(r.total)
        else entry.expense = Number(r.total)
      }
    }
    res.json(Array.from(monthMap.values()))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

export default router
