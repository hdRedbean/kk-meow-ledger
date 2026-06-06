<script setup lang="ts">
import { ref } from 'vue'
import { useBillStore } from '@/stores/bill'
import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '@/utils/export'
import { showToast, showConfirmDialog } from 'vant'
import CategoryManager from '@/components/CategoryManager.vue'
import AccountManager from '@/components/AccountManager.vue'

const billStore = useBillStore()
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

function triggerImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.csv'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const bills = file.name.endsWith('.csv') ? importFromCSV(text) : importFromJSON(text)
      if (bills.length === 0) {
        showToast('文件中没有有效数据')
        return
      }
      await showConfirmDialog({
        title: '确认导入',
        message: `将导入 ${bills.length} 条记录，是否继续？`,
      })
      for (const bill of bills) {
        await billStore.add(bill)
      }
      showToast(`成功导入 ${bills.length} 条记录 🐱`)
    } catch (err: any) {
      showToast(`导入失败: ${err.message}`)
    }
  }
  input.click()
}

async function clearAllData() {
  try {
    await showConfirmDialog({
      title: '危险操作',
      message: '确认清除所有数据？此操作不可恢复！',
    })
    for (const bill of billStore.bills) {
      if (bill.id) await billStore.remove(bill.id)
    }
    showToast('数据已清除')
  } catch {}
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">⚙️ 设置</h2>

    <div class="section-tabs">
      <button
        :class="['tab-btn', { active: activeSection === 'category' }]"
        @click="activeSection = 'category'"
      >
        分类管理
      </button>
      <button
        :class="['tab-btn', { active: activeSection === 'account' }]"
        @click="activeSection = 'account'"
      >
        账户管理
      </button>
      <button
        :class="['tab-btn', { active: activeSection === 'data' }]"
        @click="activeSection = 'data'"
      >
        数据管理
      </button>
    </div>

    <div class="section-content" style="margin-top: 16px">
      <CategoryManager v-if="activeSection === 'category'" />
      <AccountManager v-else-if="activeSection === 'account'" />

      <div v-else class="data-section">
        <div class="cat-card">
          <h4 class="data-title">导出数据</h4>
          <p class="data-desc">将所有账单数据导出为文件备份</p>
          <div class="data-actions">
            <button class="cat-btn" @click="handleExportJSON">导出 JSON</button>
            <button class="cat-btn cat-btn-outline" @click="handleExportCSV">导出 CSV</button>
          </div>
        </div>

        <div class="cat-card" style="margin-top: 12px">
          <h4 class="data-title">导入数据</h4>
          <p class="data-desc">从 JSON 或 CSV 文件恢复数据</p>
          <button class="cat-btn" @click="triggerImport">选择文件导入</button>
        </div>

        <div class="cat-card danger-card" style="margin-top: 12px">
          <h4 class="data-title" style="color: var(--cat-expense)">清除数据</h4>
          <p class="data-desc">删除所有账单数据，此操作不可恢复</p>
          <button class="cat-btn" style="background: var(--cat-expense)" @click="clearAllData">
            清除所有数据
          </button>
        </div>
      </div>
    </div>

    <div class="app-info">
      <p class="flex justify-center items-center">
        <img style="width: 26px; height: 26px;" src="/c1.png" alt="">
        <span>喵喵记账 v1.0.0</span>
      </p>
      <!--<p>所有数据仅存储在本地浏览器中</p>-->
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding-bottom: 20px;
  position: relative;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--cat-text);
}

.section-tabs {
  display: flex;
  background: var(--cat-secondary);
  border-radius: 24px;
  padding: 3px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--cat-text-light);
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  color: var(--cat-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.data-section {
  display: flex;
  flex-direction: column;
}

.data-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cat-text);
  margin-bottom: 4px;
}

.data-desc {
  font-size: 13px;
  color: var(--cat-text-light);
  margin-bottom: 12px;
}

.data-actions {
  display: flex;
  gap: 10px;
}

.danger-card {
  border: 1px solid rgba(232, 114, 114, 0.2);
}

.app-info {
  text-align: center;
  /*margin-top: 40px;*/
  padding: 20px;
  font-size: 12px;
  color: var(--cat-text-light);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
