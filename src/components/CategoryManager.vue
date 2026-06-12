<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/category'
import type { BillType } from '@/types'
import type { CategoryDTO } from '@/api'

const categoryStore = useCategoryStore()
const showAdd = ref(false)
const addType = ref<BillType>('expense')
const addName = ref('')
const addIcon = ref('🐱')
const editingCat = ref<CategoryDTO | null>(null)
const editName = ref('')
const editIcon = ref('')
const showEditPopup = computed({
  get: () => editingCat.value !== null,
  set: (val: boolean) => { if (!val) editingCat.value = null },
})

const iconOptions = ['🐱', '😺', '😸', '😹', '😻', '😽', '🙀', '😿', '😾', '🐾', '🍖', '☕', '🎪', '🎨', '🏖️', '🚀', '✈️', '🎵', '💡', '🔑']

function openAdd(type: BillType) {
  addType.value = type
  addName.value = ''
  addIcon.value = '🐱'
  showAdd.value = true
}

async function confirmAdd() {
  if (!addName.value.trim()) return
  const maxSort = categoryStore.categories.reduce((m, c) => Math.max(m, c.sortOrder), 0)
  await categoryStore.add({
    name: addName.value.trim(),
    icon: addIcon.value,
    type: addType.value,
    isPreset: false,
    isHidden: false,
    sortOrder: maxSort + 1,
  })
  showAdd.value = false
}

function startEdit(cat: CategoryDTO) {
  if (cat.isPreset) return
  editingCat.value = cat
  editName.value = cat.name
  editIcon.value = cat.icon
}

async function confirmEdit() {
  if (!editingCat.value || !editName.value.trim()) return
  await categoryStore.update(editingCat.value.id!, {
    name: editName.value.trim(),
    icon: editIcon.value,
  })
  editingCat.value = null
}

async function deleteCat(id: number) {
  await categoryStore.remove(id)
}

async function toggleHidden(cat: CategoryDTO) {
  if (!cat.isPreset) return
  await categoryStore.toggleHidden(cat.id!)
}
</script>

<template>
  <div class="category-manager">
    <div class="type-section expense-section">
      <div class="section-header">
        <div class="header-left">
          <span class="section-icon expense">💸</span>
          <h4 class="section-title">支出分类</h4>
        </div>
        <button class="cat-btn cat-btn-sm add-btn expense" @click="openAdd('expense')">
          <span class="btn-icon">＋</span>
          添加
        </button>
      </div>
      <div class="item-list">
        <div v-for="cat in categoryStore.getByType('expense')" :key="cat.id" class="item-row">
          <div class="item-icon-wrapper">
            <span class="item-icon">{{ cat.icon }}</span>
          </div>
          <span class="item-name">{{ cat.name }}</span>
          <span v-if="cat.isHidden" class="hidden-tag">已隐藏</span>
          <div class="item-actions">
            <button v-if="cat.isPreset" class="action-btn toggle" @click="toggleHidden(cat)">
              <span class="action-icon">{{ cat.isHidden ? '👁️' : '🙈' }}</span>
              {{ cat.isHidden ? '显示' : '隐藏' }}
            </button>
            <button v-else class="action-btn edit" @click="startEdit(cat)">
              <span class="action-icon">✏️</span>
              编辑
            </button>
            <button v-if="!cat.isPreset" class="action-btn delete" @click="deleteCat(cat.id!)">
              <span class="action-icon">🗑️</span>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="type-section income-section">
      <div class="section-header">
        <div class="header-left">
          <span class="section-icon income">💰</span>
          <h4 class="section-title">收入分类</h4>
        </div>
        <button class="cat-btn cat-btn-sm add-btn income" @click="openAdd('income')">
          <span class="btn-icon">＋</span>
          添加
        </button>
      </div>
      <div class="item-list">
        <div v-for="cat in categoryStore.getByType('income')" :key="cat.id" class="item-row">
          <div class="item-icon-wrapper">
            <span class="item-icon">{{ cat.icon }}</span>
          </div>
          <span class="item-name">{{ cat.name }}</span>
          <span v-if="cat.isHidden" class="hidden-tag">已隐藏</span>
          <div class="item-actions">
            <button v-if="cat.isPreset" class="action-btn toggle" @click="toggleHidden(cat)">
              <span class="action-icon">{{ cat.isHidden ? '👁️' : '🙈' }}</span>
              {{ cat.isHidden ? '显示' : '隐藏' }}
            </button>
            <button v-else class="action-btn edit" @click="startEdit(cat)">
              <span class="action-icon">✏️</span>
              编辑
            </button>
            <button v-if="!cat.isPreset" class="action-btn delete" @click="deleteCat(cat.id!)">
              <span class="action-icon">🗑️</span>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showAdd" position="bottom" round :style="{ padding: '24px' }">
      <div class="popup-content">
        <h4 class="popup-title">
          <span class="title-icon">🏷️</span>
          添加分类
        </h4>
        <div class="add-form">
          <div class="icon-picker">
            <button v-for="icon in iconOptions" :key="icon" :class="['icon-option', { active: addIcon === icon }]" @click="addIcon = icon">
              <span class="option-icon">{{ icon }}</span>
            </button>
          </div>
          <input v-model="addName" class="cat-input popup-input" placeholder="分类名称" maxlength="6" />
          <button class="cat-btn popup-btn" @click="confirmAdd">
            <span class="btn-icon">✨</span>
            确认添加
          </button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showEditPopup" position="bottom" round :style="{ padding: '24px' }">
      <template v-if="editingCat">
        <div class="popup-content">
          <h4 class="popup-title">
            <span class="title-icon">✏️</span>
            编辑分类
          </h4>
          <div class="add-form">
            <div class="icon-picker">
              <button v-for="icon in iconOptions" :key="icon" :class="['icon-option', { active: editIcon === icon }]" @click="editIcon = icon">
                <span class="option-icon">{{ icon }}</span>
              </button>
            </div>
            <input v-model="editName" class="cat-input popup-input" placeholder="分类名称" maxlength="6" />
            <div class="edit-actions">
              <button class="cat-btn cancel-btn" @click="editingCat = null">取消</button>
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
.category-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.type-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(255, 139, 94, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 6px rgba(255, 139, 94, 0.2));
}

.section-icon.expense {
  filter: drop-shadow(0 2px 6px rgba(242, 139, 130, 0.2));
}

.section-icon.income {
  filter: drop-shadow(0 2px 6px rgba(125, 211, 192, 0.2));
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

.add-btn.expense {
  background: linear-gradient(135deg, #F28B82 0%, #E07B72 100%);
  box-shadow: 0 4px 12px rgba(242, 139, 130, 0.2);
}

.add-btn.income {
  background: linear-gradient(135deg, #7DD3C0 0%, #8FE3D0 100%);
  box-shadow: 0 4px 12px rgba(125, 211, 192, 0.2);
}

.btn-icon {
  font-size: 14px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 139, 94, 0.04);
  transition: all 0.25s ease;
}

.item-row:hover {
  background: rgba(255, 139, 94, 0.08);
  transform: translateX(4px);
}

.item-icon-wrapper {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5EBE0 0%, #EDE5DB 100%);
  border-radius: 12px;
  transition: all 0.25s ease;
}

.item-row:hover .item-icon-wrapper {
  background: linear-gradient(135deg, #FFEDE3 0%, #F5EBE0 100%);
  transform: scale(1.05);
}

.item-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.item-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #3D3D3D;
}

.hidden-tag {
  font-size: 11px;
  color: #8C8C8C;
  padding: 4px 10px;
  background: rgba(140, 140, 140, 0.1);
  border-radius: 8px;
  font-weight: 500;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  font-size: 12px;
  color: #8C8C8C;
  cursor: pointer;
  transition: all 0.25s ease;
}

.action-btn:hover {
  transform: scale(1.02);
}

.action-btn.toggle:hover {
  border-color: #7DD3C0;
  background: rgba(125, 211, 192, 0.08);
  color: #7DD3C0;
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
  font-size: 12px;
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