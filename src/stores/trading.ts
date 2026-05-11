import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { TradingConfig, TradingCheckin, TradingCheckinEntry } from '@/types'
import { httpClient } from '@/shared/api/httpClient'
import { AUTH_TOKEN_KEY } from '@/constants/auth'

/** Quick auth guard — avoids circular dep with auth store */
function isLoggedIn() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY)
}

/** Today's date as YYYY-MM-DD string */
function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

/**
 * useTradingStore
 *
 * Single-domain store for the Trading Journal feature.
 * Follows ISP: keeps trading state isolated from finance/wallet stores.
 *
 * Stores:
 *   - config: which wallets to track
 *   - checkins: all historical daily check-in records
 *
 * Key derived state:
 *   - hasDoneCheckinToday: gates the auto-popup trigger
 *   - todayCheckin: the current day's record (or null)
 */
export const useTradingStore = defineStore('trading', () => {
  // ── State ──

  const config = ref<TradingConfig>({ selectedWalletIds: [], createdAt: '', updatedAt: '' })
  // shallowRef: array is fully replaced on fetch (never mutated item-by-item)
  const checkins = shallowRef<TradingCheckin[]>([])
  const loading = ref(false)
  const configLoading = ref(false)

  // ── Computed ──

  const todayCheckin = computed<TradingCheckin | null>(() => {
    const today = todayStr()
    return checkins.value.find((c) => c.date === today) ?? null
  })

  const hasDoneCheckinToday = computed(() => todayCheckin.value !== null)

  const hasWalletsConfigured = computed(() => config.value.selectedWalletIds.length > 0)

  /** Checkins sorted newest-first for history display */
  const sortedCheckins = computed(() =>
    [...checkins.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  /** Cumulative P&L across all time */
  const totalPnlAllTime = computed(() =>
    checkins.value.reduce((sum, c) => sum + c.totalPnl, 0)
  )

  /** Cumulative deposits across all time */
  const totalDepositAllTime = computed(() =>
    checkins.value.reduce((sum, c) => sum + c.totalDeposit, 0)
  )

  /** Win rate (days with positive P&L) as a percentage */
  const winRate = computed(() => {
    if (checkins.value.length === 0) return 0
    const wins = checkins.value.filter((c) => c.totalPnl > 0).length
    return Math.round((wins / checkins.value.length) * 100)
  })

  // ── Actions ──

  async function fetchConfig() {
    if (!isLoggedIn()) return
    configLoading.value = true
    try {
      const data = await httpClient.get<TradingConfig>('/api/trading/config')
      if (data) config.value = data
    } catch (err) {
      console.error('[Trading] fetchConfig failed:', err)
    } finally {
      configLoading.value = false
    }
  }

  async function saveConfig(selectedWalletIds: string[]) {
    try {
      const data = await httpClient.put<TradingConfig>('/api/trading/config', { selectedWalletIds })
      if (data) config.value = data
    } catch (err) {
      console.error('[Trading] saveConfig failed:', err)
    }
  }

  async function fetchCheckins() {
    if (!isLoggedIn()) return
    loading.value = true
    try {
      const data = await httpClient.get<TradingCheckin[]>('/api/trading/checkins')
      checkins.value = data ?? []
    } catch (err) {
      console.error('[Trading] fetchCheckins failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([fetchConfig(), fetchCheckins()])
  }

  async function submitCheckin(entries: TradingCheckinEntry[], note: string): Promise<boolean> {
    try {
      const data = await httpClient.post<TradingCheckin>('/api/trading/checkins', { entries, note })
      if (data) {
        // Prepend and trigger reactivity via full replacement (shallowRef)
        checkins.value = [data, ...checkins.value]
        return true
      }
      return false
    } catch (err) {
      console.error('[Trading] submitCheckin failed:', err)
      return false
    }
  }

  async function updateCheckin(
    date: string,
    entries: TradingCheckinEntry[],
    note: string
  ): Promise<boolean> {
    try {
      const data = await httpClient.put<TradingCheckin>(
        `/api/trading/checkins/${date}`,
        { entries, note }
      )
      if (data) {
        checkins.value = checkins.value.map((c) => (c.date === date ? data : c))
        return true
      }
      return false
    } catch (err) {
      console.error('[Trading] updateCheckin failed:', err)
      return false
    }
  }

  function reset() {
    config.value = { selectedWalletIds: [], createdAt: '', updatedAt: '' }
    checkins.value = []
    loading.value = false
    configLoading.value = false
  }

  return {
    // State
    config,
    checkins,
    loading,
    configLoading,
    // Computed
    todayCheckin,
    hasDoneCheckinToday,
    hasWalletsConfigured,
    sortedCheckins,
    totalPnlAllTime,
    totalDepositAllTime,
    winRate,
    // Actions
    fetchConfig,
    saveConfig,
    fetchCheckins,
    fetchAll,
    submitCheckin,
    updateCheckin,
    reset
  }
})
