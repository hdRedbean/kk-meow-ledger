import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { pool } from './db.js'
import { logger } from './logger.js'
import { authMiddleware } from './auth.js'
import requestLog from './middleware/requestLog.js'
import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import accountsRouter from './routes/accounts.js'
import billsRouter from './routes/bills.js'
import budgetsRouter from './routes/budgets.js'
import chatRouter from './routes/chat.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.set('trust proxy', 1)

app.use(helmet())
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins, credentials: true } : undefined))
app.use(express.json({ limit: '1mb' }))

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: '请求过于频繁，请稍后再试' } })
const authRegLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: '注册请求过于频繁，请稍后再试' } })

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authRegLimiter)

app.use(requestLog)

app.use('/api/auth', authRouter)

app.use('/api/categories', authMiddleware, categoriesRouter)
app.use('/api/accounts', authMiddleware, accountsRouter)
app.use('/api/bills', authMiddleware, billsRouter)
app.use('/api/budgets', authMiddleware, budgetsRouter)
app.use('/api/chat', authMiddleware, chatRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Unhandled error: ${req.method} ${req.originalUrl || req.url} - ${err.stack || err.message}`)
  res.status(err.status || 500).json({ error: '服务器内部错误' })
})

async function start() {
  try {
    const conn = await pool.getConnection()
    conn.release()
    logger.info('✅ MySQL connected')
  } catch (e: any) {
    logger.error(`❌ MySQL connection failed: ${e.message}`)
  }

  app.listen(PORT, () => {
    logger.info(`🐱 Meow Ledger Server running on http://localhost:${PORT}`)
  })
}

start()
