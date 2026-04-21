import { onMounted, onUnmounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useEventListener } from '@/composables/useEventListener'

/**
 * Composable that auto-polls finance data (wallets + transactions) in the background.
 *
 * Features:
 * - Fetches all data on mount (with loading indicator)
 * - Polls silently every 30 seconds via store.startPolling()
 * - Silently refreshes when user returns to the tab (visibilitychange)
 * - Cleans up timer and event listener on unmount automatically
 *
 * Usage (drop into any finance view — no boilerplate needed):
 * ```ts
 * import { useFinancePolling } from '@/composables/useFinancePolling'
 * useFinancePolling()
 * ```
 */
export function useFinancePolling() {
  const finance = useFinanceStore()

  onMounted(() => {
    finance.fetchAll()
    finance.startPolling()
  })

  // useEventListener handles add + remove automatically via onBeforeUnmount
  useEventListener(document, 'visibilitychange', finance.refreshOnVisible)

  onUnmounted(() => {
    finance.stopPolling()
  })

  return finance
}
