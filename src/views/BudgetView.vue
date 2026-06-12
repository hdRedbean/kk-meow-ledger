<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useBudgetStore } from '@/stores/budget'
import { useCategoryStore } from '@/stores/category'
import { getCurrentMonth, formatMoney } from '@/utils'
import MonthPicker from '@/components/MonthPicker.vue'
import BudgetProgress from '@/components/BudgetProgress.vue'
import EmptyState from '@/components/EmptyState.vue'

const billStore = useBillStore()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()

const currentMonth = ref(getCurrentMonth())
const showSetTotal = ref(false)
const showSetCategory = ref(false)
const totalBudgetInput = ref('')
const categoryBudgetInput = ref('')
const selectedCategoryId = ref<number>(0)
const monthExpense = ref(0)

const totalBudget = computed(() => budgetStore.getTotalBudget(currentMonth.value))
const categoryBudgets = computed(() => budgetStore.getByMonth(currentMonth.value).filter((b) => b.categoryId !== null))
const expenseCategories = computed(() => categoryStore.getByType('expense'))

function openSetTotal() {
  totalBudgetInput.value = totalBudget.value > 0 ? String(totalBudget.value) : ''
  showSetTotal.value = true
}

async function saveTotalBudget() {
  const amount = parseFloat(totalBudgetInput.value)
  if (isNaN(amount) || amount < 0) return
  await budgetStore.setTotalBudget(currentMonth.value, amount)
  showSetTotal.value = false
}

function openSetCategory(catId?: number) {
  selectedCategoryId.value = catId || expenseCategories.value[0]?.id || 0
  const existing = categoryBudgets.value.find((b) => b.categoryId === catId)
  categoryBudgetInput.value = existing ? String(existing.amount) : ''
  showSetCategory.value = true
}

async function saveCategoryBudget() {
  const amount = parseFloat(categoryBudgetInput.value)
  if (isNaN(amount) || amount < 0) return
  if (!selectedCategoryId.value) return
  await budgetStore.setCategoryBudget(currentMonth.value, selectedCategoryId.value, amount)
  showSetCategory.value = false
}

async function removeCategoryBudget(id: number) {
  await budgetStore.removeBudget(id)
}

function getCategoryUsed(catId: number): number {
  const bills = billStore.bills.filter((b) => b.type === 'expense' && b.categoryId === catId)
  const start = currentMonth.value + '-01'
  const [y, m] = currentMonth.value.split('-').map(Number)
  const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`
  return bills.filter((b) => b.date >= start && b.date <= end).reduce((s, b) => s + b.amount, 0)
}

async function loadMonthData() {
  await budgetStore.fetchByMonth(currentMonth.value)
  const stats = await billStore.getMonthStats(currentMonth.value)
  monthExpense.value = stats.expense
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
        <span class="title-icon">💰</span>
        <span class="title-text">预算管理</span>
      </h2>
    </div>

    <MonthPicker v-model="currentMonth" />

    <div class="cat-card total-budget-card" style="margin-top: 16px">
      <div class="budget-header">
        <div class="header-left">
          <span class="header-icon">📊</span>
          <h4 class="budget-title">月度总预算</h4>
        </div>
        <button class="cat-btn cat-btn-sm" @click="openSetTotal">
          <span class="btn-icon">{{ totalBudget > 0 ? '✏️' : '✨' }}</span>
          {{ totalBudget > 0 ? '修改' : '设置' }}
        </button>
      </div>
      <template v-if="totalBudget > 0">
        <BudgetProgress :used="monthExpense" :total="totalBudget" label="总预算进度" />
        <div class="budget-remain">
          <div class="remain-left">
            <span class="remain-icon">💡</span>
            <span class="remain-text">剩余可用</span>
          </div>
          <span :class="['remain-amount', monthExpense > totalBudget ? 'negative' : 'positive']">
            ¥{{ formatMoney(Math.max(0, totalBudget - monthExpense)) }}
          </span>
        </div>
      </template>
      <div v-else class="no-budget-tip">
        <span class="tip-icon">😺</span>
        <span class="tip-text">还没有设置月度预算哦~</span>
      </div>
    </div>

    <div class="cat-card category-budget-card" style="margin-top: 16px">
      <div class="budget-header">
        <div class="header-left">
          <span class="header-icon">🏷️</span>
          <h4 class="budget-title">分类预算</h4>
        </div>
        <button class="cat-btn cat-btn-sm add-btn" @click="openSetCategory()">
          <span class="btn-icon">＋</span>
          添加
        </button>
      </div>
      <template v-if="categoryBudgets.length > 0">
        <div class="category-budget-list">
          <div v-for="cb in categoryBudgets" :key="cb.id" class="category-budget-item">
            <BudgetProgress
              :used="getCategoryUsed(cb.categoryId!)"
              :total="cb.amount"
              :label="categoryStore.getById(cb.categoryId!)?.name || '未知'"
            />
            <button class="remove-btn" @click="removeCategoryBudget(cb.id!)">
              <span class="remove-icon">✕</span>
            </button>
          </div>
        </div>
      </template>
      <EmptyState v-else message="暂无分类预算 🐱" />
    </div>

    <van-popup v-model:show="showSetTotal" position="bottom" round :style="{ padding: '24px' }">
      <div class="popup-content">
        <h4 class="popup-title">
          <span class="title-icon">📊</span>
          设置月度总预算
        </h4>
        <input v-model="totalBudgetInput" type="number" class="cat-input popup-input" placeholder="请输入预算金额" min="0" step="100" />
        <button class="cat-btn popup-btn" @click="saveTotalBudget">
          <span class="btn-icon">✨</span>
          <span class="btn-text">保存</span>
        </button>
      </div>
    </van-popup>

    <van-popup v-model:show="showSetCategory" position="bottom" round :style="{ padding: '24px' }">
      <div class="popup-content">
        <h4 class="popup-title">
          <span class="title-icon">🏷️</span>
          设置分类预算
        </h4>
        <div class="category-select">
          <button v-for="cat in expenseCategories" :key="cat.id" :class="['cat-select-btn', { active: selectedCategoryId === cat.id }]" @click="selectedCategoryId = cat.id!">
            <span class="select-icon">{{ cat.icon }}</span>
            <span class="select-name">{{ cat.name }}</span>
          </button>
        </div>
        <input v-model="categoryBudgetInput" type="number" class="cat-input popup-input" placeholder="请输入预算金额" min="0" step="100" style="margin-top: 16px" />
        <button class="cat-btn popup-btn" @click="saveCategoryBudget">
          <span class="btn-icon">✨</span>
          <span class="btn-text">保存</span>
        </button>
      </div>
    </van-popup>
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

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.budget-title {
  font-size: 16px;
  font-weight: 700;
  color: #3D3D3D;
  letter-spacing: 0.02em;
}

.cat-btn {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  color: white;
  border-radius: 14px;
  padding: 10px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.2);
}

.cat-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 139, 94, 0.25);
}

.cat-btn-sm {
  padding: 8px 14px;
  font-size: 13px;
  border-radius: 12px;
}

.btn-icon {
  font-size: 12px;
}

.add-btn {
  background: linear-gradient(135deg, #7DD3C0 0%, #8FE3D0 100%);
  box-shadow: 0 4px 12px rgba(125, 211, 192, 0.2);
}

.budget-remain {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 14px;
  background: rgba(255, 139, 94, 0.06);
  border-radius: 14px;
  font-size: 14px;
}

.remain-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remain-icon {
  font-size: 16px;
}

.remain-text {
  color: #8C8C8C;
  font-weight: 500;
}

.remain-amount {
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.02em;
}

.remain-amount.positive {
  color: #7DD3C0;
}

.remain-amount.negative {
  color: #F28B82;
}

.no-budget-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  background: rgba(255, 139, 94, 0.06);
  border-radius: 14px;
}

.tip-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.15));
}

.tip-text {
  font-size: 14px;
  color: #8C8C8C;
  font-weight: 500;
}

.category-budget-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.category-budget-item {
  position: relative;
  padding: 16px;
  background: rgba(255, 139, 94, 0.04);
  border-radius: 16px;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%);
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(242, 139, 130, 0.2);
}

.remove-btn:hover {
  transform: scale(1.1);
}

.remove-icon {
  font-weight: 600;
}

.popup-content {
  background: linear-gradient(180deg, #FFF9F5 0%, #FFFFFF 100%);
  border-radius: 24px;
  padding: 4px;
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #3D3D3D;
}

.popup-title .title-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.2));
}

.cat-input {
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 14px;
  border: 1.5px solid transparent;
  transition: all 0.25s ease;
}

.cat-input:focus {
  border-color: #FF8B5E;
  box-shadow: 0 0 0 3px rgba(255, 139, 94, 0.12);
}

.popup-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  color: #3D3D3D;
}

.popup-btn {
  width: 100%;
  margin-top: 16px;
  justify-content: center;
  padding: 14px;
  font-size: 16px;
}

.category-select {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cat-select-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  font-size: 14px;
  color: #8C8C8C;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cat-select-btn:hover {
  border-color: rgba(255, 139, 94, 0.2);
  background: rgba(255, 139, 94, 0.06);
}

.cat-select-btn.active {
  border-color: #FF8B5E;
  background: rgba(255, 139, 94, 0.12);
  color: #3D3D3D;
  font-weight: 600;
  transform: scale(1.02);
}

.select-icon {
  font-size: 16px;
}
</style>