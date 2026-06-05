<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useBillStore } from '@/stores/bill'
import { useCategoryStore } from '@/stores/category'
import { getCurrentMonth, formatMoney } from '@/utils'
import type { BillType, CategoryStats, DailyStats } from '@/types'
import * as api from '@/api'
import * as echarts from 'echarts'
import MonthPicker from '@/components/MonthPicker.vue'
import EmptyState from '@/components/EmptyState.vue'

const billStore = useBillStore()
const categoryStore = useCategoryStore()

const currentMonth = ref(getCurrentMonth())
const currentYear = ref(new Date().getFullYear())
const statsType = ref<'month' | 'year'>('month')
const chartBillType = ref<BillType>('expense')

const monthStats = ref({ income: 0, expense: 0, balance: 0 })
const categoryStats = ref<CategoryStats[]>([])
const dailyStats = ref<DailyStats[]>([])
const yearStats = ref<api.YearlyStatsDTO[]>([])

const pieChartRef = ref<HTMLDivElement>()
const lineChartRef = ref<HTMLDivElement>()
const barChartRef = ref<HTMLDivElement>()
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

function renderPieChart() {
  if (!pieChartRef.value) return
  if (!pieChart) pieChart = echarts.init(pieChartRef.value)
  const data = categoryStats.value.map((s) => ({ name: `${s.categoryIcon} ${s.categoryName}`, value: s.amount }))
  if (data.length === 0) { pieChart.clear(); return }
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    color: ['#FFB347', '#FFD699', '#F5A623', '#E89E30', '#7BC67E', '#5DBE6A', '#4AA858', '#E87272', '#D45E5E', '#BF4A4A'],
    series: [{ type: 'pie', radius: ['40%', '70%'], center: ['50%', '50%'], avoidLabelOverlap: true, itemStyle: { borderRadius: 8, borderColor: '#FFFDF5', borderWidth: 2 }, label: { show: true, fontSize: 11, color: '#5D4E37' }, data }],
  }, true)
}

function renderLineChart() {
  if (!lineChartRef.value) return
  if (!lineChart) lineChart = echarts.init(lineChartRef.value)
  const stats = dailyStats.value
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: stats.map((s) => s.date), axisLabel: { fontSize: 10, color: '#8B7E6A', interval: 4 }, axisLine: { lineStyle: { color: '#F0E6D0' } } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#8B7E6A' }, splitLine: { lineStyle: { color: '#F0E6D0' } } },
    series: [
      { name: '收入', type: 'line', data: stats.map((s) => s.income), smooth: true, lineStyle: { color: '#7BC67E', width: 2 }, itemStyle: { color: '#7BC67E' }, areaStyle: { color: 'rgba(123, 198, 126, 0.1)' } },
      { name: '支出', type: 'line', data: stats.map((s) => s.expense), smooth: true, lineStyle: { color: '#E87272', width: 2 }, itemStyle: { color: '#E87272' }, areaStyle: { color: 'rgba(232, 114, 114, 0.1)' } },
    ],
  }, true)
}

function renderBarChart() {
  if (!barChartRef.value) return
  if (!barChart) barChart = echarts.init(barChartRef.value)
  const stats = yearStats.value
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], textStyle: { color: '#8B7E6A', fontSize: 12 } },
    grid: { left: 48, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: stats.map((s) => s.month), axisLabel: { fontSize: 10, color: '#8B7E6A' }, axisLine: { lineStyle: { color: '#F0E6D0' } } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#8B7E6A' }, splitLine: { lineStyle: { color: '#F0E6D0' } } },
    series: [
      { name: '收入', type: 'bar', data: stats.map((s) => s.income), itemStyle: { color: '#7BC67E', borderRadius: [4, 4, 0, 0] } },
      { name: '支出', type: 'bar', data: stats.map((s) => s.expense), itemStyle: { color: '#E87272', borderRadius: [4, 4, 0, 0] } },
    ],
  }, true)
}

function renderCharts() {
  nextTick(() => {
    if (statsType.value === 'month') { renderPieChart(); renderLineChart() }
    else { renderBarChart() }
  })
}

async function loadMonthData() {
  const [stats, catStats, dStats] = await Promise.all([
    billStore.getMonthStats(currentMonth.value),
    billStore.getCategoryStats(currentMonth.value, chartBillType.value),
    billStore.getDailyStats(currentMonth.value),
  ])
  monthStats.value = stats
  categoryStats.value = catStats
  dailyStats.value = dStats
  renderCharts()
}

async function loadYearData() {
  yearStats.value = await billStore.getYearMonthStats(currentYear.value)
  renderCharts()
}

watch([currentMonth, chartBillType], loadMonthData)
watch(currentYear, loadYearData)
watch(statsType, (v) => { if (v === 'month') loadMonthData(); else loadYearData() })
onMounted(loadMonthData)

window.addEventListener('resize', () => { pieChart?.resize(); lineChart?.resize(); barChart?.resize() })
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">📊 统计报表</h2>

    <div class="type-switch">
      <button :class="['switch-btn', { active: statsType === 'month' }]" @click="statsType = 'month'">月度</button>
      <button :class="['switch-btn', { active: statsType === 'year' }]" @click="statsType = 'year'">年度</button>
    </div>

    <template v-if="statsType === 'month'">
      <MonthPicker v-model="currentMonth" style="margin-top: 12px" />
      <div class="stats-card cat-card" style="margin-top: 12px">
        <div class="stats-row">
          <div class="stat-item"><span class="stat-label">收入</span><span class="stat-value cat-income">{{ formatMoney(monthStats.income) }}</span></div>
          <div class="stat-divider"></div>
          <div class="stat-item"><span class="stat-label">支出</span><span class="stat-value cat-expense">{{ formatMoney(monthStats.expense) }}</span></div>
          <div class="stat-divider"></div>
          <div class="stat-item"><span class="stat-label">结余</span><span :class="['stat-value', monthStats.balance >= 0 ? 'cat-income' : 'cat-expense']">{{ formatMoney(monthStats.balance) }}</span></div>
        </div>
      </div>

      <div class="cat-card" style="margin-top: 12px">
        <div class="chart-header">
          <h4 class="chart-title">分类占比</h4>
          <div class="mini-switch">
            <button :class="['mini-btn', { active: chartBillType === 'expense' }]" @click="chartBillType = 'expense'">支出</button>
            <button :class="['mini-btn', { active: chartBillType === 'income' }]" @click="chartBillType = 'income'">收入</button>
          </div>
        </div>
        <div ref="pieChartRef" class="chart-area"></div>
        <div v-if="categoryStats.length > 0" class="category-rank">
          <div v-for="s in categoryStats" :key="s.categoryId" class="rank-item">
            <span class="rank-icon">{{ s.categoryIcon }}</span>
            <span class="rank-name">{{ s.categoryName }}</span>
            <div class="rank-bar-bg"><div class="rank-bar-fill" :style="{ width: s.percentage + '%' }"></div></div>
            <span class="rank-amount">¥{{ formatMoney(s.amount) }}</span>
            <span class="rank-percent">{{ s.percentage }}%</span>
          </div>
        </div>
        <EmptyState v-else message="暂无数据 🐱" />
      </div>

      <div class="cat-card" style="margin-top: 12px">
        <h4 class="chart-title">每日收支趋势</h4>
        <div ref="lineChartRef" class="chart-area"></div>
      </div>
    </template>

    <template v-else>
      <div class="year-picker" style="margin-top: 12px">
        <button class="arrow-btn" @click="currentYear--">◀</button>
        <span class="year-label">{{ currentYear }}年</span>
        <button class="arrow-btn" @click="currentYear++">▶</button>
      </div>
      <div class="cat-card" style="margin-top: 12px">
        <h4 class="chart-title">年度收支趋势</h4>
        <div ref="barChartRef" class="chart-area"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--cat-text); }
.type-switch { display: flex; background: var(--cat-secondary); border-radius: 24px; padding: 3px; }
.switch-btn { flex: 1; padding: 10px; border: none; border-radius: 22px; font-size: 14px; font-weight: 500; cursor: pointer; background: transparent; color: var(--cat-text-light); transition: all 0.2s; }
.switch-btn.active { background: white; color: var(--cat-text); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.stats-row { display: flex; align-items: center; justify-content: space-around; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-label { font-size: 12px; color: var(--cat-text-light); }
.stat-value { font-size: 16px; font-weight: 700; }
.stat-divider { width: 1px; height: 28px; background: var(--cat-border); }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.chart-title { font-size: 15px; font-weight: 600; color: var(--cat-text); margin-bottom: 8px; }
.mini-switch { display: flex; gap: 4px; background: var(--cat-secondary); border-radius: 16px; padding: 2px; }
.mini-btn { padding: 4px 12px; border: none; border-radius: 14px; font-size: 12px; cursor: pointer; background: transparent; color: var(--cat-text-light); transition: all 0.15s; }
.mini-btn.active { background: white; color: var(--cat-text); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.chart-area { width: 100%; height: 260px; }
.category-rank { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.rank-item { display: flex; align-items: center; gap: 8px; }
.rank-icon { font-size: 18px; flex-shrink: 0; }
.rank-name { font-size: 12px; color: var(--cat-text-light); min-width: 32px; flex-shrink: 0; }
.rank-bar-bg { flex: 1; height: 6px; border-radius: 3px; background: var(--cat-secondary); overflow: hidden; min-width: 40px; }
.rank-bar-fill { height: 100%; border-radius: 3px; background: var(--cat-accent); transition: width 0.3s; }
.rank-amount { font-size: 12px; color: var(--cat-text); font-weight: 500; flex-shrink: 0; min-width: 60px; text-align: right; }
.rank-percent { font-size: 11px; color: var(--cat-text-light); flex-shrink: 0; min-width: 36px; text-align: right; }
.year-picker { display: flex; align-items: center; justify-content: center; gap: 16px; }
.arrow-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--cat-secondary); color: var(--cat-text-light); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.year-label { font-size: 18px; font-weight: 600; color: var(--cat-text); }
</style>
