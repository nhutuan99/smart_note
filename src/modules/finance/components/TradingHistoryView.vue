<script setup lang="ts">
// 1. Vue core
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
// 2. Vue ecosystem
import { useI18n } from 'vue-i18n'
// 3. Stores & composables
import { useTradingCheckin } from '@/composables/useTradingCheckin'
import { useStockStore } from '@/stores/stock'
import { useFundStore } from '@/stores/fund'
// 3. Types
import type { TradingCheckin } from '@/types'
// 4. Utils
import { formatVND } from '@/constants/finance'
// 5. Components & icons
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type TooltipModel
} from 'chart.js'
import {
  TrendingUp, TrendingDown, CalendarDays, Calendar,
  BarChart2, BookOpen, Trophy, Flame
} from 'lucide-vue-next'
import TradingCheckinModal from './TradingCheckinModal.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const { t } = useI18n()
const { trading } = useTradingCheckin()
const stockStore = useStockStore()
const fundStore = useFundStore()

// Auto-load stocks/funds on mount for homepage quick view
onMounted(() => {
  if (stockStore.positions.length === 0) stockStore.fetchPositions()
  if (fundStore.positions.length === 0) fundStore.fetchPositions()
})

// ── Period tab ──
type Period = 'day' | 'month' | 'year'
const period = ref<Period>('day')

// ── Edit modal ──
const showEditModal = ref(false)

// ── Custom tooltip DOM element ──
const tooltipEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = document.createElement('div')
  el.id = 'trading-chart-tooltip'
  el.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    opacity: 0; transition: opacity 120ms ease, transform 120ms ease;
    transform: translateY(-4px);
  `
  document.body.appendChild(el)
  tooltipEl.value = el
})

onBeforeUnmount(() => {
  tooltipEl.value?.remove()
})

/** Chart.js external tooltip handler */
function externalTooltipHandler(context: { chart: ChartJS; tooltip: TooltipModel<'line'> }) {
  const { chart, tooltip } = context
  const el = tooltipEl.value
  if (!el) return

  if (tooltip.opacity === 0) {
    el.style.opacity = '0'
    el.style.transform = 'translateY(-4px)'
    return
  }

  const item = tooltip.dataPoints?.[0]
  if (!item) return

  const label = item.label ?? ''
  const rawVal = (item.raw as number) ?? 0
  const isProfit = rawVal >= 0
  const sign = isProfit ? '+' : ''
  const color = isProfit ? '#10b981' : '#ef4444'
  const glow = isProfit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'

  el.innerHTML = `
    <div style="
      background: rgba(15,15,20,0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 10px 14px;
      min-width: 130px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
    ">
      <div style="font-size:11px;color:#737373;margin-bottom:6px;font-weight:500;letter-spacing:0.03em;">${label}</div>
      <div style="
        font-size:15px;font-weight:700;color:${color};
        font-variant-numeric:tabular-nums;letter-spacing:-0.02em;
        text-shadow: 0 0 12px ${glow};
      ">${sign}${formatVND(rawVal)}</div>
    </div>
  `

  // Position tooltip near cursor clamped to viewport
  const rect = chart.canvas.getBoundingClientRect()
  const x = rect.left + tooltip.caretX
  const y = rect.top + tooltip.caretY

  const elW = el.offsetWidth || 160
  const elH = el.offsetHeight || 72
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = x + 12
  let top = y - elH / 2

  if (left + elW > vw - 12) left = x - elW - 12
  if (top < 8) top = 8
  if (top + elH > vh - 8) top = vh - elH - 8

  el.style.left = `${left}px`
  el.style.top = `${top}px`
  el.style.opacity = '1'
  el.style.transform = 'translateY(0)'
}

// ── Grouped data ──
const groupedData = computed(() => {
  const map = new Map<string, { label: string; pnl: number; deposit: number; days: number }>()

  for (const c of trading.sortedCheckins) {
    let key: string
    let label: string

    if (period.value === 'day') {
      key = c.date
      const d = new Date(c.date)
      label = `${d.getDate()}/${d.getMonth() + 1}`
    } else if (period.value === 'month') {
      key = c.date.substring(0, 7)
      const [y, m] = key.split('-')
      label = `${m}/${y}`
    } else {
      key = c.date.substring(0, 4)
      label = key
    }

    const existing = map.get(key)
    if (existing) {
      existing.pnl += c.totalPnl
      existing.deposit += c.totalDeposit
      existing.days += 1
    } else {
      map.set(key, { label, pnl: c.totalPnl, deposit: c.totalDeposit, days: 1 })
    }
  }

  return [...map.values()].slice(0, period.value === 'day' ? 30 : period.value === 'month' ? 12 : 10)
})

// ── Chart ──

/** Create gradient dynamically from canvas */
function makeGradient(ctx: CanvasRenderingContext2D, chartArea: { top: number; bottom: number }, isProfit: boolean) {
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  if (isProfit) {
    g.addColorStop(0,   'rgba(16, 185, 129, 0.35)')
    g.addColorStop(0.5, 'rgba(16, 185, 129, 0.10)')
    g.addColorStop(1,   'rgba(16, 185, 129, 0.00)')
  } else {
    g.addColorStop(0,   'rgba(239, 68, 68, 0.35)')
    g.addColorStop(0.5, 'rgba(239, 68, 68, 0.10)')
    g.addColorStop(1,   'rgba(239, 68, 68, 0.00)')
  }
  return g
}

const overallProfit = computed(() => groupedData.value.reduce((s, d) => s + d.pnl, 0) >= 0)

const chartData = computed(() => {
  const values = groupedData.value.map((d) => d.pnl)
  const accentColor = overallProfit.value ? '#10b981' : '#ef4444'
  const pointBg = overallProfit.value ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'

  return {
    labels: groupedData.value.map((d) => d.label),
    datasets: [
      {
        label: 'P&L',
        data: values,
        borderColor: accentColor,
        borderWidth: 2,
        pointRadius: values.length <= 7 ? 4 : values.length <= 14 ? 3 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: accentColor,
        pointHoverBorderWidth: 2,
        tension: 0.42,
        fill: true,
        // Gradient background — set at draw time
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const c = ctx.chart
          if (!c.chartArea) return 'transparent'
          return makeGradient(c.ctx, c.chartArea, overallProfit.value)
        }
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600, easing: 'easeInOutQuart' as const },
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false,
      external: externalTooltipHandler
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#525252', font: { size: 10 } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.035)', drawBorder: false },
      border: { display: false },
      ticks: {
        color: '#525252',
        font: { size: 10 },
        maxTicksLimit: 5,
        callback: (v: string | number) => {
          const n = typeof v === 'number' ? v : parseFloat(String(v))
          if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
          if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`
          return String(n)
        }
      }
    }
  }
}))

// ── Stats cards ──
const statsInPeriod = computed(() => {
  const items = groupedData.value
  const totalPnl = items.reduce((s, i) => s + i.pnl, 0)
  const wins = items.filter((i) => i.pnl > 0).length
  const losses = items.filter((i) => i.pnl < 0).length
  return { totalPnl, wins, losses, sessions: items.length }
})

// ── History list ──
const recentCheckins = computed<TradingCheckin[]>(() => trading.sortedCheckins.slice(0, 30))

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })
}
</script>

<template>
  <div class="space-y-5">

    <!-- ── Period tabs ── -->
    <div class="flex items-center gap-1 p-1 bg-bg-surface rounded-xl border border-border-default w-fit">
      <button
        v-for="(tab, key) in { day: 'Ngày', month: 'Tháng', year: 'Năm' }"
        :key="key"
        @click="period = key as 'day' | 'month' | 'year'"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
        :class="period === key ? 'bg-accent text-white shadow-sm' : 'text-text-tertiary hover:text-text-primary'"
      >
        <CalendarDays v-if="key === 'day'" :size="12" />
        <Calendar v-else-if="key === 'month'" :size="12" />
        <BarChart2 v-else :size="12" />
        {{ tab }}
      </button>
    </div>

    <!-- ── Stats cards ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

      <!-- Total P&L -->
      <div class="relative overflow-hidden rounded-xl border border-border-default bg-bg-surface p-4">
        <div
          class="absolute inset-0 opacity-5 pointer-events-none"
          :class="statsInPeriod.totalPnl >= 0 ? 'bg-success' : 'bg-error'"
        />
        <p class="text-[11px] text-text-tertiary mb-1">Tổng lãi/lỗ</p>
        <p
          class="text-lg font-bold tabular-nums"
          :class="statsInPeriod.totalPnl >= 0 ? 'text-success' : 'text-error'"
        >
          {{ statsInPeriod.totalPnl >= 0 ? '+' : '' }}{{ formatVND(statsInPeriod.totalPnl) }}
        </p>
      </div>

      <!-- Win rate -->
      <div class="relative overflow-hidden rounded-xl border border-border-default bg-bg-surface p-4">
        <p class="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
          <Trophy :size="11" /> Tỉ lệ thắng
        </p>
        <p class="text-lg font-bold text-text-primary">
          {{ statsInPeriod.sessions > 0 ? Math.round((statsInPeriod.wins / statsInPeriod.sessions) * 100) : 0 }}%
        </p>
        <p class="text-[10px] text-text-disabled mt-0.5">{{ statsInPeriod.wins }}W / {{ statsInPeriod.losses }}L</p>
      </div>

      <!-- All-time P&L -->
      <div class="relative overflow-hidden rounded-xl border border-border-default bg-bg-surface p-4">
        <p class="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
          <Flame :size="11" /> Tổng mọi thời
        </p>
        <p
          class="text-lg font-bold tabular-nums"
          :class="trading.totalPnlAllTime >= 0 ? 'text-success' : 'text-error'"
        >
          {{ trading.totalPnlAllTime >= 0 ? '+' : '' }}{{ formatVND(trading.totalPnlAllTime) }}
        </p>
      </div>

      <!-- Sessions -->
      <div class="relative overflow-hidden rounded-xl border border-border-default bg-bg-surface p-4">
        <p class="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
          <BookOpen :size="11" /> Tổng phiên
        </p>
        <p class="text-lg font-bold text-text-primary">{{ trading.checkins.length }}</p>
        <p class="text-[10px] text-text-disabled mt-0.5">WR {{ trading.winRate }}% all-time</p>
      </div>
    </div>

    <!-- ── Line / Area Chart ── -->
    <div class="rounded-xl border border-border-default bg-bg-surface p-5">
      <div class="flex items-center gap-2 mb-5">
        <div
          class="h-2 w-2 rounded-full"
          :class="overallProfit ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.6)]'"
        />
        <h3 class="text-sm font-semibold">Biểu đồ lãi/lỗ</h3>
        <span class="text-[11px] text-text-disabled ml-0.5">· {{ period === 'day' ? '30 ngày' : period === 'month' ? '12 tháng' : '10 năm' }}</span>
        <div class="ml-auto flex items-center gap-3 text-[11px]">
          <span class="flex items-center gap-1.5 text-success">
            <span class="inline-block h-[3px] w-4 rounded-full bg-success" /> Lãi
          </span>
          <span class="flex items-center gap-1.5 text-error">
            <span class="inline-block h-[3px] w-4 rounded-full bg-error" /> Lỗ
          </span>
        </div>
      </div>

      <div v-if="trading.loading" class="skeleton h-44 rounded-lg" />
      <div
        v-else-if="groupedData.length === 0"
        class="flex h-44 flex-col items-center justify-center gap-2 text-sm text-text-tertiary"
      >
        <BarChart2 :size="32" class="text-text-disabled" />
        <span>Chưa có dữ liệu. Hãy check-in ngày đầu tiên!</span>
      </div>
      <div v-else class="h-44">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- ── History list (daily view) ── -->
    <div v-if="period === 'day'" class="rounded-xl border border-border-default bg-bg-surface overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
        <h3 class="text-sm font-semibold">Lịch sử check-in</h3>
      </div>

      <div v-if="trading.loading" class="p-4 space-y-3">
        <div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" />
      </div>

      <div v-else-if="recentCheckins.length === 0" class="flex flex-col items-center justify-center py-12 text-text-tertiary text-sm gap-2">
        <BookOpen :size="36" class="text-text-disabled" />
        <p>Chưa có check-in nào</p>
      </div>

      <div v-else class="divide-y divide-border-subtle">
        <div
          v-for="c in recentCheckins"
          :key="c.id"
          class="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-hover transition-colors group"
        >
          <!-- Date -->
          <div class="w-16 shrink-0">
            <div class="text-xs font-semibold text-text-primary">{{ formatDateLabel(c.date) }}</div>
            <div class="text-[10px] text-text-disabled">{{ c.entries.length }} ví</div>
          </div>

          <!-- P&L -->
          <div
            class="flex items-center gap-1 flex-1 text-sm font-bold tabular-nums"
            :class="c.totalPnl >= 0 ? 'text-success' : 'text-error'"
          >
            <TrendingUp v-if="c.totalPnl >= 0" :size="14" />
            <TrendingDown v-else :size="14" />
            {{ c.totalPnl >= 0 ? '+' : '' }}{{ formatVND(c.totalPnl) }}
          </div>

          <!-- Deposit badge -->
          <div
            v-if="c.totalDeposit > 0"
            class="hidden sm:block text-[10px] text-text-disabled bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle"
          >
            +{{ formatVND(c.totalDeposit) }} nạp
          </div>

          <!-- Note snippet -->
          <div v-if="c.note" class="hidden sm:block flex-1 min-w-0 text-[11px] text-text-tertiary truncate">
            {{ c.note }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit today's check-in modal -->
    <TradingCheckinModal v-model="showEditModal" />
  </div>
</template>
