<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BarChart3, ArrowUpRight, ArrowDownRight, ArrowRight, Plus, Wallet } from 'lucide-vue-next'
import { useFinancePolling } from '@/composables/useFinancePolling'
import { formatMoneyShort } from '@/composables/useCurrency'
import { formatVNDShort, formatVND, getCategoryConfig } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'

// Chart.js
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

const { t, tm } = useI18n()
const router = useRouter()
const finance = useFinancePolling()

const hoverIncome = ref<string | null>(null)
const hoverExpense = ref<string | null>(null)
const hoverDay = ref<string | null>(null)

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const days = tm('days.short') as string[]
  return days[d.getDay()]
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return t('time.minutesAgo', { n: m })
  const h = Math.floor(m / 60)
  if (h < 24) return t('time.hoursAgo', { n: h })
  return t('time.daysAgo', { n: Math.floor(h / 24) })
}
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart: any) {
    const tooltip = chart.tooltip
    if (!tooltip || !tooltip.getActiveElements().length) return
    const ctx = chart.ctx
    const x = tooltip.caretX
    const topY = chart.scales.y.top
    const bottomY = chart.scales.y.bottom
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, topY)
    ctx.lineTo(x, bottomY)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.restore()
  }
}

// ── Weekly Line Chart (TokenTerminal style) ──
const weeklyChartData = computed(() => ({
  labels: finance.weeklyStats.map(d => `${dayLabel(d.date)} ${formatDateShort(d.date)}`),
  datasets: [
    {
      label: t('dashboard.income'),
      data: finance.weeklyStats.map(d => d.income),
      borderColor: '#7c6ff7',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(16, 185, 129, 0.1)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(124, 111, 247, 0.25)')
        gradient.addColorStop(0.6, 'rgba(124, 111, 247, 0.05)')
        gradient.addColorStop(1, 'rgba(124, 111, 247, 0)')
        return gradient
      },
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#7c6ff7',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      tension: 0.4,
      fill: true
    },
    {
      label: t('dashboard.expense'),
      data: finance.weeklyStats.map(d => d.expense),
      borderColor: '#ef4444',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(239, 68, 68, 0.1)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)')
        gradient.addColorStop(0.6, 'rgba(239, 68, 68, 0.03)')
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)')
        return gradient
      },
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#ef4444',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      tension: 0.4,
      fill: true
    }
  ]
}))

const weeklyChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 700, easing: 'easeOutQuart' as const },
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false,
      external: (context: any) => {
        const tooltip = context.tooltip
        if (tooltip.opacity === 0) {
          hoverIncome.value = null
          hoverExpense.value = null
          hoverDay.value = null
          return
        }
        const idx = tooltip.dataPoints?.[0]?.dataIndex
        if (idx != null) {
          const stats = finance.weeklyStats
          hoverDay.value = `${dayLabel(stats[idx].date)} ${formatDateShort(stats[idx].date)}`
          hoverIncome.value = formatMoneyShort(stats[idx].income)
          hoverExpense.value = formatMoneyShort(stats[idx].expense)
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#737373', font: { size: 10, weight: 'bold' as const }, maxRotation: 0 }
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.04)', drawTicks: false },
      border: { display: false, dash: [4, 4] as number[] },
      ticks: {
        color: '#737373',
        font: { size: 10 },
        padding: 8,
        callback: (v: any) => formatMoneyShort(v)
      }
    }
  }
}))

// ── Expense by Wallet ──
interface WalletStat {
  walletId: string
  name: string
  total: number
  percentage: number
  color: string
  logoUrl: string
}

const expenseByWallet = computed<WalletStat[]>(() => {
  const map: Record<string, number> = {}
  let total = 0

  finance.monthTransactions
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      map[t.walletId] = (map[t.walletId] || 0) + t.amount
      total += t.amount
    })

  return Object.entries(map)
    .map(([walletId, amount]) => {
      const walletName = finance.getWalletName(walletId)
      const brand = getWalletBrand(walletName)
      const wallet = finance.wallets.find((w: any) => w.id === walletId)
      return {
        walletId,
        name: walletName,
        total: amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: brand?.bgColor && brand.bgColor !== '#ffffff' ? brand.bgColor : (wallet?.color || '#6366f1'),
        logoUrl: brand?.logoUrl || ''
      }
    })
    .sort((a, b) => b.total - a.total)
})

const incomeByWallet = computed<WalletStat[]>(() => {
  const map: Record<string, number> = {}
  let total = 0

  finance.monthTransactions
    .filter((t: any) => t.type === 'income')
    .forEach((t: any) => {
      map[t.walletId] = (map[t.walletId] || 0) + t.amount
      total += t.amount
    })

  return Object.entries(map)
    .map(([walletId, amount]) => {
      const walletName = finance.getWalletName(walletId)
      const brand = getWalletBrand(walletName)
      const wallet = finance.wallets.find((w: any) => w.id === walletId)
      return {
        walletId,
        name: walletName,
        total: amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: brand?.bgColor && brand.bgColor !== '#ffffff' ? brand.bgColor : (wallet?.color || '#10b981'),
        logoUrl: brand?.logoUrl || ''
      }
    })
    .sort((a, b) => b.total - a.total)
})

const walletBreakdownTab = ref<'expense' | 'income'>('income')
const activeWalletStats = computed(() => walletBreakdownTab.value === 'expense' ? expenseByWallet.value : incomeByWallet.value)
</script>
<template>
    <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- Weekly Line Chart (TokenTerminal style) -->
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <!-- Header with live hover values -->
        <div class="mb-1 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <BarChart3 :size="18" class="text-text-tertiary" />
            <h3 class="text-sm font-semibold">{{ t('dashboard.weeklyChart') }}</h3>
          </div>
          <span v-if="hoverDay" class="text-text-disabled text-[0.6875rem] font-medium">{{ hoverDay }}</span>
        </div>
        <!-- Live values row -->
        <div class="mb-3 flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <span class="h-[3px] w-3 rounded-full bg-violet-400"></span>
            <span class="text-text-tertiary text-[0.6875rem]">{{ t('dashboard.income') }}</span>
            <span class="text-violet-400 text-[0.8125rem] font-bold tabular-nums">
              {{ hoverIncome ?? formatMoneyShort(finance.monthIncome) }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="h-[3px] w-3 rounded-full bg-error"></span>
            <span class="text-text-tertiary text-[0.6875rem]">{{ t('dashboard.expense') }}</span>
            <span class="text-error text-[0.8125rem] font-bold tabular-nums">
              {{ hoverExpense ?? formatMoneyShort(finance.monthExpense) }}
            </span>
          </div>
        </div>
        <div class="h-[11rem]">
          <Line :data="weeklyChartData" :options="weeklyChartOptions" :plugins="[crosshairPlugin]" />
        </div>
      </div>

      <!-- Spending by Wallet -->
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <!-- Header with tabs -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ t('dashboard.walletBreakdown') }}</h3>
          <div class="flex items-center gap-1 rounded-lg bg-bg-elevated p-0.5">
            <button
              class="rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-all"
              :class="walletBreakdownTab === 'expense' ? 'bg-bg-surface text-error shadow-sm' : 'text-text-tertiary hover:text-text-secondary'"
              @click="walletBreakdownTab = 'expense'"
            >{{ t('dashboard.expense') }}</button>
            <button
              class="rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-all"
              :class="walletBreakdownTab === 'income' ? 'bg-bg-surface text-success shadow-sm' : 'text-text-tertiary hover:text-text-secondary'"
              @click="walletBreakdownTab = 'income'"
            >{{ t('dashboard.income') }}</button>
          </div>
        </div>

        <div v-if="activeWalletStats.length" class="space-y-3">
          <div
            v-for="ws in activeWalletStats"
            :key="ws.walletId"
            class="group cursor-pointer"
            @click="finance.filter = { walletId: ws.walletId }; router.push('/transactions')"
          >
            <div class="flex items-center gap-3 mb-1.5">
              <!-- Wallet logo -->
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm">
                <img
                  v-if="ws.logoUrl"
                  :src="ws.logoUrl"
                  :alt="ws.name"
                  class="h-5 w-5 object-contain"
                  loading="lazy"
                />
                <span v-else class="text-[9px] font-bold" :style="{ color: ws.color }">{{ ws.name.substring(0, 2).toUpperCase() }}</span>
              </div>
              <!-- Name + Amount -->
              <span class="text-text-secondary text-[0.8125rem] font-medium group-hover:text-text-primary transition-colors truncate">{{ ws.name }}</span>
              <span class="text-text-primary ml-auto text-[0.8125rem] font-bold tabular-nums whitespace-nowrap">{{ formatVNDShort(ws.total) }}</span>
              <span class="text-text-disabled text-[0.6875rem] w-[2.5rem] text-right tabular-nums">{{ ws.percentage.toFixed(0) }}%</span>
            </div>
            <!-- Progress bar -->
            <div class="bg-bg-elevated h-1.5 overflow-hidden rounded-full">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: ws.percentage + '%', backgroundColor: walletBreakdownTab === 'expense' ? 'var(--error)' : 'var(--success)' }"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="text-text-disabled flex h-[9.5rem] items-center justify-center text-sm">
          {{ t('dashboard.noDataThisMonth') }}
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="mb-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ t('dashboard.recentTransactions') }}</h3>
        <router-link
          to="/transactions"
          class="text-accent hover:text-accent-text flex items-center gap-1 text-sm transition-colors"
        >
          {{ t('dashboard.viewAll') }}
          <ArrowRight :size="14" />
        </router-link>
      </div>

      <div
        v-if="finance.recentTransactions.length"
        class="bg-bg-surface border-border-default divide-border-subtle divide-y overflow-hidden rounded-xl border"
      >
        <div
          v-for="tx in finance.recentTransactions.slice(0, 5)"
          :key="tx.id"
          class="hover:bg-bg-hover flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
          @click="router.push('/transactions')"
        >
          <!-- Wallet Logo / Category Icon -->
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-border-default/30"
            :style="{ backgroundColor: (finance.wallets.find(w => w.id === tx.walletId)?.customLogoUrl || getWalletBrand(finance.getWalletName(tx.walletId))?.logoUrl) ? '#fff' : getCategoryConfig(tx.category).color + '12' }"
          >
            <img
              v-if="finance.wallets.find(w => w.id === tx.walletId)?.customLogoUrl"
              :src="finance.wallets.find(w => w.id === tx.walletId)!.customLogoUrl"
              :alt="finance.getWalletName(tx.walletId)"
              class="h-6 w-6 object-contain"
              loading="lazy"
            />
            <img
              v-else-if="getWalletBrand(finance.getWalletName(tx.walletId))?.logoUrl"
              :src="getWalletBrand(finance.getWalletName(tx.walletId))!.logoUrl"
              :alt="finance.getWalletName(tx.walletId)"
              class="h-6 w-6 object-contain"
              loading="lazy"
            />
            <span
              v-else-if="getWalletBrand(finance.getWalletName(tx.walletId))"
              class="text-[9px] font-bold"
              :style="{ color: getWalletBrand(finance.getWalletName(tx.walletId))!.textColor, backgroundColor: getWalletBrand(finance.getWalletName(tx.walletId))!.bgColor }"
            >
              {{ getWalletBrand(finance.getWalletName(tx.walletId))!.abbr }}
            </span>
            <span v-else class="text-base">{{ getCategoryConfig(tx.category).icon }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-text-primary truncate">
                {{ t(`categories.${tx.category}`) }}
              </span>
              <span
                v-if="tx.source && tx.source !== 'manual'"
                class="inline-flex items-center text-[0.625rem] font-bold px-1.5 py-px rounded shrink-0"
                :class="{
                  'bg-success/10 text-success': tx.source === 'sms',
                  'bg-info/10 text-info': tx.source === 'telegram',
                  'bg-warning/10 text-warning': tx.source === 'notification'
                }"
              >
                {{ tx.source === 'sms' ? 'SMS' : tx.source === 'telegram' ? 'TG' : 'Auto' }}
              </span>
            </div>
            <div class="text-text-disabled flex items-center gap-1.5 text-[0.6875rem] mt-0.5">
              <span>{{ finance.getWalletName(tx.walletId) }}</span>
              <span class="opacity-40">·</span>
              <span>{{ timeSince(tx.createdAt) }}</span>
            </div>
          </div>
          <div
            class="text-[0.8125rem] font-bold whitespace-nowrap tabular-nums"
            :class="tx.type === 'income' ? 'text-success' : 'text-error'"
          >
            <span class="flex items-center gap-0.5">
              <ArrowUpRight v-if="tx.type === 'income'" :size="14" />
              <ArrowDownRight v-else :size="14" />
              {{ formatVND(tx.amount) }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="bg-bg-surface border-border-default flex flex-col items-center rounded-2xl border border-dashed py-12 text-center"
      >
        <Wallet
          :size="48"
          class="text-text-disabled mb-4"
        />
        <h4 class="mb-2 text-lg font-semibold">{{ t('dashboard.noTransactions') }}</h4>
        <p class="text-text-tertiary mb-6 text-sm">
          {{ t('dashboard.noTransactionsHint') }}
        </p>
        <button
          @click="router.push('/transactions/add')"
          class="btn-secondary"
        >
          <Plus :size="16" />
          {{ t('dashboard.addTransaction') }}
        </button>
      </div>
    </div>
</template>

