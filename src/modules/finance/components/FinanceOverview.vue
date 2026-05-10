<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Wallet, TrendingUp, TrendingDown, Plus, Eye, EyeOff, ChevronLeft, ChevronRight, LineChart, Landmark } from 'lucide-vue-next'
import { useFinancePolling } from '@/composables/useFinancePolling'
import { usePortfolioSummary } from '@/composables/usePortfolioSummary'
import { useUiStore } from '@/stores/ui'
import { formatVND, formatVNDShort } from '@/constants/finance'
import WeatherWidget from '@/components/WeatherWidget.vue'

const { t, tm } = useI18n()
const router = useRouter()
const finance = useFinancePolling()
const ui = useUiStore()
const portfolio = usePortfolioSummary()
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? t('dashboard.greetingMorning') : h < 18 ? t('dashboard.greetingAfternoon') : t('dashboard.greetingEvening')
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

function prevMonth() {
  const [y, m] = finance.selectedMonth.split('-').map(Number)
  let newM = m - 1
  let newY = y
  if (newM < 1) {
    newM = 12
    newY--
  }
  finance.selectedMonth = `${newY}-${String(newM).padStart(2, '0')}`
}

function nextMonth() {
  const [y, m] = finance.selectedMonth.split('-').map(Number)
  let newM = m + 1
  let newY = y
  if (newM > 12) {
    newM = 1
    newY++
  }
  finance.selectedMonth = `${newY}-${String(newM).padStart(2, '0')}`
}

const isCurrentMonth = computed(() => {
  const d = new Date()
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return finance.selectedMonth === currentMonthStr
})

</script>
<template>
    <!-- Weather Widget (Acts as Hero) -->
    <div class="relative mb-6">
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
    </div>

    <!-- Month Selector -->
    <div class="mb-5 flex items-center justify-center gap-2">
      <button
        @click="prevMonth"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
      >
        <ChevronLeft :size="18" />
      </button>
      <span class="text-sm font-bold text-text-primary min-w-[10rem] text-center">
        {{ monthLabel }}
      </span>
      <button
        @click="nextMonth"
        :disabled="isCurrentMonth"
        class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        :class="isCurrentMonth ? 'text-text-disabled cursor-not-allowed' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Balance + Income/Expense Cards -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Total Balance -->
      <div class="card-premium p-5 sm:col-span-1 border-accent/40 bg-accent/5 shadow-md shadow-accent/10 relative overflow-hidden">
        <!-- Decorative subtle glow -->
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="mb-3 flex items-center gap-2 relative z-10">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg" style="background: rgba(124, 111, 247, 0.12);">
            <Wallet
              :size="18"
              class="text-accent"
            />
          </div>
          <span class="text-text-tertiary text-sm">{{ t('dashboard.totalBalance') }}</span>
          <button 
            @click="ui.toggleHideBalances()" 
            class="ml-auto text-text-tertiary hover:text-accent flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-bg-hover"
            :title="t('dashboard.toggleBalance')"
          >
            <EyeOff v-if="ui.hideBalances" :size="16" />
            <Eye v-else :size="16" />
          </button>
        </div>
        <div v-if="finance.loading" class="skeleton h-8 w-40 mt-1 relative z-10"></div>
        <div v-else class="relative z-10">
          <!-- Primary: Net Worth when investments exist -->
          <template v-if="portfolio.hasInvestments.value">
            <div class="text-3xl font-bold tracking-tight text-text-primary">
              {{ ui.hideBalances ? '••••••' : formatVND(portfolio.totalNetWorth.value) }}
            </div>
            <div class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              <!-- Wallet balance breakdown -->
              <span class="text-[11px] text-text-disabled flex items-center gap-1">
                <Wallet :size="10" /> {{ ui.hideBalances ? '•••' : formatVNDShort(finance.totalBalance) }}
              </span>
              <!-- Stock P&L -->
              <span v-if="portfolio.hasStocks.value" class="text-[11px] flex items-center gap-1"
                :class="portfolio.stockProfit.value >= 0 ? 'text-success' : 'text-error'">
                <LineChart :size="10" />
                {{ portfolio.stockProfit.value >= 0 ? '+' : '' }}{{ ui.hideBalances ? '•••' : formatVNDShort(portfolio.stockProfit.value) }}
              </span>
              <!-- Fund P&L -->
              <span v-if="portfolio.hasFunds.value" class="text-[11px] flex items-center gap-1"
                :class="portfolio.fundProfit.value >= 0 ? 'text-success' : 'text-error'">
                <Landmark :size="10" />
                {{ portfolio.fundProfit.value >= 0 ? '+' : '' }}{{ ui.hideBalances ? '•••' : formatVNDShort(portfolio.fundProfit.value) }}
              </span>
            </div>
          </template>
          <!-- Fallback: just wallet balance (no investments) -->
          <div v-else class="text-3xl font-bold tracking-tight text-text-primary">
            {{ ui.hideBalances ? '••••••' : formatVND(finance.totalBalance) }}
          </div>
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
        <div v-else :class="finance.monthIncome > 0 ? 'text-success' : 'text-text-primary'" class="text-2xl font-bold tracking-tight">
          {{ finance.monthIncome > 0 ? '+' : '' }}{{ formatVND(finance.monthIncome) }}
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
        <div v-else :class="finance.monthExpense > 0 ? 'text-error' : 'text-text-primary'" class="text-2xl font-bold tracking-tight">
          {{ finance.monthExpense > 0 ? '-' : '' }}{{ formatVND(finance.monthExpense) }}
        </div>
      </div>
    </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 4s linear infinite;
}
</style>
