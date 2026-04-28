/**
 * useFaviconBadge
 *
 * Dynamically overlays a red dot on the browser tab favicon
 * when there are unread notifications.
 *
 * Strategy:
 * - Load the base favicon.svg into an Image
 * - Draw it on a Canvas, then paint a red circle on top-right
 * - Set the canvas dataURL as the <link rel="icon"> href
 * - Restore the original SVG favicon when count = 0
 */
import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const FAVICON_URL = '/favicon.svg'
const DOT_COLOR   = '#ef4444'   // Tailwind red-500
const DOT_RADIUS  = 7           // px (on a 32x32 canvas)
const CANVAS_SIZE = 32          // px

let _faviconEl: HTMLLinkElement | null = null

function getFaviconEl(): HTMLLinkElement {
  if (_faviconEl) return _faviconEl
  let el = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'icon'
    document.head.appendChild(el)
  }
  _faviconEl = el
  return el
}

/** Draw the base favicon onto canvas, optionally with a red dot */
async function renderFavicon(showDot: boolean): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width  = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Load the SVG base image
  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise<void>((resolve) => {
    img.onload  = () => resolve()
    img.onerror = () => resolve()          // still continue even if load fails
    img.src = FAVICON_URL + '?v=' + Date.now()   // cache-bust
  })

  // Draw base icon
  ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

  if (showDot) {
    // Red dot — top-right corner
    const x = CANVAS_SIZE - DOT_RADIUS - 1
    const y = DOT_RADIUS + 1

    // White ring for separation
    ctx.beginPath()
    ctx.arc(x, y, DOT_RADIUS + 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#000000'
    ctx.fill()

    // Red circle
    ctx.beginPath()
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = DOT_COLOR
    ctx.fill()
  }

  getFaviconEl().href = canvas.toDataURL('image/png')
}

/** Restore the original SVG favicon */
function resetFavicon(): void {
  getFaviconEl().href = FAVICON_URL
}

/**
 * Usage:
 * ```ts
 * useFaviconBadge(computed(() => notiStore.unreadCount))
 * ```
 */
export function useFaviconBadge(unreadCount: Ref<number>): void {
  let prev = -1

  const stop = watch(
    unreadCount,
    (count) => {
      const hasDot = count > 0
      const prevHasDot = prev > 0
      // Only re-render if state actually changed (dot on/off)
      if (hasDot !== prevHasDot || prev === -1) {
        if (hasDot) {
          renderFavicon(true)
        } else {
          resetFavicon()
        }
      }
      prev = count
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stop()
    resetFavicon()
  })
}
