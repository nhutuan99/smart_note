import { onMounted, onBeforeUnmount } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useEventListener } from '@/composables/useEventListener'

/**
 * Composable that syncs finance data on mount + tab visibility + periodic polling.
 *
 * API is called when:
 * 1. Component mounts (initial load)
 * 2. User returns to the tab (visibilitychange)
 * 3. Every POLL_INTERVAL_MS while the tab is visible (background polling)
 *
 * Polling ensures data from external sources (iPhone SMS webhook, Casso, etc.)
 * appears automatically without requiring the user to refresh or switch tabs.
 *
 * Usage:
 * ```ts
 * import { useFinancePolling } from '@/composables/useFinancePolling'
 * useFinancePolling()
 * ```
 */

const POLL_INTERVAL_MS = 30_000 // 30 seconds

export function useFinancePolling() {
  const finance = useFinanceStore()
  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPolling() {
    stopPolling()
    pollTimer = setInterval(() => {
      // Only poll when the tab is visible — skip if user switched away
      if (document.visibilityState === 'visible') {
        finance.silentRefresh()
      }
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onMounted(() => {
    finance.fetchAll()
    startPolling()
  })

  onBeforeUnmount(() => {
    stopPolling()
  })

  // useEventListener handles add + remove automatically via onBeforeUnmount
  useEventListener(document, 'visibilitychange', finance.refreshOnVisible)

  return finance
}
