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
    <div class="page-header">
      <div class="header-decoration">
        <div class="cat-ear left"></div>
        <div class="cat-ear right"></div>
      </div>
      <h2 class="page-title">
        <span class="title-icon">📋</span>
        <span class="title-text">账单明细</span>
      </h2>
    </div>

    <MonthPicker v-model="currentMonth" />

    <div class="summary-card cat-card" style="margin-top: 16px">
      <div class="summary-row">
        <div class="summary-item income">
          <div class="summary-icon-wrapper">
            <span class="summary-icon">💰</span>
          </div>
          <div class="summary-content">
            <span class="summary-label">收入</span>
            <span class="summary-value">{{ formatMoney(monthStats.income) }}</span>
          </div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item expense">
          <div class="summary-icon-wrapper">
            <span class="summary-icon">💸</span>
          </div>
          <div class="summary-content">
            <span class="summary-label">支出</span>
            <span class="summary-value">{{ formatMoney(monthStats.expense) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input v-model="searchKeyword" class="cat-input search-input" placeholder="搜索备注..." />
      </div>
      <div class="filter-chips">
        <button :class="['filter-chip', { active: filterCategoryId === null }]" @click="filterCategoryId = null">
          <span class="chip-icon">📊</span>
          <span class="chip-text">全部</span>
        </button>
        <button v-for="cat in allCategories" :key="cat.id" :class="['filter-chip', { active: filterCategoryId === cat.id }]" @click="filterCategoryId = cat.id ?? null">
          <span class="chip-icon">{{ cat.icon }}</span>
          <span class="chip-text">{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <template v-if="filteredGroups.length > 0">
      <div v-for="group in filteredGroups" :key="group!.date" class="day-group">
        <div class="day-header">
          <span class="day-date">{{ formatDate(group!.date) }}</span>
          <div class="day-summary">
            <span v-if="group!.income > 0" class="income-tag">
              <span class="tag-icon">↑</span>
              {{ formatMoney(group!.income) }}
            </span>
            <span v-if="group!.expense > 0" class="expense-tag">
              <span class="tag-icon">↓</span>
              {{ formatMoney(group!.expense) }}
            </span>
          </div>
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

.title-text {
  letter-spacing: 0.02em;
}

.cat-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 24px rgba(255, 139, 94, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
}

.summary-card {
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 14px;
  border-radius: 16px;
}

.summary-item.income {
  background: rgba(125, 211, 192, 0.08);
}

.summary-item.expense {
  background: rgba(242, 139, 130, 0.08);
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
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.summary-item.income .summary-value {
  color: #7DD3C0;
}

.summary-item.expense .summary-value {
  color: #F28B82;
}

.summary-divider {
  width: 1px;
  height: 56px;
  background: rgba(0, 0, 0, 0.06);
  margin: 0 10px;
}

.filter-section {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 16px;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  font-size: 14px;
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

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  font-size: 13px;
  color: #8C8C8C;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: rgba(255, 139, 94, 0.2);
  background: rgba(255, 139, 94, 0.06);
}

.filter-chip.active {
  border-color: #FF8B5E;
  background: rgba(255, 139, 94, 0.12);
  color: #3D3D3D;
  font-weight: 600;
  transform: scale(1.02);
}

.chip-icon {
  font-size: 14px;
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

.delete-btn {
  height: 100% !important;
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%) !important;
  border-radius: 12px !important;
}
</style>