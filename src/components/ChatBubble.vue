<script setup lang="ts">
defineProps<{
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}>()
</script>

<template>
  <div :class="['chat-bubble', role]">
    <div class="bubble-avatar">
      <span v-if="role === 'assistant'" class="avatar-icon">🐱</span>
      <span v-else class="avatar-icon">😊</span>
    </div>
    <div class="bubble-content">
      <div v-if="loading && content.length <= 0" class="bubble-loading">
        <div class="loading-cat">
          <span class="cat-face">😺</span>
        </div>
        <div class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
      <div v-else class="bubble-text">{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
.chat-bubble {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  animation: fadeIn 0.3s ease;
}

.chat-bubble.user {
  flex-direction: row-reverse;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFF8F3 0%, #F5EBE0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(255, 139, 94, 0.12);
  transition: transform 0.25s ease;
}

.chat-bubble:hover .bubble-avatar {
  transform: scale(1.05);
}

.avatar-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.bubble-content {
  max-width: 75%;
  min-width: 40px;
}

.bubble-text {
  padding: 14px 18px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
  letter-spacing: 0.02em;
}

.chat-bubble.assistant .bubble-text {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  color: var(--cat-text, #3D3D3D);
  border-bottom-left-radius: 6px;
  box-shadow: 0 3px 14px rgba(255, 139, 94, 0.08);
}

.chat-bubble.user .bubble-text {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  color: white;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 16px rgba(255, 139, 94, 0.25);
}

.bubble-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  box-shadow: 0 3px 14px rgba(255, 139, 94, 0.08);
}

.loading-cat {
  animation: catBounce 1.5s ease-in-out infinite;
}

.cat-face {
  font-size: 18px;
}

@keyframes catBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.loading-dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF8B5E;
  animation: dotPulse 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% { 
    transform: scale(0.6); 
    opacity: 0.4; 
  }
  40% { 
    transform: scale(1); 
    opacity: 1; 
  }
}
</style>