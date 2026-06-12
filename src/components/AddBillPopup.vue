<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useCategoryStore } from '@/stores/category'
import { useAccountStore } from '@/stores/account'
import { useDevice } from '@/composables/useDevice'
import type { BillType } from '@/types'
import { getToday } from '@/utils'

const props = defineProps<{
  show: boolean
  editBillId?: number
}>()

const emit = defineEmits<{
  'update:show': [val: boolean]
  saved: []
}>()

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()
const { isMobile } = useDevice()

const billType = ref<BillType>('expense')
const amount = ref('')
const categoryId = ref<number>(0)
const accountId = ref<number>(0)
const date = ref(getToday())
const note = ref('')
const showDatePicker = ref(false)
const datePickerValue = computed(() => {
  const [y, m, d] = date.value.split('-').map(Number)
  return [String(y), String(m), String(d)]
})

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  const [y, m, d] = selectedValues.map(Number)
  date.value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  showDatePicker.value = false
}

const expenseCategories = computed(() => categoryStore.getByType('expense'))
const incomeCategories = computed(() => categoryStore.getByType('income'))
const currentCategories = computed(() =>
  billType.value === 'expense' ? expenseCategories.value : incomeCategories.value
)
const accounts = computed(() => accountStore.accounts)

const popupStyle = computed(() => ({
  height: isMobile.value ? '85vh' : 'auto',
  maxHeight: '85vh',
  borderRadius: isMobile.value ? '24px 24px 0 0' : '24px',
}))

watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.editBillId) {
        const bill = billStore.bills.find((b) => b.id === props.editBillId)
        if (bill) {
          billType.value = bill.type
          amount.value = String(bill.amount)
          categoryId.value = bill.categoryId
          accountId.value = bill.accountId
          date.value = bill.date
          note.value = bill.note
        }
      } else {
        billType.value = 'expense'
        amount.value = ''
        categoryId.value = currentCategories.value[0]?.id || 0
        accountId.value = accounts.value[0]?.id || 0
        date.value = getToday()
        note.value = ''
      }
    }
  },
  { immediate: true }
)

watch(billType, () => {
  categoryId.value = currentCategories.value[0]?.id || 0
})

function selectCategory(id: number) {
  categoryId.value = id
}

function selectAccount(id: number) {
  accountId.value = id
}

async function save() {
  const amt = parseFloat(amount.value)
  if (!amt || amt <= 0) return
  if (!categoryId.value) return
  if (!accountId.value) return

  const billData = {
    type: billType.value,
    amount: Math.round(amt * 100) / 100,
    categoryId: categoryId.value,
    accountId: accountId.value,
    date: date.value,
    note: note.value.trim(),
    createdAt: Date.now(),
  }

  if (props.editBillId) {
    await billStore.update(props.editBillId, billData)
  } else {
    await billStore.add(billData)
  }

  emit('saved')
}

function onClose() {
  emit('update:show', false)
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    :style="popupStyle"
    round
    @update:show="onClose"
  >
    <div class="add-bill-popup">
      <div class="popup-header">
        <button class="close-btn" @click="onClose">
          <span class="close-icon">✕</span>
        </button>
        <h3 class="popup-title">
          <span class="title-icon">🐱</span>
          {{ editBillId ? '编辑账单' : '记一笔' }}
        </h3>
        <div style="width: 36px"></div>
      </div>

      <div class="type-switch">
        <button
          :class="['type-btn', 'expense-btn', { active: billType === 'expense' }]"
          @click="billType = 'expense'"
        >
          <span class="btn-icon">💸</span>
          <span class="btn-text">支出</span>
        </button>
        <button
          :class="['type-btn', 'income-btn', { active: billType === 'income' }]"
          @click="billType = 'income'"
        >
          <span class="btn-icon">💰</span>
          <span class="btn-text">收入</span>
        </button>
      </div>

      <div class="amount-section">
        <div class="amount-container">
          <span class="currency">¥</span>
          <input
            v-model="amount"
            type="number"
            class="amount-input"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          <div class="amount-decoration">
            <span class="paw">🐾</span>
          </div>
        </div>
      </div>

      <div class="category-section">
        <div class="section-label">
          <span class="label-icon">🏷️</span>
          <span class="label-text">选择分类</span>
        </div>
        <div class="category-grid">
          <div
            v-for="cat in currentCategories"
            :key="cat.id"
            :class="['category-item', { active: categoryId === cat.id }]"
            @click="selectCategory(cat.id!)"
          >
            <div class="cat-icon-wrapper">
              <span class="cat-icon">{{ cat.icon }}</span>
            </div>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-row">
          <label class="form-label">
            <span class="label-icon">💳</span>
            <span class="label-text">账户</span>
          </label>
          <div class="account-chips">
            <button
              v-for="acc in accounts"
              :key="acc.id"
              :class="['account-chip', { active: accountId === acc.id }]"
              @click="selectAccount(acc.id!)"
            >
              <span class="chip-icon">{{ acc.icon }}</span>
              <span class="chip-name">{{ acc.name }}</span>
            </button>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-icon">📅</span>
            <span class="label-text">日期</span>
          </label>
          <span class="cat-input form-input date-trigger" @click="showDatePicker = true">
            <span class="date-text">{{ date }}</span>
          </span>
        </div>
        <van-popup v-model:show="showDatePicker" position="bottom" round>
          <van-date-picker
            :model-value="datePickerValue"
            title="选择日期"
            :columns-type="['year', 'month', 'day']"
            @confirm="onDateConfirm"
            @cancel="showDatePicker = false"
          />
        </van-popup>

        <div class="form-row">
          <label class="form-label">
            <span class="label-icon">📝</span>
            <span class="label-text">备注</span>
          </label>
          <input
            v-model="note"
            type="text"
            class="cat-input form-input"
            placeholder="添加备注..."
            maxlength="50"
          />
        </div>
      </div>

      <button class="cat-btn save-btn" @click="save">
        <span class="btn-icon">✨</span>
        <span class="btn-text">{{ editBillId ? '保存修改' : '保存' }}</span>
      </button>
    </div>
  </van-popup>
</template>

<style scoped>
.add-bill-popup {
  padding: 24px;
  background: linear-gradient(180deg, #FFF9F5 0%, #FFFFFF 100%);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .add-bill-popup {
    height: auto;
    max-height: 85vh;
    min-width: 440px;
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #FFF8F3 0%, #F5EBE0 100%);
  color: var(--cat-text-light, #8C8C8C);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(255, 139, 94, 0.08);
}

.close-btn:hover {
  transform: scale(1.05);
  background: linear-gradient(135deg, #FFEDE3 0%, #F5EBE0 100%);
}

.close-icon {
  font-weight: 600;
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--cat-text, #3D3D3D);
}

.title-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.2));
}

.type-switch {
  display: flex;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 20px;
  padding: 6px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--cat-text-light, #8C8C8C);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.type-btn.active {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  color: var(--cat-text, #3D3D3D);
  box-shadow: 0 4px 16px rgba(255, 139, 94, 0.12);
  transform: scale(1.02);
}

.expense-btn.active {
  background: linear-gradient(135deg, #FFFFFF 0%, rgba(242, 139, 130, 0.08) 100%);
}

.income-btn.active {
  background: linear-gradient(135deg, #FFFFFF 0%, rgba(125, 211, 192, 0.08) 100%);
}

.btn-icon {
  font-size: 16px;
}

.amount-section {
  margin-top: 4px;
}

.amount-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(255, 139, 94, 0.08);
  position: relative;
}

.currency {
  font-size: 26px;
  font-weight: 700;
  color: #FF8B5E;
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 34px;
  font-weight: 700;
  background: transparent;
  color: var(--cat-text, #3D3D3D);
  min-width: 0;
  letter-spacing: -0.02em;
}

.amount-input::placeholder {
  color: #D4C4B5;
  opacity: 0.6;
}

.amount-decoration {
  position: absolute;
  right: 16px;
  bottom: 8px;
}

.paw {
  font-size: 12px;
  opacity: 0.25;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon {
  font-size: 14px;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--cat-text-light, #8C8C8C);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

@media (min-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: transparent;
}

.category-item:hover {
  background: linear-gradient(135deg, #FFF8F3 0%, #F5EBE0 100%);
  transform: translateY(-2px);
}

.category-item.active {
  background: linear-gradient(135deg, rgba(255, 139, 94, 0.12) 0%, #FFEDE3 100%);
  transform: translateY(-2px);
}

.cat-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 12px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(255, 139, 94, 0.06);
}

.category-item.active .cat-icon-wrapper {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.25);
  transform: scale(1.08);
}

.cat-icon {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  transition: filter 0.25s ease;
}

.category-item.active .cat-icon {
  filter: brightness(10) drop-shadow(0 2px 4px rgba(255, 139, 94, 0.3));
}

.cat-name {
  font-size: 11px;
  color: var(--cat-text-light, #8C8C8C);
  white-space: nowrap;
  transition: color 0.25s ease;
}

.category-item.active .cat-name {
  color: var(--cat-text, #3D3D3D);
  font-weight: 600;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 56px;
  flex-shrink: 0;
}

.form-row .label-icon {
  font-size: 14px;
}

.form-row .label-text {
  font-size: 14px;
  color: var(--cat-text-light, #8C8C8C);
  font-weight: 500;
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

.form-input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--cat-text, #3D3D3D);
}

.date-trigger {
  cursor: pointer;
  color: var(--cat-text, #3D3D3D);
  display: flex;
  align-items: center;
}

.date-text {
  font-weight: 500;
}

.account-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.account-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  font-size: 13px;
  color: var(--cat-text-light, #8C8C8C);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
}

.account-chip:hover {
  border-color: rgba(255, 139, 94, 0.2);
  background: rgba(255, 139, 94, 0.06);
}

.account-chip.active {
  border-color: #FF8B5E;
  background: rgba(255, 139, 94, 0.12);
  color: var(--cat-text, #3D3D3D);
  font-weight: 600;
  transform: scale(1.02);
}

.chip-icon {
  font-size: 14px;
}

.save-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  border-radius: 18px;
  font-weight: 700;
}

.save-btn .btn-icon {
  font-size: 16px;
  filter: brightness(10);
}
</style>