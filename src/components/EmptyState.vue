<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon-wrapper">
      <span class="empty-icon">😺</span>
      <div class="empty-pawprints">
        <span class="paw">🐾</span>
        <span class="paw">🐾</span>
        <span class="paw">🐾</span>
      </div>
    </div>
    <p class="empty-text">{{ message || '暂无数据' }}</p>
    <div class="empty-decoration">
      <div class="cat-ear left"></div>
      <div class="cat-ear right"></div>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  gap: 16px;
  position: relative;
}

.empty-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF8F3 0%, #FFEDE3 100%);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

.empty-icon {
  font-size: 42px;
  filter: drop-shadow(0 2px 8px rgba(255, 139, 94, 0.15));
}

.empty-pawprints {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.paw {
  font-size: 10px;
  opacity: 0.4;
  animation: paw-walk 2s ease-in-out infinite;
}

.paw:nth-child(2) {
  animation-delay: 0.3s;
}

.paw:nth-child(3) {
  animation-delay: 0.6s;
}

.empty-text {
  font-size: 14px;
  color: var(--cat-text-light, #8C8C8C);
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.02em;
  max-width: 200px;
}

.empty-decoration {
  position: absolute;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 40px;
}

.cat-ear {
  width: 12px;
  height: 16px;
  background: rgba(255, 139, 94, 0.15);
  border-radius: 50% 50% 0 0;
  transform: rotate(-15deg);
}

.cat-ear.right {
  transform: rotate(15deg);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes paw-walk {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-2px);
    opacity: 0.6;
  }
}
</style>