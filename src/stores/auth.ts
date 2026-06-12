import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<api.UserInfoDTO | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  )

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const nickname = computed(() => user.value?.nickname || user.value?.username || '')
  const userId = computed(() => user.value?.id)

  async function login(username: string, password: string) {
    const res = await api.login({ username, password })
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }

  async function register(username: string, password: string, nickname?: string) {
    const res = await api.register({ username, password, nickname })
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
  }

  async function fetchMe() {
    try {
      const me = await api.getMe()
      user.value = me
      localStorage.setItem('user', JSON.stringify(me))
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, nickname, userId, login, register, fetchMe, logout }
})