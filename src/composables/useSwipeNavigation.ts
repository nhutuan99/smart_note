import { useRouter, useRoute } from 'vue-router'
import { useEventListener } from './useEventListener'

export function useSwipeNavigation() {
  const router = useRouter()
  const route = useRoute()

  let startX = 0
  let startY = 0
  let isEdgeSwipeBack = false
  let isEdgeSwipeForward = false

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY

    // Detect if starting touch is near the left edge (go back)
    if (startX < 30) {
      isEdgeSwipeBack = true
    } else {
      isEdgeSwipeBack = false
    }

    // Detect if starting touch is near the right edge (go forward)
    if (startX > window.innerWidth - 30) {
      isEdgeSwipeForward = true
    } else {
      isEdgeSwipeForward = false
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isEdgeSwipeBack && !isEdgeSwipeForward) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    // Thresholds
    const SWIPE_THRESHOLD = 50
    const SWIPE_RESTRICT_Y = 50 // To avoid triggering on vertical scrolling

    if (Math.abs(deltaY) < SWIPE_RESTRICT_Y) {
      if (isEdgeSwipeBack && deltaX > SWIPE_THRESHOLD) {
        // Go Back
        const parent = route.meta.parentRoute as string | undefined
        if (parent) {
          router.push(parent)
        } else {
          router.back()
        }
      } else if (isEdgeSwipeForward && deltaX < -SWIPE_THRESHOLD) {
        // Go Forward
        router.forward()
      }
    }

    // Reset
    isEdgeSwipeBack = false
    isEdgeSwipeForward = false
  }

  // Register global events
  useEventListener(document, 'touchstart', handleTouchStart as EventListener, { passive: true })
  useEventListener(document, 'touchend', handleTouchEnd as EventListener, { passive: true })
}
