<script setup lang="ts">
import type { BillDTO } from '@/api'
import { useCategoryStore } from '@/stores/category'
import { formatMoney } from '@/utils'
import { computed } from 'vue'

const props = defineProps<{ bill: BillDTO }>()
const emit = defineEmits<{ edit: [id: number] }>()

const categoryStore = useCategoryStore()

const category = computed(() => categoryStore.getById(props.bill.categoryId))
</script>

<template>
  <div class="bill-item" @click="emit('edit', bill.id!)">
    <div class="bill-icon-wrapper">
      <span class="bill-icon">{{ category?.icon || '❓' }}</span>
    </div>
    <div class="bill-info">
      <span class="bill-category">{{ category?.name || '未知' }}</span>
      <span v-if="bill.note" class="bill-note">{{ bill.note }}</span>
    </div>
    <div class="bill-amount-wrapper">
      <span :class="['bill-amount', bill.type === 'income' ? 'income' : 'expense']">
        {{ bill.type === 'income' ? '+' : '-' }}{{ formatMoney(bill.amount) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bill-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 16px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  box-shadow: 0 2px 12px rgba(255, 139, 94, 0.06);
  margin-bottom: 10px;
}

.bill-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 139, 94, 0.12);
}

.bill-item:active {
  transform: scale(0.98);
}

.bill-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cat-secondary, #F5EBE0);
  border-radius: 14px;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.bill-item:hover .bill-icon-wrapper {
  transform: scale(1.05);
}

.bill-icon {
  font-size: 26px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.bill-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bill-category {
  font-size: 15px;
  font-weight: 600;
  color: var(--cat-text, #3D3D3D);
  letter-spacing: 0.02em;
}

.bill-note {
  font-size: 12px;
  color: var(--cat-text-light, #8C8C8C);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.85;
}

.bill-amount-wrapper {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(255, 139, 94, 0.08);
}

.bill-amount {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.bill-amount.income {
  color: #7DD3C0;
}

.bill-amount-wrapper .bill-amount.income {
  background: rgba(125, 211, 192, 0.12);
}

.bill-amount.expense {
  color: #F28B82;
}

.bill-amount-wrapper .bill-amount.expense {
  background: rgba(242, 139, 130, 0.08);
}
</style>