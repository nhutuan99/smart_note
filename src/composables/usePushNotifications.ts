/**
 * usePushNotifications — Subscribe/unsubscribe to Web Push Notifications (iOS 16.4+ PWA)
 *
 * Requirements for iOS:
 * 1. App must be installed to Home Screen (standalone PWA)
 * 2. User must trigger permission request via a user gesture (button click)
 * 3. Service worker must handle 'push' and 'notificationclick' events
 */

import { ref, onMounted, computed } from 'vue'
import { httpClient } from '@/shared/api/httpClient'
import { useUiStore } from '@/stores/ui'

// Public VAPID key — must match the one on the backend
const VAPID_PUBLIC_KEY = 'BDx3Yup7JurMcaGcdckYyq2iOFKsDNuqIWtL-UAprbtDbcj5akio4VyY5mSuPVFJfbFhNTig9AXmeMP1Ef1von8'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const ui = useUiStore()

  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const permissionState = ref<NotificationPermission>('default')
  const loading = ref(false)

  /** PWA must be in standalone mode for iOS push to work */
  const isStandalone = computed(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )

  /** Check if push notifications are supported in this environment */
  function checkSupport() {
    isSupported.value =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
  }

  /** Read current permission + subscription state */
  async function checkState() {
    if (!isSupported.value) return

    permissionState.value = Notification.permission

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!sub
    } catch {
      isSubscribed.value = false
    }
  }

  /** Request permission and subscribe */
  async function subscribe() {
    if (!isSupported.value) return
    loading.value = true

    try {
      // 1. Ask for permission
      const permission = await Notification.requestPermission()
      permissionState.value = permission

      if (permission !== 'granted') {
        ui.showToast('error', 'Notification permission denied')
        return
      }

      // 2. Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // 3. Send subscription to backend
      await httpClient.post('/api/push/subscribe', sub.toJSON())

      isSubscribed.value = true
      ui.showToast('success', '🔔 Push notifications enabled!')
    } catch (err: any) {
      console.error('[PUSH] Subscribe error:', err)
      ui.showToast('error', err.message || 'Failed to enable notifications')
    } finally {
      loading.value = false
    }
  }

  /** Unsubscribe from push notifications */
  async function unsubscribe() {
    if (!isSupported.value) return
    loading.value = true

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        // Tell backend to remove subscription
        await httpClient.post('/api/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }

      isSubscribed.value = false
      ui.showToast('success', 'Push notifications disabled')
    } catch (err: any) {
      console.error('[PUSH] Unsubscribe error:', err)
      ui.showToast('error', err.message || 'Failed to disable notifications')
    } finally {
      loading.value = false
    }
  }

  /** Toggle subscription */
  async function toggle() {
    if (isSubscribed.value) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  onMounted(() => {
    checkSupport()
    checkState()
  })

  return {
    isSupported,
    isSubscribed,
    isStandalone,
    permissionState,
    loading,
    subscribe,
    unsubscribe,
    toggle
  }
}
