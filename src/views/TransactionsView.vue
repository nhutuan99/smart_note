<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventListener } from '@/composables/useEventListener'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { formatVND, getCategoryConfig } from '@/constants/finance'
import type { Transaction } from '@/types'
import {
  Search,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  ChevronDown,
  Check,
  Wallet
} from 'lucide-vue-next'

const router = useRouter()
const finance = useFinanceStore()

onMounted(() => finance.fetchAll())

// Group transactions by date
const groupedTransactions = computed(() => {
  const groups: Record<string, Transaction[]> = {}
  finance.filteredTransactions.forEach((tx) => {
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

  if (dateStr === today.toISOString().substring(0, 10)) return 'Hôm nay'
  if (dateStr === yesterday.toISOString().substring(0, 10)) return 'Hôm qua'

  const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function dayTotal(txs: Transaction[]) {
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, net: income - expense }
}

function deleteTx(id: string) {
  finance.deleteTransaction(id)
}

// Custom wallet dropdown
const walletDropdownOpen = ref(false)
const walletDropdownRef = ref<HTMLElement | null>(null)

const selectedWallet = computed(() => {
  if (!finance.filter.walletId) return null
  return finance.wallets.find((w) => w.id === finance.filter.walletId) || null
})

function selectWallet(walletId: string | undefined) {
  finance.filter = { ...finance.filter, walletId }
  walletDropdownOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (walletDropdownRef.value && !walletDropdownRef.value.contains(e.target as Node)) {
    walletDropdownOpen.value = false
  }
}

// Auto-cleanup click-outside listener via composable
useEventListener(document, 'click', handleClickOutside)
</script>

<template>
  <div class="mx-auto max-w-[50rem]">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Giao dịch</h1>
        <p class="text-text-tertiary mt-1 text-sm">
          {{ finance.filteredTransactions.length }} giao dịch
        </p>
      </div>
      <button
        @click="router.push('/transactions/add')"
        class="btn-primary"
      >
        <Plus :size="16" />
        Thêm
      </button>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-2">
      <!-- Type filter -->
      <div class="border-border-default flex overflow-hidden rounded-lg border">
        <button
          v-for="f in [
            { key: 'all', label: 'Tất cả' },
            { key: 'expense', label: 'Chi' },
            { key: 'income', label: 'Thu' }
          ]"
          :key="f.key"
          class="bg-bg-surface border-border-default border-r px-3 py-1.5 text-sm transition-all duration-150 last:border-r-0"
          :class="
            (finance.filter.type || 'all') === f.key
              ? 'bg-accent-subtle text-accent'
              : 'text-text-secondary hover:bg-bg-hover'
          "
          @click="finance.filter = { ...finance.filter, type: f.key as any }"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Wallet filter (custom dropdown) -->
      <div ref="walletDropdownRef" class="relative">
        <button
          @click="walletDropdownOpen = !walletDropdownOpen"
          class="border-border-default bg-bg-surface hover:border-border-strong flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all duration-150"
          :class="walletDropdownOpen ? 'border-accent ring-accent-subtle ring-2' : ''"
        >
          <span v-if="selectedWallet" class="flex items-center gap-1.5">
            <span class="text-sm">{{ selectedWallet.icon }}</span>
            <span class="text-text-primary">{{ selectedWallet.name }}</span>
          </span>
          <span v-else class="text-text-secondary flex items-center gap-1.5">
            <Wallet :size="14" />
            <span>Tất cả ví</span>
          </span>
          <ChevronDown
            :size="14"
            class="text-text-tertiary ml-1 transition-transform duration-200"
            :class="walletDropdownOpen ? 'rotate-180' : ''"
          />
        </button>

        <!-- Dropdown panel -->
        <transition name="dropdown">
          <div
            v-if="walletDropdownOpen"
            class="bg-bg-surface border-border-default absolute top-full left-0 z-50 mt-1.5 min-w-[12rem] max-h-[16rem] overflow-y-auto overflow-x-hidden rounded-xl border shadow-lg"
          >
            <!-- All wallets option -->
            <button
              @click="selectWallet(undefined)"
              class="hover:bg-bg-hover flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-100"
              :class="!finance.filter.walletId ? 'bg-accent-subtle' : ''"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg"
                :class="!finance.filter.walletId ? 'bg-accent/15' : 'bg-bg-elevated'"
              >
                <Wallet :size="14" :class="!finance.filter.walletId ? 'text-accent' : 'text-text-tertiary'" />
              </span>
              <span :class="!finance.filter.walletId ? 'text-accent font-medium' : 'text-text-secondary'">Tất cả ví</span>
              <Check
                v-if="!finance.filter.walletId"
                :size="14"
                class="text-accent ml-auto"
              />
            </button>

            <!-- Divider -->
            <div class="border-border-subtle mx-2 border-t"></div>

            <!-- Wallet options -->
            <button
              v-for="w in finance.wallets"
              :key="w.id"
              @click="selectWallet(w.id)"
              class="hover:bg-bg-hover flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-100"
              :class="finance.filter.walletId === w.id ? 'bg-accent-subtle' : ''"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                :class="finance.filter.walletId === w.id ? 'bg-accent/15' : 'bg-bg-elevated'"
              >
                {{ w.icon }}
              </span>
              <span :class="finance.filter.walletId === w.id ? 'text-accent font-medium' : 'text-text-secondary'">{{ w.name }}</span>
              <Check
                v-if="finance.filter.walletId === w.id"
                :size="14"
                class="text-accent ml-auto"
              />
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Transaction Groups / Loading -->
    <template v-if="finance.loading">
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

    <template v-else-if="groupedTransactions.length">
      <div class="space-y-4">
      <div
        v-for="[date, txs] in groupedTransactions"
        :key="date"
      >
        <!-- Date Header -->
        <div class="mb-2 flex items-center justify-between px-1">
          <span class="text-text-secondary text-sm font-medium">
            {{ formatDateGroup(date) }}
          </span>
          <span
            class="text-sm font-medium"
            :class="dayTotal(txs).net >= 0 ? 'text-success' : 'text-error'"
          >
            {{ dayTotal(txs).net >= 0 ? '+' : '' }}{{ formatVND(dayTotal(txs).net) }}
          </span>
        </div>

        <!-- Transaction Items -->
        <div
          class="bg-bg-surface border-border-default divide-border-subtle divide-y overflow-hidden rounded-xl border"
        >
          <div
            v-for="tx in txs"
            :key="tx.id"
            class="group hover:bg-bg-hover flex items-center gap-3 px-4 py-3 transition-colors duration-150"
          >
            <!-- Icon -->
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              :style="{ backgroundColor: getCategoryConfig(tx.category).color + '15' }"
            >
              {{ getCategoryConfig(tx.category).icon }}
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">
                {{ tx.note || getCategoryConfig(tx.category).label }}
              </div>
              <div class="text-text-disabled flex items-center gap-2 text-[0.6875rem]">
                <span>{{ finance.getWalletName(tx.walletId) }}</span>
                <span
                  v-if="tx.source === 'telegram'"
                  class="bg-info/10 text-info rounded px-1.5 py-0.5 text-[0.625rem]"
                >
                  Telegram
                </span>
              </div>
            </div>

            <!-- Amount -->
            <div
              class="flex items-center gap-0.5 text-sm font-semibold whitespace-nowrap"
              :class="tx.type === 'income' ? 'text-success' : 'text-error'"
            >
              <ArrowUpRight
                v-if="tx.type === 'income'"
                :size="14"
              />
              <ArrowDownRight
                v-else
                :size="14"
              />
              {{ formatVND(tx.amount) }}
            </div>

            <!-- Delete -->
            <button
              class="text-text-disabled hover:text-error hover:bg-bg-active rounded p-1 opacity-0 transition-all duration-150 group-hover:opacity-100"
              @click="deleteTx(tx.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </template>

    <!-- Empty -->
    <template v-else>
      <div
        class="flex flex-col items-center py-16 text-center"
      >
        <Calendar
          :size="48"
          class="text-text-disabled mb-4"
        />
        <h3 class="mb-2 text-lg font-semibold">Chưa có giao dịch</h3>
        <p class="text-text-tertiary mb-6 text-sm">Thêm giao dịch thủ công hoặc chat qua Telegram</p>
        <button
          @click="router.push('/transactions/add')"
          class="btn-secondary"
        >
          <Plus :size="16" />
          Thêm giao dịch
        </button>
      </div>
    </template>
  </div>
</template>

<style>
.dropdown-enter-active {
  transition: opacity 150ms ease, transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-leave-active {
  transition: opacity 100ms ease, transform 100ms ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-0.375rem) scale(0.97);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
</style>
