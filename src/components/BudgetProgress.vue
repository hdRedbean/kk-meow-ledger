<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  used: number
  total: number
  label?: string
}>()

const percentage = computed(() => {
  if (props.total <= 0) return 0
  return Math.min(Math.round((props.used / props.total) * 100), 100)
})

const barColor = computed(() => {
  if (props.total <= 0) return 'var(--cat-accent)'
  const p = props.used / props.total
  if (p >= 1) return 'var(--cat-expense)'
  if (p >= 0.8) return '#E8A72E'
  return 'var(--cat-accent)'
})

const isOver = computed(() => props.total > 0 && props.used >= props.total)
</script>

<template>
  <div class="budget-progress">
    <div class="progress-header">
      <span class="progress-label">{{ label || '预算' }}</span>
      <span :class="['progress-percent', { over: isOver }]">
        {{ percentage }}%
        <span v-if="isOver" class="over-tag">超支!</span>
      </span>
    </div>
    <div class="progress-bar-bg">
      <div
        class="progress-bar-fill"
        :style="{ width: `${Math.min(percentage, 100)}%`, background: barColor }"
      ></div>
    </div>
    <div class="progress-detail">
      <span>已用 ¥{{ used.toFixed(2) }}</span>
      <span>预算 ¥{{ total.toFixed(2) }}</span>
    </div>
  </div>
</template>

<style scoped>
.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 13px;
  color: var(--cat-text-light);
}

.progress-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--cat-accent);
}

.progress-percent.over {
  color: var(--cat-expense);
}

.over-tag {
  font-size: 11px;
  margin-left: 4px;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.progress-bar-bg {
  height: 8px;
  border-radius: 4px;
  background: var(--cat-secondary);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-detail {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--cat-text-light);
}
</style>
