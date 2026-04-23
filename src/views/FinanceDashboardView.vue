<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFinancePolling } from '@/composables/useFinancePolling'
import { useAuthStore } from '@/stores/auth'
import { formatVND, formatVNDShort, getCategoryConfig } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
import { formatMoneyShort } from '@/composables/useCurrency'
import { useUiStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Eye,
  EyeOff,
  Zap,
  ChevronUp,
  ChevronDown,
  Send,
  Bot,
  X
} from 'lucide-vue-next'
import { httpClient } from '@/shared/api/httpClient'
import { useAi } from '@/composables/useGemini'
import WeatherWidget from '@/components/WeatherWidget.vue'

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
const auth = useAuthStore()
const ui = useUiStore()
const finance = useFinancePolling()

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const monthLabel = computed(() => {
  const [y, m] = finance.selectedMonth.split('-')
  const months = tm('months') as string[]
  return `${months[parseInt(m) - 1]}, ${y}`
})

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

// ── Hover state for header-value display (TokenTerminal pattern) ──
const hoverIncome = ref<string | null>(null)
const hoverExpense = ref<string | null>(null)
const hoverDay = ref<string | null>(null)

// ── Crosshair plugin (vertical line on hover) ──
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
      borderColor: '#10b981',
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(16, 185, 129, 0.1)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
        gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.05)')
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
        return gradient
      },
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#10b981',
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

// ── Monthly Budget ──
const BUDGET_KEY = 'smart_note_monthly_budget'
const monthlyBudget = ref(parseInt(localStorage.getItem(BUDGET_KEY) || '0'))
const showBudgetInput = ref(false)
const budgetInputValue = ref('')

function saveBudget() {
  const val = parseInt(budgetInputValue.value.replace(/[^0-9]/g, ''))
  if (val > 0) {
    monthlyBudget.value = val
    localStorage.setItem(BUDGET_KEY, String(val))
  }
  showBudgetInput.value = false
  budgetInputValue.value = ''
}

const budgetUsedPercent = computed(() => {
  if (!monthlyBudget.value) return 0
  return Math.min((finance.monthExpense / monthlyBudget.value) * 100, 100)
})

const budgetRemaining = computed(() => {
  if (!monthlyBudget.value) return 0
  return Math.max(monthlyBudget.value - finance.monthExpense, 0)
})

const daysLeftInMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
})

const dailyBudgetRemaining = computed(() => {
  if (!budgetRemaining.value || !daysLeftInMonth.value) return 0
  return Math.round(budgetRemaining.value / daysLeftInMonth.value)
})

// ── Smart Financial Insights ──
interface Insight {
  icon: string
  text: string
  type: 'success' | 'warning' | 'info'
}

const insights = computed<Insight[]>(() => {
  const result: Insight[] = []
  const txs = finance.monthTransactions

  // 1. Savings rate
  if (finance.monthIncome > 0) {
    const savingsRate = ((finance.monthIncome - finance.monthExpense) / finance.monthIncome * 100).toFixed(0)
    const saved = finance.monthIncome > finance.monthExpense
    result.push({
      icon: saved ? '💰' : '⚠️',
      text: saved
        ? `Tỷ lệ tiết kiệm tháng này: ${savingsRate}%. Tuyệt vời!`
        : `Chi nhiều hơn thu ${formatMoneyShort(finance.monthExpense - finance.monthIncome)}. Cần kiểm soát!`,
      type: saved ? 'success' : 'warning'
    })
  }

  // 2. Top spending wallet
  if (expenseByWallet.value.length > 0) {
    const top = expenseByWallet.value[0]
    result.push({
      icon: '🏦',
      text: `Ví chi nhiều nhất: ${top.name} — ${formatMoneyShort(top.total)} (${top.percentage.toFixed(0)}%)`,
      type: 'info'
    })
  }

  // 3. Average daily spend
  const today = new Date().getDate()
  if (finance.monthExpense > 0 && today > 1) {
    const avgDaily = Math.round(finance.monthExpense / today)
    result.push({
      icon: '📊',
      text: `Chi tiêu trung bình: ${formatMoneyShort(avgDaily)}/ngày`,
      type: 'info'
    })
  }

  // 4. Budget warning
  if (monthlyBudget.value > 0) {
    const pct = budgetUsedPercent.value
    if (pct >= 90) {
      result.push({
        icon: '🔴',
        text: `Đã dùng ${pct.toFixed(0)}% ngân sách! Còn ${formatMoneyShort(budgetRemaining.value)} cho ${daysLeftInMonth.value} ngày`,
        type: 'warning'
      })
    } else if (pct >= 70) {
      result.push({
        icon: '🟡',
        text: `Đã dùng ${pct.toFixed(0)}% ngân sách. Mỗi ngày nên chi tối đa ${formatMoneyShort(dailyBudgetRemaining.value)}`,
        type: 'warning'
      })
    }
  }

  // 5. Transaction count
  const expenseCount = txs.filter((t: any) => t.type === 'expense').length
  if (expenseCount > 0) {
    result.push({
      icon: '🧾',
      text: `${expenseCount} giao dịch chi tiêu trong tháng`,
      type: 'info'
    })
  }

  return result
})

// ── AI Generator ──
const isInsightsCollapsed = ref(false)
const isAiCollapsed = ref(false)
const isSmartSectionCollapsed = ref(false)
const aiPrompt = ref('')
const { streamText: aiResponse, loading: isAiLoading, askAbout } = useAi()

async function generateAiInsight() {
  if (isAiLoading.value || !aiPrompt.value.trim()) return

  const promptStr = aiPrompt.value.trim()
  aiPrompt.value = '' // clear immediately for better UX

  // Build rich context from app data
  const walletSummary = finance.wallets.map(w => `- ${w.name}: ${formatMoneyShort(w.balance)}`).join('\n')
  
  const recentTxs = finance.monthTransactions.slice(0, 5).map(t => {
    const wName = finance.wallets.find(w => w.id === t.walletId)?.name || 'Ví'
    return `- ${t.date.split('T')[0]}: ${t.type === 'expense' ? 'Chi' : 'Thu'} ${formatMoneyShort(t.amount)} cho "${t.note || 'Không rõ'}" (tại ${wName})`
  }).join('\n')

  const context = `Bạn là chuyên gia tài chính cá nhân. Dựa vào toàn bộ dữ liệu ứng dụng dưới đây của người dùng ${auth.user?.name || 'tôi'}:

[Số dư hiện tại]
${walletSummary}

[Thống kê tháng này]
- Tổng thu: ${formatMoneyShort(finance.monthIncome)}
- Tổng chi: ${formatMoneyShort(finance.monthExpense)}
- Ngân sách tháng: ${monthlyBudget.value > 0 ? formatMoneyShort(monthlyBudget.value) : 'Chưa đặt'}
- Còn lại: ${monthlyBudget.value > 0 ? formatMoneyShort(budgetRemaining.value) : 'N/A'}
- Phân bổ chi tiêu: ${expenseByWallet.value.map(w => `${w.name} (${formatMoneyShort(w.total)})`).join(', ')}

[5 giao dịch gần nhất]
${recentTxs || 'Không có'}

Quy tắc:
1. Trả lời trực tiếp vào câu hỏi.
2. Ngắn gọn, súc tích, format Markdown thân thiện dễ đọc.
3. Đưa ra lời khuyên thực tế dựa trên số liệu cụ thể ở trên.
`

  await askAbout(context, promptStr)
}

</script>

<template>
  <div class="max-w-[75rem]">
    <!-- Weather Widget (Acts as Hero) -->
    <WeatherWidget>
      <template #actions>
        <button
          @click="router.push('/transactions/add')"
          class="btn-primary"
        >
          <Plus :size="16" />
          <span class="hidden sm:inline">{{ t('dashboard.addTransaction') }}</span>
        </button>
      </template>
    </WeatherWidget>

    <!-- Balance + Income/Expense Cards -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Total Balance -->
      <div class="card-premium p-5 sm:col-span-1 border-accent/40 bg-accent/5 shadow-md shadow-accent/10 relative overflow-hidden">
        <!-- Decorative subtle glow -->
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="mb-3 flex items-center gap-2 relative z-10">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg" style="background: rgba(20, 184, 166, 0.12);">
            <Wallet
              :size="18"
              class="text-accent"
            />
          </div>
          <span class="text-text-tertiary text-sm">{{ t('dashboard.totalBalance') }}</span>
          <button 
            @click="ui.toggleHideBalances()" 
            class="ml-auto text-text-tertiary hover:text-accent flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-bg-hover"
            title="Ẩn/hiện số dư"
          >
            <EyeOff v-if="ui.hideBalances" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
        <div v-if="finance.loading" class="skeleton h-8 w-40 mt-1 relative z-10"></div>
        <div v-else class="text-3xl font-bold tracking-tight text-text-primary relative z-10">
          {{ formatVND(finance.totalBalance) }}
        </div>
      </div>

      <!-- Month Income -->
      <div class="card-premium p-5">
        <div class="mb-3 flex items-center gap-2">
          <div class="bg-success/10 flex h-9 w-9 items-center justify-center rounded-lg">
            <TrendingUp
              :size="18"
              class="text-success"
            />
          </div>
          <span class="text-text-tertiary text-sm">{{ t('dashboard.monthIncome') }}</span>
        </div>
        <div v-if="finance.loading" class="skeleton h-8 w-32 mt-1"></div>
        <div v-else class="text-success text-2xl font-bold tracking-tight">
          +{{ formatVND(finance.monthIncome) }}
        </div>
      </div>

      <!-- Month Expense -->
      <div class="card-premium p-5">
        <div class="mb-3 flex items-center gap-2">
          <div class="bg-error/10 flex h-9 w-9 items-center justify-center rounded-lg">
            <TrendingDown
              :size="18"
              class="text-error"
            />
          </div>
          <span class="text-text-tertiary text-sm">{{ t('dashboard.monthExpense') }}</span>
        </div>
        <div v-if="finance.loading" class="skeleton h-8 w-32 mt-1"></div>
        <div v-else class="text-error text-2xl font-bold tracking-tight">
          -{{ formatVND(finance.monthExpense) }}
        </div>
      </div>
    </div>

    <!-- Budget Gauge + Smart Insights -->
    <div v-if="isSmartSectionCollapsed" class="mb-6 card-premium p-4 flex items-center justify-between cursor-pointer group hover:bg-bg-elevated transition-colors" @click="isSmartSectionCollapsed = false">
      <div class="flex items-center gap-6 divide-x divide-border-subtle flex-1 overflow-x-auto no-scrollbar">
        <!-- Budget summary -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles :size="16" class="text-accent" />
          </div>
          <div>
            <div class="text-[0.6875rem] text-text-tertiary font-medium">{{ t('dashboard.monthlyBudget') }}</div>
            <div class="text-sm font-bold" :class="monthlyBudget > 0 && budgetUsedPercent >= 90 ? 'text-error' : monthlyBudget > 0 && budgetUsedPercent >= 70 ? 'text-yellow-400' : 'text-success'">
              {{ monthlyBudget > 0 ? formatVNDShort(budgetRemaining) + ' ' + t('dashboard.remaining').toLowerCase() : t('dashboard.notSet') }}
            </div>
          </div>
        </div>
        <!-- AI summary -->
        <div class="flex items-center gap-3 pl-6 shrink-0 hidden sm:flex">
          <div class="bg-blue-500/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Bot :size="16" class="text-blue-400" />
          </div>
          <div>
            <div class="text-[0.6875rem] text-text-tertiary font-medium">{{ t('dashboard.aiAssistant') }}</div>
            <div class="text-sm font-bold text-text-primary">{{ t('dashboard.aiReady') }}</div>
          </div>
        </div>
        <!-- Insights summary -->
        <div class="flex items-center gap-3 pl-6 shrink-0">
          <div class="bg-yellow-500/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Zap :size="16" class="text-yellow-400" />
          </div>
          <div>
            <div class="text-[0.6875rem] text-text-tertiary font-medium">{{ t('dashboard.smartInsights') }}</div>
            <div class="text-sm font-bold text-text-primary">{{ insights.length }} {{ t('dashboard.insightsCount') }}</div>
          </div>
        </div>
      </div>
      <button class="text-text-tertiary group-hover:text-text-primary transition-colors p-2 rounded-lg bg-bg-surface group-hover:bg-bg-elevated ml-4 shrink-0">
        <ChevronDown :size="18" />
      </button>
    </div>

    <div v-else class="mb-6 relative">
      <div class="absolute right-0 -top-8 flex items-center justify-end z-10">
        <button 
          @click="isSmartSectionCollapsed = true"
          class="flex items-center gap-1 text-text-tertiary hover:text-text-primary text-xs font-medium px-2 py-1 rounded-lg hover:bg-bg-elevated transition-colors"
        >
          <span>{{ t('dashboard.collapse') }}</span>
          <ChevronUp :size="14" />
        </button>
      </div>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- LEFT COLUMN -->
      <div class="flex flex-col gap-4">
        <!-- Monthly Budget Gauge -->
        <div class="card-premium p-5">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold flex items-center gap-2">
              <div class="bg-accent/10 flex h-7 w-7 items-center justify-center rounded-lg">
                <Sparkles :size="14" class="text-accent" />
              </div>
              {{ t('dashboard.monthlyBudget') }}
            </h3>
            <button
              v-if="monthlyBudget > 0 && !showBudgetInput"
              class="text-text-tertiary hover:text-accent text-[0.6875rem] transition-colors"
              @click="showBudgetInput = true; budgetInputValue = String(monthlyBudget)"
            >{{ t('common.edit') }}</button>
          </div>

          <!-- No budget set -->
          <div v-if="!monthlyBudget && !showBudgetInput" class="flex flex-col items-center gap-3 py-4">
            <span class="text-text-disabled text-sm">{{ t('dashboard.notSetFull') }}</span>
            <button
              class="btn-primary text-sm px-4 py-1.5"
              @click="showBudgetInput = true"
            >{{ t('dashboard.setBudget') }}</button>
          </div>

          <!-- Budget input -->
          <div v-if="showBudgetInput" class="flex flex-col gap-2 pt-2 pb-4">
            <div class="relative flex items-center">
              <span class="absolute left-3 text-text-tertiary font-medium">đ</span>
              <input
                v-model="budgetInputValue"
                type="text"
                inputmode="numeric"
                placeholder="..."
                class="w-full bg-bg-surface border border-border-subtle rounded-xl pl-8 pr-24 py-2.5 text-sm font-medium text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                @keyup.enter="saveBudget"
              />
              <div class="absolute right-1.5 flex items-center gap-1">
                <button class="bg-accent/10 hover:bg-accent/20 text-accent rounded-lg px-3 py-1.5 text-[0.6875rem] font-semibold transition-colors" @click="saveBudget">{{ t('common.save') }}</button>
                <button class="hover:bg-bg-elevated text-text-tertiary hover:text-text-secondary rounded-lg p-1.5 transition-colors text-[0.6875rem]" @click="showBudgetInput = false">{{ t('common.cancel') }}</button>
              </div>
            </div>
          </div>

          <!-- Gauge display -->
          <div v-if="monthlyBudget > 0 && !showBudgetInput" class="flex items-center gap-5">
            <!-- SVG Ring -->
            <div class="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <!-- Background ring -->
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="7" class="text-bg-elevated" />
                <!-- Progress ring -->
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  :stroke="budgetUsedPercent >= 90 ? '#ef4444' : budgetUsedPercent >= 70 ? '#f59e0b' : '#10b981'"
                  stroke-width="7"
                  stroke-linecap="round"
                  :stroke-dasharray="`${budgetUsedPercent * 2.64} 264`"
                  class="transition-all duration-700"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-lg font-bold" :class="budgetUsedPercent >= 90 ? 'text-error' : budgetUsedPercent >= 70 ? 'text-yellow-400' : 'text-success'">
                  {{ budgetUsedPercent.toFixed(0) }}%
                </span>
              </div>
            </div>
            <!-- Stats -->
            <div class="flex-1 space-y-2 min-w-0">
              <div class="flex justify-between text-[0.75rem]">
                <span class="text-text-tertiary">{{ t('dashboard.monthlyBudget') }}</span>
                <span class="text-text-primary font-semibold tabular-nums">{{ formatVNDShort(monthlyBudget) }}</span>
              </div>
              <div class="flex justify-between text-[0.75rem]">
                <span class="text-text-tertiary">{{ t('dashboard.spent') }}</span>
                <span class="text-error font-semibold tabular-nums">{{ formatVNDShort(finance.monthExpense) }}</span>
              </div>
              <div class="flex justify-between text-[0.75rem]">
                <span class="text-text-tertiary">{{ t('dashboard.remaining') }}</span>
                <span class="text-success font-semibold tabular-nums">{{ formatVNDShort(budgetRemaining) }}</span>
              </div>
              <div class="border-border-subtle border-t pt-2 flex justify-between text-[0.6875rem]">
                <span class="text-text-disabled">{{ t('dashboard.dailyRemaining') }}</span>
                <span class="text-accent font-semibold tabular-nums">{{ t('dashboard.dailyRemainingValue', { val: formatVNDShort(dailyBudgetRemaining) }) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Chat Area -->
        <div class="card-premium p-4 flex flex-col flex-1">
          <div class="flex items-center justify-between cursor-pointer" :class="isAiCollapsed ? '' : 'mb-3'" @click="isAiCollapsed = !isAiCollapsed">
            <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
              <div class="bg-blue-500/10 flex h-7 w-7 items-center justify-center rounded-lg">
                <Bot :size="14" class="text-blue-400" />
              </div>
              {{ t('dashboard.aiAssistant') }}
            </h3>
            <button class="text-text-tertiary hover:text-text-primary p-1 rounded-md transition-colors">
              <ChevronDown v-if="isAiCollapsed" :size="18" />
              <ChevronUp v-else :size="18" />
            </button>
          </div>

          <div v-show="!isAiCollapsed" class="flex flex-col flex-1">
            <div class="flex flex-col flex-1 justify-end">
              <div v-if="aiResponse" class="mb-4 bg-bg-surface rounded-xl p-3.5 text-[0.8125rem] text-text-secondary leading-relaxed border border-border-subtle relative shadow-sm">
                <div class="absolute -top-2.5 left-3 bg-bg-elevated px-1.5 flex items-center gap-1 text-blue-400 rounded-full text-[0.625rem] font-semibold border border-border-subtle shadow-sm">
                  <Sparkles :size="10" /> AI Insight
                </div>
                <button 
                  @click="aiResponse = ''" 
                  class="absolute top-2 right-2 text-text-tertiary hover:text-error transition-colors p-1 rounded-md hover:bg-error/10"
                  title="Clear"
                >
                  <X :size="14" />
                </button>
                <div class="pt-2 pr-6 whitespace-pre-wrap">{{ aiResponse }}</div>
              </div>

              <div class="relative flex items-center group mt-auto">
                <input
                  v-model="aiPrompt"
                  type="text"
                  :placeholder="t('dashboard.askAiPlaceholder')"
                  class="w-full bg-bg-surface border border-border-subtle rounded-xl pl-3 pr-10 py-2.5 text-[0.8125rem] font-medium text-text-primary focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-text-disabled shadow-sm"
                  @keyup.enter="generateAiInsight"
                  :disabled="isAiLoading"
                />
                <button
                  class="absolute right-1.5 p-1.5 rounded-lg transition-all"
                  :class="aiPrompt.trim() ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'text-text-disabled'"
                  :disabled="!aiPrompt.trim() || isAiLoading"
                  @click="generateAiInsight"
                >
                  <div v-if="isAiLoading" class="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                  <Send v-else :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Smart Insights -->
      <div class="card-premium p-5 flex flex-col h-full">
        <div class="flex items-center justify-between mb-1 cursor-pointer" @click="isInsightsCollapsed = !isInsightsCollapsed">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <div class="bg-yellow-500/10 flex h-7 w-7 items-center justify-center rounded-lg">
              <Zap :size="14" class="text-yellow-400" />
            </div>
            {{ t('dashboard.smartInsights') }}
          </h3>
          <button class="text-text-tertiary hover:text-text-primary p-1 rounded-md transition-colors">
            <ChevronDown v-if="isInsightsCollapsed" :size="18" />
            <ChevronUp v-else :size="18" />
          </button>
        </div>

        <div v-show="!isInsightsCollapsed" class="flex-1 flex flex-col mt-3">
          <div v-if="insights.length" class="space-y-2.5">
            <div
              v-for="(insight, idx) in insights"
              :key="idx"
              class="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors border border-transparent hover:border-border-subtle"
              :class="{
                'bg-success/5': insight.type === 'success',
                'bg-yellow-500/5': insight.type === 'warning',
                'bg-blue-500/5': insight.type === 'info'
              }"
            >
              <span class="text-base shrink-0 mt-0.5">{{ insight.icon }}</span>
              <span class="text-text-secondary text-[0.8125rem] leading-relaxed">{{ insight.text }}</span>
            </div>
          </div>
          <div v-else class="text-text-disabled flex h-20 items-center justify-center text-sm">
            {{ t('dashboard.notEnoughData') }}
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Wallets -->
    <div class="mb-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ t('dashboard.myWallets') }}</h3>
        <router-link
          to="/wallets"
          class="text-accent hover:text-accent-text flex items-center gap-1 text-sm transition-colors"
        >
          {{ t('dashboard.manage') }}
          <ArrowRight :size="14" />
        </router-link>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="w in finance.wallets"
          :key="w.id"
          class="bg-bg-surface border-border-default hover:border-border-strong cursor-pointer rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5"
          @click="finance.filter = { walletId: w.id }; router.push('/transactions')"
        >
          <!-- Brand Logo -->
          <div class="mb-2 h-8 w-8">
            <img
              v-if="getWalletBrand(w.name)?.logoUrl"
              :src="getWalletBrand(w.name)!.logoUrl"
              :alt="w.name"
              class="h-8 w-8 rounded-lg object-contain"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'; ($event.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden')"
            />
            <div
              v-if="getWalletBrand(w.name) && !getWalletBrand(w.name)!.logoUrl"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
              :style="{ backgroundColor: getWalletBrand(w.name)!.bgColor, color: getWalletBrand(w.name)!.textColor }"
            >
              {{ getWalletBrand(w.name)!.abbr }}
            </div>
            <div
              v-if="!getWalletBrand(w.name)"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-xl"
              :style="{ backgroundColor: w.color + '20' }"
            >
              {{ w.icon }}
            </div>
          </div>
          <div class="text-text-tertiary mb-1 truncate text-[0.6875rem]">
            {{ w.name }}
          </div>
          <div
            class="text-sm font-semibold"
            :class="w.balance >= 0 ? 'text-text-primary' : 'text-error'"
          >
            {{ formatVNDShort(w.balance) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Chart + Category Breakdown -->
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
            <span class="h-[3px] w-3 rounded-full bg-emerald-500"></span>
            <span class="text-text-tertiary text-[0.6875rem]">{{ t('dashboard.income') }}</span>
            <span class="text-emerald-400 text-[0.8125rem] font-bold tabular-nums">
              {{ hoverIncome ?? formatMoneyShort(finance.monthIncome) }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="h-[3px] w-3 rounded-full bg-red-500"></span>
            <span class="text-text-tertiary text-[0.6875rem]">{{ t('dashboard.expense') }}</span>
            <span class="text-red-400 text-[0.8125rem] font-bold tabular-nums">
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
          <h3 class="text-sm font-semibold">{{ t('dashboard.walletBreakdown') || 'Chi tiêu theo ví' }}</h3>
          <div class="flex items-center gap-1 rounded-lg bg-bg-elevated p-0.5">
            <button
              class="rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-all"
              :class="walletBreakdownTab === 'expense' ? 'bg-bg-surface text-error shadow-sm' : 'text-text-tertiary hover:text-text-secondary'"
              @click="walletBreakdownTab = 'expense'"
            >Chi</button>
            <button
              class="rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-all"
              :class="walletBreakdownTab === 'income' ? 'bg-bg-surface text-success shadow-sm' : 'text-text-tertiary hover:text-text-secondary'"
              @click="walletBreakdownTab = 'income'"
            >Thu</button>
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
                :style="{ width: ws.percentage + '%', backgroundColor: walletBreakdownTab === 'expense' ? '#ef4444' : '#10b981' }"
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
          class="hover:bg-bg-hover flex items-center gap-3 px-4 py-3 transition-colors"
        >
          <!-- Wallet Logo / Category Icon -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden"
            :style="{ backgroundColor: getWalletBrand(finance.getWalletName(tx.walletId))?.logoUrl ? '#fff' : getCategoryConfig(tx.category).color + '15' }"
          >
            <img
              v-if="getWalletBrand(finance.getWalletName(tx.walletId))?.logoUrl"
              :src="getWalletBrand(finance.getWalletName(tx.walletId))!.logoUrl"
              :alt="finance.getWalletName(tx.walletId)"
              class="h-7 w-7 object-contain"
              loading="lazy"
            />
            <span
              v-else-if="getWalletBrand(finance.getWalletName(tx.walletId))"
              class="text-[10px] font-bold"
              :style="{ color: getWalletBrand(finance.getWalletName(tx.walletId))!.textColor, backgroundColor: getWalletBrand(finance.getWalletName(tx.walletId))!.bgColor }"
            >
              {{ getWalletBrand(finance.getWalletName(tx.walletId))!.abbr }}
            </span>
            <span v-else class="text-lg">{{ getCategoryConfig(tx.category).icon }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium">
              {{ tx.note || t(`categories.${tx.category}`) }}
            </div>
            <div class="text-text-disabled flex items-center gap-2 text-[0.6875rem]">
              <span>{{ finance.getWalletName(tx.walletId) }}</span>
              <span>·</span>
              <span>{{ timeSince(tx.createdAt) }}</span>
            </div>
          </div>
          <div
            class="text-sm font-semibold whitespace-nowrap"
            :class="tx.type === 'income' ? 'text-success' : 'text-error'"
          >
            <span class="flex items-center gap-0.5">
              <ArrowUpRight
                v-if="tx.type === 'income'"
                :size="14"
              />
              <ArrowDownRight
                v-else
                :size="14"
              />
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
  </div>
</template>
