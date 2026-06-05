import type { BillDTO } from '@/api'

export function exportToJSON(bills: BillDTO[]): void {
  const data = JSON.stringify(bills, null, 2)
  downloadFile(data, 'meow-ledger-backup.json', 'application/json')
}

export function exportToCSV(bills: BillDTO[]): void {
  const headers = ['id', 'type', 'amount', 'categoryId', 'accountId', 'date', 'note', 'createdAt']
  const rows = bills.map((b) =>
    headers.map((h) => {
      const val = String((b as any)[h] ?? '')
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const bom = '\uFEFF'
  downloadFile(bom + csv, 'meow-ledger-backup.csv', 'text/csv;charset=utf-8')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importFromJSON(text: string): Omit<BillDTO, 'id' | 'createdAt'>[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('数据格式错误：应为数组')
  return data.map(validateBill)
}

export function importFromCSV(text: string): Omit<BillDTO, 'id' | 'createdAt'>[] {
  const lines = text.replace(/^\uFEFF/, '').split('\n').filter((l) => l.trim())
  if (lines.length < 2) throw new Error('CSV 数据为空')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim() ?? '' })
    return validateBill(obj)
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { current += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { result.push(current); current = '' }
      else { current += ch }
    }
  }
  result.push(current)
  return result
}

function validateBill(obj: any): Omit<BillDTO, 'id' | 'createdAt'> {
  if (!['income', 'expense'].includes(obj.type)) throw new Error(`无效的类型: ${obj.type}`)
  const amount = Number(obj.amount)
  if (isNaN(amount) || amount <= 0) throw new Error(`无效的金额: ${obj.amount}`)
  if (!obj.date || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) throw new Error(`无效的日期: ${obj.date}`)
  return {
    type: obj.type,
    amount,
    categoryId: Number(obj.categoryId) || 0,
    accountId: Number(obj.accountId) || 0,
    date: obj.date,
    note: String(obj.note || ''),
  }
}
