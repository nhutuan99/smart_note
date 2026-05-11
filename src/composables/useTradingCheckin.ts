import { useTradingStore } from '@/stores/trading'
import { useFinanceStore } from '@/stores/finance'

/**
 * useTradingCheckin
 *
 * SRP composable: composes trading + finance stores into a single
 * interface for the check-in modal workflow.
 *
 * Does NOT fetch data — App.vue handles the initial load on auth.
 * Components that need to ensure data is loaded should call
 * trading.fetchAll() or trading.fetchCheckins() themselves.
 *
 * Follows ISP — expose only what check-in UI needs.
 *
 * Usage:
 * ```ts
 * const { trading, finance, getSelectedWallets } = useTradingCheckin()
 * ```
 */
export function useTradingCheckin() {
  const trading = useTradingStore()
  const finance = useFinanceStore()

  /** Wallet objects for the IDs configured in trading config */
  function getSelectedWallets() {
    return finance.wallets.filter((w) =>
      trading.config.selectedWalletIds.includes(w.id)
    )
  }

  return {
    trading,
    finance,
    getSelectedWallets
  }
}

