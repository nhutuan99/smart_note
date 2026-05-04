<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2, LineChart, TrendingUp, TrendingDown, Bell, BellRing, RotateCcw, X } from 'lucide-vue-next'
import { useStockStore } from '@/stores/stock'
import { useUiStore } from '@/stores/ui'
import { formatVNDShort } from '@/constants/finance'
import type { StockPosition, StockAlert } from '@/types'

// Chart.js
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const { t } = useI18n()
const stockStore = useStockStore()
const ui = useUiStore()

const showAddModal = ref(false)
const newPosition = ref({ symbol: '', buyPrice: '', quantity: '', targetProfit: '', stopLoss: '' })

// Alert modal state
const showAlertModal = ref(false)
const alertTargetStock = ref<StockPosition | null>(null)
const alertForm = ref({ targetPrice: '', direction: 'below' as 'above' | 'below', label: '' })

onMounted(() => {
  stockStore.fetchPositions()
  stockStore.startPolling()
})

onUnmounted(() => {
  stockStore.stopPolling()
})

const totalValue = computed(() => {
  return stockStore.positions.reduce((acc, pos) => {
    const currentPrice = stockStore.prices[pos.symbol] || pos.buyPrice
    return acc + (currentPrice * pos.quantity * 1000)
  }, 0)
})

const totalProfit = computed(() => {
  return stockStore.positions.reduce((acc, pos) => {
    const currentPrice = stockStore.prices[pos.symbol] || pos.buyPrice
    return acc + ((currentPrice - pos.buyPrice) * pos.quantity * 1000)
  }, 0)
})

async function handleAdd() {
  if (!newPosition.value.symbol || !newPosition.value.buyPrice || !newPosition.value.quantity) {
    ui.showToast('error', t('common.fillRequiredFields'))
    return
  }
  await stockStore.addPosition({
    symbol: newPosition.value.symbol.toUpperCase(),
    buyPrice: Number(newPosition.value.buyPrice),
    quantity: Number(newPosition.value.quantity),
    targetProfit: newPosition.value.targetProfit ? Number(newPosition.value.targetProfit) : undefined,
    stopLoss: newPosition.value.stopLoss ? Number(newPosition.value.stopLoss) : undefined
  })
  showAddModal.value = false
  newPosition.value = { symbol: '', buyPrice: '', quantity: '', targetProfit: '', stopLoss: '' }
}

async function removePos(id: string) {
  if (confirm(t('common.confirmDelete'))) {
    await stockStore.deletePosition(id)
  }
}

// ── Alert Functions ──
function openAlertModal(pos: StockPosition) {
  alertTargetStock.value = pos
  alertForm.value = { targetPrice: '', direction: 'below', label: '' }
  showAlertModal.value = true
}

async function handleAddAlert() {
  if (!alertTargetStock.value || !alertForm.value.targetPrice) {
    ui.showToast('error', t('common.fillRequiredFields'))
    return
  }
  try {
    await stockStore.addAlert(alertTargetStock.value.id, {
      targetPrice: Number(alertForm.value.targetPrice),
      direction: alertForm.value.direction,
      label: alertForm.value.label || undefined
    })
    showAlertModal.value = false
    ui.showToast('success', t('stockAlert.added'))
  } catch (e) {
    // httpClient handles toast
  }
}

async function handleDeleteAlert(stockId: string, alertId: string) {
  try {
    await stockStore.deleteAlert(stockId, alertId)
  } catch (e) {}
}

async function handleResetAlert(stockId: string, alertId: string) {
  try {
    await stockStore.resetAlert(stockId, alertId)
    ui.showToast('success', t('stockAlert.resetDone'))
  } catch (e) {}
}

// ── Price bar helpers ──
function getPriceRange(pos: StockPosition) {
  const alerts = pos.alerts || []
  const currentPrice = stockStore.prices[pos.symbol] || pos.buyPrice
  const allPrices = [pos.buyPrice, currentPrice, ...alerts.map(a => a.targetPrice)]
  const min = Math.min(...allPrices) * 0.95
  const max = Math.max(...allPrices) * 1.05
  return { min, max, range: max - min }
}

function priceToPercent(price: number, min: number, range: number) {
  if (range === 0) return 50
  return Math.max(0, Math.min(100, ((price - min) / range) * 100))
}

// ── Sparkline config ──
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 } as any,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { 
    legend: { display: false }, 
    tooltip: { 
      enabled: true,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#fff',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(124, 111, 247, 0.2)',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context: any) => {
          const ds = context.dataset
          const pt = ds.customData?.[context.dataIndex]
          if (!pt) return `Giá: ${context.raw}`
          return [
            `Mở cửa: ${pt.open}`,
            `Cao nhất: ${pt.high}`,
            `Thấp nhất: ${pt.low}`,
            `Kết phiên: ${pt.price}`,
            `KL: ${pt.volume ? pt.volume.toLocaleString() : '0'}`
          ]
        }
      }
    } 
  },
  scales: {
    x: { display: false },
    y: { display: false }
  }
}))

function getChartData(symbol: string) {
  const history = stockStore.histories[symbol]
  if (!history || history.length === 0) return { labels: [], datasets: [] }
  
  const prices = history.map(h => h.price)
  const isUp = prices[prices.length - 1] >= prices[0]
  const color = isUp ? '#34d399' : '#fb7185'
  
  return {
    labels: history.map(h => new Date(h.time).toLocaleDateString()),
    datasets: [{
      data: prices,
      customData: history,
      borderColor: color,
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return color + '1a'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, color + '33')
        gradient.addColorStop(1, color + '00')
        return gradient
      },
      borderWidth: 2.5,
      pointRadius: 1.5,
      pointBackgroundColor: color,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color,
      pointHoverBorderWidth: 2,
      pointHoverRadius: 6,
      tension: 0.35,
      fill: true
    }]
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">{{ t('settings.stocks') }}</h1>
        <p class="text-text-tertiary text-sm mt-1">
          {{ t('nav.totalBalance') }}: <span class="text-accent font-semibold">{{ formatVNDShort(totalValue) }}</span>
          <span :class="totalProfit > 0 ? 'text-success' : (totalProfit < 0 ? 'text-error' : 'text-text-primary')" class="ml-2 font-medium">
            ({{ totalProfit > 0 ? '+' : '' }}{{ formatVNDShort(totalProfit) }})
          </span>
        </p>
      </div>
      <button @click="showAddModal = true" class="btn-primary">
        <Plus :size="18" /> {{ t('common.add') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="stockStore.loading" class="text-center py-10">
      <div class="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="stockStore.positions.length === 0" class="card-premium p-8 text-center flex flex-col items-center">
      <div class="h-12 w-12 rounded-full bg-accent-subtle flex items-center justify-center text-accent mb-3">
        <LineChart :size="24" />
      </div>
      <p class="text-text-secondary font-medium">{{ t('common.noData') }}</p>
    </div>

    <!-- Portfolio Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="pos in stockStore.positions" :key="pos.id" class="card-premium p-5 flex flex-col relative group">
        <!-- Action buttons -->
        <div class="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openAlertModal(pos)" class="p-1.5 text-text-disabled hover:text-warning hover:bg-warning/10 rounded-lg transition-colors" :title="t('stockAlert.addAlert')">
            <Bell :size="16" />
          </button>
          <button @click="removePos(pos.id)" class="p-1.5 text-text-disabled hover:text-error hover:bg-error/10 rounded-lg transition-colors">
            <Trash2 :size="16" />
          </button>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between mb-4 pr-16">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-xs relative overflow-hidden border border-accent/20">
              <span class="absolute z-0">{{ pos.symbol }}</span>
              <img :src="`https://image.simplize.vn/logo/${pos.symbol.toLowerCase()}.jpeg`" :alt="pos.symbol" class="w-full h-full object-cover relative z-10 bg-white" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
            </div>
            <div>
              <p class="font-semibold text-lg">{{ pos.symbol }}</p>
              <p class="text-xs text-text-tertiary">{{ pos.quantity }} {{ t('common.shares') }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-text-tertiary">{{ t('common.currentPrice') }}</p>
            <p class="font-semibold text-lg">{{ stockStore.prices[pos.symbol] || '---' }}</p>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-bg-surface p-3 rounded-xl border border-border-default">
            <p class="text-xs text-text-disabled">{{ t('common.buyPrice') }}</p>
            <p class="font-medium text-sm mt-0.5">{{ pos.buyPrice }}</p>
          </div>
          <div class="bg-bg-surface p-3 rounded-xl border border-border-default text-right">
            <p class="text-xs text-text-disabled">{{ t('common.profit') }}</p>
            <template v-if="stockStore.prices[pos.symbol]">
              <p :class="(stockStore.prices[pos.symbol] - pos.buyPrice) > 0 ? 'text-success' : ((stockStore.prices[pos.symbol] - pos.buyPrice) < 0 ? 'text-error' : 'text-text-primary')" class="font-medium text-sm mt-0.5 flex items-center justify-end gap-1">
                <TrendingUp v-if="(stockStore.prices[pos.symbol] - pos.buyPrice) > 0" :size="14" />
                <TrendingDown v-else-if="(stockStore.prices[pos.symbol] - pos.buyPrice) < 0" :size="14" />
                <span v-else class="w-[14px] inline-block"></span>
                {{ (((stockStore.prices[pos.symbol] - pos.buyPrice) / pos.buyPrice) * 100).toFixed(2) }}%
              </p>
            </template>
            <p v-else class="font-medium text-sm mt-0.5">---</p>
          </div>
        </div>

        <!-- 7-Day Chart -->
        <div v-if="stockStore.histories[pos.symbol] && stockStore.histories[pos.symbol].length > 0" class="h-16 mb-4 -mx-2">
          <Line :data="getChartData(pos.symbol)" :options="chartOptions" />
        </div>

        <!-- Price Bar — Visual Price Markers -->
        <div v-if="pos.alerts && pos.alerts.length > 0 && stockStore.prices[pos.symbol]" class="mb-4">
          <div class="relative h-6 bg-bg-surface rounded-full border border-border-default overflow-visible">
            <!-- Buy price marker -->
            <div 
              class="absolute top-0 h-full w-0.5 bg-accent/50"
              :style="{ left: priceToPercent(pos.buyPrice, getPriceRange(pos).min, getPriceRange(pos).range) + '%' }"
              :title="'Giá mua: ' + pos.buyPrice"
            ></div>
            <!-- Current price marker -->
            <div 
              class="absolute top-[-2px] h-[calc(100%+4px)] w-1.5 bg-accent rounded-full shadow-sm shadow-accent/40 z-10"
              :style="{ left: 'calc(' + priceToPercent(stockStore.prices[pos.symbol], getPriceRange(pos).min, getPriceRange(pos).range) + '% - 3px)' }"
              :title="'Giá hiện tại: ' + stockStore.prices[pos.symbol]"
            ></div>
            <!-- Alert markers -->
            <div 
              v-for="alert in pos.alerts" :key="alert.id"
              class="absolute top-0 h-full w-0.5 z-5"
              :class="alert.triggered ? 'bg-text-disabled' : (alert.direction === 'below' ? 'bg-success' : 'bg-error')"
              :style="{ left: priceToPercent(alert.targetPrice, getPriceRange(pos).min, getPriceRange(pos).range) + '%' }"
              :title="alert.label + ': ' + alert.targetPrice"
            >
              <!-- Dot -->
              <div 
                class="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full"
                :class="alert.triggered ? 'bg-text-disabled' : (alert.direction === 'below' ? 'bg-success' : 'bg-error')"
              ></div>
            </div>
          </div>
          <div class="flex justify-between text-[9px] text-text-disabled mt-0.5 px-0.5">
            <span>{{ getPriceRange(pos).min.toFixed(1) }}</span>
            <span>{{ getPriceRange(pos).max.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Alert Badges -->
        <div v-if="pos.alerts && pos.alerts.length > 0" class="flex flex-wrap gap-1.5 mb-3">
          <div 
            v-for="alert in pos.alerts" :key="alert.id"
            class="group/alert flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
            :class="alert.triggered 
              ? 'bg-bg-elevated text-text-disabled line-through' 
              : (alert.direction === 'below' ? 'bg-success/10 text-success' : 'bg-error/10 text-error')"
          >
            <BellRing v-if="alert.triggered" :size="10" />
            <Bell v-else :size="10" />
            <span>{{ alert.direction === 'below' ? '📉' : '📈' }} {{ alert.targetPrice }}</span>
            <!-- Alert actions -->
            <button 
              v-if="alert.triggered"
              @click.stop="handleResetAlert(pos.id, alert.id)" 
              class="ml-0.5 p-0.5 rounded hover:bg-bg-hover transition-colors"
              :title="t('stockAlert.reset')"
            >
              <RotateCcw :size="9" />
            </button>
            <button 
              @click.stop="handleDeleteAlert(pos.id, alert.id)" 
              class="ml-0.5 p-0.5 rounded hover:bg-error/20 hover:text-error transition-colors opacity-0 group-hover/alert:opacity-100"
              :title="t('stockAlert.delete')"
            >
              <X :size="9" />
            </button>
          </div>
        </div>

        <!-- Mobile: Add alert button (always visible) -->
        <button 
          @click="openAlertModal(pos)" 
          class="md:hidden flex items-center justify-center gap-1.5 text-xs text-warning bg-warning/10 hover:bg-warning/20 rounded-lg py-2 px-3 font-medium transition-colors mb-3"
        >
          <Bell :size="14" /> {{ t('stockAlert.addAlert') }}
        </button>

        <!-- Original target/stopLoss badges -->
        <div v-if="pos.targetProfit || pos.stopLoss" class="flex gap-2 mt-auto pt-4 border-t border-border-subtle">
          <span v-if="pos.targetProfit" class="text-[10px] px-2 py-1 rounded-md bg-success/10 text-success font-medium">{{ t('stockAlert.takeProfit') }}: {{ pos.targetProfit }}%</span>
          <span v-if="pos.stopLoss" class="text-[10px] px-2 py-1 rounded-md bg-error/10 text-error font-medium">{{ t('stockAlert.stopLoss') }}: {{ pos.stopLoss }}%</span>
        </div>
      </div>
    </div>

    <!-- ══════ Add Position Modal ══════ -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div class="card-premium w-full max-w-sm p-6 shadow-2xl relative overflow-hidden" @click.stop>
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-hover"></div>
          <h3 class="mb-5 text-lg font-bold">{{ t('common.add') }} {{ t('settings.stocks') }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('common.symbol') }}</label>
              <input v-model="newPosition.symbol" type="text" class="uppercase border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none" placeholder="FPT" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('common.quantity') }}</label>
                <input v-model="newPosition.quantity" type="number" class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none" placeholder="1000" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('common.buyPrice') }} (x1000)</label>
                <input v-model="newPosition.buyPrice" type="number" step="0.1" class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none" placeholder="75.5" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">Target (%)</label>
                <input v-model="newPosition.targetProfit" type="number" class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none" placeholder="15" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">Stop Loss (%)</label>
                <input v-model="newPosition.stopLoss" type="number" class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none" placeholder="-7" />
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-end gap-3">
            <button @click="showAddModal = false" class="btn-secondary w-full">{{ t('common.cancel') }}</button>
            <button @click="handleAdd" class="btn-primary w-full">{{ t('common.save') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══════ Add Alert Modal ══════ -->
    <transition name="fade">
      <div v-if="showAlertModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm" @click.self="showAlertModal = false">
        <div class="card-premium w-full max-w-sm shadow-2xl relative overflow-hidden" @click.stop>
          <!-- Header gradient -->
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning to-orange-400"></div>
          
          <div class="p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Bell :size="20" class="text-warning" />
              </div>
              <div>
                <h3 class="text-base font-bold">{{ t('stockAlert.addAlert') }}</h3>
                <p class="text-xs text-text-tertiary">{{ alertTargetStock?.symbol }} — {{ t('common.currentPrice') }}: <span class="text-accent font-semibold">{{ stockStore.prices[alertTargetStock?.symbol || ''] || '---' }}</span></p>
              </div>
            </div>

            <div class="space-y-4">
              <!-- Direction Toggle -->
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-text-secondary uppercase tracking-wider">{{ t('stockAlert.direction') }}</label>
                <div class="flex overflow-hidden rounded-xl border border-border-default">
                  <button 
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
                    :class="alertForm.direction === 'below' ? 'bg-success/10 text-success' : 'bg-bg-surface text-text-tertiary hover:bg-bg-hover'"
                    @click="alertForm.direction = 'below'"
                  >
                    📉 {{ t('stockAlert.buy') }}
                  </button>
                  <button 
                    class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
                    :class="alertForm.direction === 'above' ? 'bg-error/10 text-error' : 'bg-bg-surface text-text-tertiary hover:bg-bg-hover'"
                    @click="alertForm.direction = 'above'"
                  >
                    📈 {{ t('stockAlert.sell') }}
                  </button>
                </div>
              </div>

              <!-- Target Price -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('stockAlert.targetPrice') }}</label>
                <input 
                  v-model="alertForm.targetPrice" 
                  type="number" 
                  step="0.1"
                  class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all focus:ring-2 focus:outline-none" 
                  :placeholder="alertForm.direction === 'below' ? '16.9' : '42.5'" 
                />
              </div>

              <!-- Label -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-text-secondary">{{ t('stockAlert.label') }} <span class="text-text-disabled">({{ t('stockAlert.optional') }})</span></label>
                <input 
                  v-model="alertForm.label" 
                  type="text"
                  class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none" 
                  :placeholder="alertForm.direction === 'below' ? t('stockAlert.buyPlaceholder') : t('stockAlert.sellPlaceholder')" 
                />
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-6 flex gap-3">
              <button @click="showAlertModal = false" class="btn-secondary flex-1">{{ t('common.cancel') }}</button>
              <button @click="handleAddAlert" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-warning to-orange-400 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-warning/20 hover:shadow-warning/40 transition-all hover:-translate-y-0.5">
                <Bell :size="16" /> {{ t('stockAlert.addAlert') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
