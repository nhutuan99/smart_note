<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ShoppingCart,
  Coffee,
  Zap,
  Banknote
} from 'lucide-vue-next'

const { t } = useI18n()

// ── Counter-up animation ──
const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const animatedBalance = ref(0)
const animatedIncome = ref(0)
const animatedExpense = ref(0)

const TARGET_BALANCE = 27500000
const TARGET_INCOME = 15200000
const TARGET_EXPENSE = 8300000

let observer: IntersectionObserver | null = null

function animateCounter(target: number, setter: (v: number) => void, duration = 1800) {
  const startTime = performance.now()
  const step = (now: number) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    setter(Math.round(target * eased))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function formatVND(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K'
  return value.toString()
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isVisible.value) {
        isVisible.value = true
        animateCounter(TARGET_BALANCE, (v) => (animatedBalance.value = v))
        animateCounter(TARGET_INCOME, (v) => (animatedIncome.value = v), 1500)
        animateCounter(TARGET_EXPENSE, (v) => (animatedExpense.value = v), 1500)
        observer?.disconnect()
      }
    },
    { threshold: 0.2 }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

// ── Demo wallet data ──
const wallets = [
  { name: 'TPBank', pct: 45, color: '#7B2FBE' },
  { name: 'MoMo', pct: 30, color: '#D82D8B' },
  { name: 'Cash', pct: 25, color: '#10b981' }
]

// ── Demo transactions ──
const transactions = [
  { cat: 'salary', icon: 'salary', type: 'income', amount: 12000000, wallet: 'TPBank', time: '2h' },
  { cat: 'food', icon: 'food', type: 'expense', amount: 85000, wallet: 'MoMo', time: '4h' },
  {
    cat: 'shopping',
    icon: 'shopping',
    type: 'expense',
    amount: 450000,
    wallet: 'TPBank',
    time: '6h'
  },
  {
    cat: 'electricity',
    icon: 'electricity',
    type: 'expense',
    amount: 320000,
    wallet: 'Cash',
    time: '1d'
  }
]

function getCatIcon(icon: string) {
  switch (icon) {
    case 'salary':
      return Banknote
    case 'food':
      return Coffee
    case 'shopping':
      return ShoppingCart
    case 'electricity':
      return Zap
    default:
      return Wallet
  }
}

function getCatColor(icon: string) {
  switch (icon) {
    case 'salary':
      return '#10b981'
    case 'food':
      return '#f59e0b'
    case 'shopping':
      return '#ec4899'
    case 'electricity':
      return '#3b82f6'
    default:
      return '#7c6ff7'
  }
}
</script>

<template>
  <section
    ref="sectionRef"
    class="relative overflow-hidden px-4 py-28 sm:px-6"
  >
    <!-- Background glow -->
    <div
      class="bg-accent/10 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[60vw] max-h-[700px] w-[60vw] max-w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
    ></div>

    <div class="mx-auto max-w-7xl">
      <!-- Section header -->
      <div class="reveal-on-scroll mb-16 text-center">
        <h2
          class="mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text pb-2 text-4xl font-extrabold text-transparent md:text-5xl lg:text-6xl"
        >
          {{ t('landing.showcase.title') }}
        </h2>
        <p class="mx-auto max-w-2xl text-xl text-gray-400">
          {{ t('landing.showcase.subtitle') }}
        </p>
      </div>

      <!-- Dashboard mock grid -->
      <div class="mx-auto max-w-6xl">
        <!-- Row 1: Overview cards -->
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Balance card -->
          <div
            :class="[
              'relative overflow-hidden rounded-2xl border p-5 transition-all duration-700',
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            ]"
            style="
              border-color: rgba(124, 111, 247, 0.3);
              background: linear-gradient(
                135deg,
                rgba(124, 111, 247, 0.08) 0%,
                rgba(15, 15, 25, 0.9) 100%
              );
              box-shadow: 0 4px 24px rgba(124, 111, 247, 0.08);
            "
          >
            <div
              class="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full blur-3xl"
              style="background: rgba(124, 111, 247, 0.15)"
            ></div>
            <div class="relative z-10 mb-3 flex items-center gap-2">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style="background: rgba(124, 111, 247, 0.15)"
              >
                <Wallet
                  :size="18"
                  class="text-[#7c6ff7]"
                />
              </div>
              <span class="text-sm text-gray-400">{{ t('landing.showcase.balance') }}</span>
            </div>
            <div class="relative z-10 text-3xl font-bold tracking-tight text-white">
              {{ formatVND(animatedBalance) }}đ
            </div>
          </div>

          <!-- Income card -->
          <div
            :class="[
              'relative overflow-hidden rounded-2xl border border-white/10 p-5 transition-all delay-100 duration-700',
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            ]"
            style="background: rgba(15, 15, 25, 0.8)"
          >
            <div class="mb-3 flex items-center gap-2">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10"
              >
                <TrendingUp
                  :size="18"
                  class="text-emerald-400"
                />
              </div>
              <span class="text-sm text-gray-400">{{ t('landing.showcase.income') }}</span>
            </div>
            <div class="text-2xl font-bold tracking-tight text-emerald-400">
              +{{ formatVND(animatedIncome) }}đ
            </div>
          </div>

          <!-- Expense card -->
          <div
            :class="[
              'relative overflow-hidden rounded-2xl border border-white/10 p-5 transition-all delay-200 duration-700',
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            ]"
            style="background: rgba(15, 15, 25, 0.8)"
          >
            <div class="mb-3 flex items-center gap-2">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10"
              >
                <TrendingDown
                  :size="18"
                  class="text-red-400"
                />
              </div>
              <span class="text-sm text-gray-400">{{ t('landing.showcase.expense') }}</span>
            </div>
            <div class="text-2xl font-bold tracking-tight text-red-400">
              -{{ formatVND(animatedExpense) }}đ
            </div>
          </div>
        </div>

        <!-- Row 2: Chart + Wallet breakdown -->
        <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- SVG Animated Line Chart -->
          <div
            :class="[
              'rounded-2xl border border-white/10 p-5 transition-all delay-300 duration-700',
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            ]"
            style="background: rgba(15, 15, 25, 0.8)"
          >
            <div class="mb-1 flex items-center gap-2">
              <BarChart3
                :size="16"
                class="text-gray-500"
              />
              <h3 class="text-sm font-semibold text-white">
                {{ t('landing.showcase.weeklyChart') }}
              </h3>
            </div>
            <!-- Legend -->
            <div class="mb-3 flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <span class="h-[3px] w-3 rounded-full bg-violet-400"></span>
                <span class="text-[11px] text-gray-500">{{ t('landing.showcase.income') }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="h-[3px] w-3 rounded-full bg-red-400"></span>
                <span class="text-[11px] text-gray-500">{{ t('landing.showcase.expense') }}</span>
              </div>
            </div>
            <!-- SVG Chart -->
            <div class="relative h-[180px] w-full">
              <svg
                viewBox="0 0 400 160"
                class="h-full w-full"
                preserveAspectRatio="none"
              >
                <!-- Grid lines -->
                <line
                  v-for="i in 4"
                  :key="'grid-' + i"
                  x1="0"
                  :y1="i * 35"
                  x2="400"
                  :y2="i * 35"
                  stroke="rgba(255,255,255,0.04)"
                  stroke-width="1"
                />
                <!-- Income line (gradient fill) -->
                <defs>
                  <linearGradient
                    id="incomeGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stop-color="rgba(124,111,247,0.25)"
                    />
                    <stop
                      offset="100%"
                      stop-color="rgba(124,111,247,0)"
                    />
                  </linearGradient>
                  <linearGradient
                    id="expenseGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stop-color="rgba(239,68,68,0.15)"
                    />
                    <stop
                      offset="100%"
                      stop-color="rgba(239,68,68,0)"
                    />
                  </linearGradient>
                </defs>
                <!-- Income area fill -->
                <path
                  d="M0,100 C30,85 60,60 100,55 C140,50 180,70 200,45 C220,20 260,30 300,15 C340,5 370,20 400,10 L400,160 L0,160 Z"
                  fill="url(#incomeGrad)"
                  :class="['chart-fill', isVisible ? 'chart-fill-visible' : '']"
                />
                <!-- Income line -->
                <path
                  d="M0,100 C30,85 60,60 100,55 C140,50 180,70 200,45 C220,20 260,30 300,15 C340,5 370,20 400,10"
                  fill="none"
                  stroke="#7c6ff7"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  :class="['chart-line', isVisible ? 'chart-line-visible' : '']"
                />
                <!-- Expense area fill -->
                <path
                  d="M0,120 C30,115 60,105 100,110 C140,115 180,95 200,100 C220,105 260,90 300,95 C340,100 370,85 400,90 L400,160 L0,160 Z"
                  fill="url(#expenseGrad)"
                  :class="['chart-fill', isVisible ? 'chart-fill-visible' : '']"
                />
                <!-- Expense line -->
                <path
                  d="M0,120 C30,115 60,105 100,110 C140,115 180,95 200,100 C220,105 260,90 300,95 C340,100 370,85 400,90"
                  fill="none"
                  stroke="#ef4444"
                  stroke-width="2"
                  stroke-linecap="round"
                  :class="['chart-line chart-line-delay', isVisible ? 'chart-line-visible' : '']"
                />
                <!-- Glow dot on income peak -->
                <circle
                  cx="300"
                  cy="15"
                  r="4"
                  fill="#7c6ff7"
                  :class="['chart-dot', isVisible ? 'chart-dot-visible' : '']"
                />
                <circle
                  cx="300"
                  cy="15"
                  r="8"
                  fill="rgba(124,111,247,0.3)"
                  :class="['chart-dot-glow', isVisible ? 'chart-dot-visible' : '']"
                />
              </svg>
              <!-- X-axis labels -->
              <div class="absolute right-0 bottom-0 left-0 flex justify-between px-1">
                <span
                  v-for="day in ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']"
                  :key="day"
                  class="text-[10px] font-medium text-gray-600"
                >
                  {{ day }}
                </span>
              </div>
            </div>
          </div>

          <!-- Wallet Breakdown -->
          <div
            :class="[
              'rounded-2xl border border-white/10 p-5 transition-all delay-[400ms] duration-700',
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            ]"
            style="background: rgba(15, 15, 25, 0.8)"
          >
            <h3 class="mb-5 text-sm font-semibold text-white">
              {{ t('landing.showcase.walletBreakdown') }}
            </h3>
            <div class="space-y-4">
              <div
                v-for="(w, idx) in wallets"
                :key="w.name"
              >
                <div class="mb-2 flex items-center gap-3">
                  <!-- Wallet icon -->
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                    :style="{ backgroundColor: w.color }"
                  >
                    {{ w.name.substring(0, 2).toUpperCase() }}
                  </div>
                  <span class="flex-1 text-sm font-medium text-gray-300">{{ w.name }}</span>
                  <span class="text-sm font-bold text-white tabular-nums">{{ w.pct }}%</span>
                </div>
                <!-- Progress bar -->
                <div class="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    class="h-full rounded-full transition-all ease-out"
                    :style="{
                      width: isVisible ? w.pct + '%' : '0%',
                      backgroundColor: w.color,
                      transitionDuration: 1000 + idx * 300 + 'ms',
                      transitionDelay: 500 + idx * 150 + 'ms'
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 3: Recent transactions -->
        <div
          :class="[
            'overflow-hidden rounded-2xl border border-white/10 transition-all delay-500 duration-700',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          ]"
          style="background: rgba(15, 15, 25, 0.8)"
        >
          <div class="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
            <h3 class="text-sm font-semibold text-white">{{ t('landing.showcase.recentTx') }}</h3>
          </div>
          <div class="divide-y divide-white/5">
            <div
              v-for="(tx, i) in transactions"
              :key="i"
              class="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              :class="{ 'translate-y-4 opacity-0': !isVisible }"
              :style="
                isVisible
                  ? {
                      opacity: 1,
                      transform: 'translateY(0)',
                      transition: `all 0.5s ease ${600 + i * 100}ms`
                    }
                  : {}
              "
            >
              <!-- Category icon -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                :style="{ backgroundColor: getCatColor(tx.icon) + '18' }"
              >
                <component
                  :is="getCatIcon(tx.icon)"
                  :size="18"
                  :style="{ color: getCatColor(tx.icon) }"
                />
              </div>
              <!-- Info -->
              <div class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-white">
                  {{ t('landing.showcase.tx.' + tx.cat) }}
                </span>
                <div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span>{{ tx.wallet }}</span>
                  <span class="opacity-40">·</span>
                  <span>{{ tx.time }} {{ t('landing.showcase.ago') }}</span>
                </div>
              </div>
              <!-- Amount -->
              <div
                class="flex items-center gap-0.5 text-sm font-bold whitespace-nowrap tabular-nums"
                :class="tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'"
              >
                <ArrowUpRight
                  v-if="tx.type === 'income'"
                  :size="14"
                />
                <ArrowDownRight
                  v-else
                  :size="14"
                />
                {{ tx.type === 'income' ? '+' : '-' }}{{ formatVND(tx.amount) }}đ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── SVG Chart animations ── */
.chart-line {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  transition: stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1);
}
.chart-line-delay {
  transition-delay: 0.3s;
}
.chart-line-visible {
  stroke-dashoffset: 0;
}

.chart-fill {
  opacity: 0;
  transition: opacity 1.2s ease 0.8s;
}
.chart-fill-visible {
  opacity: 1;
}

.chart-dot,
.chart-dot-glow {
  opacity: 0;
  transition: opacity 0.5s ease 1.8s;
}
.chart-dot-visible {
  opacity: 1;
}
.chart-dot-glow {
  animation: dot-pulse 2s ease-in-out infinite 2s;
}

@keyframes dot-pulse {
  0%,
  100% {
    r: 8;
    opacity: 0.3;
  }
  50% {
    r: 14;
    opacity: 0;
  }
}
</style>
