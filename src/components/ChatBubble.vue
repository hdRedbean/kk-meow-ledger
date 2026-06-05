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
      <span v-if="role === 'assistant'">🐱</span>
      <span v-else>😊</span>
    </div>
    <div class="bubble-content">
      <div v-if="loading" class="bubble-loading">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <div v-else class="bubble-text">{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
.chat-bubble {
  display: flex;
  gap: 10px;
  padding: 8px 0;
}

.chat-bubble.user {
  flex-direction: row-reverse;
}

.bubble-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--cat-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.bubble-content {
  max-width: 75%;
  min-width: 40px;
}

.bubble-text {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-bubble.assistant .bubble-text {
  background: var(--cat-card);
  color: var(--cat-text);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 6px rgba(245, 166, 35, 0.08);
}

.chat-bubble.user .bubble-text {
  background: var(--cat-accent);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-loading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: var(--cat-card);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cat-accent);
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
