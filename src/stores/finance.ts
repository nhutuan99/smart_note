import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Wallet,
  Transaction,
  TransactionType,
  TransactionFilter,
  CategoryStat,
  DailyStat
} from '@/types'
import {
  DEFAULT_WALLETS,
  getCategoryConfig,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '@/constants/finance'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function loadJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : fallback
}

function saveJSON(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useFinanceStore = defineStore('finance', () => {
  // ── State ──

  const wallets = ref<Wallet[]>(loadJSON('sn_wallets', []))
  const transactions = ref<Transaction[]>(loadJSON('sn_transactions', []))
  const loading = ref(false)
  const filter = ref<TransactionFilter>({ type: 'all' })
  const selectedMonth = ref(
    new Date().toISOString().substring(0, 7) // "2026-04"
  )

  // ── Init default wallets if empty ──

  if (wallets.value.length === 0) {
    wallets.value = DEFAULT_WALLETS.map((w) => ({
      ...w,
      id: generateId()
    }))
    saveJSON('sn_wallets', wallets.value)
  }

  // ── Computed: Totals ──

  const totalBalance = computed(() => wallets.value.reduce((sum, w) => sum + w.balance, 0))

  const monthTransactions = computed(() => {
    return transactions.value.filter((t) => t.date.startsWith(selectedMonth.value))
  })

  const monthIncome = computed(() =>
    monthTransactions.value.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  )

  const monthExpense = computed(() =>
    monthTransactions.value
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const monthNet = computed(() => monthIncome.value - monthExpense.value)

  // ── Computed: Filtered Transactions ──

  const filteredTransactions = computed(() => {
    let result = [...transactions.value]

    if (filter.value.type && filter.value.type !== 'all') {
      result = result.filter((t) => t.type === filter.value.type)
    }
    if (filter.value.walletId) {
      result = result.filter((t) => t.walletId === filter.value.walletId)
    }
    if (filter.value.category) {
      result = result.filter((t) => t.category === filter.value.category)
    }
    if (filter.value.dateFrom) {
      result = result.filter((t) => t.date >= filter.value.dateFrom!)
    }
    if (filter.value.dateTo) {
      result = result.filter((t) => t.date <= filter.value.dateTo!)
    }

    // Sort by date desc, then createdAt desc
    result.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date)
      if (dateDiff !== 0) return dateDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  })

  // ── Computed: Category Stats ──

  const expenseByCategoryThisMonth = computed<CategoryStat[]>(() => {
    const map: Record<string, number> = {}
    let total = 0

    monthTransactions.value
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount
        total += t.amount
      })

    return Object.entries(map)
      .map(([key, amount]) => {
        const cfg = getCategoryConfig(key)
        return {
          category: key,
          total: amount,
          count: monthTransactions.value.filter((t) => t.type === 'expense' && t.category === key)
            .length,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          icon: cfg.icon,
          color: cfg.color
        }
      })
      .sort((a, b) => b.total - a.total)
  })

  // ── Computed: Daily Stats (last 7 days) ──

  const weeklyStats = computed<DailyStat[]>(() => {
    const stats: DailyStat[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().substring(0, 10)
      const dayTx = transactions.value.filter((t) => t.date === dateStr)
      const income = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      stats.push({
        date: dateStr,
        income,
        expense,
        net: income - expense
      })
    }
    return stats
  })

  // ── Computed: Recent Transactions ──

  const recentTransactions = computed(() =>
    [...transactions.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  )

  // ── Actions: Wallets ──

  function getWallet(id: string) {
    return wallets.value.find((w) => w.id === id)
  }

  function getWalletName(id: string) {
    return getWallet(id)?.name || 'Unknown'
  }

  function addWallet(data: Omit<Wallet, 'id'>) {
    const wallet: Wallet = { ...data, id: generateId() }
    wallets.value.push(wallet)
    saveJSON('sn_wallets', wallets.value)
    return wallet
  }

  function updateWallet(id: string, updates: Partial<Wallet>) {
    const idx = wallets.value.findIndex((w) => w.id === id)
    if (idx !== -1) {
      wallets.value[idx] = { ...wallets.value[idx], ...updates }
      saveJSON('sn_wallets', wallets.value)
    }
  }

  function deleteWallet(id: string) {
    wallets.value = wallets.value.filter((w) => w.id !== id)
    saveJSON('sn_wallets', wallets.value)
  }

  // ── Actions: Transactions ──

  function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    const tx: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    transactions.value.push(tx)

    // Update wallet balance
    const wallet = getWallet(tx.walletId)
    if (wallet) {
      wallet.balance += tx.type === 'income' ? tx.amount : -tx.amount
      saveJSON('sn_wallets', wallets.value)
    }

    saveJSON('sn_transactions', transactions.value)
    return tx
  }

  function deleteTransaction(id: string) {
    const tx = transactions.value.find((t) => t.id === id)
    if (tx) {
      // Revert wallet balance
      const wallet = getWallet(tx.walletId)
      if (wallet) {
        wallet.balance += tx.type === 'income' ? -tx.amount : tx.amount
        saveJSON('sn_wallets', wallets.value)
      }
      transactions.value = transactions.value.filter((t) => t.id !== id)
      saveJSON('sn_transactions', transactions.value)
    }
  }

  // ── Persist ──

  function save() {
    saveJSON('sn_wallets', wallets.value)
    saveJSON('sn_transactions', transactions.value)
  }

  return {
    wallets,
    transactions,
    loading,
    filter,
    selectedMonth,
    totalBalance,
    monthTransactions,
    monthIncome,
    monthExpense,
    monthNet,
    filteredTransactions,
    expenseByCategoryThisMonth,
    weeklyStats,
    recentTransactions,
    getWallet,
    getWalletName,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransaction,
    deleteTransaction,
    save
  }
})
