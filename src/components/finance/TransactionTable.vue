<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Transaction } from '@/types'
import { formatVND, getCategoryConfig } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
import { useFinancePolling } from '@/composables/useFinancePolling'
import {
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-vue-next'

const props = defineProps<{
  transactions: Transaction[]
  loading?: boolean
}>()

const emit = defineEmits<{
  delete: [tx: Transaction]
  add: []
}>()

const { t, tm } = useI18n()
const finance = useFinancePolling()

const selectedTx = ref<Transaction | null>(null)
const currentPage = ref(1)
const pageSize = 15

// Format precise time for modal
function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

// Reset pagination when data changes
watch(() => props.transactions, () => {
  currentPage.value = 1
}, { deep: true })

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return props.transactions.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(props.transactions.length / pageSize))

const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 || 
      i === totalPages.value || 
      (i >= currentPage.value - 1 && i <= currentPage.value + 1)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
})

// Group paginated transactions by date
const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {}
  paginatedTransactions.value.forEach((tx) => {
    if (!groups[tx.date]) groups[tx.date] = []
    groups[tx.date].push(tx)
  })
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
})

function formatDateGroup(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().substring(0, 10)) return t('common.today')
  if (dateStr === yesterday.toISOString().substring(0, 10)) return t('common.yesterday')

  const days = tm('days.long') as string[]
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function dayTotal(txs: Transaction[]) {
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, net: income - expense }
}
</script>

<template>
  <!-- Loading State -->
  <template v-if="loading">
    <div class="space-y-4">
      <div v-for="i in 2" :key="'grp-' + i">
        <div class="mb-2 flex items-center justify-between px-1">
          <div class="skeleton h-4 w-24"></div>
          <div class="skeleton h-4 w-16"></div>
        </div>
        <div class="bg-bg-surface border-border-default divide-border-subtle divide-y overflow-hidden rounded-xl border">
          <div v-for="j in 3" :key="'item-' + j" class="flex items-center gap-3 px-4 py-3">
            <div class="skeleton h-10 w-10 rounded-xl"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 w-3/4"></div>
              <div class="skeleton h-3 w-1/2"></div>
            </div>
            <div class="skeleton h-5 w-16"></div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Table View -->
  <template v-else-if="groupedTransactions.length">
    <div class="bg-bg-surface border-border-default overflow-hidden rounded-xl border">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-bg-subtle border-border-subtle border-b text-xs uppercase text-text-tertiary">
            <tr>
              <th class="px-4 py-3 font-medium w-[45%]">{{ t('transactions.tableTransaction') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('transactions.tableWallet') }}</th>
              <th class="px-4 py-3 font-medium text-center">{{ t('transactions.tableSource') }}</th>
              <th class="px-4 py-3 font-medium text-right">{{ t('transactions.tableAmount') }}</th>
              <th class="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          
          <template v-for="[date, txs] in groupedTransactions" :key="date">
            <tbody class="divide-border-subtle divide-y">
              <!-- Date Header Row -->
              <tr class="bg-bg-active/40">
                <td colspan="5" class="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  <div class="flex items-center justify-between">
                    <span>{{ formatDateGroup(date) }}</span>
                    <span :class="dayTotal(txs).net >= 0 ? 'text-success' : 'text-error'">
                      {{ dayTotal(txs).net >= 0 ? '+' : '' }}{{ formatVND(dayTotal(txs).net) }}
                    </span>
                  </div>
                </td>
              </tr>
              
              <!-- Transaction Rows -->
              <tr
                v-for="tx in txs"
                :key="tx.id"
                class="group hover:bg-bg-hover transition-colors duration-150 cursor-pointer"
                @click="selectedTx = tx"
              >
                <!-- Giao dịch (Icon + Note) -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-border-default/30"
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
                    
                    <div class="group/tooltip relative flex-1 min-w-0">
                      <div class="max-w-[14rem] sm:max-w-[20rem] truncate font-medium text-text-primary">
                        {{ tx.note || t(`categories.${tx.category}`) }}
                      </div>
                      
                      <!-- Custom Tooltip (PC only) -->
                      <div class="pointer-events-none absolute left-0 bottom-full mb-1 z-50 hidden w-max max-w-[300px] opacity-0 transition-all duration-200 group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-1 md:block shadow-2xl">
                        <div class="rounded-lg border border-border-default bg-bg-surface/95 backdrop-blur-xl px-3 py-2 text-sm text-text-primary shadow-xl ring-1 ring-black/5 whitespace-normal break-words">
                          {{ tx.note || t(`categories.${tx.category}`) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Tài khoản -->
                <td class="px-4 py-3 text-text-secondary">
                  {{ finance.getWalletName(tx.walletId) }}
                </td>

                <!-- Nguồn -->
                <td class="px-4 py-3 text-center">
                  <span
                    v-if="tx.source === 'telegram'"
                    class="bg-info/10 text-info rounded px-2 py-1 text-[0.6875rem] font-medium"
                  >
                    Telegram
                  </span>
                  <span
                    v-else-if="tx.source === 'sms'"
                    class="bg-success/10 text-success rounded px-2 py-1 text-[0.6875rem] font-medium"
                  >
                    SMS
                  </span>
                  <span
                    v-else-if="tx.source === 'notification'"
                    class="bg-warning/10 text-warning rounded px-2 py-1 text-[0.6875rem] font-medium"
                  >
                    Auto
                  </span>
                  <span v-else class="text-text-disabled text-xs">-</span>
                </td>

                <!-- Số tiền -->
                <td class="px-4 py-3 text-right">
                  <div
                    class="flex items-center justify-end gap-1 font-semibold"
                    :class="tx.type === 'income' ? 'text-success' : 'text-error'"
                  >
                    <ArrowUpRight v-if="tx.type === 'income'" :size="14" />
                    <ArrowDownRight v-else :size="14" />
                    {{ formatVND(tx.amount) }}
                  </div>
                </td>

                <!-- Hành động -->
                <td class="px-4 py-3 w-12 text-right">
                  <button
                    class="text-text-tertiary hover:text-error hover:bg-bg-active inline-flex rounded p-1.5 opacity-100 md:opacity-0 transition-all duration-150 md:group-hover:opacity-100"
                    @click.stop="emit('delete', tx)"
                    title="Xóa giao dịch"
                  >
                    <Trash2 :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 bg-bg-surface border-t border-border-default">
        <div class="text-xs text-text-secondary">
          {{ t('transactions.pagination', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, transactions.length), total: transactions.length }) }}
        </div>
        <div class="flex items-center gap-1">
          <button 
            class="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft :size="16" />
          </button>
          
          <template v-for="(page, idx) in displayedPages" :key="idx">
            <span v-if="page === '...'" class="px-2 text-text-tertiary">...</span>
            <button 
              v-else
              class="min-w-[28px] h-7 px-2 text-xs font-medium rounded-md transition-colors"
              :class="currentPage === page ? 'bg-accent text-white hover:bg-accent-strong' : 'text-text-secondary hover:bg-bg-hover'"
              @click="currentPage = page as number"
            >
              {{ page }}
            </button>
          </template>

          <button 
            class="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </template>

  <!-- Empty State -->
  <template v-else>
    <div class="flex flex-col items-center py-16 text-center">
      <Calendar :size="48" class="text-text-disabled mb-4" />
      <h3 class="mb-2 text-lg font-semibold">{{ t('transactions.empty') }}</h3>
      <p class="text-text-tertiary mb-6 text-sm">{{ t('transactions.emptyHint') }}</p>
      <button @click="emit('add')" class="btn-secondary">
        <Plus :size="16" />
        {{ t('transactions.addTransaction') }}
      </button>
    </div>
  </template>
  <!-- Transaction Detail Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="selectedTx" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="selectedTx = null"></div>
        
        <div class="bg-bg-surface border-border-default relative w-full max-w-[24rem] rounded-2xl border p-6 shadow-xl flex flex-col gap-5">
          <!-- Header -->
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-border-default/30 shadow-sm"
                :style="{ backgroundColor: getWalletBrand(finance.getWalletName(selectedTx.walletId))?.logoUrl ? '#fff' : getCategoryConfig(selectedTx.category).color + '15' }"
              >
                <img
                  v-if="getWalletBrand(finance.getWalletName(selectedTx.walletId))?.logoUrl"
                  :src="getWalletBrand(finance.getWalletName(selectedTx.walletId))!.logoUrl"
                  :alt="finance.getWalletName(selectedTx.walletId)"
                  class="h-8 w-8 object-contain"
                />
                <span v-else class="text-2xl">{{ getCategoryConfig(selectedTx.category).icon }}</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-text-primary">{{ t(`categories.${selectedTx.category}`) }}</h3>
                <p class="text-xs text-text-tertiary">{{ formatDateTime(selectedTx.createdAt || selectedTx.date) }}</p>
              </div>
            </div>
            <button @click="selectedTx = null" class="text-text-tertiary hover:bg-bg-hover hover:text-text-primary p-1.5 rounded-lg transition-colors">
              <X :size="20" />
            </button>
          </div>

          <!-- Amount -->
          <div class="bg-bg-elevated border-border-default rounded-xl border p-4 flex flex-col items-center justify-center gap-1">
            <div class="text-xs font-medium uppercase text-text-secondary">{{ selectedTx.type === 'income' ? t('transactions.filterIncome') : t('transactions.filterExpense') }}</div>
            <div
              class="text-2xl font-bold flex items-center gap-1"
              :class="selectedTx.type === 'income' ? 'text-success' : 'text-error'"
            >
              <ArrowUpRight v-if="selectedTx.type === 'income'" :size="20" />
              <ArrowDownRight v-else :size="20" />
              {{ formatVND(selectedTx.amount) }}
            </div>
          </div>

          <!-- Details List -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-start border-b border-border-subtle pb-3">
              <span class="text-sm text-text-secondary min-w-[5rem]">{{ t('transactions.tableWallet') }}</span>
              <span class="text-sm font-medium text-text-primary text-right">{{ finance.getWalletName(selectedTx.walletId) }}</span>
            </div>
            
            <div class="flex justify-between items-start border-b border-border-subtle pb-3">
              <span class="text-sm text-text-secondary min-w-[5rem]">{{ t('transactions.tableSource') }}</span>
              <span class="text-sm font-medium text-text-primary text-right uppercase">
                <span
                  class="px-2 py-0.5 rounded text-[0.6875rem] font-bold"
                  :class="{
                    'bg-info/10 text-info': selectedTx.source === 'telegram',
                    'bg-warning/10 text-warning': selectedTx.source === 'notification',
                    'bg-bg-hover text-text-secondary': !['telegram','sms','notification'].includes(selectedTx.source)
                  }"
                >{{ selectedTx.source || 'Manual' }}</span>
              </span>
            </div>

            <div class="flex flex-col gap-1.5">
              <span class="text-sm text-text-secondary">{{ t('addTx.note') }}</span>
              <div class="bg-bg-active/30 rounded-lg p-3 border border-border-subtle max-h-[150px] overflow-y-auto">
                <p class="text-sm text-text-primary leading-relaxed break-words whitespace-pre-wrap">{{ selectedTx.note || t(`categories.${selectedTx.category}`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
