<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useCategoryStore } from '@/stores/category'
import { getCurrentMonth, formatMoney } from '@/utils'
import MonthPicker from '@/components/MonthPicker.vue'
import EmptyState from '@/components/EmptyState.vue'

const billStore = useBillStore()
const categoryStore = useCategoryStore()

const currentMonth = ref(getCurrentMonth())
const monthStats = ref({ income: 0, expense: 0, balance: 0 })
const categoryStats = ref<{ categoryId: number; amount: number; percentage: number }[]>([])
const monthBills = ref([])

const expenseCategories = computed(() => categoryStore.getByType('expense'))
const incomeCategories = computed(() => categoryStore.getByType('income'))

const topExpenseCategories = computed(() =>
  categoryStats.value
    .filter((s) => s.categoryId && expenseCategories.value.find((c) => c.id === s.categoryId))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
)

const topIncomeCategories = computed(() =>
  categoryStats.value
    .filter((s) => s.categoryId && incomeCategories.value.find((c) => c.id === s.categoryId))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
)

function getCategoryInfo(catId: number) {
  return categoryStore.getById(catId)
}

async function loadMonthData() {
  const [stats, bills] = await Promise.all([
    billStore.getMonthStats(currentMonth.value),
    billStore.fetchByMonth(currentMonth.value),
  ])
  monthStats.value = stats
  monthBills.value = bills

  const categoryAmounts: Record<number, number> = {}
  for (const bill of bills) {
    if (bill.categoryId) {
      categoryAmounts[bill.categoryId] = (categoryAmounts[bill.categoryId] || 0) + bill.amount
    }
  }

  const totalExpense = bills.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const totalIncome = bills.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)

  categoryStats.value = Object.entries(categoryAmounts).map(([catId, amount]) => ({
    categoryId: Number(catId),
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
  }))
}

watch(currentMonth, loadMonthData, { immediate: true })
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-decoration">
        <div class="cat-ear left"></div>
        <div class="cat-ear right"></div>
      </div>
      <h2 class="page-title">
        <span class="title-icon">📊</span>
        <span class="title-text">统计分析</span>
      </h2>
    </div>

    <MonthPicker v-model="currentMonth" />

    <div class="cat-card summary-card" style="margin-top: 16px">
      <div class="summary-grid">
        <div class="summary-item income">
          <div class="summary-icon-wrapper">
            <span class="summary-icon">💰</span>
          </div>
          <div class="summary-content">
            <span class="summary-label">收入</span>
            <span class="summary-value">{{ formatMoney(monthStats.income) }}</span>
          </div>
        </div>
        <div class="summary-item expense">
          <div class="summary-icon-wrapper">
            <span class="summary-icon">💸</span>
          </div>
          <div class="summary-content">
            <span class="summary-label">支出</span>
            <span class="summary-value">{{ formatMoney(monthStats.expense) }}</span>
          </div>
        </div>
        <div class="summary-item balance">
          <div class="summary-icon-wrapper">
            <span class="summary-icon">📊</span>
          </div>
          <div class="summary-content">
            <span class="summary-label">结余</span>
            <span :class="['summary-value', monthStats.balance >= 0 ? 'positive' : 'negative']">
              {{ formatMoney(monthStats.balance) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="cat-card expense-analysis" style="margin-top: 16px">
      <div class="section-header">
        <div class="header-left">
          <span class="section-icon expense">💸</span>
          <h4 class="section-title">支出分布</h4>
        </div>
      </div>

      <template v-if="topExpenseCategories.length > 0">
        <div class="category-bars">
          <div v-for="stat in topExpenseCategories" :key="stat.categoryId" class="category-bar-item">
            <div class="bar-header">
              <div class="category-info">
                <div class="category-icon-wrapper">
                  <span class="category-icon">{{ getCategoryInfo(stat.categoryId)?.icon }}</span>
                </div>
                <span class="category-name">{{ getCategoryInfo(stat.categoryId)?.name }}</span>
              </div>
              <div class="category-amount">
                <span class="amount-value">{{ formatMoney(stat.amount) }}</span>
                <span class="amount-percent">{{ stat.percentage.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill expense" :style="{ width: `${stat.percentage}%` }">
                <div class="progress-shine"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="pie-chart-visual" v-if="false">
          <div class="pie-container">
            <div class="pie-chart">
              <div v-for="(stat, index) in topExpenseCategories.slice(0, 4)" :key="stat.categoryId" class="pie-segment expense" :style="{
                transform: `rotate(${index * 90}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + stat.percentage}% 0%, ${50 + stat.percentage}% 50%)`
              }">
              </div>
              <div class="pie-center">
                <span class="center-icon">🐱</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <EmptyState v-else message="本月暂无支出记录 🐱" />
    </div>

    <div class="cat-card income-analysis" style="margin-top: 16px">
      <div class="section-header">
        <div class="header-left">
          <span class="section-icon income">💰</span>
          <h4 class="section-title">收入来源</h4>
        </div>
      </div>

      <template v-if="topIncomeCategories.length > 0">
        <div class="income-items">
          <div v-for="stat in topIncomeCategories" :key="stat.categoryId" class="income-item">
            <div class="income-icon-wrapper">
              <span class="income-icon">{{ getCategoryInfo(stat.categoryId)?.icon }}</span>
            </div>
            <div class="income-content">
              <span class="income-name">{{ getCategoryInfo(stat.categoryId)?.name }}</span>
              <span class="income-amount">{{ formatMoney(stat.amount) }}</span>
            </div>
            <div class="income-badge">
              <span class="badge-text">{{ monthStats.income > 0 ? ((stat.amount / monthStats.income) * 100).toFixed(1) : 0 }}%</span>
            </div>
          </div>
        </div>
      </template>
      <EmptyState v-else message="本月暂无收入记录 🐱" />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 0 20px 24px;
  min-height: 100vh;
  background: #FFF9F5;
}

.page-header {
  text-align: center;
  padding: 20px 0 16px;
  position: relative;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 40px;
}

.cat-ear {
  width: 14px;
  height: 18px;
  background: rgba(255, 139, 94, 0.15);
  border-radius: 50% 50% 0 0;
}

.cat-ear.left {
  transform: rotate(-20deg);
}

.cat-ear.right {
  transform: rotate(20deg);
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #3D3D3D;
}

.title-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 6px rgba(255, 139, 94, 0.2));
}

.cat-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(255, 139, 94, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(255, 139, 94, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.summary-card {
  margin-bottom: 16px;
}

.summary-grid {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
}

.summary-item.income {
  background: rgba(125, 211, 192, 0.08);
}

.summary-item.expense {
  background: rgba(242, 139, 130, 0.08);
}

.summary-item.balance {
  background: rgba(255, 139, 94, 0.08);
}

.summary-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 139, 94, 0.08);
}

.summary-icon {
  font-size: 18px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #8C8C8C;
  font-weight: 500;
}

.summary-value {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.summary-item.income .summary-value {
  color: #7DD3C0;
}

.summary-item.expense .summary-value {
  color: #F28B82;
}

.summary-value.positive {
  color: #7DD3C0;
}

.summary-value.negative {
  color: #F28B82;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 18px;
}

.section-icon.expense {
  filter: drop-shadow(0 2px 6px rgba(242, 139, 130, 0.2));
}

.section-icon.income {
  filter: drop-shadow(0 2px 6px rgba(125, 211, 192, 0.2));
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #3D3D3D;
}

.category-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.category-bar-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: rgba(255, 139, 94, 0.04);
  border-radius: 16px;
  transition: all 0.25s ease;
}

.category-bar-item:hover {
  background: rgba(255, 139, 94, 0.08);
  transform: translateX(4px);
}

.bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon-wrapper {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 12px;
  transition: all 0.25s ease;
}

.category-bar-item:hover .category-icon-wrapper {
  background: linear-gradient(135deg, #FFEDE3 0%, #F5EBE0 100%);
  transform: scale(1.05);
}

.category-icon {
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  color: #3D3D3D;
}

.category-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.amount-value {
  font-size: 14px;
  font-weight: 700;
  color: #F28B82;
}

.amount-percent {
  font-size: 12px;
  color: #8C8C8C;
  font-weight: 500;
}

.progress-bar {
  height: 10px;
  background: rgba(242, 139, 130, 0.08);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.progress-fill.expense {
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
  border-radius: 10px 10px 0 0;
}

.pie-chart-visual {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.pie-container {
  width: 120px;
  height: 120px;
}

.pie-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  position: relative;
  box-shadow: 0 4px 16px rgba(255, 139, 94, 0.12);
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.pie-segment.expense {
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%);
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(255, 139, 94, 0.1);
}

.center-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.15));
}

.income-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.income-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: rgba(125, 211, 192, 0.06);
  border-radius: 16px;
  transition: all 0.25s ease;
}

.income-item:hover {
  background: rgba(125, 211, 192, 0.1);
  transform: translateX(4px);
}

.income-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 14px;
  transition: all 0.25s ease;
}

.income-item:hover .income-icon-wrapper {
  background: linear-gradient(135deg, #FFEDE3 0%, #F5EBE0 100%);
  transform: scale(1.05);
}

.income-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.income-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.income-name {
  font-size: 15px;
  font-weight: 600;
  color: #3D3D3D;
}

.income-amount {
  font-size: 16px;
  font-weight: 700;
  color: #7DD3C0;
  letter-spacing: -0.02em;
}

.income-badge {
  padding: 6px 12px;
  background: rgba(125, 211, 192, 0.12);
  border-radius: 10px;
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  color: #7DD3C0;
}
</style>