<script setup lang="ts">
import { computed } from 'vue'
import { useCategoryStore } from '@/stores/category'
import type { BillType } from '@/types'

const props = defineProps<{
  modelValue: number
  type: BillType
}>()

const emit = defineEmits<{
  'update:modelValue': [val: number]
}>()

const categoryStore = useCategoryStore()
const categories = computed(() => categoryStore.getByType(props.type))
</script>

<template>
  <div class="category-picker">
    <div
      v-for="cat in categories"
      :key="cat.id"
      :class="['picker-item', { active: modelValue === cat.id }]"
      @click="emit('update:modelValue', cat.id!)"
    >
      <span class="picker-icon">{{ cat.icon }}</span>
      <span class="picker-name">{{ cat.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.category-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

@media (min-width: 768px) {
  .category-picker {
    grid-template-columns: repeat(8, 1fr);
  }
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.picker-item:hover {
  background: var(--cat-secondary);
}

.picker-item.active {
  background: var(--cat-accent-light);
}

.picker-icon {
  font-size: 24px;
}

.picker-name {
  font-size: 11px;
  color: var(--cat-text-light);
}

.picker-item.active .picker-name {
  color: var(--cat-text);
  font-weight: 500;
}
</style>
