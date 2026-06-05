import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api'
import type { BillType } from '@/types'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<api.CategoryDTO[]>([])
  const loaded = ref(false)

  async function load() {
    categories.value = await api.getCategories()
    loaded.value = true
  }

  function getByType(type: BillType): api.CategoryDTO[] {
    return categories.value.filter((c) => c.type === type && !c.isHidden)
  }

  function getById(id: number): api.CategoryDTO | undefined {
    return categories.value.find((c) => c.id === id)
  }

  async function add(cat: Omit<api.CategoryDTO, 'id'>) {
    const res = await api.createCategory(cat)
    categories.value.push({ ...cat, id: res.id })
    categories.value.sort((a, b) => a.sortOrder - b.sortOrder)
    return res.id
  }

  async function update(id: number, data: Partial<api.CategoryDTO>) {
    await api.updateCategory(id, data)
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      categories.value[idx] = { ...categories.value[idx], ...data }
    }
  }

  async function remove(id: number) {
    await api.deleteCategory(id)
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  async function toggleHidden(id: number) {
    const cat = categories.value.find((c) => c.id === id)
    if (cat) {
      await update(id, { isHidden: !cat.isHidden })
    }
  }

  return { categories, loaded, load, getByType, getById, add, update, remove, toggleHidden }
})
