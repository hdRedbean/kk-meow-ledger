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
    <h2 class="page-title">💰 预算管理</h2>

    <MonthPicker v-model="currentMonth" />

    <div class="cat-card" style="margin-top: 12px">
      <div class="budget-header">
        <h4 class="budget-title">月度总预算</h4>
        <button class="cat-btn cat-btn-sm" @click="openSetTotal">{{ totalBudget > 0 ? '修改' : '设置' }}</button>
      </div>
      <template v-if="totalBudget > 0">
        <BudgetProgress :used="monthExpense" :total="totalBudget" label="总预算进度" />
        <div class="budget-remain">
          <span>剩余可用</span>
          <span :class="['remain-amount', monthExpense > totalBudget ? 'cat-expense' : 'cat-income']">¥{{ formatMoney(Math.max(0, totalBudget - monthExpense)) }}</span>
        </div>
      </template>
      <p v-else class="no-budget-tip">还没有设置月度预算哦~ 🐱</p>
    </div>

    <div class="cat-card" style="margin-top: 12px">
      <div class="budget-header">
        <h4 class="budget-title">分类预算</h4>
        <button class="cat-btn cat-btn-sm" @click="openSetCategory()">＋ 添加</button>
      </div>
      <template v-if="categoryBudgets.length > 0">
        <div class="category-budget-list">
          <div v-for="cb in categoryBudgets" :key="cb.id" class="category-budget-item">
            <BudgetProgress :used="getCategoryUsed(cb.categoryId!)" :total="cb.amount" :label="categoryStore.getById(cb.categoryId!)?.name || '未知'" />
            <button class="remove-btn" @click="removeCategoryBudget(cb.id!)">✕</button>
          </div>
        </div>
      </template>
      <EmptyState v-else message="暂无分类预算 🐱" />
    </div>

    <van-popup v-model:show="showSetTotal" position="bottom" round :style="{ padding: '24px' }">
      <h4 class="popup-title">设置月度总预算 🐱</h4>
      <input v-model="totalBudgetInput" type="number" class="cat-input" placeholder="请输入预算金额" min="0" step="100" />
      <button class="cat-btn" style="width:100%;margin-top:12px" @click="saveTotalBudget">保存</button>
    </van-popup>

    <van-popup v-model:show="showSetCategory" position="bottom" round :style="{ padding: '24px' }">
      <h4 class="popup-title">设置分类预算 🐱</h4>
      <div class="category-select">
        <button v-for="cat in expenseCategories" :key="cat.id" :class="['cat-select-btn', { active: selectedCategoryId === cat.id }]" @click="selectedCategoryId = cat.id!">
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>
      <input v-model="categoryBudgetInput" type="number" class="cat-input" placeholder="请输入预算金额" min="0" step="100" style="margin-top: 12px" />
      <button class="cat-btn" style="width:100%;margin-top:12px" @click="saveCategoryBudget">保存</button>
    </van-popup>
  </div>
</template>

<style scoped>
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--cat-text); }
.budget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.budget-title { font-size: 15px; font-weight: 600; color: var(--cat-text); }
.budget-remain { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--cat-border); font-size: 14px; color: var(--cat-text-light); }
.remain-amount { font-weight: 600; font-size: 16px; }
.no-budget-tip { font-size: 13px; color: var(--cat-text-light); text-align: center; padding: 16px 0; }
.category-budget-list { display: flex; flex-direction: column; gap: 16px; }
.category-budget-item { position: relative; }
.remove-btn { position: absolute; top: -25px; right: -25px; width: 24px; height: 24px; border-radius: 50%; border: none; background: var(--cat-secondary); color: var(--cat-text-light); font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.popup-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--cat-text); }
.category-select { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-select-btn { padding: 6px 12px; border-radius: 16px; border: 1.5px solid var(--cat-border); background: transparent; font-size: 13px; color: var(--cat-text-light); cursor: pointer; transition: all 0.15s; }
.cat-select-btn.active { border-color: var(--cat-accent); background: var(--cat-accent-light); color: var(--cat-text); }
</style>
