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
  const debugInfo = ref('')

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
    
    debugInfo.value = `Support: SW=${'serviceWorker' in navigator}, PM=${'PushManager' in window}, N=${'Notification' in window}, Standalone=${isStandalone.value}`
  }

  /** Read current permission + subscription state */
  async function checkState() {
    if (!isSupported.value) return

    permissionState.value = Notification.permission

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!sub

      // Health check: if we think we're subscribed but subscription is expired/null,
      // update the state to reflect reality
      if (!sub && isSubscribed.value) {
        isSubscribed.value = false
      }

      debugInfo.value += ` | Permission=${permissionState.value} | Sub=${!!sub}`
      if (sub) {
        debugInfo.value += ` | Endpoint=${sub.endpoint.substring(0, 50)}...`
      }
    } catch (err) {
      isSubscribed.value = false
      debugInfo.value += ` | CheckError: ${err}`
    }
  }

  /** Request permission and subscribe */
  async function subscribe() {
    if (!isSupported.value) {
      ui.showToast('error', 'Push notifications không được hỗ trợ trên thiết bị này')
      return
    }

    // iOS requires standalone mode
    if (!isStandalone.value) {
      ui.showToast('error', '📱 Vui lòng cài app về Home Screen trước khi bật thông báo')
      return
    }

    loading.value = true

    try {
      // 1. Ask for permission
      const permission = await Notification.requestPermission()
      permissionState.value = permission

      if (permission !== 'granted') {
        ui.showToast('error', 'Quyền thông báo bị từ chối. Vào Settings iOS → FinNote → bật Notifications')
        return
      }

      // 2. Ensure service worker is ready
      const reg = await navigator.serviceWorker.ready
      
      // 3. Unsubscribe from any existing stale subscription first
      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) {
        try {
          await existingSub.unsubscribe()
        } catch {
          // Best-effort cleanup
        }
      }

      // 4. Subscribe via PushManager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // 5. Send subscription to backend
      const subJson = sub.toJSON()
      console.log('[PUSH] Subscription created:', {
        endpoint: subJson.endpoint?.substring(0, 60),
        hasKeys: !!(subJson.keys?.p256dh && subJson.keys?.auth)
      })

      await httpClient.post('/api/push/subscribe', subJson)

      isSubscribed.value = true
      ui.showToast('success', '🔔 Đã bật thông báo đẩy!')
    } catch (err: any) {
      console.error('[PUSH] Subscribe error:', err)
      
      // Provide more specific error messages
      let msg = err.message || 'Không thể bật thông báo'
      if (msg.includes('push service')) {
        msg = 'Không thể kết nối push service. Thử lại sau.'
      } else if (msg.includes('applicationServerKey')) {
        msg = 'Lỗi VAPID key. Liên hệ admin.'
      }
      
      ui.showToast('error', msg)
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
      ui.showToast('success', 'Đã tắt thông báo đẩy')
    } catch (err: any) {
      console.error('[PUSH] Unsubscribe error:', err)
      ui.showToast('error', err.message || 'Không thể tắt thông báo')
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

  /**
   * Health check: verify subscription is still valid.
   * iOS can silently invalidate subscriptions after periods of inactivity.
   * Call this on app mount to auto-detect stale subscriptions.
   */
  async function healthCheck() {
    if (!isSupported.value || !isStandalone.value) return
    if (permissionState.value !== 'granted') return

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      
      if (!sub && isSubscribed.value) {
        // Subscription was invalidated — reset state
        console.warn('[PUSH] Subscription expired/invalidated, resetting state')
        isSubscribed.value = false
        ui.showToast('warning', '⚠️ Thông báo đẩy đã hết hạn. Vui lòng bật lại trong Cài đặt.')
      }
    } catch (err) {
      console.error('[PUSH] Health check error:', err)
    }
  }

  onMounted(() => {
    checkSupport()
    checkState()
    // Run health check after a short delay to not block initial render
    setTimeout(healthCheck, 3000)
  })

  return {
    isSupported,
    isSubscribed,
    isStandalone,
    permissionState,
    loading,
    debugInfo,
    subscribe,
    unsubscribe,
    toggle,
    healthCheck
  }
}
