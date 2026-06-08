import Bottleneck from 'bottleneck'

export const aiLimiter = new Bottleneck({
  maxConcurrent: Number(process.env.AI_LIMIT_CONCURRENT) || 5,
  minTime: Number(process.env.AI_LIMIT_MIN_INTERVAL) || 200,
  reservoir: Number(process.env.AI_LIMIT_RESERVOIR) || 30,
  reservoirRefreshInterval: Number(process.env.AI_LIMIT_RESERVOIR_INTERVAL) || 60_000,
  reservoirRefreshAmount: Number(process.env.AI_LIMIT_RESERVOIR_REFRESH) || 30,
})

export const chatRateLimitMeta = {
  windowMs: Number(process.env.CHAT_RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.CHAT_RATE_MAX) || 15,
  dailyMax: Number(process.env.CHAT_RATE_DAILY_MAX) || 200,
}