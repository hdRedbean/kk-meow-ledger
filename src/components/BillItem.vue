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
    <span class="bill-icon">{{ category?.icon || '❓' }}</span>
    <div class="bill-info">
      <span class="bill-category">{{ category?.name || '未知' }}</span>
      <span v-if="bill.note" class="bill-note">{{ bill.note }}</span>
    </div>
    <span :class="['bill-amount', bill.type === 'income' ? 'cat-income' : 'cat-expense']">
      {{ bill.type === 'income' ? '+' : '-' }}{{ formatMoney(bill.amount) }}
    </span>
  </div>
</template>

<style scoped>
.bill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 10px;
}

.bill-item:active {
  background: var(--cat-secondary);
}

.bill-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cat-secondary);
  border-radius: 12px;
  flex-shrink: 0;
}

.bill-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bill-category {
  font-size: 14px;
  font-weight: 500;
  color: var(--cat-text);
}

.bill-note {
  font-size: 12px;
  color: var(--cat-text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
