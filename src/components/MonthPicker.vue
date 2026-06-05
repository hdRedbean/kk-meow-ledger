<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [val: string]
}>()

function prev() {
  const [y, m] = props.modelValue.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  emit('update:modelValue', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}

function next() {
  const [y, m] = props.modelValue.split('-').map(Number)
  const d = new Date(y, m, 1)
  emit('update:modelValue', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}

function current() {
  const now = new Date()
  emit('update:modelValue', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
}
</script>

<template>
  <div class="month-picker">
    <button class="arrow-btn" @click="prev">◀</button>
    <button class="month-label" @click="current">
      {{ modelValue.replace('-', '年') }}月
    </button>
    <button class="arrow-btn" @click="next">▶</button>
  </div>
</template>

<style scoped>
.month-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.arrow-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--cat-secondary);
  color: var(--cat-text-light);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.arrow-btn:hover {
  background: var(--cat-accent-light);
}

.month-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--cat-text);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 12px;
  transition: background 0.15s;
}

.month-label:hover {
  background: var(--cat-secondary);
}
</style>
