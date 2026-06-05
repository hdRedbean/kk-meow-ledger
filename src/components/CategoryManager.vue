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
    <div class="type-section">
      <div class="section-header">
        <h4 class="section-title">支出分类</h4>
        <button class="cat-btn cat-btn-sm" @click="openAdd('expense')">＋ 添加</button>
      </div>
      <div class="item-list">
        <div v-for="cat in categoryStore.getByType('expense')" :key="cat.id" class="item-row">
          <span class="item-icon">{{ cat.icon }}</span>
          <span class="item-name">{{ cat.name }}</span>
          <span v-if="cat.isHidden" class="hidden-tag">已隐藏</span>
          <div class="item-actions">
            <button v-if="cat.isPreset" class="action-btn" @click="toggleHidden(cat)">
              {{ cat.isHidden ? '显示' : '隐藏' }}
            </button>
            <button v-else class="action-btn" @click="startEdit(cat)">编辑</button>
            <button v-if="!cat.isPreset" class="action-btn danger" @click="deleteCat(cat.id!)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="type-section">
      <div class="section-header">
        <h4 class="section-title">收入分类</h4>
        <button class="cat-btn cat-btn-sm" @click="openAdd('income')">＋ 添加</button>
      </div>
      <div class="item-list">
        <div v-for="cat in categoryStore.getByType('income')" :key="cat.id" class="item-row">
          <span class="item-icon">{{ cat.icon }}</span>
          <span class="item-name">{{ cat.name }}</span>
          <span v-if="cat.isHidden" class="hidden-tag">已隐藏</span>
          <div class="item-actions">
            <button v-if="cat.isPreset" class="action-btn" @click="toggleHidden(cat)">
              {{ cat.isHidden ? '显示' : '隐藏' }}
            </button>
            <button v-else class="action-btn" @click="startEdit(cat)">编辑</button>
            <button v-if="!cat.isPreset" class="action-btn danger" @click="deleteCat(cat.id!)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showAdd" position="bottom" round :style="{ padding: '24px' }">
      <h4 class="popup-title">添加分类 🐱</h4>
      <div class="add-form">
        <div class="icon-picker">
          <button
            v-for="icon in iconOptions"
            :key="icon"
            :class="['icon-option', { active: addIcon === icon }]"
            @click="addIcon = icon"
          >
            {{ icon }}
          </button>
        </div>
        <input v-model="addName" class="cat-input" placeholder="分类名称" maxlength="6" />
        <button class="cat-btn" style="width:100%" @click="confirmAdd">确认添加</button>
      </div>
    </van-popup>

    <van-popup v-model:show="showEditPopup" position="bottom" round :style="{ padding: '24px' }">
      <template v-if="editingCat">
        <h4 class="popup-title">编辑分类</h4>
        <div class="add-form">
          <div class="icon-picker">
            <button
              v-for="icon in iconOptions"
              :key="icon"
              :class="['icon-option', { active: editIcon === icon }]"
              @click="editIcon = icon"
            >
              {{ icon }}
            </button>
          </div>
          <input v-model="editName" class="cat-input" placeholder="分类名称" maxlength="6" />
          <div class="edit-actions">
            <button class="cat-btn cat-btn-outline" style="flex:1" @click="editingCat = null">取消</button>
            <button class="cat-btn" style="flex:1" @click="confirmEdit">保存</button>
          </div>
        </div>
      </template>
    </van-popup>
  </div>
</template>

<style scoped>
.type-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cat-text);
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background 0.15s;
}

.item-row:hover {
  background: var(--cat-secondary);
}

.item-icon {
  font-size: 22px;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: var(--cat-text);
}

.hidden-tag {
  font-size: 11px;
  color: var(--cat-text-light);
  background: var(--cat-secondary);
  padding: 2px 8px;
  border-radius: 8px;
}

.item-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--cat-border);
  background: transparent;
  font-size: 12px;
  color: var(--cat-text-light);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: var(--cat-accent);
  color: var(--cat-accent);
}

.action-btn.danger:hover {
  border-color: var(--cat-expense);
  color: var(--cat-expense);
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--cat-text);
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-option {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid var(--cat-border);
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-option.active {
  border-color: var(--cat-accent);
  background: var(--cat-accent-light);
}

.edit-actions {
  display: flex;
  gap: 12px;
}
</style>
