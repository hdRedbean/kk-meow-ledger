import { type Request, type Response, type NextFunction } from 'express'
import { logger } from '../logger.js'
import { type AuthRequest } from '../auth.js'

export default function requestLog(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now()
  const userId = (req as AuthRequest).userId ?? '-'
  const method = req.method
  const url = req.originalUrl || req.url

  logger.info(`--> Methods：[${method}] URL：[${url}] DATA：[userId=${userId}]`)

  _res.on('finish', () => {
    const duration = Date.now() - start
    const status = _res.statusCode
    const uid = (req as AuthRequest).userId ?? '-'
    const line = `<-- Methods：[${method}] URL：[${url}] STATUS：[${status}] TIME：[${duration}ms] DATA：[userId=${uid}]`

    if (status >= 500) {
      logger.error(line)
    } else if (status >= 400) {
      logger.warn(line)
    } else {
      logger.info(line)
    }
  })

  next()
}
