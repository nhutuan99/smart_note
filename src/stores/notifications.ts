import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { httpClient } from '@/shared/api/httpClient'
import { AUTH_TOKEN_KEY } from '@/constants/auth'
import i18n from '@/i18n'

export interface AppNotification {
  id: string
  type: 'bank_in' | 'bank_out' | 'system'
  title: string
  body: string
  read: boolean
  createdAt: string
  meta?: {
    amount?: number
    txType?: 'income' | 'expense'
    walletName?: string
    bankName?: string
    savingId?: string
  }
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])
  const loading = ref(false)
  const filter = ref<'all' | 'unread'>('all')
  
  let lastFetchTime = 0

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  // Sync PWA App Badge on iOS/Android
  watch(unreadCount, (count) => {
    if (navigator && 'setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {})
      } else {
        if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge().catch(() => {})
        }
      }
    }
  }, { immediate: true })

  const filtered = computed(() =>
    filter.value === 'unread'
      ? notifications.value.filter(n => !n.read)
      : notifications.value
  )

  async function fetch(force = false) {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
    const now = Date.now()
    // Rate limit: prevent spamming API if called within 5 seconds unless forced
    if (!force && now - lastFetchTime < 5000 && notifications.value.length > 0) {
      return
    }

    loading.value = true
    try {
      const data = await httpClient.get<AppNotification[]>('/api/notifications')
      notifications.value = data || []
      lastFetchTime = Date.now()
    } catch {
      // silently fail — non-critical
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: string) {
    const n = notifications.value.find(n => n.id === id)
    if (n && !n.read) {
      n.read = true
      await httpClient.post(`/api/notifications/${id}/read`)
    }
  }

  async function markAllRead() {
    notifications.value.forEach(n => (n.read = true))
    await httpClient.post('/api/notifications/read-all')
  }

  async function clearAll() {
    notifications.value = []
    await httpClient.del('/api/notifications')
  }

  function timeSince(iso: string): string {
    const { t } = i18n.global
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return t('time.justNow')
    if (m < 60) return t('time.minutesAgo', { n: m })
    const h = Math.floor(m / 60)
    if (h < 24) return t('time.hoursAgo', { n: h })
    const d = Math.floor(h / 24)
    return t('time.daysAgo', { n: d })
  }

  return { notifications, loading, filter, unreadCount, filtered, fetch, markRead, markAllRead, clearAll, timeSince }
})
