<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useCategoryStore } from '@/stores/category'
import { getCurrentMonth, formatMoney, formatDate } from '@/utils'
import type { BillDTO } from '@/api'
import MonthPicker from '@/components/MonthPicker.vue'
import BillItem from '@/components/BillItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import { showConfirmDialog } from 'vant'

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const currentMonth = ref(getCurrentMonth())
const searchKeyword = ref('')
const filterCategoryId = ref<number | null>(null)

const monthStats = ref({ income: 0, expense: 0, balance: 0 })
const monthBills = ref<BillDTO[]>([])

const allCategories = computed(() => [
  ...categoryStore.getByType('expense'),
  ...categoryStore.getByType('income'),
])

const dayGroups = computed(() => billStore.groupByDays(monthBills.value))

const filteredGroups = computed(() => {
  return dayGroups.value
    .map((group) => {
      let bills = [...group.bills]
      if (filterCategoryId.value) {
        bills = bills.filter((b) => b.categoryId === filterCategoryId.value)
      }
      if (searchKeyword.value.trim()) {
        const kw = searchKeyword.value.trim().toLowerCase()
        bills = bills.filter((b) => b.note.toLowerCase().includes(kw))
      }
      if (bills.length === 0) return null
      return {
        ...group,
        bills: bills as any,
        income: bills.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0),
        expense: bills.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0),
      }
    })
    .filter(Boolean)
})

const emit = defineEmits<{
  editBill: [id: number]
}>()

async function deleteBill(id: number) {
  try {
    await showConfirmDialog({ title: '确认删除', message: '删除后不可恢复，确认删除此账单？' })
    await billStore.remove(id)
    loadMonthData()
  } catch {}
}

async function loadMonthData() {
  const [stats, bills] = await Promise.all([
    billStore.getMonthStats(currentMonth.value),
    billStore.fetchByMonth(currentMonth.value),
  ])
  monthStats.value = stats
  monthBills.value = bills
}

watch(currentMonth, loadMonthData, { immediate: true })
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">📋 账单明细</h2>

    <MonthPicker v-model="currentMonth" />

    <div class="summary-card cat-card" style="margin-top: 12px">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">收入</span>
          <span class="cat-income">{{ formatMoney(monthStats.income) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">支出</span>
          <span class="cat-expense">{{ formatMoney(monthStats.expense) }}</span>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <input v-model="searchKeyword" class="cat-input" placeholder="搜索备注..." style="margin-bottom: 8px" />
      <div class="filter-chips">
        <button :class="['filter-chip', { active: filterCategoryId === null }]" @click="filterCategoryId = null">全部</button>
        <button v-for="cat in allCategories" :key="cat.id" :class="['filter-chip', { active: filterCategoryId === cat.id }]" @click="filterCategoryId = cat.id ?? null">
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>
    </div>

    <template v-if="filteredGroups.length > 0">
      <div v-for="group in filteredGroups" :key="group!.date" class="day-group">
        <div class="day-header">
          <span class="day-date">{{ formatDate(group!.date) }}</span>
          <span class="day-summary">
            <span v-if="group!.income > 0" class="cat-income">收 {{ formatMoney(group!.income) }}</span>
            <span v-if="group!.expense > 0" class="cat-expense">支 {{ formatMoney(group!.expense) }}</span>
          </span>
        </div>
        <van-swipe-cell v-for="bill in group!.bills" :key="bill.id">
          <BillItem :bill="bill" @edit="emit('editBill', $event)" />
          <template #right>
            <van-button square type="danger" text="删除" class="delete-btn" @click="deleteBill(bill.id!)" />
          </template>
        </van-swipe-cell>
      </div>
    </template>
    <EmptyState v-else message="本月暂无账单 🐱" />
  </div>
</template>

<style scoped>
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--cat-text); }
.summary-card { margin-bottom: 16px; }
.summary-row { display: flex; justify-content: space-around; }
.summary-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.summary-label { font-size: 12px; color: var(--cat-text-light); }
.filter-section { margin-bottom: 16px; }
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip { padding: 4px 10px; border-radius: 14px; border: 1px solid var(--cat-border); background: transparent; font-size: 12px; color: var(--cat-text-light); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.filter-chip.active { border-color: var(--cat-accent); background: var(--cat-accent-light); color: var(--cat-text); }
.day-group { margin-bottom: 16px; }
.day-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--cat-border); margin-bottom: 4px; }
.day-date { font-size: 13px; color: var(--cat-text-light); font-weight: 500; }
.day-summary { display: flex; gap: 12px; font-size: 12px; }
.delete-btn { height: 100% !important; }
</style>
