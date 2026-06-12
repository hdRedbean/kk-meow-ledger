<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''

  if (!username.value.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  if (!isLogin.value) {
    if (password.value.length < 6) {
      errorMsg.value = '密码长度不能少于6位'
      return
    }
    if (password.value !== confirmPassword.value) {
      errorMsg.value = '两次密码不一致'
      return
    }
    if (username.value.length < 3) {
      errorMsg.value = '用户名长度需在3-32个字符之间'
      return
    }
  }

  loading.value = true
  try {
    if (isLogin.value) {
      await authStore.login(username.value.trim(), password.value)
    } else {
      await authStore.register(username.value.trim(), password.value, nickname.value.trim() || undefined)
    }
    router.replace('/')
  } catch (e: any) {
    const resp = e.response?.data
    if (resp?.error) {
      errorMsg.value = resp.error
    } else {
      errorMsg.value = isLogin.value ? '登录失败，请稍后重试' : '注册失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
  password.value = ''
  confirmPassword.value = ''
  nickname.value = ''
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg-deco">
      <div class="deco-paw paw-1">🐾</div>
      <div class="deco-paw paw-2">🐾</div>
      <div class="deco-paw paw-3">🐾</div>
    </div>

    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <span class="logo-emoji">🐱</span>
        </div>
        <h1 class="auth-title">{{ isLogin ? '欢迎回来' : '创建账号' }}</h1>
        <p class="auth-subtitle">{{ isLogin ? '登录你的喵喵记账' : '注册新账号开始使用' }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">👤</span>
            <span>用户名</span>
          </label>
          <input
            v-model="username"
            type="text"
            class="cat-input auth-input"
            placeholder="请输入用户名"
            autocomplete="username"
            :disabled="loading"
          />
        </div>

        <div v-if="!isLogin" class="input-group">
          <label class="input-label">
            <span class="label-icon">😺</span>
            <span>昵称</span>
          </label>
          <input
            v-model="nickname"
            type="text"
            class="cat-input auth-input"
            placeholder="选填，展示的昵称"
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label class="input-label">
            <span class="label-icon">🔒</span>
            <span>密码</span>
          </label>
          <input
            v-model="password"
            type="password"
            class="cat-input auth-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <div v-if="!isLogin" class="input-group">
          <label class="input-label">
            <span class="label-icon">🔒</span>
            <span>确认密码</span>
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            class="cat-input auth-input"
            placeholder="再次输入密码"
            autocomplete="new-password"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">
          <span class="error-icon">⚠️</span>
          {{ errorMsg }}
        </div>

        <button class="cat-btn auth-submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>{{ isLogin ? '登 录' : '注 册' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <span class="footer-text">{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <button class="footer-link" @click="toggleMode" :disabled="loading">
          {{ isLogin ? '去注册' : '去登录' }}
        </button>
      </div>
    </div>

    <!--<div class="auth-bottom-text">-->
    <!--  <span class="cat-emoji">🐱</span> 喵喵记账 · 安全加密存储-->
    <!--</div>-->
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(var(--cat-nav-bottom-padding) - 100vh);
  display: flex;
  flex-direction: column;
  background: #FFF8E7;
  padding: 24px 20px;
  position: relative;
  overflow: hidden;
}

.auth-bg-deco {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.15;
}

.deco-paw {
  position: absolute;
  font-size: 40px;
}

.paw-1 { top: 8%; left: 10%; transform: rotate(-30deg); }
.paw-2 { top: 15%; right: 12%; transform: rotate(20deg); }
.paw-3 { bottom: 20%; left: 15%; transform: rotate(45deg); }

.auth-card {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 24px;
  padding: 36px 28px 28px;
  box-shadow: 0 8px 40px rgba(255, 139, 94, 0.12), 0 2px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-logo {
  margin-bottom: 12px;
}

.logo-emoji {
  font-size: 48px;
  filter: drop-shadow(0 4px 12px rgba(255, 139, 94, 0.3));
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #3D3D3D;
  margin: 0 0 6px;
}

.auth-subtitle {
  font-size: 14px;
  color: #8C8C8C;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #5D4E37;
}

.label-icon {
  font-size: 14px;
}

.auth-input {
  background: #FFFDF5;
  border-color: #F0E6D0;
  padding: 12px 16px;
  font-size: 15px;
}

.auth-input:focus {
  border-color: #FFB347;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(255, 179, 71, 0.15);
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(232, 114, 114, 0.1);
  border: 1px solid rgba(232, 114, 114, 0.25);
  border-radius: 12px;
  font-size: 13px;
  color: #E87272;
}

.error-icon {
  font-size: 14px;
}

.auth-submit-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  margin-top: 4px;
  background: linear-gradient(135deg, #FF8B5E 0%, #FFB347 100%);
  box-shadow: 0 4px 16px rgba(255, 139, 94, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.auth-submit-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(255, 139, 94, 0.35);
}

.auth-submit-btn:active {
  transform: scale(0.98);
}

.auth-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
}

.footer-text {
  font-size: 14px;
  color: #8C8C8C;
}

.footer-link {
  font-size: 14px;
  color: #FF8B5E;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #E87A4A;
}

.footer-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-bottom-text {
  margin-top: 28px;
  font-size: 13px;
  color: #B0A08C;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
}

.cat-emoji {
  font-size: 16px;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px 24px;
    border-radius: 20px;
  }

  .auth-title {
    font-size: 22px;
  }

  .auth-submit-btn {
    padding: 12px;
  }
}
</style>
