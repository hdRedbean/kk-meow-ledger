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
    <button class="arrow-btn prev" @click="prev">
      <span class="arrow-icon">←</span>
    </button>
    <button class="month-label" @click="showPicker = true">
      <span class="month-text">{{ modelValue.replace('-', '年') }}月</span>
      <span class="month-icon">📅</span>
    </button>
    <button class="arrow-btn next" @click="next">
      <span class="arrow-icon">→</span>
    </button>
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
  padding: 8px 0;
}

.arrow-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #FFF8F3 0%, #F5EBE0 100%);
  color: var(--cat-text-light, #8C8C8C);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(255, 139, 94, 0.08);
}

.arrow-btn:hover {
  transform: scale(1.08);
  background: linear-gradient(135deg, #FFEDE3 0%, #F5EBE0 100%);
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.15);
}

.arrow-btn:active {
  transform: scale(0.95);
}

.arrow-icon {
  font-weight: 600;
}

.month-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--cat-text, #3D3D3D);
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border: none;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 14px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 3px 12px rgba(255, 139, 94, 0.1);
}

.month-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 139, 94, 0.15);
}

.month-text {
  letter-spacing: 0.02em;
}

.month-icon {
  font-size: 14px;
  opacity: 0.7;
}
</style>