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
  } catch { }
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
    activeConvId.value = null
    messages.value = []
    showSidebar.value = false
    await loadConversations()
  } catch { }
}

async function deleteConversation(id: number) {
  try {
    await api.deleteConversation(id)
    if (activeConvId.value === id) {
      activeConvId.value = null
      messages.value = []
    }
    await loadConversations()
  } catch { }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

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
  const msgIndex = messages.value.length - 1
  await nextTick()
  scrollToBottom()

  try {
    const { conversationId } = await api.sendMessageStream(
      text,
      activeConvId.value,
      (chunk) => {
        messages.value[msgIndex].content += chunk
        scrollToBottom()
      },
      (id) => {
        activeConvId.value = id
      },
    )
    activeConvId.value = conversationId
    await loadConversations()
  } catch (e: any) {
    messages.value[msgIndex].content = '抱歉，出了点问题，请稍后再试 😿\n' + (e.message || '')
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
    <div class="mask" v-if="showSidebar" @click="showSidebar = !showSidebar"></div>
    <div :class="['sidebar', { open: showSidebar }]">
      <div class="sidebar-header">
        <div class="header-left">
          <span class="header-icon">🐱</span>
          <h3 class="sidebar-title">对话列表</h3>
        </div>
        <button class="cat-btn cat-btn-sm" @click="newConversation">
          <span class="btn-icon">✨</span>
          新对话
        </button>
      </div>
      <div class="conv-list">
        <div v-for="conv in conversations" :key="conv.id" :class="['conv-item', { active: activeConvId === conv.id }]"
          @click="selectConversation(conv.id)">
          <span class="conv-icon">💬</span>
          <span class="conv-title">{{ conv.title }}</span>
          <button class="conv-delete" @click.stop="deleteConversation(conv.id)">
            <span class="delete-icon">✕</span>
          </button>
        </div>
        <div v-if="conversations.length === 0" class="conv-empty">
          <span class="empty-icon">😺</span>
          <span class="empty-text">暂无对话</span>
        </div>
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-header">
        <button v-if="isMobile" class="menu-btn" @click="showSidebar = !showSidebar">
          <span class="menu-icon">☰</span>
        </button>
        <div class="header-center">
          <span class="header-icon">🐱</span>
          <h3 class="chat-title">AI 助手</h3>
        </div>
        <button class="cat-btn cat-btn-sm" @click="newConversation">
          <span class="btn-icon">✨</span>
          新对话
        </button>
      </div>

      <div ref="chatListRef" class="chat-list">
        <template v-if="messages.length > 0">
          <ChatBubble v-for="msg in messages.slice(0, -1)" :key="msg.id" :role="msg.role" :content="msg.content" />
          <ChatBubble v-if="messages.length > 0" :role="messages[messages.length - 1].role"
            :content="messages[messages.length - 1].content" :loading="isLoading" />
        </template>
        <div v-else class="empty-chat">
          <div class="empty-icon-wrapper">
            <span class="empty-icon">😺</span>
          </div>
          <p class="empty-text">开始和喵喵助手聊天吧~ 试试问我：</p>
          <div class="welcome-suggestions">
            <button class="suggestion" @click="inputText = '这个月花了多少钱？'; sendMessage()">这个月花了多少钱？</button>
            <button class="suggestion" @click="inputText = '本月餐饮支出多少？'; sendMessage()">本月餐饮支出多少？</button>
            <button class="suggestion" @click="inputText = '帮我记一笔餐饮支出50元'; sendMessage()">帮我记一笔餐饮支出50元</button>
            <button class="suggestion" @click="inputText = '预算还剩多少？'; sendMessage()">预算还剩多少？</button>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea v-model="inputText" class="chat-input" placeholder="输入消息..." rows="1" @keydown="handleKeydown" />
          <button class="send-btn" :disabled="!inputText.trim() || isLoading" @click="sendMessage">
            <span class="send-icon">🚀</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 11;
}

.chat-page {
  display: flex;
  height: 100vh;
  background: #FFF9F5;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 4px 0 20px rgba(255, 139, 94, 0.08);
}

@media (max-width: 767px) {
  .sidebar {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 100;
    transform: translateX(-100%);
    height: 100%;
  }

  .sidebar.open {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 6px rgba(255, 139, 94, 0.2));
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #3D3D3D;
}

.cat-btn {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  color: white;
  border-radius: 12px;
  padding: 8px 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  cursor: pointer;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.2);
}

.cat-btn:hover {
  transform: scale(1.02);
}

.cat-btn-sm {
  padding: 8px 12px;
}

.btn-icon {
  font-size: 12px;
  filter: brightness(10);
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-bottom: 8px;
  background: transparent;
}

.conv-item:hover {
  background: rgba(255, 139, 94, 0.08);
  transform: translateX(4px);
}

.conv-item.active {
  background: rgba(255, 139, 94, 0.12);
  box-shadow: 0 2px 12px rgba(255, 139, 94, 0.1);
}

.conv-icon {
  font-size: 18px;
}

.conv-title {
  flex: 1;
  font-size: 14px;
  color: #3D3D3D;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-delete {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(242, 139, 130, 0.1);
  color: #F28B82;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  opacity: 0;
}

.conv-item:hover .conv-delete {
  opacity: 1;
}

.conv-delete:hover {
  background: #F28B82;
  color: white;
  transform: scale(1.1);
}

.delete-icon {
  font-weight: 600;
}

.conv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.empty-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 8px rgba(255, 139, 94, 0.15));
}

.empty-text {
  font-size: 14px;
  color: #8C8C8C;
  font-weight: 500;
}

.welcome-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(255, 139, 94, 0.08);
}

.menu-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #FFF8F3 0%, #F5EBE0 100%);
  color: #8C8C8C;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(255, 139, 94, 0.08);
}

.menu-btn:hover {
  transform: scale(1.05);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-title {
  font-size: 18px;
  font-weight: 700;
  color: #3D3D3D;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
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

.empty-icon-wrapper .empty-icon {
  font-size: 42px;
}

.pawprints {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.paw {
  font-size: 12px;
  opacity: 0.4;
}

.chat-input-area {
  padding: 12px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 -4px 20px rgba(255, 139, 94, 0.08);
  padding-bottom: calc(var(--cat-nav-bottom-padding) + 10px);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 18px;
  padding: 6px;
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  background: transparent;
  padding: 8px 10px;
  color: #3D3D3D;
  resize: none;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: #8C8C8C;
}

.send-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.2);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
}

.send-btn:disabled {
  background: #D4C4B5;
  box-shadow: none;
  cursor: not-allowed;
}

.send-icon {
  filter: brightness(10);
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}
</style>