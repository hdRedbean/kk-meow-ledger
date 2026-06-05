import type { BillDTO } from '@/api'

export type BillType = 'income' | 'expense'

export interface DayGroup {
  date: string
  income: number
  expense: number
  bills: BillDTO[]
}

export interface CategoryStats {
  categoryId: number
  categoryName: string
  categoryIcon: string
  amount: number
  percentage: number
}

export interface DailyStats {
  date: string
  income: number
  expense: number
}
