<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useBudgetStore } from '@/stores/budget'
import { getCurrentMonth, formatMoney, formatDate } from '@/utils'
import type { BillDTO } from '@/api'
import BudgetProgress from '@/components/BudgetProgress.vue'
import BillItem from '@/components/BillItem.vue'
import EmptyState from '@/components/EmptyState.vue'

const billStore = useBillStore()
const budgetStore = useBudgetStore()
const currentMonth = ref(getCurrentMonth())

const monthStats = ref({ income: 0, expense: 0, balance: 0 })
const monthBills = ref<BillDTO[]>([])
const totalBudget = ref(0)

const dayGroups = computed(() => billStore.groupByDays(monthBills.value))
const recentGroups = computed(() => dayGroups.value.slice(0, 5))

const emit = defineEmits<{
  editBill: [id: number]
}>()

async function loadMonthData() {
  const [stats, bills] = await Promise.all([
    billStore.getMonthStats(currentMonth.value),
    billStore.fetchByMonth(currentMonth.value),
  ])
  monthStats.value = stats
  monthBills.value = bills
  await budgetStore.fetchByMonth(currentMonth.value)
  totalBudget.value = budgetStore.getTotalBudget(currentMonth.value)
}

watch(currentMonth, loadMonthData, { immediate: true })
</script>

<template>
  <div class="page-container">
    <div class="home-header">
      <h1 class="home-title">🐱 喵喵记账</h1>
      <p class="home-subtitle">{{ currentMonth.replace('-', '年') }}月</p>
    </div>

    <div class="stats-card cat-card">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">收入</span>
          <span class="stat-value cat-income">+{{ formatMoney(monthStats.income) }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">支出</span>
          <span class="stat-value cat-expense">-{{ formatMoney(monthStats.expense) }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">结余</span>
          <span :class="['stat-value', monthStats.balance >= 0 ? 'cat-income' : 'cat-expense']">
            {{ formatMoney(monthStats.balance) }}
          </span>
        </div>
      </div>

      <BudgetProgress
        v-if="totalBudget > 0"
        :used="monthStats.expense"
        :total="totalBudget"
        label="月度预算"
        class="mt-4"
      />
    </div>

    <div class="recent-section">
      <div class="section-header">
        <h3 class="section-title">最近账单</h3>
      </div>

      <template v-if="recentGroups.length > 0">
        <div v-for="group in recentGroups" :key="group.date" class="day-group">
          <div class="day-header">
            <span class="day-date">{{ formatDate(group.date) }}</span>
            <span class="day-summary">
              <span v-if="group.income > 0" class="cat-income">收 {{ formatMoney(group.income) }}</span>
              <span v-if="group.expense > 0" class="cat-expense">支 {{ formatMoney(group.expense) }}</span>
            </span>
          </div>
          <div class="day-bills">
            <BillItem
              v-for="bill in group.bills"
              :key="bill.id"
              :bill="bill"
              @edit="emit('editBill', $event)"
            />
          </div>
        </div>
      </template>
      <EmptyState v-else message="还没有账单哦，快去记一笔吧~ 🐱" />
    </div>
  </div>
</template>

<style scoped>
.home-header {
  text-align: center;
  padding: 8px 0 16px;
}
.home-title { font-size: 24px; font-weight: 700; color: var(--cat-text); }
.home-subtitle { font-size: 13px; color: var(--cat-text-light); margin-top: 4px; }
.stats-card { margin-bottom: 20px; }
.stats-row { display: flex; align-items: center; justify-content: space-around; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-label { font-size: 12px; color: var(--cat-text-light); }
.stat-value { font-size: 16px; font-weight: 700; }
.stat-divider { width: 1px; height: 28px; background: var(--cat-border); }
.mt-4 { margin-top: 16px; }
.recent-section { margin-top: 8px; }
.section-header { margin-bottom: 12px; }
.section-title { font-size: 16px; font-weight: 600; color: var(--cat-text); }
.day-group { margin-bottom: 16px; }
.day-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--cat-border); margin-bottom: 4px; }
.day-date { font-size: 13px; color: var(--cat-text-light); font-weight: 500; }
.day-summary { display: flex; gap: 12px; font-size: 12px; }
.day-bills { padding: 0 4px; }
</style>
