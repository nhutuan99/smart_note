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

// ── Monthly Budget (API-backed + Smart Planner) ──
const BUDGET_KEY = 'smart_note_monthly_budget'
const BUDGET_DISMISSED_KEY = 'smart_note_budget_dismissed'
const monthlyBudget = ref(parseInt(localStorage.getItem(BUDGET_KEY) || '0'))
const budgetDismissed = ref(localStorage.getItem(BUDGET_DISMISSED_KEY) === 'true')
const showBudgetInput = ref(false)
const budgetInputValue = ref('')
const budgetSaving = ref(false)

// Load budget from API on mount
;(async () => {
  try {
    const data = await httpClient.get<{ amount: number; dismissed: boolean }>('/api/finance/budget')
    if (data) {
      monthlyBudget.value = data.amount || 0
      budgetDismissed.value = !!data.dismissed
      localStorage.setItem(BUDGET_KEY, String(data.amount || 0))
      localStorage.setItem(BUDGET_DISMISSED_KEY, String(!!data.dismissed))
    }
  } catch {
    // Fallback to localStorage values
  }
})()

function handleBudgetInput(e: Event) {
  const input = e.target as HTMLInputElement
  const raw = input.value.replace(/\D/g, '')
  if (raw) {
    budgetInputValue.value = new Intl.NumberFormat('vi-VN').format(parseInt(raw))
  } else {
    budgetInputValue.value = ''
  }
}

async function saveBudget() {
  const val = parseInt(budgetInputValue.value.replace(/\D/g, ''))
  budgetSaving.value = true
  try {
    if (!isNaN(val) && val > 0) {
      monthlyBudget.value = val
      budgetDismissed.value = false
      localStorage.setItem(BUDGET_KEY, String(val))
      localStorage.setItem(BUDGET_DISMISSED_KEY, 'false')
      await httpClient.put('/api/finance/budget', { amount: val, dismissed: false })
      // Auto-trigger AI analysis after saving budget
      await analyzeBudgetWithAi()
    } else {
      monthlyBudget.value = 0
      localStorage.setItem(BUDGET_KEY, '0')
      await httpClient.put('/api/finance/budget', { amount: 0, dismissed: false })
    }
  } catch {
    // localStorage already updated as fallback
  } finally {
    budgetSaving.value = false
  }
  showBudgetInput.value = false
  budgetInputValue.value = ''
}

async function dismissBudget() {
  budgetDismissed.value = true
  localStorage.setItem(BUDGET_DISMISSED_KEY, 'true')
  try {
    await httpClient.put('/api/finance/budget', { amount: monthlyBudget.value, dismissed: true })
  } catch {
    // localStorage already updated
  }
}

async function reEnableBudget() {
  budgetDismissed.value = false
  showBudgetInput.value = true
  budgetInputValue.value = monthlyBudget.value > 0 ? new Intl.NumberFormat('vi-VN').format(monthlyBudget.value) : ''
  localStorage.setItem(BUDGET_DISMISSED_KEY, 'false')
  try {
    await httpClient.put('/api/finance/budget', { amount: monthlyBudget.value, dismissed: false })
  } catch {
    // localStorage already updated
  }
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

// ── Smart Budget Planner ──
const topExpenseCategories = computed(() =>
  finance.expenseByCategoryThisMonth
    .map(c => `${t(`categories.${c.category}`)}: ${formatMoneyShort(c.total)} (${c.percentage.toFixed(0)}%)`)
    .join(', ')
)

// Tiền thực tế có thể dùng = min(số dư thực tế, ngân sách còn lại)
const spendableBalance = computed(() =>
  monthlyBudget.value > 0
    ? Math.min(finance.totalBalance, budgetRemaining.value)
    : finance.totalBalance
)

// Mỗi ngày có thể chi dựa trên tiền thực tế còn lại
const dailySpendable = computed(() => {
  if (!daysLeftInMonth.value) return 0
  return Math.round(spendableBalance.value / daysLeftInMonth.value)
})

// ── Budget AI ──
const { streamText: budgetAiText, loading: isBudgetAiLoading, askAbout: askBudgetAi } = useAi()
const showBudgetAiPanel = ref(false)
const aiFollowUp = ref('')

function buildFinanceContext() {
  const now = new Date()
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate() - 1
  const daysLeft = daysLeftInMonth.value
  const actualDaily = daysElapsed > 0 ? Math.round(finance.monthExpense / daysElapsed) : 0
  const wallets = finance.wallets.map(w => `  - ${w.name}: ${formatMoneyShort(w.balance)}`).join('\n')
  const cats = finance.expenseByCategoryThisMonth
    .map(c => `  - ${t(`categories.${c.category}`)}: ${formatMoneyShort(c.total)}`).join('\n')

  return `📊 TÀI CHÍNH THÁNG ${now.getMonth()+1}/${now.getFullYear()} (ngày ${now.getDate()}/${totalDays}, còn ${daysLeft} ngày)

💰 SỐ DƯ THỰC TẾ CÁC TÀI KHOẢN:
${wallets || '  Chưa có tài khoản'}
→ Tổng: ${formatMoneyShort(finance.totalBalance)}

📈 THU CHI THÁNG NÀY:
  Thu vào: ${formatMoneyShort(finance.monthIncome)}
  Chi ra: ${formatMoneyShort(finance.monthExpense)} (trung bình ${formatMoneyShort(actualDaily)}/ngày)

🏷️ DANH MỤC CHI TIÊU:
${cats || '  Chưa có giao dịch'}

🎯 MỤC TIÊU CHI:
  Ngân sách tháng: ${monthlyBudget.value > 0 ? formatMoneyShort(monthlyBudget.value) : 'Chưa đặt'}
  Đã chi: ${formatMoneyShort(finance.monthExpense)} (${budgetUsedPercent.value.toFixed(0)}%)
  Còn lại theo ngân sách: ${formatMoneyShort(budgetRemaining.value)}
  Tiền thực có thể dùng: ${formatMoneyShort(spendableBalance.value)}
  → Mỗi ngày còn lại tối đa: ${formatMoneyShort(dailySpendable.value)}/ngày`
}

async function analyzeBudgetWithAi() {
  if (isBudgetAiLoading.value) return
  showBudgetAiPanel.value = true

  const context = buildFinanceContext()
  const prompt = `${context}

YÊU CẦU:
1. Đánh giá tình hình (tốt/cần chú ý/nguy hiểm) - 1 câu
2. So sánh tốc độ chi thực tế vs kế hoạch
3. Số tiền tối đa nên chi mỗi ngày từ hôm nay để đạt mục tiêu
4. Gợi ý cắt giảm theo danh mục chi nhiều nhất

Viết ngắn, dùng emoji, tối đa 180 từ, format Markdown.`

  await askBudgetAi(prompt, 'Phân tích và lập kế hoạch')
}

async function askFollowUp() {
  const q = aiFollowUp.value.trim()
  if (!q || isBudgetAiLoading.value) return
  aiFollowUp.value = ''
  showBudgetAiPanel.value = true
  const context = buildFinanceContext()
  await askBudgetAi(`${context}\n\nTrả lời ngắn gọn, Markdown, dùng số liệu thực tế.`, q)
}

// ── Collapse state ──
const isSmartSectionCollapsed = ref(false)

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
            <div class="text-sm font-bold" :class="budgetDismissed ? 'text-text-disabled' : monthlyBudget > 0 && budgetUsedPercent >= 90 ? 'text-error' : monthlyBudget > 0 && budgetUsedPercent >= 70 ? 'text-yellow-400' : 'text-success'">
              {{ budgetDismissed ? t('dashboard.skipBudget') : monthlyBudget > 0 ? formatVNDShort(budgetRemaining) + ' ' + t('dashboard.remaining').toLowerCase() : t('dashboard.notSet') }}
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

      </div>
      <button class="text-text-tertiary group-hover:text-text-primary transition-colors p-2 rounded-lg bg-bg-surface group-hover:bg-bg-elevated ml-4 shrink-0">
        <ChevronDown :size="18" />
      </button>
    </div>

    <div v-else class="mb-6">
      <div class="mb-3 flex justify-end">
        <button 
          @click="isSmartSectionCollapsed = true"
          class="flex items-center gap-1 text-text-tertiary hover:text-text-primary text-xs font-medium px-2 py-1 rounded-lg hover:bg-bg-elevated transition-colors"
        >
          <span>{{ t('dashboard.collapse') }}</span>
          <ChevronUp :size="14" />
        </button>
      </div>
      <div class="grid grid-cols-1 gap-4">
      <!-- FULL WIDTH: Smart Budget Card -->
      <div class="card-premium p-5 flex flex-col">

        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <div class="bg-accent/10 flex h-7 w-7 items-center justify-center rounded-lg">
              <Sparkles :size="14" class="text-accent" />
            </div>
            {{ t('dashboard.monthlyBudget') }}
          </h3>
          <button
            v-if="monthlyBudget > 0 && !showBudgetInput && !budgetDismissed"
            class="text-text-tertiary hover:text-accent text-[0.6875rem] transition-colors px-1.5 py-0.5 rounded hover:bg-accent/10"
            @click="showBudgetInput = true; budgetInputValue = new Intl.NumberFormat('vi-VN').format(monthlyBudget)"
          >{{ t('common.edit') }}</button>
        </div>

        <!-- Financial Summary Strip (always visible) -->
        <div class="mb-4 grid grid-cols-3 gap-2 text-center">
          <div class="bg-bg-surface rounded-lg p-2">
            <div class="text-[0.625rem] text-text-disabled mb-0.5">{{ t('dashboard.totalBalance') }}</div>
            <div class="text-[0.75rem] font-bold text-text-primary tabular-nums">{{ formatMoneyShort(finance.totalBalance) }}</div>
          </div>
          <div class="bg-success/5 rounded-lg p-2">
            <div class="text-[0.625rem] text-text-disabled mb-0.5">{{ t('dashboard.income') }}</div>
            <div class="text-[0.75rem] font-bold text-success tabular-nums">+{{ formatMoneyShort(finance.monthIncome) }}</div>
          </div>
          <div class="bg-error/5 rounded-lg p-2">
            <div class="text-[0.625rem] text-text-disabled mb-0.5">{{ t('dashboard.expense') }}</div>
            <div class="text-[0.75rem] font-bold text-error tabular-nums">-{{ formatMoneyShort(finance.monthExpense) }}</div>
          </div>
        </div>

        <!-- No budget set -->
        <div v-if="!monthlyBudget && !showBudgetInput && !budgetDismissed" class="flex flex-col items-center gap-3 py-6">
          <Sparkles :size="28" class="text-text-disabled" />
          <div class="text-center">
            <p class="text-text-secondary text-sm font-medium">{{ t('dashboard.setBudgetTitle') }}</p>
            <p class="text-text-disabled text-[0.75rem] mt-0.5">{{ t('dashboard.setBudgetHint') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-primary text-sm px-4 py-1.5" @click="showBudgetInput = true">{{ t('dashboard.setBudget') }}</button>
            <button class="text-text-tertiary hover:text-text-secondary text-[0.75rem] px-3 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors" @click="dismissBudget">{{ t('dashboard.skipBudget') }}</button>
          </div>
        </div>

        <!-- Budget dismissed -->
        <div v-if="budgetDismissed && !showBudgetInput" class="flex flex-col items-center gap-2 py-6">
          <span class="text-text-disabled text-[0.8125rem]">{{ t('dashboard.budgetDismissed') }}</span>
          <button class="text-accent text-[0.75rem] font-medium px-3 py-1 rounded-lg hover:bg-accent/10 transition-colors" @click="reEnableBudget">{{ t('dashboard.reEnableBudget') }}</button>
        </div>

        <!-- Budget input -->
        <div v-if="showBudgetInput" class="flex flex-col gap-2 py-2">
          <p class="text-[0.75rem] text-text-tertiary">{{ t('dashboard.setBudgetLabel') }}</p>
          <div class="relative flex items-center">
            <input
              :value="budgetInputValue"
              @input="handleBudgetInput"
              type="tel" inputmode="numeric" pattern="[0-9]*"
              placeholder="VD: 10.000.000"
              class="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 pr-28 py-2.5 text-sm font-bold text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all tracking-wide"
              @keyup.enter="saveBudget"
            />
            <div class="absolute right-1.5 flex items-center gap-1">
              <button
                class="bg-accent hover:bg-accent/80 text-white rounded-lg px-3 py-1.5 text-[0.6875rem] font-semibold transition-colors flex items-center gap-1"
                :disabled="budgetSaving"
                @click="saveBudget"
              >
                <div v-if="budgetSaving" class="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <Sparkles v-else :size="11" />
                {{ budgetSaving ? t('common.saving') : t('dashboard.analyzeAndSave') }}
              </button>
              <button class="hover:bg-bg-elevated text-text-tertiary rounded-lg p-1.5 transition-colors" @click="showBudgetInput = false"><X :size="14" /></button>
            </div>
          </div>
          <p class="text-[0.6875rem] text-text-disabled">{{ t('dashboard.setBudgetSubhint') }}</p>
        </div>

        <!-- Gauge + Stats + AI (when budget set) -->
        <div v-if="monthlyBudget > 0 && !showBudgetInput && !budgetDismissed" class="flex flex-col gap-4">

          <!-- Ring + Stats row -->
          <div class="flex items-start gap-6">
            <!-- SVG Ring -->
            <div class="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="7" class="text-bg-elevated" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  :stroke="budgetUsedPercent >= 90 ? '#ef4444' : budgetUsedPercent >= 70 ? '#f59e0b' : '#10b981'"
                  stroke-width="7" stroke-linecap="round"
                  :stroke-dasharray="`${budgetUsedPercent * 2.64} 264`"
                  class="transition-all duration-700"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-bold" :class="budgetUsedPercent >= 90 ? 'text-error' : budgetUsedPercent >= 70 ? 'text-yellow-400' : 'text-success'">{{ budgetUsedPercent.toFixed(0) }}%</span>
                <span class="text-[0.5rem] text-text-disabled">{{ t('dashboard.spent') }}</span>
              </div>
            </div>

            <!-- Stats grid -->
            <div class="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-[0.75rem]">
              <div class="flex justify-between col-span-2 pb-2 border-b border-border-subtle">
                <span class="text-text-tertiary">{{ t('dashboard.monthlyBudget') }}</span>
                <span class="text-text-primary font-bold tabular-nums">{{ formatVNDShort(monthlyBudget) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">{{ t('dashboard.spent') }}</span>
                <span class="text-error font-semibold tabular-nums">{{ formatVNDShort(finance.monthExpense) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">{{ t('dashboard.remaining') }}</span>
                <span class="text-success font-semibold tabular-nums">{{ formatVNDShort(budgetRemaining) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-disabled">Tiền thực có</span>
                <span class="text-text-primary font-semibold tabular-nums">{{ formatVNDShort(spendableBalance) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-disabled">{{ t('dashboard.dailyRemaining') }}</span>
                <span class="text-accent font-bold tabular-nums">{{ formatVNDShort(dailySpendable) }}/ngày</span>
              </div>
            </div>
          </div>

          <!-- AI Panel -->
          <div class="border-t border-border-subtle pt-3">
            <!-- Trigger button -->
            <button
              v-if="!showBudgetAiPanel"
              class="w-full flex items-center justify-center gap-2 text-[0.75rem] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl py-2 transition-all"
              @click="analyzeBudgetWithAi"
            >
              <Bot :size="14" /> {{ t('dashboard.analyzeWithAi') }}
            </button>

            <!-- AI result area -->
            <div v-if="showBudgetAiPanel">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[0.625rem] font-semibold text-blue-400 flex items-center gap-1"><Bot :size="11" /> AI Phân tích</span>
                <div class="flex items-center gap-1">
                  <button v-if="!isBudgetAiLoading" class="text-[0.625rem] text-text-disabled hover:text-accent flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-accent/10 transition-colors" @click="analyzeBudgetWithAi">
                    <Zap :size="10" /> {{ t('dashboard.refresh') }}
                  </button>
                  <button class="text-text-disabled hover:text-error p-1 rounded hover:bg-error/10 transition-colors" @click="showBudgetAiPanel = false"><X :size="12" /></button>
                </div>
              </div>

              <!-- Skeleton -->
              <div v-if="isBudgetAiLoading && !budgetAiText" class="space-y-1.5 mb-3">
                <div class="skeleton h-3 w-full rounded" />
                <div class="skeleton h-3 w-4/5 rounded" />
                <div class="skeleton h-3 w-full rounded" />
                <div class="skeleton h-3 w-3/5 rounded" />
              </div>

              <!-- AI response -->
              <div v-if="budgetAiText" class="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-[0.75rem] text-text-secondary leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto mb-3">
                {{ budgetAiText }}
              </div>

              <!-- Follow-up question input -->
              <div class="relative flex items-center">
                <input
                  v-model="aiFollowUp"
                  type="text"
                  placeholder="VD: Tôi muốn mua điện thoại 12tr, có nên chi không?"
                  class="w-full bg-bg-surface border border-border-subtle rounded-xl pl-3 pr-10 py-2 text-[0.8125rem] text-text-primary focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-text-disabled"
                  @keyup.enter="askFollowUp"
                  :disabled="isBudgetAiLoading"
                />
                <button
                  class="absolute right-1.5 p-1.5 rounded-lg transition-all"
                  :class="aiFollowUp.trim() ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'text-text-disabled'"
                  :disabled="!aiFollowUp.trim() || isBudgetAiLoading"
                  @click="askFollowUp"
                >
                  <div v-if="isBudgetAiLoading" class="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  <Send v-else :size="14" />
                </button>
              </div>
            </div>
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
