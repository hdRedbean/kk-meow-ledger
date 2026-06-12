import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'meow_ledger_jwt_secret_key_2026'
const JWT_EXPIRES_IN = '7d'

export function generateToken(payload: { userId: number; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string }
  } catch {
    return null
  }
}

export interface AuthRequest extends Request {
  userId?: number
  username?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录，请先登录' })
    return
  }
  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    res.status(401).json({ error: '登录已过期，请重新登录' })
    return
  }
  req.userId = decoded.userId
  req.username = decoded.username
  next()
}

export { JWT_SECRET }