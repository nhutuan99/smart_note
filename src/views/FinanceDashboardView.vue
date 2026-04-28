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
  X,
  BookmarkPlus,
  CheckCircle2
} from 'lucide-vue-next'
import { httpClient } from '@/shared/api/httpClient'
import { useAi } from '@/composables/useGemini'
import { useNotesStore } from '@/stores/notes'
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

// ── AI Finance Advisor ──
const notesStore = useNotesStore()

const daysLeftInMonth = computed(() => {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
})

// Build rich context from all wallet balances + transactions
function buildFinanceContext() {
  const now = new Date()
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysLeft = daysLeftInMonth.value
  const daysElapsed = dayOfMonth - 1
  const avgDailyExpense = daysElapsed > 0 ? Math.round(finance.monthExpense / daysElapsed) : 0
  const projectedMonthExpense = avgDailyExpense * totalDays

  const walletLines = finance.wallets
    .map(w => `  • ${w.name}: ${formatMoneyShort(w.balance)}`)
    .join('\n')

  const categoryLines = finance.expenseByCategoryThisMonth
    .map(c => `  • ${t(`categories.${c.category}`)}: ${formatMoneyShort(c.total)} (${c.percentage.toFixed(0)}%)`)
    .join('\n')

  const netFlow = finance.monthIncome - finance.monthExpense

  return `Bạn là chuyên gia tài chính cá nhân thông minh, đang tư vấn cho người dùng với dữ liệu sau:

📊 TÀI CHÍNH THÁNG ${now.getMonth()+1}/${now.getFullYear()}
Hôm nay ngày ${dayOfMonth}/${totalDays} | Còn ${daysLeft} ngày trong tháng

🏦 SỐ DƯ CÁC TÀI KHOẢN (số dư hiện tại):
${walletLines || '  Chưa có tài khoản'}
→ Tổng: ${formatMoneyShort(finance.totalBalance)}

📅 THU CHI THÁNG ${now.getMonth()+1}:
  ↑ Thu vào: ${formatMoneyShort(finance.monthIncome)}
  ↓ Chi ra: ${formatMoneyShort(finance.monthExpense)}
  = Dòng tiền ròng: ${netFlow >= 0 ? '+' : ''}${formatMoneyShort(netFlow)}
  Ø Chi bình quân/ngày: ${formatMoneyShort(avgDailyExpense)}/ngày (dự kiến cả tháng: ${formatMoneyShort(projectedMonthExpense)})

🏷️ DANH MỤC ĐÃ CHI THÁNG NÀY:
${categoryLines || '  Chưa có giao dịch'}`
}

const { streamText: aiInsightText, loading: isAiLoading, askFinance } = useAi()
const aiQuestion = ref('')
const showAiPanel = ref(false)
const isSavingNote = ref(false)
const noteSaved = ref(false)

async function askAiAdvisor() {
  const q = aiQuestion.value.trim()
  if (!q || isAiLoading.value) return
  aiQuestion.value = ''
  showAiPanel.value = true
  noteSaved.value = false

  const context = buildFinanceContext()

  // Build a self-contained prompt: finance context + user question in one block.
  // The backend 'finance' action has its own system prompt as a finance expert.
  // We do NOT label context as "Note content" — that misleads the model.
  const fullPrompt = `${context}

---
CÂU HỎI CỦA NGƯỜI DÙNG: ${q}

Hãy trả lời dựa trên dữ liệu tài chính ở trên. Ngắn gọn, thực tế, dùng emoji và Markdown.`

  await askFinance(fullPrompt)
}

async function saveAiInsightAsNote() {
  if (!aiInsightText.value || isSavingNote.value) return
  isSavingNote.value = true
  try {
    const now = new Date()
    const title = `📊 Kế hoạch tài chính - ${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`
    const content = `# ${title}

${aiInsightText.value}

---
*Tạo tự động bởi AI Finance Advisor*
*Ngày: ${now.toLocaleDateString('vi-VN')}*`
    await notesStore.createNote({
      title,
      content,
      tags: ['tài-chính', 'ai-insight'],
      pinned: false
    })
    noteSaved.value = true
  } catch (e) {
    console.error('Failed to save note', e)
  } finally {
    isSavingNote.value = false
  }
}

// ── Collapse state ──
const isSmartSectionCollapsed = ref(false)

// ── Rich AI markdown renderer ──
function renderAiMarkdown(text: string): string {
  let html = text

  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Status badges: lines containing verdict keywords
  html = html.replace(/\u2705\s*(.+)/g, '<span class="ai-badge ai-badge-ok">✅ $1</span>')
  html = html.replace(/\u26a0\ufe0f\s*(.+)/g, '<span class="ai-badge ai-badge-warn">⚠️ $1</span>')
  html = html.replace(/\u274c\s*(.+)/g, '<span class="ai-badge ai-badge-err">❌ $1</span>')

  // Section headings: **text** at line start or standalone
  html = html.replace(/^\*\*(.+?)\*\*\s*$/gm, '<div class="ai-section-title">$1</div>')

  // Inline bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="ai-bold">$1</strong>')

  // Highlight money amounts (e.g. 12tr, 12,000,000đ, 12.000đ)
  html = html.replace(/(\d+[,.]?\d*\s*(?:tr|triệu|k|đồng|d|đ)\b)/gi, '<span class="ai-amount">$1</span>')

  // Bullet points
  html = html.replace(/^[\-\*•]\s+(.+)/gm, '<div class="ai-bullet"><span class="ai-bullet-dot">‣</span><span>$1</span></div>')

  // Numbered lists
  html = html.replace(/^(\d+)\.\ (.+)/gm, '<div class="ai-numbered"><span class="ai-num">$1</span><span>$2</span></div>')

  // Emoji-prefixed lines as info cards
  html = html.replace(/^([\u{1F300}-\u{1FFFF}\u2600-\u27FF]\ufe0f?\s+.+)/gmu, '<div class="ai-info-line">$1</div>')

  // Line breaks
  html = html.replace(/\n\n+/g, '<div class="ai-spacer"></div>')
  html = html.replace(/\n/g, '<br>')

  return html
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

    <!-- AI Finance Advisor (collapsed bar) -->
    <div v-if="isSmartSectionCollapsed" class="mb-6 card-premium p-4 flex items-center justify-between cursor-pointer group hover:bg-bg-elevated transition-colors" @click="isSmartSectionCollapsed = false">
      <div class="flex items-center gap-6 divide-x divide-border-subtle flex-1 overflow-x-auto no-scrollbar">
        <!-- Balance summary -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="bg-blue-500/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Bot :size="16" class="text-blue-400" />
          </div>
          <div>
            <div class="text-[0.6875rem] text-text-tertiary font-medium">AI Finance Advisor</div>
            <div class="text-sm font-bold text-text-primary">{{ formatMoneyShort(finance.totalBalance) }} · {{ finance.wallets.length }} tài khoản</div>
          </div>
        </div>
        <!-- Net flow summary -->
        <div class="flex items-center gap-3 pl-6 shrink-0 hidden sm:flex">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="finance.monthIncome >= finance.monthExpense ? 'bg-success/10' : 'bg-error/10'">
            <Sparkles :size="16" :class="finance.monthIncome >= finance.monthExpense ? 'text-success' : 'text-error'" />
          </div>
          <div>
            <div class="text-[0.6875rem] text-text-tertiary font-medium">Dòng tiền tháng này</div>
            <div class="text-sm font-bold" :class="finance.monthIncome >= finance.monthExpense ? 'text-success' : 'text-error'">
              {{ finance.monthIncome >= finance.monthExpense ? '+' : '' }}{{ formatMoneyShort(finance.monthIncome - finance.monthExpense) }}
            </div>
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
            <div class="bg-blue-500/10 flex h-7 w-7 items-center justify-center rounded-lg">
              <Bot :size="14" class="text-blue-400" />
            </div>
            AI Finance Advisor
          </h3>
          <span class="text-[0.625rem] text-text-disabled bg-bg-elevated px-2 py-0.5 rounded-full">{{ new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) }}</span>
        </div>




        <!-- Ask AI question input -->
        <div class="relative mb-4">
          <input
            v-model="aiQuestion"
            type="text"
            placeholder="VD: Tôi muốn mua laptop 20tr tháng này, có nên chi không?"
            class="w-full bg-bg-elevated border border-border-subtle rounded-2xl pl-4 pr-24 py-3 text-[0.875rem] text-text-primary focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 outline-none transition-all placeholder:text-text-disabled"
            @keyup.enter="askAiAdvisor"
            :disabled="isAiLoading"
          />
          <button
            class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] font-semibold transition-all"
            :class="aiQuestion.trim() && !isAiLoading
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
              : 'text-text-disabled bg-transparent'"
            :disabled="!aiQuestion.trim() || isAiLoading"
            @click="askAiAdvisor"
          >
            <div v-if="isAiLoading" class="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <Bot v-else :size="13" />
            {{ isAiLoading ? 'Đang phân tích...' : 'Hỏi AI' }}
          </button>
        </div>

        <!-- AI Response Panel -->
        <div v-if="showAiPanel">
          <!-- Header bar -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-[0.6875rem] font-semibold text-blue-400 flex items-center gap-1.5">
              <Bot :size="12" /> AI Finance Advisor
            </span>
            <button class="text-text-disabled hover:text-error p-1 rounded hover:bg-error/10 transition-colors" @click="showAiPanel = false">
              <X :size="12" />
            </button>
          </div>

          <!-- Skeleton loading -->
          <div v-if="isAiLoading && !aiInsightText" class="space-y-2 mb-3">
            <div class="skeleton h-3 w-full rounded-lg" />
            <div class="skeleton h-3 w-5/6 rounded-lg" />
            <div class="skeleton h-3 w-full rounded-lg" />
            <div class="skeleton h-3 w-3/4 rounded-lg" />
            <div class="skeleton h-3 w-4/5 rounded-lg" />
          </div>

          <!-- AI response rich render -->
          <div
            v-if="aiInsightText"
            class="ai-rich-response bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-3 max-h-72 overflow-y-auto"
            v-html="renderAiMarkdown(aiInsightText)"
          />

          <!-- Save to Notes button -->
          <div v-if="aiInsightText && !isAiLoading" class="flex items-center gap-2">
            <button
              v-if="!noteSaved"
              class="flex items-center gap-1.5 text-[0.75rem] font-medium px-3 py-1.5 rounded-lg transition-all border"
              :class="isSavingNote
                ? 'text-text-disabled border-border-subtle'
                : 'text-accent border-accent/30 hover:bg-accent/10'"
              :disabled="isSavingNote"
              @click="saveAiInsightAsNote"
            >
              <div v-if="isSavingNote" class="h-3 w-3 border border-accent border-t-transparent rounded-full animate-spin" />
              <BookmarkPlus v-else :size="13" />
              {{ isSavingNote ? 'Đang lưu...' : 'Lưu vào Notes' }}
            </button>
            <span v-else class="flex items-center gap-1.5 text-[0.75rem] text-success font-medium">
              <CheckCircle2 :size="13" /> Đã lưu vào Notes
            </span>
            <button
              class="ml-auto text-[0.625rem] text-text-disabled hover:text-accent flex items-center gap-0.5 px-2 py-1 rounded hover:bg-accent/10 transition-colors"
              @click="showAiPanel = false; aiQuestion = ''"
            >
              <Zap :size="10" /> Hỏi tiếp
            </button>
          </div>
        </div>

        <!-- Empty state hint -->
        <div v-if="!showAiPanel" class="flex items-center gap-2 text-text-disabled text-[0.75rem]">
          <Bot :size="14" class="text-blue-400/60 shrink-0" />
          <span>Nhập kế hoạch chi tiêu của bạn → AI sẽ tư vấn dựa trên số dư thực tế</span>
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
            <span class="h-[3px] w-3 rounded-full bg-violet-400"></span>
            <span class="text-text-tertiary text-[0.6875rem]">{{ t('dashboard.income') }}</span>
            <span class="text-violet-400 text-[0.8125rem] font-bold tabular-nums">
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

<style scoped>
.ai-rich-response {
  font-size: 0.8125rem;
  line-height: 1.65;
  color: var(--color-text-secondary, #a3a3a3);
}
.ai-rich-response :deep(.ai-section-title) {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-text-primary, #f5f5f5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0.75rem 0 0.3rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(99,102,241,0.15);
}
.ai-rich-response :deep(.ai-badge) {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0.25rem 0;
}
.ai-rich-response :deep(.ai-badge-ok)   { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
.ai-rich-response :deep(.ai-badge-warn) { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.ai-rich-response :deep(.ai-badge-err)  { background: rgba(239,68,68,0.12);  color: #ef4444; border: 1px solid rgba(239,68,68,0.25);  }
.ai-rich-response :deep(.ai-amount) {
  color: var(--color-accent, #6366f1);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ai-rich-response :deep(.ai-bold) { color: var(--color-text-primary, #f5f5f5); font-weight: 600; }
.ai-rich-response :deep(.ai-bullet) {
  display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.2rem 0;
}
.ai-rich-response :deep(.ai-bullet-dot) {
  color: var(--color-accent, #6366f1); font-size: 1rem; line-height: 1.4; flex-shrink: 0;
}
.ai-rich-response :deep(.ai-numbered) {
  display: flex; align-items: flex-start; gap: 0.6rem; margin: 0.25rem 0;
}
.ai-rich-response :deep(.ai-num) {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.25rem; height: 1.25rem; border-radius: 50%;
  background: rgba(99,102,241,0.15); color: var(--color-accent, #6366f1);
  font-size: 0.625rem; font-weight: 700; flex-shrink: 0; margin-top: 0.1rem;
}
.ai-rich-response :deep(.ai-info-line) {
  background: rgba(99,102,241,0.06);
  border-left: 2px solid rgba(99,102,241,0.3);
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 0.35rem 0.65rem; margin: 0.3rem 0;
}
.ai-rich-response :deep(.ai-spacer) { height: 0.5rem; }
</style>

