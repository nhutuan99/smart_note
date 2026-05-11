<script setup lang="ts">
// 1. Vue core
import { ref, computed } from 'vue'
// 2. Stores & composables
import { useTradingCheckin } from '@/composables/useTradingCheckin'
// 3. Types
import type { TradingCheckin } from '@/types'
// 4. Utils
import { formatVND } from '@/constants/finance'
// 5. Components & icons
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
  type TooltipItem
} from 'chart.js'
import { TrendingUp, TrendingDown, CalendarDays, Calendar, BarChart2, BookOpen, Edit2, Trophy, Flame } from 'lucide-vue-next'
import TradingCheckinModal from './TradingCheckinModal.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const { trading } = useTradingCheckin()

// ── Period tab ──

type Period = 'day' | 'month' | 'year'
const period = ref<Period>('day')

// ── Edit modal ──

const showEditModal = ref(false)

// ── Derived data based on period ──

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

const chartData = computed(() => ({
  labels: groupedData.value.map((d) => d.label),
  datasets: [
    {
      label: 'Lãi/Lỗ (₫)',
      data: groupedData.value.map((d) => d.pnl),
      backgroundColor: groupedData.value.map((d) =>
        d.pnl >= 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(239, 68, 68, 0.75)'
      ),
      borderRadius: 6,
      borderSkipped: false
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<'bar'>) => ` ${formatVND(ctx.parsed.y ?? 0)}`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#737373', font: { size: 10 } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      border: { display: false },
      ticks: {
        color: '#737373',
        font: { size: 10 },
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

// ── History list (day view only — per check-in) ──

const recentCheckins = computed<TradingCheckin[]>(() => trading.sortedCheckins.slice(0, 30))

// ── Format helpers ──

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
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
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
      <div class="rounded-xl border border-border-default bg-bg-surface p-4">
        <p class="text-[11px] text-text-tertiary mb-1">Tổng lãi/lỗ</p>
        <p
          class="text-lg font-bold tabular-nums"
          :class="statsInPeriod.totalPnl >= 0 ? 'text-success' : 'text-error'"
        >
          {{ statsInPeriod.totalPnl >= 0 ? '+' : '' }}{{ formatVND(statsInPeriod.totalPnl) }}
        </p>
      </div>
      <!-- Win rate -->
      <div class="rounded-xl border border-border-default bg-bg-surface p-4">
        <p class="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
          <Trophy :size="11" /> Tỉ lệ thắng
        </p>
        <p class="text-lg font-bold text-text-primary">
          {{ statsInPeriod.sessions > 0 ? Math.round((statsInPeriod.wins / statsInPeriod.sessions) * 100) : 0 }}%
        </p>
        <p class="text-[10px] text-text-disabled mt-0.5">{{ statsInPeriod.wins }}W / {{ statsInPeriod.losses }}L</p>
      </div>
      <!-- All-time P&L -->
      <div class="rounded-xl border border-border-default bg-bg-surface p-4">
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
      <div class="rounded-xl border border-border-default bg-bg-surface p-4">
        <p class="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
          <BookOpen :size="11" /> Tổng phiên
        </p>
        <p class="text-lg font-bold text-text-primary">{{ trading.checkins.length }}</p>
        <p class="text-[10px] text-text-disabled mt-0.5">WR {{ trading.winRate }}% all-time</p>
      </div>
    </div>

    <!-- ── Bar Chart ── -->
    <div class="rounded-xl border border-border-default bg-bg-surface p-5">
      <div class="flex items-center gap-2 mb-4">
        <BarChart2 :size="16" class="text-text-tertiary" />
        <h3 class="text-sm font-semibold">Biểu đồ lãi/lỗ</h3>
        <div class="ml-auto flex items-center gap-3 text-[11px]">
          <span class="flex items-center gap-1 text-success">
            <span class="inline-block h-2 w-2 rounded-sm bg-success/80" /> Lãi
          </span>
          <span class="flex items-center gap-1 text-error">
            <span class="inline-block h-2 w-2 rounded-sm bg-error/80" /> Lỗ
          </span>
        </div>
      </div>

      <div v-if="trading.loading" class="skeleton h-40 rounded-lg" />
      <div v-else-if="groupedData.length === 0" class="flex h-40 items-center justify-center text-sm text-text-tertiary">
        Chưa có dữ liệu. Hãy check-in ngày đầu tiên!
      </div>
      <div v-else class="h-40">
        <Bar :data="chartData" :options="chartOptions" />
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
          <div v-if="c.totalDeposit > 0" class="hidden sm:block text-[10px] text-text-disabled bg-bg-elevated px-2 py-0.5 rounded-full border border-border-subtle">
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
