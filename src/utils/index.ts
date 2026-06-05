export function formatMoney(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 周${weekDays[d.getDay()]}`
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function getMonthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split('-').map(Number)
  const start = `${year}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(year, m, 0).getDate()
  const end = `${year}-${String(m).padStart(2, '0')}-${lastDay}`
  return { start, end }
}

export function getDaysInMonth(month: string): number {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m, 0).getDate()
}

export function getYearRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}
