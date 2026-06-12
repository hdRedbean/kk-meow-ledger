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
watch(() => billStore.version, loadMonthData)
</script>

<template>
  <div class="page-container">
    <div class="home-header">
      <div class="header-decoration">
        <div class="cat-ear left"></div>
        <div class="cat-ear right"></div>
      </div>
      <h1 class="home-title">
        <span class="title-icon">🐱</span>
        <span class="title-text">喵喵记账</span>
      </h1>
      <p class="home-subtitle">{{ currentMonth.replace('-', '年') }}月</p>
    </div>

    <div class="stats-card cat-card">
      <div class="stats-row">
        <div class="stat-item income">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">💰</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">收入</span>
            <span class="stat-value">+{{ formatMoney(monthStats.income) }}</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item expense">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">💸</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">支出</span>
            <span class="stat-value">-{{ formatMoney(monthStats.expense) }}</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item balance">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📊</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">结余</span>
            <span :class="['stat-value', monthStats.balance >= 0 ? 'positive' : 'negative']">
              {{ formatMoney(monthStats.balance) }}
            </span>
          </div>
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
        <div class="header-left">
          <span class="header-icon">📋</span>
          <h3 class="section-title">最近账单</h3>
        </div>
      </div>

      <template v-if="recentGroups.length > 0">
        <div v-for="group in recentGroups" :key="group.date" class="day-group">
          <div class="day-header">
            <span class="day-date">{{ formatDate(group.date) }}</span>
            <div class="day-summary">
              <span v-if="group.income > 0" class="income-tag">
                <span class="tag-icon">↑</span>
                {{ formatMoney(group.income) }}
              </span>
              <span v-if="group.expense > 0" class="expense-tag">
                <span class="tag-icon">↓</span>
                {{ formatMoney(group.expense) }}
              </span>
            </div>
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
.page-container {
  padding: 0 20px;
  min-height: 100vh;
  background: #FFF9F5;
}

.home-header {
  text-align: center;
  padding: 20px 0 24px;
  position: relative;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 50px;
}

.cat-ear {
  width: 16px;
  height: 20px;
  background: rgba(255, 139, 94, 0.15);
  border-radius: 50% 50% 0 0;
}

.cat-ear.left {
  transform: rotate(-20deg);
}

.cat-ear.right {
  transform: rotate(20deg);
}

.home-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 26px;
  font-weight: 700;
  color: #3D3D3D;
}

.title-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 6px rgba(255, 139, 94, 0.2));
}

.title-text {
  letter-spacing: 0.02em;
}

.home-subtitle {
  font-size: 14px;
  color: #8C8C8C;
  margin-top: 6px;
  font-weight: 500;
}

.cat-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(255, 139, 94, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(255, 139, 94, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 12px 8px;
  border-radius: 16px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-item.income {
  background: rgba(125, 211, 192, 0.08);
}

.stat-item.expense {
  background: rgba(242, 139, 130, 0.08);
}

.stat-item.balance {
  background: rgba(255, 139, 94, 0.08);
}

.stat-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(255, 139, 94, 0.08);
}

.stat-icon {
  font-size: 16px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #8C8C8C;
  font-weight: 500;
}

.stat-value {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-item.income .stat-value {
  color: #7DD3C0;
}

.stat-item.expense .stat-value {
  color: #F28B82;
}

.stat-value.positive {
  color: #7DD3C0;
}

.stat-value.negative {
  color: #F28B82;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: rgba(0, 0, 0, 0.06);
}

.mt-4 {
  margin-top: 16px;
}

.recent-section {
  margin-top: 12px;
}

.section-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.15));
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #3D3D3D;
  letter-spacing: 0.02em;
}

.day-group {
  margin-bottom: 20px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 12px;
  margin-bottom: 12px;
}

.day-date {
  font-size: 14px;
  color: #8C8C8C;
  font-weight: 600;
}

.day-summary {
  display: flex;
  gap: 10px;
}

.income-tag, .expense-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
}

.income-tag {
  color: #7DD3C0;
  background: rgba(125, 211, 192, 0.12);
}

.expense-tag {
  color: #F28B82;
  background: rgba(242, 139, 130, 0.08);
}

.tag-icon {
  font-size: 10px;
}

.day-bills {
  padding: 0 4px;
}
</style>