<script setup lang="ts">
// 1. Vue core
import { computed, ref } from 'vue'
// 2. Vue ecosystem
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
// 3. Composables / Stores
import { useFinancePolling } from '@/composables/useFinancePolling'
import { usePortfolioSummary } from '@/composables/usePortfolioSummary'
import { useUiStore } from '@/stores/ui'
import { useTradingStore } from '@/stores/trading'
// 4. Utils
import { formatVNDShort } from '@/constants/finance'
// 5. Components & icons
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  AlertCircle,
  Bell
} from 'lucide-vue-next'
import WeatherWidget from '@/components/WeatherWidget.vue'
import TradingCheckinModal from './TradingCheckinModal.vue'
import TradingReminderModal from './TradingReminderModal.vue'

const { t, tm } = useI18n()
const router = useRouter()
const finance = useFinancePolling()
const ui = useUiStore()
const portfolio = usePortfolioSummary()
const trading = useTradingStore()

// Trading check-in modal (manual trigger from widget)
const showCheckinModal = ref(false)
// Trading reminder time modal
const showReminderModal = ref(false)


// ── Month navigation ──

const monthLabel = computed(() => {
  const [y, m] = finance.selectedMonth.split('-')
  const months = tm('months') as string[]
  return `${months[parseInt(m) - 1]}, ${y}`
})

function prevMonth() {
  const [y, m] = finance.selectedMonth.split('-').map(Number)
  let newM = m - 1
  let newY = y
  if (newM < 1) { newM = 12; newY-- }
  finance.selectedMonth = `${newY}-${String(newM).padStart(2, '0')}`
}

function nextMonth() {
  const [y, m] = finance.selectedMonth.split('-').map(Number)
  let newM = m + 1
  let newY = y
  if (newM > 12) { newM = 1; newY++ }
  finance.selectedMonth = `${newY}-${String(newM).padStart(2, '0')}`
}

const isCurrentMonth = computed(() => {
  const d = new Date()
  return finance.selectedMonth === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

/** The big number: Net Worth when investments exist, wallet balance otherwise */
const primaryBalance = computed(() =>
  portfolio.hasInvestments.value ? portfolio.totalNetWorth.value : finance.totalBalance
)
</script>

<template>
  <!-- ── Weather hero ── -->
  <div class="relative mb-6">
    <WeatherWidget>
      <template #actions>
        <button @click="router.push('/transactions/add')" class="btn-primary">
          <Plus :size="16" />
          <span class="hidden sm:inline">{{ t('dashboard.addTransaction') }}</span>
        </button>
      </template>
    </WeatherWidget>
  </div>

  <!-- ── Month selector ── -->
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

  <!-- ── Overview cards grid ── -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

    <!-- ★ Total Balance / Net Worth ── -->
    <div
      class="relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-0 sm:col-span-1"
      style="border-color: color-mix(in srgb, var(--accent) 30%, transparent); background: color-mix(in srgb, var(--accent) 4%, var(--bg-surface)); box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 8%, transparent);"
    >
      <!-- glow decor -->
      <div
        class="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
        style="background: color-mix(in srgb, var(--accent) 18%, transparent);"
      />

      <!-- Label row -->
      <div class="relative z-10 mb-3 flex items-center gap-2">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
          style="background: color-mix(in srgb, var(--accent) 12%, transparent);"
        >
          <Wallet :size="18" class="text-accent" />
        </div>
        <span class="text-text-tertiary text-sm">
          {{ portfolio.hasInvestments.value ? t('dashboard.totalAssets') : t('dashboard.totalBalance') }}
        </span>
        <button
          @click="ui.toggleHideBalances()"
          class="ml-auto text-text-tertiary hover:text-accent flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-bg-hover"
          :title="t('dashboard.toggleBalance')"
        >
          <EyeOff v-if="ui.hideBalances" :size="16" />
          <Eye v-else :size="16" />
        </button>
      </div>

      <!-- Primary balance number -->
      <div v-if="finance.loading" class="skeleton h-9 w-44 mt-1 relative z-10" />
      <div v-else class="relative z-10 text-3xl font-bold tracking-tight text-text-primary leading-none">
        {{ ui.hideBalances ? '••••••' : formatVNDShort(primaryBalance) }}
      </div>

      <!-- Breakdown rows (only when investments exist) -->
      <template v-if="portfolio.hasInvestments.value && !finance.loading">
        <div class="relative z-10 mt-3 space-y-1.5 border-t pt-3" style="border-color: color-mix(in srgb, var(--border-subtle) 80%, transparent);">

          <!-- Wallet row -->
          <div class="flex items-center gap-2">
            <Wallet :size="12" class="text-text-disabled shrink-0" />
            <span class="flex-1 text-xs text-text-disabled">{{ t('dashboard.walletBalance') }}</span>
            <span class="text-xs tabular-nums text-text-secondary font-medium">
              {{ ui.hideBalances ? '•••' : formatVNDShort(finance.totalBalance) }}
            </span>
          </div>

          <!-- Stocks P&L -->
          <div v-if="portfolio.hasStocks.value" class="flex items-center gap-2">
            <LineChart
              :size="12"
              class="shrink-0"
              :class="portfolio.stockProfit.value >= 0 ? 'text-success' : 'text-error'"
            />
            <span class="flex-1 text-xs text-text-disabled">{{ t('dashboard.stocksLabel') }}</span>
            <span
              class="text-xs tabular-nums font-bold flex items-center gap-0.5"
              :class="portfolio.stockProfit.value >= 0 ? 'text-success' : 'text-error'"
            >
              <component
                :is="portfolio.stockProfit.value >= 0 ? ArrowUpRight : ArrowDownRight"
                :size="11"
              />
              {{ ui.hideBalances ? '•••' : formatVNDShort(Math.abs(portfolio.stockProfit.value)) }}
            </span>
          </div>

          <!-- Funds P&L -->
          <div v-if="portfolio.hasFunds.value" class="flex items-center gap-2">
            <Landmark
              :size="12"
              class="shrink-0"
              :class="portfolio.fundProfit.value >= 0 ? 'text-success' : 'text-error'"
            />
            <span class="flex-1 text-xs text-text-disabled">{{ t('dashboard.fundsLabel') }}</span>
            <span
              class="text-xs tabular-nums font-bold flex items-center gap-0.5"
              :class="portfolio.fundProfit.value >= 0 ? 'text-success' : 'text-error'"
            >
              <component
                :is="portfolio.fundProfit.value >= 0 ? ArrowUpRight : ArrowDownRight"
                :size="11"
              />
              {{ ui.hideBalances ? '•••' : formatVNDShort(Math.abs(portfolio.fundProfit.value)) }}
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Monthly Income ── -->
    <div class="relative overflow-hidden rounded-2xl border border-border-default bg-bg-surface p-5 flex flex-col gap-0">
      <div class="mb-3 flex items-center gap-2">
        <div class="bg-success/10 flex h-9 w-9 items-center justify-center rounded-lg shrink-0">
          <TrendingUp :size="18" class="text-success" />
        </div>
        <span class="text-text-tertiary text-sm">{{ t('dashboard.monthIncome') }}</span>
      </div>
      <div v-if="finance.loading" class="skeleton h-8 w-32 mt-1" />
      <div
        v-else
        class="text-2xl font-bold tracking-tight"
        :class="finance.monthIncome > 0 ? 'text-success' : 'text-text-primary'"
      >
        {{ finance.monthIncome > 0 ? '+' : '' }}{{ formatVNDShort(finance.monthIncome) }}
      </div>
      <!-- Net savings hint -->
      <div
        v-if="!finance.loading && finance.monthNet !== 0"
        class="mt-2 flex items-center gap-1 text-[11px]"
        :class="finance.monthNet >= 0 ? 'text-success' : 'text-error'"
      >
        <component :is="finance.monthNet >= 0 ? ArrowUpRight : ArrowDownRight" :size="12" />
        <span>{{ t('dashboard.monthlySavings') }} {{ formatVNDShort(Math.abs(finance.monthNet)) }}</span>
      </div>
    </div>

    <!-- Monthly Expense ── -->
    <div class="relative overflow-hidden rounded-2xl border border-border-default bg-bg-surface p-5 flex flex-col gap-0">
      <div class="mb-3 flex items-center gap-2">
        <div class="bg-error/10 flex h-9 w-9 items-center justify-center rounded-lg shrink-0">
          <TrendingDown :size="18" class="text-error" />
        </div>
        <span class="text-text-tertiary text-sm">{{ t('dashboard.monthExpense') }}</span>
      </div>
      <div v-if="finance.loading" class="skeleton h-8 w-32 mt-1" />
      <div
        v-else
        class="text-2xl font-bold tracking-tight"
        :class="finance.monthExpense > 0 ? 'text-error' : 'text-text-primary'"
      >
        {{ finance.monthExpense > 0 ? '-' : '' }}{{ formatVNDShort(finance.monthExpense) }}
      </div>
      <!-- Expense rate -->
      <div
        v-if="!finance.loading && finance.monthIncome > 0 && finance.monthExpense > 0"
        class="mt-2 text-[11px] text-text-disabled"
      >
        {{ Math.round((finance.monthExpense / finance.monthIncome) * 100) }}{{ t('dashboard.incomePercent') }}
      </div>
    </div>

    <!-- ── Trading Journal Widget ── -->
    <div class="relative overflow-hidden rounded-2xl border border-border-default bg-bg-surface p-5 sm:col-span-3">
      <!-- Subtle glow when checked in -->
      <div
        v-if="trading.hasDoneCheckinToday && trading.todayCheckin"
        class="pointer-events-none absolute inset-0 opacity-[0.04]"
        :class="trading.todayCheckin.totalPnl >= 0 ? 'bg-success' : 'bg-error'"
      />

      <!-- Header row -->
      <div class="flex items-center gap-2 mb-3">
        <div class="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg shrink-0">
          <BookOpen :size="16" class="text-accent" />
        </div>
        <span class="text-text-tertiary text-xs font-medium flex-1">{{ t('trading.widgetTitle') }}</span>

        <!-- Reminder time badge (when active) -->
        <button
          v-if="trading.reminderTime"
          @click="showReminderModal = true"
          class="flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 px-2 py-1 rounded-full hover:bg-accent/20 transition-colors"
          :title="t('trading.reminderActive', { time: trading.reminderTime })"
        >
          <Bell :size="10" />
          {{ trading.reminderTime }}
        </button>

        <!-- Set reminder button (when not active) -->
        <button
          v-else
          @click="showReminderModal = true"
          class="flex items-center gap-1 text-[10px] font-medium text-text-disabled hover:text-accent transition-colors px-1.5 py-1 rounded-lg hover:bg-accent/5"
          :title="t('trading.reminderOff')"
        >
          <Bell :size="11" />
          {{ t('trading.reminderSetBtn') }}
        </button>

        <button
          @click="showCheckinModal = true"
          class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          :class="trading.hasDoneCheckinToday
            ? 'text-text-tertiary hover:bg-bg-hover border border-border-default'
            : 'bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20'"
        >
          {{ trading.hasDoneCheckinToday ? t('trading.viewEdit') : t('trading.checkinCta') }}
        </button>
      </div>

      <!-- Not checked in -->
      <div v-if="!trading.hasDoneCheckinToday" class="flex items-center gap-2">
        <AlertCircle :size="13" class="text-warning shrink-0" />
        <span class="text-xs text-text-tertiary">{{ t('trading.notCheckedIn') }}</span>
      </div>

      <!-- Today's result -->
      <template v-else-if="trading.todayCheckin">
        <div class="flex items-end gap-3">
          <!-- Big P&L number -->
          <div
            class="text-2xl font-bold tracking-tight tabular-nums flex items-center gap-1.5 leading-none"
            :class="trading.todayCheckin.totalPnl >= 0 ? 'text-success' : 'text-error'"
          >
            <TrendingUp v-if="trading.todayCheckin.totalPnl >= 0" :size="20" />
            <TrendingDown v-else :size="20" />
            {{ trading.todayCheckin.totalPnl >= 0 ? '+' : '' }}{{ formatVNDShort(trading.todayCheckin.totalPnl) }}
          </div>
          <!-- Win rate pill -->
          <span class="mb-0.5 text-[11px] text-text-disabled">WR {{ trading.winRate }}%</span>
        </div>

        <!-- Per-wallet mini rows -->
        <div class="mt-2.5 space-y-1.5">
          <div
            v-for="e in trading.todayCheckin.entries"
            :key="e.walletId"
            class="flex items-center gap-2"
          >
            <div class="h-1.5 flex-1 rounded-full bg-bg-elevated overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="e.pnlAmount >= 0 ? 'bg-success/60' : 'bg-error/60'"
                :style="{
                  width: trading.todayCheckin!.totalPnl !== 0
                    ? `${Math.min(100, Math.abs(e.pnlAmount / trading.todayCheckin!.totalPnl) * 100)}%`
                    : '0%'
                }"
              />
            </div>
            <span class="text-[10px] text-text-disabled w-24 text-right truncate">{{ e.walletName }}</span>
            <span
              class="text-[10px] font-semibold tabular-nums w-16 text-right"
              :class="e.pnlAmount >= 0 ? 'text-success' : 'text-error'"
            >
              {{ e.pnlAmount >= 0 ? '+' : '' }}{{ formatVNDShort(e.pnlAmount) }}
            </span>
          </div>
        </div>
      </template>
    </div>


  </div>

  <!-- Trading Check-in Modal (manual trigger) -->
  <TradingCheckinModal v-model="showCheckinModal" />
  <!-- Trading Reminder Modal -->
  <TradingReminderModal v-model="showReminderModal" />
</template>
