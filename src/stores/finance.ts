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
import { getCategoryConfig } from '@/constants/finance'
import { httpClient } from '@/shared/api/httpClient'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import Pusher from 'pusher-js'

/** AbortError is expected when httpClient cancels requests on 401 — not a real error. */
function isAbortError(err: unknown) {
  return err instanceof Error && (err.name === 'AbortError' || err.message === 'Session expired')
}

export const useFinanceStore = defineStore('finance', () => {
  // ── State ──

  const wallets = ref<Wallet[]>([])
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const filter = ref<TransactionFilter>({ type: 'all' })
  const selectedMonth = ref(
    new Date().toISOString().substring(0, 7) // "2026-04"
  )

  // ── Polling & Realtime state (module-level, not reactive) ──
  let _pollTimer: ReturnType<typeof setInterval> | null = null
  let _lastFetchTime = 0
  let _pusher: Pusher | null = null
  let _pusherChannel: any = null
  const POLL_INTERVAL_MS = 60_000    // 1 minute (reduced because we have realtime)
  const VISIBILITY_STALE_MS = 10_000 // 10 seconds

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

  // ── Actions: Fetch from API ──

  async function fetchWallets() {
    try {
      const data = await httpClient.get<Wallet[]>('/api/wallets')
      if (data) {
        wallets.value = data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      } else {
        wallets.value = []
      }
    } catch (err) {
      if (!isAbortError(err)) console.error('Failed to fetch wallets:', err)
    }
  }

  async function fetchTransactions() {
    try {
      const data = await httpClient.get<Transaction[]>('/api/transactions')
      transactions.value = data || []
    } catch (err) {
      if (!isAbortError(err)) console.error('Failed to fetch transactions:', err)
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([fetchWallets(), fetchTransactions()])
      _lastFetchTime = Date.now()
    } finally {
      loading.value = false
    }
  }

  /**
   * Silent background refresh — no loading spinner.
   * Used by polling and visibility-change handler.
   */
  async function silentRefresh() {
    try {
      await Promise.all([fetchWallets(), fetchTransactions()])
      _lastFetchTime = Date.now()
    } catch (err) {
      if (!isAbortError(err)) console.error('silentRefresh error:', err)
    }
  }

  // ── Auto-polling & Real-time ──

  /**
   * Start 60s polling interval and Pusher connection.
   */
  function startPolling() {
    if (!_pollTimer) {
      _pollTimer = setInterval(() => {
        silentRefresh()
      }, POLL_INTERVAL_MS)
    }
    
    // Connect to Pusher
    const authStore = useAuthStore()
    const { VITE_PUSHER_KEY, VITE_PUSHER_CLUSTER } = import.meta.env
    
    if (!_pusher && authStore.user?.id && VITE_PUSHER_KEY && VITE_PUSHER_CLUSTER) {
      _pusher = new Pusher(VITE_PUSHER_KEY, {
        cluster: VITE_PUSHER_CLUSTER
      })
      
      const channelName = `smart-note-user-${authStore.user.id}`
      _pusherChannel = _pusher.subscribe(channelName)
      
      _pusherChannel.bind('new_transaction', (data: any) => {
        // We received a real-time transaction!
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        const tx = parsed.tx
        
        if (tx && !transactions.value.some(t => t.id === tx.id)) {
          // Add to local state and force new array reference for total reactivity on charts
          transactions.value = [tx, ...transactions.value]
          
          if (parsed.walletBalance !== undefined && tx.walletId) {
            // Force new array reference to update wallet cards instantly
            wallets.value = wallets.value.map(w => 
              w.id === tx.walletId ? { ...w, balance: parsed.walletBalance } : w
            )
          }
          
          if (parsed.notification) {
            useNotificationStore().fetch() // trigger badge update
          }
          
          useUiStore().showToast('success', `Giao dịch tự động: ${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}đ đã được thêm!`)
        }
      })
    }
  }

  /**
   * Stop polling interval and cleanly disconnect Pusher.
   */
  function stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer)
      _pollTimer = null
    }
    if (_pusher) {
      _pusher.disconnect()
      _pusher = null
      _pusherChannel = null
    }
  }

  /**
   * Refresh if data is stale when user returns to the tab/window.
   * Wire this to document visibilitychange in each finance view.
   */
  function refreshOnVisible() {
    if (document.visibilityState === 'visible') {
      const isStale = Date.now() - _lastFetchTime > VISIBILITY_STALE_MS
      if (isStale) {
        silentRefresh()
      }
    }
  }

  /**
   * Reset all cached finance data.
   * MUST be called on logout to prevent data leakage between users.
   */
  function reset() {
    stopPolling()
    wallets.value = []
    transactions.value = []
    filter.value = { type: 'all' }
    selectedMonth.value = new Date().toISOString().substring(0, 7)
    _lastFetchTime = 0
  }

  // ── Actions: Wallets ──

  function getWallet(id: string) {
    return wallets.value.find((w) => w.id === id)
  }

  function getWalletName(id: string) {
    return getWallet(id)?.name || 'Unknown'
  }

  async function addWallet(data: Omit<Wallet, 'id'>) {
    try {
      const wallet = await httpClient.post<Wallet>('/api/wallets', data)
      if (wallet) wallets.value.push(wallet)
      return wallet
    } catch (err) {
      console.error('Failed to add wallet:', err)
      return null
    }
  }

  async function updateWallet(id: string, updates: Partial<Wallet>) {
    try {
      const updated = await httpClient.put<Wallet>(`/api/wallets/${id}`, updates)
      if (updated) {
        const idx = wallets.value.findIndex((w) => w.id === id)
        if (idx !== -1) wallets.value[idx] = updated
      }
    } catch (err) {
      console.error('Failed to update wallet:', err)
    }
  }

  async function deleteWallet(id: string) {
    try {
      await httpClient.del(`/api/wallets/${id}`)
      wallets.value = wallets.value.filter((w) => w.id !== id)
    } catch (err) {
      console.error('Failed to delete wallet:', err)
    }
  }

  // ── Actions: Transactions ──

  async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    try {
      const tx = await httpClient.post<Transaction>('/api/transactions', data)
      if (tx) {
        transactions.value.push(tx)
        // Refresh wallets to get updated balance from server
        await fetchWallets()
        _lastFetchTime = Date.now()
      }
      return tx
    } catch (err) {
      console.error('Failed to add transaction:', err)
      return null
    }
  }

  async function deleteTransaction(id: string) {
    try {
      await httpClient.del(`/api/transactions/${id}`)
      transactions.value = transactions.value.filter((t) => t.id !== id)
      // Refresh wallets to get reverted balance from server
      await fetchWallets()
      _lastFetchTime = Date.now()
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
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
    fetchWallets,
    fetchTransactions,
    fetchAll,
    silentRefresh,
    startPolling,
    stopPolling,
    refreshOnVisible,
    reset
  }
})
