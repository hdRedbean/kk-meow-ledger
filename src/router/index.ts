import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/bills', name: 'bills', component: () => import('@/views/BillListView.vue') },
  { path: '/stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
  { path: '/budget', name: 'budget', component: () => import('@/views/BudgetView.vue') },
  { path: '/chat', name: 'chat', component: () => import('@/views/ChatView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
