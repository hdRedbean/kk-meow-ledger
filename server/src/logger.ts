import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve(process.cwd(), 'logs')
const LEVELS = {
  INFO: { color: '\x1b[36m', label: 'INFO' },
  WARN: { color: '\x1b[33m', label: 'WARN' },
  ERROR: { color: '\x1b[31m', label: 'ERROR' },
} as const

let logDirReady = false

function ensureLogDir() {
  if (logDirReady) return
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
    logDirReady = true
  } catch { }
}

function formatTime(date: Date): string {
  const y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${M}-${d} ${h}:${m}:${s}`
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${M}-${d}`
}

function write(level: keyof typeof LEVELS, msg: string) {
  const now = new Date()
  const timeStr = formatTime(now)
  const { color, label } = LEVELS[level]
  const line = `[${timeStr}] [${label}] ${msg}`
  const reset = '\x1b[0m'

  console.log(`${color}${line}${reset}`)

  ensureLogDir()
  try {
    const logFile = path.join(LOG_DIR, `${formatDate(now)}.log`)
    fs.appendFileSync(logFile, line + '\n', 'utf-8')
  } catch { }
}

export const logger = {
  info: (msg: string) => write('INFO', msg),
  warn: (msg: string) => write('WARN', msg),
  error: (msg: string) => write('ERROR', msg),
}
