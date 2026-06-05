import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<api.BudgetDTO[]>([])
  const loaded = ref(false)

  async function load() {
    budgets.value = await api.getBudgets()
    loaded.value = true
  }

  async function fetchByMonth(month: string) {
    budgets.value = await api.getBudgets({ month })
  }

  function getByMonth(month: string): api.BudgetDTO[] {
    return budgets.value.filter((b) => b.month === month)
  }

  function getTotalBudget(month: string): number {
    const b = budgets.value.find((b) => b.month === month && b.categoryId === null)
    return b?.amount || 0
  }

  function getCategoryBudget(month: string, categoryId: number): number {
    const b = budgets.value.find((b) => b.month === month && b.categoryId === categoryId)
    return b?.amount || 0
  }

  async function setTotalBudget(month: string, amount: number) {
    await api.createBudget({ month, categoryId: null, amount })
    await fetchByMonth(month)
  }

  async function setCategoryBudget(month: string, categoryId: number, amount: number) {
    await api.createBudget({ month, categoryId, amount })
    await fetchByMonth(month)
  }

  async function removeBudget(id: number) {
    await api.deleteBudget(id)
    budgets.value = budgets.value.filter((b) => b.id !== id)
  }

  return {
    budgets, loaded, load, fetchByMonth, getByMonth,
    getTotalBudget, getCategoryBudget, setTotalBudget, setCategoryBudget, removeBudget,
  }
})
