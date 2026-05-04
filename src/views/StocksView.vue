<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2, LineChart, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { useStockStore } from '@/stores/stock'
import { formatVNDShort } from '@/constants/finance'

const { t } = useI18n()
const stockStore = useStockStore()

const showAddModal = ref(false)
const newPosition = ref({ symbol: '', buyPrice: '', quantity: '', targetProfit: '', stopLoss: '' })

onMounted(() => {
  stockStore.fetchPositions()
})

const totalValue = computed(() => {
  return stockStore.positions.reduce((acc, pos) => {
    const currentPrice = stockStore.prices[pos.symbol] || pos.buyPrice
    return acc + (currentPrice * pos.quantity * 1000) // Assuming prices are in 1000 VND
  }, 0)
})

const totalProfit = computed(() => {
  return stockStore.positions.reduce((acc, pos) => {
    const currentPrice = stockStore.prices[pos.symbol] || pos.buyPrice
    return acc + ((currentPrice - pos.buyPrice) * pos.quantity * 1000)
  }, 0)
})

async function handleAdd() {
  if (!newPosition.value.symbol || !newPosition.value.buyPrice || !newPosition.value.quantity) return
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">{{ t('settings.stocks') }}</h1>
        <p class="text-text-tertiary text-sm mt-1">
          {{ t('nav.totalBalance') }}: <span class="text-accent font-semibold">{{ formatVNDShort(totalValue) }}</span>
          <span :class="totalProfit >= 0 ? 'text-success' : 'text-error'" class="ml-2 font-medium">
            ({{ totalProfit >= 0 ? '+' : '' }}{{ formatVNDShort(totalProfit) }})
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
        <button @click="removePos(pos.id)" class="absolute top-4 right-4 p-1.5 text-text-disabled hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 :size="16" />
        </button>
        <div class="flex items-center justify-between mb-4 pr-8">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold">
              {{ pos.symbol }}
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

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-bg-surface p-3 rounded-xl border border-border-default">
            <p class="text-xs text-text-disabled">{{ t('common.buyPrice') }}</p>
            <p class="font-medium text-sm mt-0.5">{{ pos.buyPrice }}</p>
          </div>
          <div class="bg-bg-surface p-3 rounded-xl border border-border-default text-right">
            <p class="text-xs text-text-disabled">{{ t('common.profit') }}</p>
            <template v-if="stockStore.prices[pos.symbol]">
              <p :class="(stockStore.prices[pos.symbol] - pos.buyPrice) >= 0 ? 'text-success' : 'text-error'" class="font-medium text-sm mt-0.5 flex items-center justify-end gap-1">
                <TrendingUp v-if="(stockStore.prices[pos.symbol] - pos.buyPrice) >= 0" :size="14" />
                <TrendingDown v-else :size="14" />
                {{ (((stockStore.prices[pos.symbol] - pos.buyPrice) / pos.buyPrice) * 100).toFixed(2) }}%
              </p>
            </template>
            <p v-else class="font-medium text-sm mt-0.5">---</p>
          </div>
        </div>

        <div v-if="pos.targetProfit || pos.stopLoss" class="flex gap-2 mt-auto pt-4 border-t border-border-subtle">
          <span v-if="pos.targetProfit" class="text-[10px] px-2 py-1 rounded-md bg-success/10 text-success font-medium">🎯 {{ pos.targetProfit }}%</span>
          <span v-if="pos.stopLoss" class="text-[10px] px-2 py-1 rounded-md bg-error/10 text-error font-medium">🛑 {{ pos.stopLoss }}%</span>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div class="card-premium w-full max-w-sm p-6 shadow-2xl">
        <h3 class="mb-5 text-lg font-bold">{{ t('common.add') }} {{ t('settings.stocks') }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium">{{ t('common.symbol') }}</label>
            <input v-model="newPosition.symbol" type="text" class="input-field" placeholder="FPT" uppercase />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium">{{ t('common.quantity') }}</label>
              <input v-model="newPosition.quantity" type="number" class="input-field" placeholder="1000" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium">{{ t('common.buyPrice') }} (x1000)</label>
              <input v-model="newPosition.buyPrice" type="number" step="0.1" class="input-field" placeholder="75.5" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium">Target (%)</label>
              <input v-model="newPosition.targetProfit" type="number" class="input-field" placeholder="15" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium">Stop Loss (%)</label>
              <input v-model="newPosition.stopLoss" type="number" class="input-field" placeholder="-7" />
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button @click="showAddModal = false" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button @click="handleAdd" class="btn-primary">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
