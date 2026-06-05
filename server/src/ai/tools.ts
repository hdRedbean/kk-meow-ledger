import type { ChatCompletionTool } from 'openai/resources/chat/completions'

export const toolDefinitions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_month_summary',
      description: '获取指定月份的收支汇总，包括总收入、总支出和结余',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: '月份，格式 YYYY-MM，如 2024-06' },
        },
        required: ['month'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_stats',
      description: '获取指定月份某一类型（收入/支出）的分类统计，包含每个分类的金额和占比',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: '月份，格式 YYYY-MM' },
          type: { type: 'string', enum: ['income', 'expense'], description: '收入或支出' },
        },
        required: ['month', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_trend',
      description: '获取指定月份每日的收支趋势数据',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: '月份，格式 YYYY-MM' },
        },
        required: ['month'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_yearly_trend',
      description: '获取指定年份每月的收支趋势数据',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number', description: '年份，如 2024' },
        },
        required: ['year'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_bills',
      description: '查询账单列表，可按月份、类型、分类、关键词筛选',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: '月份，格式 YYYY-MM' },
          type: { type: 'string', enum: ['income', 'expense'], description: '收入或支出' },
          categoryName: { type: 'string', description: '分类名称，如 餐饮、交通' },
          keyword: { type: 'string', description: '备注关键词搜索' },
          limit: { type: 'number', description: '返回条数，默认20' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description: '获取指定月份的预算使用情况，包括总预算和分类预算',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: '月份，格式 YYYY-MM' },
        },
        required: ['month'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_expense',
      description: '获取指定月份支出最多的分类排名',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: '月份，格式 YYYY-MM' },
          topN: { type: 'number', description: '排名数量，默认5' },
        },
        required: ['month'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_bill',
      description: '添加一笔新的账单记录',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'], description: '收入或支出' },
          amount: { type: 'number', description: '金额' },
          categoryName: { type: 'string', description: '分类名称，如 餐饮、工资' },
          accountName: { type: 'string', description: '账户名称，如 微信、现金' },
          date: { type: 'string', description: '日期，格式 YYYY-MM-DD，默认今天' },
          note: { type: 'string', description: '备注' },
        },
        required: ['type', 'amount', 'categoryName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_account_balance',
      description: '获取所有账户的余额信息',
      parameters: { type: 'object', properties: {} },
    },
  },
]
