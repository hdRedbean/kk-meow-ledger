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
      <div class="picker-icon-wrapper">
        <span class="picker-icon">{{ cat.icon }}</span>
        <div class="picker-ear left" v-if="modelValue === cat.id"></div>
        <div class="picker-ear right" v-if="modelValue === cat.id"></div>
      </div>
      <span class="picker-name">{{ cat.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.category-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (min-width: 768px) {
  .category-picker {
    grid-template-columns: repeat(6, 1fr);
  }
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: transparent;
  position: relative;
}

.picker-item:hover {
  background: linear-gradient(135deg, #FFF8F3 0%, #F5EBE0 100%);
  transform: translateY(-2px);
}

.picker-item:hover:not(.active) .picker-icon-wrapper {
  transform: scale(1.05);
}

.picker-item.active {
  background: linear-gradient(135deg, #FFEDE3 0%, rgba(255, 139, 94, 0.12) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 139, 94, 0.15);
}

.picker-icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 14px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.picker-item.active .picker-icon-wrapper {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.3);
  transform: scale(1.08);
}

.picker-icon {
  font-size: 24px;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
  transition: transform 0.25s ease;
}

.picker-item.active .picker-icon {
  filter: brightness(10) drop-shadow(0 2px 4px rgba(255, 139, 94, 0.4));
}

.picker-ear {
  position: absolute;
  top: -4px;
  width: 8px;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50% 50% 0 0;
}

.picker-ear.left {
  left: 6px;
  transform: rotate(-20deg);
}

.picker-ear.right {
  right: 6px;
  transform: rotate(20deg);
}

.picker-name {
  font-size: 12px;
  color: var(--cat-text-light, #8C8C8C);
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: color 0.25s ease;
}

.picker-item:hover .picker-name {
  color: var(--cat-text, #3D3D3D);
}

.picker-item.active .picker-name {
  color: var(--cat-text, #3D3D3D);
  font-weight: 600;
}
</style>