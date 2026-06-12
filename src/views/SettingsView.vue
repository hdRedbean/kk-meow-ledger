<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillStore } from '@/stores/bill'
import { useAuthStore } from '@/stores/auth'
import { exportToJSON, exportToCSV } from '@/utils/export'
import { showToast, showConfirmDialog } from 'vant'
import CategoryManager from '@/components/CategoryManager.vue'
import AccountManager from '@/components/AccountManager.vue'

const router = useRouter()
const billStore = useBillStore()
const authStore = useAuthStore()
const activeSection = ref<'category' | 'account' | 'data'>('category')

async function handleExportJSON() {
  if (billStore.bills.length === 0) {
    showToast('暂无数据可导出')
    return
  }
  exportToJSON(billStore.bills)
  showToast('导出成功 🐱')
}

async function handleExportCSV() {
  if (billStore.bills.length === 0) {
    showToast('暂无数据可导出')
    return
  }
  exportToCSV(billStore.bills)
  showToast('导出成功 🐱')
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出当前账号吗？',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    })
    authStore.logout()
    router.replace('/login')
  } catch { }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-decoration">
        <div class="cat-ear left"></div>
        <div class="cat-ear right"></div>
      </div>
      <h2 class="page-title">
        <span class="title-icon">⚙️</span>
        <span class="title-text">设置</span>
      </h2>
    </div>

    <div class="user-card cat-card">
      <div class="user-card-inner">
        <span class="user-avatar">{{ authStore.nickname?.charAt(0) || '🐱' }}</span>
        <div class="user-info">
          <div class="user-nickname">{{ authStore.nickname || '未登录' }}</div>
          <div class="user-username">@{{ authStore.user?.username || '--' }}</div>
        </div>
      </div>
      <button class="cat-btn logout-btn" @click="handleLogout">
        <span>🚪</span>
        <span>退出登录</span>
      </button>
    </div>

    <div class="section-tabs">
      <button :class="['tab-btn', { active: activeSection === 'category' }]" @click="activeSection = 'category'">
        <span class="tab-icon">🏷️</span>
        <span class="tab-text" style="font-size: 12px;">分类管理</span>
      </button>
      <button :class="['tab-btn', { active: activeSection === 'account' }]" @click="activeSection = 'account'">
        <span class="tab-icon">💳</span>
        <span class="tab-text" style="font-size: 12px;">账户管理</span>
      </button>
      <button :class="['tab-btn', { active: activeSection === 'data' }]" @click="activeSection = 'data'">
        <span class="tab-icon">📦</span>
        <span class="tab-text" style="font-size: 12px;">数据管理</span>
      </button>
    </div>

    <div class="section-content" style="margin-top: 20px">
      <CategoryManager v-if="activeSection === 'category'" />
      <AccountManager v-else-if="activeSection === 'account'" />

      <div v-else class="data-section">
        <div class="cat-card data-card">
          <div class="card-header">
            <div class="header-left">
              <span class="card-icon">📤</span>
              <h4 class="card-title">导出数据</h4>
            </div>
          </div>
          <p class="card-desc">将所有账单数据导出为文件备份</p>
          <div class="data-actions">
            <button class="cat-btn action-btn" @click="handleExportJSON">
              <span class="btn-icon">✨</span>
              <span class="btn-text">导出 JSON</span>
            </button>
            <button class="cat-btn action-btn" @click="handleExportCSV">
              <span class="btn-icon">📋</span>
              <span class="btn-text">导出 CSV</span>
            </button>
          </div>
        </div>

        <div v-if="false" class="cat-card data-card" style="margin-top: 16px">
          <div class="card-header">
            <div class="header-left">
              <span class="card-icon">📥</span>
              <h4 class="card-title">导入数据</h4>
            </div>
          </div>
          <p class="card-desc">从 JSON 或 CSV 文件恢复数据</p>
          <button class="cat-btn action-btn import" @click="triggerImport">
            <span class="btn-icon">📂</span>
            <span class="btn-text">选择文件导入</span>
          </button>
        </div>

        <div v-if="false" class="cat-card data-card danger-card" style="margin-top: 16px">
          <div class="card-header">
            <div class="header-left">
              <span class="card-icon danger">⚠️</span>
              <h4 class="card-title danger">清除数据</h4>
            </div>
          </div>
          <p class="card-desc">删除所有账单数据，此操作不可恢复</p>
          <button class="cat-btn action-btn danger-action" @click="clearAllData">
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">清除所有数据</span>
          </button>
        </div>
      </div>
    </div>

    <div class="app-info">
      <div class="info-card">
        <span class="info-icon">🐱</span>
        <span class="info-text">喵喵记账 v1.0.0</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 0 20px 24px;
  min-height: 100vh;
  background: #FFF9F5;
  position: relative;
}

.user-card {
  margin-top: 16px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-card-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF8B5E 0%, #FFB347 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
}

.user-nickname {
  font-size: 16px;
  font-weight: 700;
  color: #3D3D3D;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-username {
  font-size: 13px;
  color: #8C8C8C;
  margin-top: 2px;
}

.logout-btn {
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%);
  box-shadow: 0 4px 12px rgba(242, 139, 130, 0.2);
  white-space: nowrap;
  flex-shrink: 0;
  padding: 10px 18px;
  font-size: 13px;
}

.logout-btn:hover {
  transform: scale(1.02);
}

.page-header {
  text-align: center;
  padding: 20px 0 16px;
  position: relative;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 40px;
}

.cat-ear {
  width: 14px;
  height: 18px;
  background: rgba(255, 139, 94, 0.15);
  border-radius: 50% 50% 0 0;
}

.cat-ear.left {
  transform: rotate(-20deg);
}

.cat-ear.right {
  transform: rotate(20deg);
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #3D3D3D;
}

.title-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 6px rgba(255, 139, 94, 0.2));
}

.section-tabs {
  display: flex;
  gap: 12px;
  padding: 4px;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 18px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 8px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #8C8C8C;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-btn:hover:not(.active) {
  background: rgba(255, 139, 94, 0.06);
}

.tab-btn.active {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  color: #3D3D3D;
  box-shadow: 0 4px 16px rgba(255, 139, 94, 0.12);
  transform: scale(1.02);
}

.tab-icon {
  font-size: 16px;
}

.cat-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(255, 139, 94, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(255, 139, 94, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.data-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  font-size: 22px;
  filter: drop-shadow(0 2px 6px rgba(255, 139, 94, 0.2));
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #3D3D3D;
}

.card-title.danger {
  color: #F28B82;
}

.card-desc {
  font-size: 13px;
  color: #8C8C8C;
  margin: 0;
}

.data-actions {
  display: flex;
  gap: 12px;
}

.cat-btn {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  color: white;
  border-radius: 14px;
  padding: 12px 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.2);
}

.cat-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 139, 94, 0.25);
}

.action-btn {
  flex: 1;
  justify-content: center;
}

.action-btn.outline {
  background: transparent;
  color: #FF8B5E;
  border: 2px solid #FF8B5E;
  box-shadow: none;
}

.action-btn.outline:hover {
  background: rgba(255, 139, 94, 0.08);
}

.action-btn.import {
  background: linear-gradient(135deg, #7DD3C0 0%, #8FE3D0 100%);
  box-shadow: 0 4px 12px rgba(125, 211, 192, 0.2);
}

.danger-card {
  border: 1px solid rgba(242, 139, 130, 0.15);
}

.danger-card .card-icon.danger {
  filter: drop-shadow(0 2px 6px rgba(242, 139, 130, 0.2));
}

.danger-action {
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%);
  box-shadow: 0 4px 12px rgba(242, 139, 130, 0.2);
}

.btn-icon {
  font-size: 16px;
}

.app-info {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  padding-bottom: 16px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255, 139, 94, 0.08);
  border-radius: 14px;
}

.info-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.15));
}

.info-text {
  font-size: 14px;
  color: #8C8C8C;
  font-weight: 500;
}
</style>
<style>
/* 不要动这里，这些样式是覆盖 Vant Toast 组件的，调整了字体颜色以适配整体风格 */
.van-toast__text {
  color: #333;
}
</style>
