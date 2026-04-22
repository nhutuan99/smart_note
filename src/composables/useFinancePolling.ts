import { onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useEventListener } from '@/composables/useEventListener'

/**
 * Composable that syncs finance data on mount + tab visibility.
 *
 * NO interval polling — API is only called when:
 * 1. Component mounts (initial load)
 * 2. User returns to the tab (visibilitychange)
 *
 * This reduces server load while keeping data fresh whenever
 * the user is actually looking at the screen.
 *
 * Usage:
 * ```ts
 * import { useFinancePolling } from '@/composables/useFinancePolling'
 * useFinancePolling()
 * ```
 */
export function useFinancePolling() {
  const finance = useFinanceStore()

  onMounted(() => {
    finance.fetchAll()
  })

  // useEventListener handles add + remove automatically via onBeforeUnmount
  useEventListener(document, 'visibilitychange', finance.refreshOnVisible)

  return finance
}
