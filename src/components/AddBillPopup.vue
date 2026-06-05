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
  borderRadius: isMobile.value ? '20px 20px 0 0' : '20px',
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
        <button class="close-btn" @click="onClose">✕</button>
        <h3 class="popup-title">{{ editBillId ? '编辑账单' : '记一笔' }} 🐱</h3>
        <div style="width: 32px"></div>
      </div>

      <div class="type-switch">
        <button
          :class="['type-btn', { active: billType === 'expense' }]"
          @click="billType = 'expense'"
        >
          支出
        </button>
        <button
          :class="['type-btn', { active: billType === 'income' }]"
          @click="billType = 'income'"
        >
          收入
        </button>
      </div>

      <div class="amount-section">
        <span class="currency">¥</span>
        <input
          v-model="amount"
          type="number"
          class="amount-input"
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>

      <div class="category-grid">
        <div
          v-for="cat in currentCategories"
          :key="cat.id"
          :class="['category-item', { active: categoryId === cat.id }]"
          @click="selectCategory(cat.id!)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
        </div>
      </div>

      <div class="form-section">
        <div class="form-row">
          <label>账户</label>
          <div class="account-chips">
            <button
              v-for="acc in accounts"
              :key="acc.id"
              :class="['account-chip', { active: accountId === acc.id }]"
              @click="selectAccount(acc.id!)"
            >
              {{ acc.icon }} {{ acc.name }}
            </button>
          </div>
        </div>

        <div class="form-row">
          <label>日期</label>
          <span class="cat-input form-input date-trigger" @click="showDatePicker = true">{{ date }}</span>
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
          <label>备注</label>
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
        {{ editBillId ? '保存修改' : '保存' }}
      </button>
    </div>
  </van-popup>
</template>

<style scoped>
.add-bill-popup {
  padding: 20px;
  background: var(--cat-card);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .add-bill-popup {
    height: auto;
    max-height: 85vh;
    min-width: 420px;
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--cat-secondary);
  color: var(--cat-text-light);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--cat-text);
}

.type-switch {
  display: flex;
  background: var(--cat-secondary);
  border-radius: 24px;
  padding: 3px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--cat-text-light);
  transition: all 0.2s;
}

.type-btn.active {
  background: white;
  color: var(--cat-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.amount-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.currency {
  font-size: 28px;
  font-weight: 700;
  color: var(--cat-accent);
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 32px;
  font-weight: 700;
  background: transparent;
  color: var(--cat-text);
  min-width: 0;
}

.amount-input::placeholder {
  color: var(--cat-border);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
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
  gap: 4px;
  padding: 10px 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
}

.category-item:hover {
  background: var(--cat-secondary);
}

.category-item.active {
  background: var(--cat-accent-light);
}

.cat-icon {
  font-size: 24px;
}

.cat-name {
  font-size: 11px;
  color: var(--cat-text-light);
  white-space: nowrap;
}

.category-item.active .cat-name {
  color: var(--cat-text);
  font-weight: 500;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-row label {
  font-size: 14px;
  color: var(--cat-text-light);
  min-width: 48px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  min-width: 0;
}

.date-trigger {
  cursor: pointer;
  color: var(--cat-text);
  padding: 8px 12px;
}

.account-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.account-chip {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1.5px solid var(--cat-border);
  background: transparent;
  font-size: 13px;
  color: var(--cat-text-light);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.account-chip.active {
  border-color: var(--cat-accent);
  background: var(--cat-accent-light);
  color: var(--cat-text);
}

.save-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 8px;
}
</style>
