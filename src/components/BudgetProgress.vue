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
  if (props.total <= 0) return '#FF8B5E'
  const p = props.used / props.total
  if (p >= 1) return '#F28B82'
  if (p >= 0.8) return '#E8A72E'
  return '#FF8B5E'
})

const barGradient = computed(() => {
  const color = barColor.value
  return `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`
})

const isOver = computed(() => props.total > 0 && props.used >= props.total)
</script>

<template>
  <div class="budget-progress">
    <div class="progress-header">
      <div class="progress-label-wrapper">
        <span class="progress-label-icon">📊</span>
        <span class="progress-label">{{ label || '预算' }}</span>
      </div>
      <div :class="['progress-percent-wrapper', { over: isOver }]">
        <span class="progress-percent">{{ percentage }}%</span>
        <span v-if="isOver" class="over-tag">⚠️ 超支!</span>
      </div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar-bg">
        <div
          class="progress-bar-fill"
          :style="{ width: `${Math.min(percentage, 100)}%`, background: barGradient }"
        >
          <div class="progress-bar-shine"></div>
        </div>
        <div class="progress-bar-paw" v-if="percentage > 20">🐾</div>
      </div>
    </div>
    
    <div class="progress-detail">
      <div class="detail-item used">
        <span class="detail-dot"></span>
        <span>已用 ¥{{ used.toFixed(2) }}</span>
      </div>
      <div class="detail-item total">
        <span class="detail-dot"></span>
        <span>预算 ¥{{ total.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-label-icon {
  font-size: 14px;
}

.progress-label {
  font-size: 13px;
  color: var(--cat-text-light, #8C8C8C);
  font-weight: 500;
}

.progress-percent-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 139, 94, 0.1);
  border-radius: 8px;
}

.progress-percent {
  font-size: 14px;
  font-weight: 700;
  color: #FF8B5E;
}

.progress-percent-wrapper.over {
  background: rgba(242, 139, 130, 0.12);
}

.progress-percent-wrapper.over .progress-percent {
  color: #F28B82;
}

.over-tag {
  font-size: 11px;
  color: #F28B82;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.progress-bar-container {
  padding: 2px 0;
}

.progress-bar-bg {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
}

.progress-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.progress-bar-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 6px 6px 0 0;
}

.progress-bar-paw {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 7px;
  opacity: 0.6;
  filter: brightness(10);
}

.progress-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--cat-text-light, #8C8C8C);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.detail-item.used .detail-dot {
  background: #FF8B5E;
}

.detail-item.total .detail-dot {
  background: #7DD3C0;
}
</style>