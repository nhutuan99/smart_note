import { ref, computed, onMounted, onUnmounted } from 'vue'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Detect device type from User Agent and screen width.
 * - mobile: phones (< 768px hoặc UA là mobile phone)
 * - tablet: tablets như iPad, Android tablet (768px–1024px hoặc UA là tablet)
 * - desktop: anything else
 */

const MOBILE_UA_REGEX =
  /Android(?!.*Tablet)|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari(?!.*iPad)/i

const TABLET_UA_REGEX = /iPad|Android(?=.*Tablet)|Tablet|PlayBook|Silk/i

function detectDeviceFromUA(): DeviceType {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent

  if (TABLET_UA_REGEX.test(ua)) return 'tablet'
  if (MOBILE_UA_REGEX.test(ua)) return 'mobile'
  return 'desktop'
}

function detectDeviceFromScreen(): DeviceType {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1025) return 'tablet'
  return 'desktop'
}

/**
 * Merge UA detection + screen width.
 * UA has priority; screen width is fallback for unknown UAs.
 */
function resolveDeviceType(): DeviceType {
  const fromUA = detectDeviceFromUA()

  // Nếu UA rõ ràng là mobile/tablet thì trust UA
  if (fromUA !== 'desktop') return fromUA

  // Nếu UA là desktop nhưng màn hình nhỏ (ví dụ responsive dev tools)
  // → vẫn dùng screen width để detect cho phù hợp layout
  return detectDeviceFromScreen()
}

// Singleton state – shared across all composable instances
const deviceType = ref<DeviceType>(resolveDeviceType())

export function useDevice() {
  const isMobile = computed(() => deviceType.value === 'mobile')
  const isTablet = computed(() => deviceType.value === 'tablet')
  const isDesktop = computed(() => deviceType.value === 'desktop')
  const isMobileOrTablet = computed(
    () => deviceType.value === 'mobile' || deviceType.value === 'tablet',
  )

  function onResize() {
    // Re-evaluate only if UA said desktop (to handle dev tools resize)
    const fromUA = detectDeviceFromUA()
    if (fromUA === 'desktop') {
      deviceType.value = detectDeviceFromScreen()
    } else {
      deviceType.value = fromUA
    }
  }

  onMounted(() => {
    window.addEventListener('resize', onResize, { passive: true })
    // Initial evaluation
    deviceType.value = resolveDeviceType()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
  })

  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
  }
}
