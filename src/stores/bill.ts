import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api'
import type { BillType, DayGroup } from '@/types'
import { useCategoryStore } from './category'

export const useBillStore = defineStore('bill', () => {
  const bills = ref<api.BillDTO[]>([])
  const loaded = ref(false)
  const version = ref(0)

  async function load() {
    bills.value = await api.getBills()
    loaded.value = true
  }

  async function add(bill: Omit<api.BillDTO, 'id' | 'createdAt'>) {
    const res = await api.createBill(bill)
    bills.value.unshift({ ...bill, id: res.id, createdAt: Date.now() })
    bills.value.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    version.value++
    return res.id
  }

  async function update(id: number, data: Partial<api.BillDTO>) {
    await api.updateBill(id, data)
    const idx = bills.value.findIndex((b) => b.id === id)
    if (idx !== -1) {
      bills.value[idx] = { ...bills.value[idx], ...data }
    }
    version.value++
  }

  async function remove(id: number) {
    await api.deleteBill(id)
    bills.value = bills.value.filter((b) => b.id !== id)
    version.value++
  }

  async function fetchByMonth(month: string): Promise<api.BillDTO[]> {
    return api.getBills({ month })
  }

  function groupByDays(billList: api.BillDTO[]): DayGroup[] {
    const map = new Map<string, DayGroup>()
    for (const bill of billList) {
      if (!map.has(bill.date)) {
        map.set(bill.date, { date: bill.date, income: 0, expense: 0, bills: [] })
      }
      const group = map.get(bill.date)!
      group.bills.push(bill as any)
      if (bill.type === 'income') group.income += bill.amount
      else group.expense += bill.amount
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
  }

  async function getMonthStats(month: string) {
    return api.getMonthlyStats(month)
  }

  async function getCategoryStats(month: string, type: BillType) {
    return api.getCategoryStats(month, type)
  }

  async function getDailyStats(month: string) {
    return api.getDailyStats(month)
  }

  async function getYearMonthStats(year: number) {
    return api.getYearlyStats(year)
  }

  return {
    bills, loaded, version, load, add, update, remove,
    fetchByMonth, groupByDays,
    getMonthStats, getCategoryStats, getDailyStats, getYearMonthStats,
  }
})
