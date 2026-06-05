<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [val: string]
}>()

const showPicker = ref(false)
const pickerDate = computed(() => {
  const [y, m] = props.modelValue.split('-').map(Number)
  return [String(y), String(m)]
})

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

function onConfirm({ selectedValues }: { selectedValues: string[] }) {
  const [y, m] = selectedValues.map(Number)
  emit('update:modelValue', `${y}-${String(m).padStart(2, '0')}`)
  showPicker.value = false
}
</script>

<template>
  <div class="month-picker">
    <button class="arrow-btn" @click="prev">◀</button>
    <button class="month-label" @click="showPicker = true">
      {{ modelValue.replace('-', '年') }}月
    </button>
    <button class="arrow-btn" @click="next">▶</button>
    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-date-picker
        :model-value="pickerDate"
        title="选择年月"
        :columns-type="['year', 'month']"
        @confirm="onConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
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
