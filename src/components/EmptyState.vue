<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="empty-state">
    <span class="empty-icon">😺</span>
    <p class="empty-text">{{ message || '暂无数据' }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 14px;
  color: var(--cat-text-light);
}
</style>
