import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// ---- Categories ----

export interface CategoryDTO {
  id: number
  name: string
  icon: string
  type: 'income' | 'expense'
  isPreset: boolean
  isHidden: boolean
  sortOrder: number
}

export const getCategories = (params?: { type?: string }) =>
  http.get<CategoryDTO[]>('/categories', { params }).then((r) => r.data)

export const createCategory = (data: Omit<CategoryDTO, 'id'>) =>
  http.post<{ id: number }>('/categories', data).then((r) => r.data)

export const updateCategory = (id: number, data: Partial<CategoryDTO>) =>
  http.put(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number) =>
  http.delete(`/categories/${id}`).then((r) => r.data)

// ---- Accounts ----

export interface AccountDTO {
  id: number
  name: string
  icon: string
  isPreset: boolean
  balance: number
}

export const getAccounts = () =>
  http.get<AccountDTO[]>('/accounts').then((r) => r.data)

export const createAccount = (data: { name: string; icon: string }) =>
  http.post<{ id: number }>('/accounts', data).then((r) => r.data)

export const updateAccount = (id: number, data: { name?: string; icon?: string }) =>
  http.put(`/accounts/${id}`, data).then((r) => r.data)

export const deleteAccount = (id: number) =>
  http.delete(`/accounts/${id}`).then((r) => r.data)

// ---- Bills ----

export interface BillDTO {
  id: number
  type: 'income' | 'expense'
  amount: number
  categoryId: number
  accountId: number
  date: string
  note: string
  createdAt: number
}

export const getBills = (params?: { month?: string; type?: string; categoryId?: number; keyword?: string }) =>
  http.get<BillDTO[]>('/bills', { params }).then((r) => r.data)

export const createBill = (data: { type: string; amount: number; categoryId: number; accountId: number; date: string; note: string }) =>
  http.post<{ id: number }>('/bills', data).then((r) => r.data)

export const updateBill = (id: number, data: Partial<BillDTO>) =>
  http.put(`/bills/${id}`, data).then((r) => r.data)

export const deleteBill = (id: number) =>
  http.delete(`/bills/${id}`).then((r) => r.data)

// ---- Bill Stats ----

export interface MonthStatsDTO {
  income: number
  expense: number
  balance: number
}

export interface CategoryStatsDTO {
  categoryId: number
  categoryName: string
  categoryIcon: string
  amount: number
  percentage: number
}

export interface DailyStatsDTO {
  date: string
  income: number
  expense: number
}

export interface YearlyStatsDTO {
  month: string
  income: number
  expense: number
}

export const getMonthlyStats = (month: string) =>
  http.get<MonthStatsDTO>('/bills/stats/monthly', { params: { month } }).then((r) => r.data)

export const getCategoryStats = (month: string, type: string) =>
  http.get<CategoryStatsDTO[]>('/bills/stats/category', { params: { month, type } }).then((r) => r.data)

export const getDailyStats = (month: string) =>
  http.get<DailyStatsDTO[]>('/bills/stats/daily', { params: { month } }).then((r) => r.data)

export const getYearlyStats = (year: number) =>
  http.get<YearlyStatsDTO[]>('/bills/stats/yearly', { params: { year } }).then((r) => r.data)

// ---- Budgets ----

export interface BudgetDTO {
  id: number
  month: string
  categoryId: number | null
  amount: number
}

export const getBudgets = (params?: { month?: string }) =>
  http.get<BudgetDTO[]>('/budgets', { params }).then((r) => r.data)

export const createBudget = (data: { month: string; categoryId?: number | null; amount: number }) =>
  http.post<{ id: number }>('/budgets', data).then((r) => r.data)

export const deleteBudget = (id: number) =>
  http.delete(`/budgets/${id}`).then((r) => r.data)

// ---- Chat ----

export interface ConversationDTO {
  id: number
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessageDTO {
  id: number
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  createdAt: number
}

export const getConversations = () =>
  http.get<ConversationDTO[]>('/chat/conversations').then((r) => r.data)

export const createConversation = (title?: string) =>
  http.post<{ id: number }>('/chat/conversations', { title }).then((r) => r.data)

export const deleteConversation = (id: number) =>
  http.delete(`/chat/conversations/${id}`).then((r) => r.data)

export const getMessages = (conversationId: number) =>
  http.get<ChatMessageDTO[]>(`/chat/conversations/${conversationId}/messages`).then((r) => r.data)

export const sendMessage = (message: string, conversationId?: number) =>
  http.post<{ conversationId: number; assistantMessage: ChatMessageDTO }>('/chat', { message, conversationId }).then((r) => r.data)

export async function sendMessageStream(
  message: string,
  conversationId: number | null,
  onChunk: (text: string) => void,
  onConversationId: (id: number) => void,
): Promise<{ conversationId: number; fullContent: string }> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Stream request failed: ${res.status}`)
  }

  let convId = conversationId
  let fullContent = ''
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.type === 'conversationId') {
          convId = data.conversationId
          onConversationId(data.conversationId)
        } else if (data.type === 'chunk') {
          fullContent += data.content
          onChunk(data.content)
        } else if (data.type === 'error') {
          throw new Error(data.error)
        }
      } catch (e: any) {
        if (e.message && !e.message.includes('JSON')) throw e
      }
    }
  }

  return { conversationId: convId!, fullContent }
}
