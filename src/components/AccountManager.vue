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
      <div class="header-left">
        <span class="section-icon">💳</span>
        <h4 class="section-title">账户管理</h4>
      </div>
      <button class="cat-btn cat-btn-sm add-btn" @click="openAdd">
        <span class="btn-icon">＋</span>
        添加
      </button>
    </div>

    <div class="account-list">
      <div v-for="acc in accountStore.accounts" :key="acc.id" class="account-card">
        <div class="account-info">
          <div class="account-icon-wrapper">
            <span class="account-icon">{{ acc.icon }}</span>
          </div>
          <div class="account-detail">
            <span class="account-name">{{ acc.name }}</span>
            <span class="account-balance">¥{{ acc.balance.toFixed(2) }}</span>
          </div>
        </div>
        <div v-if="!acc.isPreset" class="account-actions">
          <button class="action-btn edit" @click="startEdit(acc)">
            <span class="action-icon">✏️</span>
            编辑
          </button>
          <button class="action-btn delete" @click="deleteAcc(acc.id)">
            <span class="action-icon">🗑️</span>
            删除
          </button>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showAdd" position="bottom" round :style="{ padding: '24px' }">
      <div class="popup-content">
        <h4 class="popup-title">
          <span class="title-icon">💳</span>
          添加账户
        </h4>
        <div class="add-form">
          <div class="icon-picker">
            <button v-for="icon in iconOptions" :key="icon" :class="['icon-option', { active: addIcon === icon }]" @click="addIcon = icon">
              <span class="option-icon">{{ icon }}</span>
            </button>
          </div>
          <input v-model="addName" class="cat-input popup-input" placeholder="账户名称" maxlength="8" />
          <button class="cat-btn popup-btn" @click="confirmAdd">
            <span class="btn-icon">✨</span>
            确认添加
          </button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showEditPopup" position="bottom" round :style="{ padding: '24px' }">
      <template v-if="editingAcc">
        <div class="popup-content">
          <h4 class="popup-title">
            <span class="title-icon">✏️</span>
            编辑账户
          </h4>
          <div class="add-form">
            <div class="icon-picker">
              <button v-for="icon in iconOptions" :key="icon" :class="['icon-option', { active: editIcon === icon }]" @click="editIcon = icon">
                <span class="option-icon">{{ icon }}</span>
              </button>
            </div>
            <input v-model="editName" class="cat-input popup-input" placeholder="账户名称" maxlength="8" />
            <div class="edit-actions">
              <button class="cat-btn cancel-btn" @click="editingAcc = null">
                取消
              </button>
              <button class="cat-btn popup-btn" @click="confirmEdit">
                <span class="btn-icon">✨</span>
                保存
              </button>
            </div>
          </div>
        </div>
      </template>
    </van-popup>
  </div>
</template>

<style scoped>
.account-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 18px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.15));
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #3D3D3D;
}

.cat-btn {
  background: linear-gradient(135deg, #FF8B5E 0%, #FF9A6F 100%);
  color: white;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 139, 94, 0.2);
}

.cat-btn:hover {
  transform: scale(1.02);
}

.cat-btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

.add-btn {
  background: linear-gradient(135deg, #7DD3C0 0%, #8FE3D0 100%);
  box-shadow: 0 4px 12px rgba(125, 211, 192, 0.2);
}

.btn-icon {
  font-size: 14px;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(255, 139, 94, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.25s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(255, 139, 94, 0.12);
}

.account-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.account-icon-wrapper {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 14px;
  transition: all 0.25s ease;
}

.account-card:hover .account-icon-wrapper {
  background: linear-gradient(135deg, #FFEDE3 0%, #F5EBE0 100%);
  transform: scale(1.05);
}

.account-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.account-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-name {
  font-size: 16px;
  font-weight: 600;
  color: #3D3D3D;
}

.account-balance {
  font-size: 14px;
  color: #FF8B5E;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.account-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  font-size: 13px;
  color: #8C8C8C;
  cursor: pointer;
  transition: all 0.25s ease;
}

.action-btn:hover {
  transform: scale(1.02);
}

.action-btn.edit:hover {
  border-color: #FF8B5E;
  background: rgba(255, 139, 94, 0.08);
  color: #FF8B5E;
}

.action-btn.delete:hover {
  border-color: #F28B82;
  background: rgba(242, 139, 130, 0.08);
  color: #F28B82;
}

.action-icon {
  font-size: 14px;
}

.popup-content {
  background: linear-gradient(180deg, #FFF9F5 0%, #FFFFFF 100%);
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #3D3D3D;
}

.title-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255, 139, 94, 0.2));
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 16px;
}

.icon-option {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-option:hover {
  transform: scale(1.05);
}

.icon-option.active {
  border-color: #FF8B5E;
  background: rgba(255, 139, 94, 0.12);
  transform: scale(1.08);
}

.option-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.cat-input {
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 14px;
  border: 1.5px solid transparent;
  transition: all 0.25s ease;
}

.cat-input:focus {
  border-color: #FF8B5E;
  box-shadow: 0 0 0 3px rgba(255, 139, 94, 0.12);
}

.popup-input {
  padding: 14px 16px;
  font-size: 15px;
  color: #3D3D3D;
}

.popup-btn {
  width: 100%;
  justify-content: center;
  padding: 14px;
  font-size: 16px;
  border-radius: 16px;
}

.edit-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  background: transparent;
  color: #8C8C8C;
  border: 2px solid rgba(0, 0, 0, 0.06);
  box-shadow: none;
  justify-content: center;
}

.cancel-btn:hover {
  background: rgba(255, 139, 94, 0.06);
}
</style>