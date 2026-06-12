<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBillStore } from '@/stores/bill'
import { useCategoryStore } from '@/stores/category'
import { useAccountStore } from '@/stores/account'
import { useBudgetStore } from '@/stores/budget'
import { useAuthStore } from '@/stores/auth'
import { useDevice } from '@/composables/useDevice'
import AddBillPopup from '@/components/AddBillPopup.vue'

const route = useRoute()
const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const authStore = useAuthStore()
const { isMobile } = useDevice()

const showAddBill = ref(false)
const activeTab = ref('home')
const editingBillId = ref<number | undefined>(undefined)

const tabItems = [
  { key: 'home', label: '首页', icon: '🐱' },
  { key: 'bills', label: '账单', icon: '📋' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'chat', label: '助手', icon: '🤖' },
  { key: 'budget', label: '预算', icon: '💰' },
  { key: 'settings', label: '设置', icon: '⚙️' },
]

const routeNameMap: Record<string, string> = {
  home: 'home', bills: 'bills', stats: 'stats', chat: 'chat', budget: 'budget', settings: 'settings',
}

watch(() => route.name, (name) => {
  if (name && routeNameMap[name as string]) {
    activeTab.value = routeNameMap[name as string]
  }
}, { immediate: true })

function onTabChange(key: string) {
  activeTab.value = key
  const routeMap: Record<string, string> = {
    home: '/', bills: '/bills', stats: '/stats', chat: '/chat', budget: '/budget', settings: '/settings',
  }
  if (routeMap[key] && route.path !== routeMap[key]) {
    editingBillId.value = undefined
    router.push(routeMap[key])
  }
}

function openAddBill(billId?: number) {
  editingBillId.value = billId
  showAddBill.value = true
}

function onBillSaved() {
  showAddBill.value = false
  editingBillId.value = undefined
  billStore.version++
}

const tokens = ref<boolean>(localStorage.getItem('token') ? true : false)

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchMe()
      tokens.value = localStorage.getItem('token') ? true : false
    } catch {
      return
    }
  }
})
</script>

<template>
  <div class="app-container">
    <header v-if="!isMobile" class="desktop-header">
      <div class="desktop-header-inner">
        <div class="logo" @click="router.push('/')">
          <span class="logo-icon">🐱</span>
          <span class="logo-text">喵喵记账</span>
        </div>
        <nav class="desktop-nav">
          <button v-for="tab in tabItems" :key="tab.key" :class="['nav-btn', { active: activeTab === tab.key }]" @click="onTabChange(tab.key)">
            <span class="nav-icon">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </nav>
        <div class="header-actions">
          <button class="cat-btn add-btn-desktop" @click="openAddBill()">＋ 记一笔</button>
        </div>
      </div>
    </header>

    <main :class="['main-content', { 'has-bottom-nav': isMobile && activeTab !== 'chat' }]">
      <router-view @edit-bill="openAddBill" />
    </main>

    <AddBillPopup v-model:show="showAddBill" :edit-bill-id="editingBillId" @saved="onBillSaved" />

    <van-tabbar style="height: var(--cat-nav-bottom-padding);" v-if="isMobile" v-model="activeTab" @change="onTabChange" active-color="#FFB347" inactive-color="#8B7E6A">
      <van-tabbar-item v-for="tab in tabItems" :key="tab.key" :name="tab.key">
        <span>{{ tab.label }}</span>
        <template #icon><span class="tabbar-icon">{{ tab.icon }}</span></template>
      </van-tabbar-item>
    </van-tabbar>

    <button v-if="tokens && isMobile && activeTab !== 'chat'" class="mobile-fab" @click="openAddBill()">
      <span class="fab-icon">✏️</span>
    </button>
  </div>
</template>

<style scoped>
.app-container { min-height: 100vh; display: flex; flex-direction: column; }
.desktop-header { background: var(--cat-card); box-shadow: 0 2px 12px rgba(245,166,35,0.1); position: sticky; top: 0; z-index: 100; }
.desktop-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; padding: 12px 24px; gap: 24px; }
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
.logo-icon { font-size: 28px; }
.logo-text { font-size: 20px; font-weight: 700; color: var(--cat-text); }
.desktop-nav { display: flex; gap: 8px; flex: 1; justify-content: center; }
.nav-btn { display: flex; align-items: center; gap: 6px; padding: 8px 18px; border: none; border-radius: 24px; background: transparent; color: var(--cat-text-light); font-size: 14px; cursor: pointer; transition: all 0.2s; }
.nav-btn:hover { background: var(--cat-secondary); }
.nav-btn.active { background: var(--cat-accent); color: white; }
.nav-icon { font-size: 16px; }
.add-btn-desktop { flex-shrink: 0; }
.main-content { flex: 1; }
.main-content.has-bottom-nav { padding-bottom: 50px; }
.mobile-fab { position: fixed; bottom: 80px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: var(--cat-accent); box-shadow: 0 4px 20px rgba(245,166,35,0.35); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 99; transition: transform 0.2s; }
.mobile-fab:active { transform: scale(0.9); }
.fab-icon { font-size: 24px; }
.tabbar-icon { font-size: 20px; }
</style>
