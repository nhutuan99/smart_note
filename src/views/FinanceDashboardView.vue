<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinancePolling } from '@/composables/useFinancePolling'
import { useAuthStore } from '@/stores/auth'
import { formatVND, formatVNDShort, getCategoryConfig } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
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
  EyeOff
} from 'lucide-vue-next'
import WeatherWidget from '@/components/WeatherWidget.vue'

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

const maxDailyAmount = computed(() => {
  let max = 0
  finance.weeklyStats.forEach((s) => {
    max = Math.max(max, s.income, s.expense)
  })
  return max || 1
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
</script>

<template>
  <div class="max-w-[75rem]">
    <!-- Weather Widget -->
    <WeatherWidget />

    <!-- Hero -->
    <div
      class="card-premium relative mb-6 flex flex-col gap-4 overflow-hidden p-5 md:flex-row md:items-start md:justify-between md:p-8"
    >
      <div class="relative z-10">
        <div class="mb-2 flex items-center gap-2">
          <Sparkles
            :size="20"
            class="text-accent"
          />
          <span class="text-accent text-sm font-medium">{{ greeting }}</span>
        </div>
        <h1 class="mb-1 text-2xl font-bold tracking-tight md:text-3xl">
          {{ auth.user?.name || 'User' }}
        </h1>
        <p class="text-text-tertiary text-sm">{{ monthLabel }}</p>
      </div>
      <button
        @click="router.push('/transactions/add')"
        class="btn-primary relative z-10 self-start"
      >
        <Plus :size="18" />
        {{ t('dashboard.addTransaction') }}
      </button>
    </div>

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
      <!-- Weekly Chart -->
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <div class="mb-4 flex items-center gap-2">
          <BarChart3
            :size="18"
            class="text-text-tertiary"
          />
          <h3 class="text-sm font-semibold">{{ t('dashboard.weeklyChart') }}</h3>
        </div>
        <div class="flex h-[9.375rem] items-end gap-2">
          <div
            v-for="day in finance.weeklyStats"
            :key="day.date"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div
              class="flex w-full items-end justify-center gap-0.5"
              style="height: 7.5rem"
            >
              <!-- Income bar -->
              <div
                class="bg-success/60 w-2.5 rounded-t transition-all duration-300"
                :style="{
                  height: (day.income / maxDailyAmount) * 100 + '%',
                  minHeight: day.income ? '0.25rem' : '0'
                }"
              ></div>
              <!-- Expense bar -->
              <div
                class="bg-error/60 w-2.5 rounded-t transition-all duration-300"
                :style="{
                  height: (day.expense / maxDailyAmount) * 100 + '%',
                  minHeight: day.expense ? '0.25rem' : '0'
                }"
              ></div>
            </div>
            <span class="text-text-disabled text-[0.625rem]">
              {{ dayLabel(day.date) }}
            </span>
          </div>
        </div>
        <div class="border-border-subtle mt-3 flex items-center justify-center gap-4 border-t pt-3">
          <span class="text-text-tertiary flex items-center gap-1 text-[0.6875rem]">
            <span class="bg-success/60 h-2 w-2 rounded-full"></span>
            {{ t('dashboard.income') }}
          </span>
          <span class="text-text-tertiary flex items-center gap-1 text-[0.6875rem]">
            <span class="bg-error/60 h-2 w-2 rounded-full"></span>
            {{ t('dashboard.expense') }}
          </span>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-bg-surface border-border-default rounded-xl border p-5">
        <h3 class="mb-4 text-sm font-semibold">{{ t('dashboard.categoryBreakdown') }}</h3>

        <div
          v-if="finance.expenseByCategoryThisMonth.length"
          class="space-y-3"
        >
          <div
            v-for="cat in finance.expenseByCategoryThisMonth.slice(0, 6)"
            :key="cat.category"
          >
            <div class="mb-1 flex items-center justify-between">
              <span class="flex items-center gap-2 text-sm">
                <span>{{ cat.icon }}</span>
                <span class="text-text-secondary">
                  {{ t(`categories.${cat.category}`) }}
                </span>
              </span>
              <span class="text-sm font-medium">
                {{ formatVNDShort(cat.total) }}
              </span>
            </div>
            <div class="bg-bg-elevated h-1.5 overflow-hidden rounded-full">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: cat.percentage + '%',
                  backgroundColor: cat.color
                }"
              ></div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-text-disabled flex h-[9.375rem] items-center justify-center text-sm"
        >
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
          <div class="text-xl">
            {{ getCategoryConfig(tx.category).icon }}
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
