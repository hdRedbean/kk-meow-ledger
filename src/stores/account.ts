import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<api.AccountDTO[]>([])
  const loaded = ref(false)

  async function load() {
    accounts.value = await api.getAccounts()
    loaded.value = true
  }

  function getById(id: number): api.AccountDTO | undefined {
    return accounts.value.find((a) => a.id === id)
  }

  async function add(acc: { name: string; icon: string }) {
    const res = await api.createAccount(acc)
    accounts.value.push({ ...acc, isPreset: false, balance: 0, id: res.id })
    return res.id
  }

  async function update(id: number, data: { name?: string; icon?: string }) {
    await api.updateAccount(id, data)
    const idx = accounts.value.findIndex((a) => a.id === id)
    if (idx !== -1) {
      accounts.value[idx] = { ...accounts.value[idx], ...data }
    }
  }

  async function remove(id: number) {
    await api.deleteAccount(id)
    accounts.value = accounts.value.filter((a) => a.id !== id)
  }

  return { accounts, loaded, load, getById, add, update, remove }
})
