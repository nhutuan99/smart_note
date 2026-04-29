<script setup lang="ts">
import { computed } from 'vue'
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
  Plus
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

// Group transactions by date
const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {}
  props.transactions.forEach((tx) => {
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
              <th class="px-4 py-3 font-medium w-[45%]">Giao dịch</th>
              <th class="px-4 py-3 font-medium">Tài khoản</th>
              <th class="px-4 py-3 font-medium text-center">Nguồn</th>
              <th class="px-4 py-3 font-medium text-right">Số tiền</th>
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
                class="group hover:bg-bg-hover transition-colors duration-150"
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
                    
                    <div class="max-w-[14rem] sm:max-w-[20rem] truncate font-medium text-text-primary" :title="tx.note || t(`categories.${tx.category}`)">
                      {{ tx.note || t(`categories.${tx.category}`) }}
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
                    v-else-if="tx.source === 'casso'"
                    class="bg-accent/10 text-accent rounded px-2 py-1 text-[0.6875rem] font-medium"
                  >
                    Casso
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
                    @click="emit('delete', tx)"
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
</template>
