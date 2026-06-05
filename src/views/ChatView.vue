<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import * as api from '@/api'
import ChatBubble from '@/components/ChatBubble.vue'
import { useDevice } from '@/composables/useDevice'

const { isMobile } = useDevice()

const conversations = ref<api.ConversationDTO[]>([])
const activeConvId = ref<number | null>(null)
const messages = ref<api.ChatMessageDTO[]>([])
const inputText = ref('')
const isLoading = ref(false)
const showSidebar = ref(false)

const chatListRef = ref<HTMLDivElement>()

async function loadConversations() {
  try {
    conversations.value = await api.getConversations()
  } catch {}
}

async function selectConversation(id: number) {
  activeConvId.value = id
  messages.value = await api.getMessages(id)
  showSidebar.value = false
  await nextTick()
  scrollToBottom()
}

async function newConversation() {
  try {
    const res = await api.createConversation()
    activeConvId.value = res.id
    messages.value = []
    showSidebar.value = false
    await loadConversations()
  } catch {}
}

async function deleteConversation(id: number) {
  try {
    await api.deleteConversation(id)
    if (activeConvId.value === id) {
      activeConvId.value = null
      messages.value = []
    }
    await loadConversations()
  } catch {}
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  if (!activeConvId.value) {
    await newConversation()
  }

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: text,
    createdAt: Date.now(),
  })
  inputText.value = ''
  await nextTick()
  scrollToBottom()

  isLoading.value = true
  messages.value.push({
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    createdAt: Date.now(),
  })
  await nextTick()
  scrollToBottom()

  try {
    const res = await api.sendMessage(text, activeConvId.value || undefined)
    activeConvId.value = res.conversationId
    messages.value[messages.value.length - 1] = res.assistantMessage
    await loadConversations()
  } catch (e: any) {
    messages.value[messages.value.length - 1] = {
      id: Date.now(),
      role: 'assistant',
      content: '抱歉，出了点问题，请稍后再试 😿\n' + (e.message || ''),
      createdAt: Date.now(),
    }
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatListRef.value) {
      chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(loadConversations)
</script>

<template>
  <div class="chat-page">
    <div :class="['sidebar', { open: showSidebar }]">
      <div class="sidebar-header">
        <h3 class="sidebar-title">🐱 对话列表</h3>
        <button class="cat-btn cat-btn-sm" @click="newConversation">＋ 新对话</button>
      </div>
      <div class="conv-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="['conv-item', { active: activeConvId === conv.id }]"
          @click="selectConversation(conv.id)"
        >
          <span class="conv-title">{{ conv.title }}</span>
          <button class="conv-delete" @click.stop="deleteConversation(conv.id)">✕</button>
        </div>
        <div v-if="conversations.length === 0" class="conv-empty">暂无对话</div>
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-header">
        <button v-if="isMobile" class="menu-btn" @click="showSidebar = !showSidebar">☰</button>
        <h3 class="chat-title">🐱 AI 助手</h3>
        <button class="cat-btn cat-btn-sm" @click="newConversation">新对话</button>
      </div>

      <div ref="chatListRef" class="chat-list">
        <template v-if="messages.length > 0">
          <ChatBubble
            v-for="msg in messages.slice(0, -1)"
            :key="msg.id"
            :role="msg.role as 'user' | 'assistant'"
            :content="msg.content"
          />
          <ChatBubble
            v-if="messages.length > 0"
            :role="messages[messages.length - 1].role as 'user' | 'assistant'"
            :content="messages[messages.length - 1].content"
            :loading="isLoading && !messages[messages.length - 1].content"
          />
        </template>
        <div v-else class="chat-welcome">
          <span class="welcome-icon">🐱</span>
          <h4 class="welcome-title">喵喵助手来帮你记账！</h4>
          <p class="welcome-desc">试试问我：</p>
          <div class="welcome-suggestions">
            <button class="suggestion" @click="inputText = '这个月花了多少钱？'; sendMessage()">这个月花了多少钱？</button>
            <button class="suggestion" @click="inputText = '本月餐饮支出多少？'; sendMessage()">本月餐饮支出多少？</button>
            <button class="suggestion" @click="inputText = '帮我记一笔餐饮支出50元'; sendMessage()">帮我记一笔餐饮支出50元</button>
            <button class="suggestion" @click="inputText = '预算还剩多少？'; sendMessage()">预算还剩多少？</button>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <input
          v-model="inputText"
          class="chat-input"
          placeholder="问我任何记账问题..."
          :disabled="isLoading"
          @keydown="handleKeydown"
        />
        <button :class="['send-btn', { disabled: isLoading || !inputText.trim() }]" @click="sendMessage">
          📤
        </button>
      </div>
    </div>

    <div v-if="showSidebar && isMobile" class="sidebar-overlay" @click="showSidebar = false"></div>
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 50px);
  max-width: 1200px;
  margin: 0 auto;
}

.sidebar {
  width: 240px;
  border-right: 1px solid var(--cat-border);
  background: var(--cat-card);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: -260px;
    top: 0;
    bottom: 0;
    z-index: 200;
    width: 260px;
    transition: left 0.25s;
  }
  .sidebar.open {
    left: 0;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  }
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 199;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--cat-border);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cat-text);
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.conv-item:hover {
  background: var(--cat-secondary);
}

.conv-item.active {
  background: var(--cat-accent-light);
}

.conv-title {
  font-size: 13px;
  color: var(--cat-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.conv-delete {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--cat-text-light);
  font-size: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conv-item:hover .conv-delete {
  opacity: 1;
}

.conv-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: var(--cat-text-light);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cat-border);
  background: var(--cat-card);
}

.menu-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--cat-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--cat-text);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.chat-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.welcome-icon {
  font-size: 48px;
}

.welcome-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--cat-text);
}

.welcome-desc {
  font-size: 13px;
  color: var(--cat-text-light);
}

.welcome-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.suggestion {
  padding: 10px 18px;
  border-radius: 16px;
  border: 1.5px solid var(--cat-border);
  background: var(--cat-card);
  font-size: 13px;
  color: var(--cat-text);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.suggestion:hover {
  border-color: var(--cat-accent);
  background: var(--cat-accent-light);
}

.chat-input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--cat-border);
  background: var(--cat-card);
}

.chat-input {
  flex: 1;
  border: 1.5px solid var(--cat-border);
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  background: var(--cat-bg);
  color: var(--cat-text);
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: var(--cat-accent);
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--cat-accent);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.send-btn:active {
  transform: scale(0.9);
}

.send-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
