import OpenAI from 'openai'
import { pool } from '../db.js'
import { toolDefinitions } from './tools.js'
import { aiLimiter } from './limiter.js'

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY || '',
  baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
})

const SYSTEM_PROMPT = `你是喵喵记账的AI助手🐱，可以帮助用户查询账单、分析消费、管理预算等。

你的职责：
- 查询和分析用户的收支数据
- 提供消费建议和预算提醒
- 帮助用户快速记账
- 用友好、简洁的语气回答，适当使用emoji

规则：
- 金额显示时保留两位小数，使用 ¥ 符号
- 当前日期用于推算"本月"、"今年"等时间范围
- 如果用户意图模糊，主动询问确认
- 记账时需要确认信息完整后再调用add_bill工具

当前日期：${new Date().toISOString().slice(0, 10)}`

type ToolCall = { id: string; function: { name: string; arguments: string } }

async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'get_month_summary': {
      const { month } = args
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const [rows] = await pool.query(
        `SELECT type, SUM(amount) as total FROM bill WHERE date >= ? AND date <= ? GROUP BY type`,
        [`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`]
      )
      let income = 0, expense = 0
      for (const r of rows as any[]) {
        if (r.type === 'income') income = Number(r.total)
        else expense = Number(r.total)
      }
      return { month, income, expense, balance: income - expense }
    }

    case 'get_category_stats': {
      const { month, type } = args
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const [rows] = await pool.query(
        `SELECT c.name, c.icon, SUM(b.amount) as amount
         FROM bill b JOIN category c ON b.category_id = c.id
         WHERE b.date >= ? AND b.date <= ? AND b.type = ?
         GROUP BY b.category_id ORDER BY amount DESC`,
        [`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`, type]
      )
      const total = (rows as any[]).reduce((s, r) => s + Number(r.amount), 0)
      return (rows as any[]).map((r) => ({
        name: r.name, icon: r.icon,
        amount: Number(r.amount),
        percentage: total > 0 ? Math.round((Number(r.amount) / total) * 1000) / 10 : 0,
      }))
    }

    case 'get_daily_trend': {
      const { month } = args
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const [rows] = await pool.query(
        `SELECT date, type, SUM(amount) as total FROM bill WHERE date >= ? AND date <= ? GROUP BY date, type ORDER BY date`,
        [`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`]
      )
      const result: { date: string; income: number; expense: number }[] = []
      for (let d = 1; d <= lastDay; d++) {
        result.push({ date: `${m}/${d}`, income: 0, expense: 0 })
      }
      for (const r of rows as any[]) {
        const dateStr = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date)
        const day = Number(dateStr.split('-')[2])
        if (r.type === 'income') result[day - 1].income = Number(r.total)
        else result[day - 1].expense = Number(r.total)
      }
      return result
    }

    case 'get_yearly_trend': {
      const { year } = args
      const [rows] = await pool.query(
        `SELECT MONTH(date) as m, type, SUM(amount) as total FROM bill WHERE YEAR(date) = ? GROUP BY MONTH(date), type ORDER BY m`,
        [year]
      )
      const result = Array.from({ length: 12 }, (_, i) => ({ month: `${i + 1}月`, income: 0, expense: 0 }))
      for (const r of rows as any[]) {
        if (r.type === 'income') result[r.m - 1].income = Number(r.total)
        else result[r.m - 1].expense = Number(r.total)
      }
      return result
    }

    case 'get_bills': {
      const { month, type, categoryName, keyword, limit = 20 } = args
      let sql = 'SELECT b.*, c.name as category_name, c.icon as category_icon FROM bill b JOIN category c ON b.category_id = c.id WHERE 1=1'
      const params: any[] = []
      if (month) {
        const [y, m] = month.split('-').map(Number)
        const lastDay = new Date(y, m, 0).getDate()
        sql += ' AND b.date >= ? AND b.date <= ?'
        params.push(`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`)
      }
      if (type) { sql += ' AND b.type = ?'; params.push(type) }
      if (categoryName) { sql += ' AND c.name = ?'; params.push(categoryName) }
      if (keyword) { sql += ' AND b.note LIKE ?'; params.push(`%${keyword}%`) }
      sql += ' ORDER BY b.date DESC, b.created_at DESC LIMIT ?'
      params.push(limit)
      const [rows] = await pool.query(sql, params)
      return (rows as any[]).map((r) => ({
        id: r.id, type: r.type, amount: Number(r.amount),
        categoryName: r.category_name, categoryIcon: r.category_icon,
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
        note: r.note,
      }))
    }

    case 'get_budget_status': {
      const { month } = args
      const [budgetRows] = await pool.query('SELECT * FROM budget WHERE month = ?', [month])
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const [billRows] = await pool.query(
        `SELECT category_id, SUM(amount) as total FROM bill WHERE date >= ? AND date <= ? AND type = 'expense' GROUP BY category_id`,
        [`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`]
      )
      const spendMap = new Map<number, number>()
      let totalExpense = 0
      for (const b of billRows as any[]) {
        spendMap.set(b.category_id, Number(b.total))
        totalExpense += Number(b.total)
      }
      const budgets = (budgetRows as any[]).map((r) => {
        const spent = r.category_id ? (spendMap.get(r.category_id) || 0) : totalExpense
        return {
          categoryId: r.category_id,
          amount: Number(r.amount),
          spent,
          remaining: Number(r.amount) - spent,
          isOverBudget: spent > Number(r.amount),
        }
      })
      return { month, totalExpense, budgets }
    }

    case 'get_top_expense': {
      const { month, topN = 5 } = args
      const [y, m] = month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      const [rows] = await pool.query(
        `SELECT c.name, c.icon, SUM(b.amount) as amount
         FROM bill b JOIN category c ON b.category_id = c.id
         WHERE b.date >= ? AND b.date <= ? AND b.type = 'expense'
         GROUP BY b.category_id ORDER BY amount DESC LIMIT ?`,
        [`${y}-${String(m).padStart(2, '0')}-01`, `${y}-${String(m).padStart(2, '0')}-${lastDay}`, topN]
      )
      return (rows as any[]).map((r) => ({ name: r.name, icon: r.icon, amount: Number(r.amount) }))
    }

    case 'add_bill': {
      const { type, amount, categoryName, accountName = '微信', date, note = '' } = args
      const [catRows] = await pool.query('SELECT id FROM category WHERE name = ? LIMIT 1', [categoryName])
      if ((catRows as any[]).length === 0) return { error: `未找到分类"${categoryName}"` }
      const categoryId = (catRows as any[])[0].id
      const [accRows] = await pool.query('SELECT id FROM account WHERE name = ? LIMIT 1', [accountName])
      const accountId = (accRows as any[]).length > 0 ? (accRows as any[])[0].id : 1
      const billDate = date || new Date().toISOString().slice(0, 10)
      const [result] = await pool.query(
        'INSERT INTO bill (type, amount, category_id, account_id, date, note) VALUES (?, ?, ?, ?, ?, ?)',
        [type, amount, categoryId, accountId, billDate, note]
      )
      return { success: true, id: (result as any).insertId, type, amount, categoryName, date: billDate }
    }

    case 'get_account_balance': {
      const [accRows] = await pool.query('SELECT * FROM account ORDER BY id')
      const [billRows] = await pool.query('SELECT account_id, type, SUM(amount) as total FROM bill GROUP BY account_id, type')
      const balanceMap = new Map<number, { income: number; expense: number }>()
      for (const b of billRows as any[]) {
        if (!balanceMap.has(b.account_id)) balanceMap.set(b.account_id, { income: 0, expense: 0 })
        const entry = balanceMap.get(b.account_id)!
        if (b.type === 'income') entry.income = Number(b.total)
        else entry.expense = Number(b.total)
      }
      return (accRows as any[]).map((r) => {
        const bal = balanceMap.get(r.id) || { income: 0, expense: 0 }
        return { name: r.name, icon: r.icon, balance: bal.income - bal.expense }
      })
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export async function chat(userMessage: string, history: { role: string; content: string }[]): Promise<{
  assistantContent: string
  toolCallsLog: { name: string; args: any; result: any }[]
}> {
  const messages = buildMessages(userMessage, history)
  const toolCallsLog: { name: string; args: any; result: any }[] = []
  let assistantContent = ''

  for (let round = 0; round < 5; round++) {
    const response = await aiLimiter.schedule(() =>
      client.chat.completions.create({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
      })
    )

    const choice = response.choices[0]
    const msg = choice.message

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push(msg as any)

      for (const tc of msg.tool_calls as ToolCall[]) {
        const args = JSON.parse(tc.function.arguments)
        const result = await executeTool(tc.function.name, args)
        toolCallsLog.push({ name: tc.function.name, args, result })
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        } as any)
      }
    } else {
      assistantContent = msg.content || ''
      break
    }

    if (choice.finish_reason === 'stop') break
  }

  return { assistantContent, toolCallsLog }
}

export async function streamChat(
  userMessage: string,
  history: { role: string; content: string }[],
  onChunk: (text: string) => void,
): Promise<string> {
  const messages = buildMessages(userMessage, history)

  for (let round = 0; round < 5; round++) {
    const stream = await aiLimiter.schedule(() =>
      client.chat.completions.create({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        stream: true,
      })
    )

    let toolCalls: { id: string; name: string; arguments: string }[] = []
    let hasToolCalls = false
    let content = ''

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (!delta) continue

      if (delta.content) {
        content += delta.content
        onChunk(delta.content)
      }

      if (delta.tool_calls) {
        hasToolCalls = true
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0
          if (!toolCalls[idx]) {
            toolCalls[idx] = { id: '', name: '', arguments: '' }
          }
          if (tc.id) toolCalls[idx].id = tc.id
          if (tc.function?.name) toolCalls[idx].name = tc.function.name
          if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments
        }
      }
    }

    if (!hasToolCalls) return content

    messages.push({
      role: 'assistant',
      content: content || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    } as any)

    for (const tc of toolCalls) {
      const args = JSON.parse(tc.arguments)
      const result = await executeTool(tc.name, args)
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      } as any)
    }
  }

  return ''
}

function buildMessages(userMessage: string, history: { role: string; content: string }[]): OpenAI.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as any, content: m.content })),
    { role: 'user', content: userMessage },
  ]
}
