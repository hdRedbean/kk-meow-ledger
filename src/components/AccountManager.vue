<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import type { AccountDTO } from '@/api'

const accountStore = useAccountStore()

const showAdd = ref(false)
const addName = ref('')
const addIcon = ref('💵')
const editingAcc = ref<AccountDTO | null>(null)
const editName = ref('')
const editIcon = ref('')
const showEditPopup = computed({
  get: () => editingAcc.value !== null,
  set: (val: boolean) => { if (!val) editingAcc.value = null },
})

const iconOptions = ['💵', '💚', '🔵', '💳', '🏦', '🐷', '💰', '👛', '💎', '🐱']

function openAdd() {
  addName.value = ''
  addIcon.value = '💵'
  showAdd.value = true
}

async function confirmAdd() {
  if (!addName.value.trim()) return
  await accountStore.add({ name: addName.value.trim(), icon: addIcon.value })
  showAdd.value = false
}

function startEdit(acc: AccountDTO) {
  if (acc.isPreset) return
  editingAcc.value = acc
  editName.value = acc.name
  editIcon.value = acc.icon
}

async function confirmEdit() {
  if (!editingAcc.value || !editName.value.trim()) return
  await accountStore.update(editingAcc.value.id, {
    name: editName.value.trim(),
    icon: editIcon.value,
  })
  editingAcc.value = null
}

async function deleteAcc(id: number) {
  await accountStore.remove(id)
}
</script>

<template>
  <div class="account-manager">
    <div class="section-header">
      <h4 class="section-title">账户管理</h4>
      <button class="cat-btn cat-btn-sm" @click="openAdd">＋ 添加</button>
    </div>

    <div class="account-list">
      <div v-for="acc in accountStore.accounts" :key="acc.id" class="account-card">
        <div class="account-info">
          <span class="account-icon">{{ acc.icon }}</span>
          <div class="account-detail">
            <span class="account-name">{{ acc.name }}</span>
            <span class="account-balance">¥{{ acc.balance.toFixed(2) }}</span>
          </div>
        </div>
        <div v-if="!acc.isPreset" class="account-actions">
          <button class="action-btn" @click="startEdit(acc)">编辑</button>
          <button class="action-btn danger" @click="deleteAcc(acc.id)">删除</button>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showAdd" position="bottom" round :style="{ padding: '24px' }">
      <h4 class="popup-title">添加账户 🐱</h4>
      <div class="add-form">
        <div class="icon-picker">
          <button v-for="icon in iconOptions" :key="icon" :class="['icon-option', { active: addIcon === icon }]" @click="addIcon = icon">{{ icon }}</button>
        </div>
        <input v-model="addName" class="cat-input" placeholder="账户名称" maxlength="8" />
        <button class="cat-btn" style="width:100%" @click="confirmAdd">确认添加</button>
      </div>
    </van-popup>

    <van-popup v-model:show="showEditPopup" position="bottom" round :style="{ padding: '24px' }">
      <template v-if="editingAcc">
        <h4 class="popup-title">编辑账户</h4>
        <div class="add-form">
          <div class="icon-picker">
            <button v-for="icon in iconOptions" :key="icon" :class="['icon-option', { active: editIcon === icon }]" @click="editIcon = icon">{{ icon }}</button>
          </div>
          <input v-model="editName" class="cat-input" placeholder="账户名称" maxlength="8" />
          <div class="edit-actions">
            <button class="cat-btn cat-btn-outline" style="flex:1" @click="editingAcc = null">取消</button>
            <button class="cat-btn" style="flex:1" @click="confirmEdit">保存</button>
          </div>
        </div>
      </template>
    </van-popup>
  </div>
</template>

<style scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-title { font-size: 15px; font-weight: 600; color: var(--cat-text); }
.account-list { display: flex; flex-direction: column; gap: 10px; }
.account-card { background: var(--cat-card); border-radius: 14px; padding: 14px; box-shadow: 0 2px 12px rgba(245,166,35,0.1); display: flex; align-items: center; justify-content: space-between; }
.account-info { display: flex; align-items: center; gap: 12px; }
.account-icon { font-size: 28px; }
.account-detail { display: flex; flex-direction: column; gap: 2px; }
.account-name { font-size: 14px; font-weight: 500; color: var(--cat-text); }
.account-balance { font-size: 13px; color: var(--cat-accent); font-weight: 600; }
.account-actions { display: flex; gap: 6px; }
.action-btn { padding: 4px 10px; border-radius: 12px; border: 1px solid var(--cat-border); background: transparent; font-size: 12px; color: var(--cat-text-light); cursor: pointer; transition: all 0.15s; }
.action-btn:hover { border-color: var(--cat-accent); color: var(--cat-accent); }
.action-btn.danger:hover { border-color: var(--cat-expense); color: var(--cat-expense); }
.popup-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--cat-text); }
.add-form { display: flex; flex-direction: column; gap: 12px; }
.icon-picker { display: flex; flex-wrap: wrap; gap: 6px; }
.icon-option { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid var(--cat-border); background: transparent; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.icon-option.active { border-color: var(--cat-accent); background: var(--cat-accent-light); }
.edit-actions { display: flex; gap: 12px; }
</style>
