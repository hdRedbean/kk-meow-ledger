import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db.js'
import { authMiddleware, type AuthRequest } from './auth.js'
import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import accountsRouter from './routes/accounts.js'
import billsRouter from './routes/bills.js'
import budgetsRouter from './routes/budgets.js'
import chatRouter from './routes/chat.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)

app.use('/api/categories', authMiddleware, categoriesRouter)
app.use('/api/accounts', authMiddleware, accountsRouter)
app.use('/api/bills', authMiddleware, billsRouter)
app.use('/api/budgets', authMiddleware, budgetsRouter)
app.use('/api/chat', authMiddleware, chatRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

async function start() {
  try {
    const conn = await pool.getConnection()
    conn.release()
    console.log('✅ MySQL connected')
  } catch (e) {
    console.error('❌ MySQL connection failed:', e)
  }

  app.listen(PORT, () => {
    console.log(`🐱 Meow Ledger Server running on http://localhost:${PORT}`)
  })
}

start()
