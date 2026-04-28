/**
 * useFaviconBadge
 *
 * Dynamically overlays a red notification dot on the browser tab favicon.
 * Uses Canvas API to draw base icon + red circle, then sets <link rel="icon">.
 * Restores the original SVG favicon when unreadCount returns to 0.
 *
 * Complies with vue-expert.md:
 * - No module-level mutable state (all state is local to each invocation)
 * - SVG source cached as base64 after first load (no repeated network requests)
 * - Strict TypeScript — no `any`
 * - onUnmounted cleanup registered (auto via Vue lifecycle)
 * - Error logged to console, never swallowed silently
 */

// 1. Vue core
import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// ─── Constants ───────────────────────────────────────────────────────────────

const FAVICON_SVG_PATH = '/favicon.svg'
const DOT_COLOR        = '#ef4444' // red-500
const DOT_RADIUS       = 7         // px, on 32×32 canvas
const CANVAS_SIZE      = 32        // px

// ─── Module-level cache (read-only after first load, safe) ───────────────────

/** Base64 PNG of the plain favicon (no dot). Populated on first render. */
let _cachedBasePng: string | null = null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFaviconLinkEl(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (existing) return existing
  const el = document.createElement('link')
  el.rel = 'icon'
  document.head.appendChild(el)
  return el
}

/** Load SVG → HTMLImageElement, resolves even on error (graceful degradation). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(img) // still use (will be blank)
    img.src = src
  })
}

/** Draw image onto 32×32 canvas, return PNG base64. */
function drawToCanvas(img: HTMLImageElement, showDot: boolean): string | null {
  const canvas = document.createElement('canvas')
  canvas.width  = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

  if (showDot) {
    const x = CANVAS_SIZE - DOT_RADIUS - 1
    const y = DOT_RADIUS + 1

    // Black ring (separation from icon)
    ctx.beginPath()
    ctx.arc(x, y, DOT_RADIUS + 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#000000'
    ctx.fill()

    // Red notification dot
    ctx.beginPath()
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = DOT_COLOR
    ctx.fill()
  }

  return canvas.toDataURL('image/png')
}

/**
 * Render favicon — with or without red dot.
 * Caches the base PNG after the first SVG load to avoid repeated network requests.
 */
async function renderFavicon(showDot: boolean): Promise<void> {
  try {
    // Ensure base image is loaded (only once per app session)
    if (!_cachedBasePng) {
      const img   = await loadImage(FAVICON_SVG_PATH)
      const plain = drawToCanvas(img, false)
      if (!plain) return
      _cachedBasePng = plain
    }

    if (!showDot) {
      // Restore plain cached favicon — no canvas needed
      getFaviconLinkEl().href = _cachedBasePng
      return
    }

    // For dot: re-draw from cached base (avoids another network request)
    const imgWithDot = new Image()
    await new Promise<void>((resolve) => {
      imgWithDot.onload  = () => resolve()
      imgWithDot.onerror = () => resolve()
      imgWithDot.src = _cachedBasePng as string
    })

    const withDot = drawToCanvas(imgWithDot, true)
    if (withDot) {
      getFaviconLinkEl().href = withDot
    }
  } catch (err) {
    // Non-critical — log but do not surface to user
    console.warn('[useFaviconBadge] Failed to render favicon badge:', err)
  }
}

/** Reset to the original SVG href (clears canvas override). */
function resetToSvg(): void {
  getFaviconLinkEl().href = FAVICON_SVG_PATH
}

// ─── Public composable ────────────────────────────────────────────────────────

/**
 * Watch `unreadCount` and toggle a red dot on the browser tab favicon.
 *
 * Must be called inside `<script setup>` or a composable with an active
 * Vue component instance (required for `onUnmounted` lifecycle hook).
 *
 * @example
 * ```ts
 * // In AppLayout.vue <script setup>
 * useFaviconBadge(computed(() => notificationStore.unreadCount))
 * ```
 */
export function useFaviconBadge(unreadCount: Ref<number>): void {
  // Track previous dot-visibility state to avoid redundant re-renders
  let prevHasDot: boolean | null = null

  const stopWatch = watch(
    unreadCount,
    (count: number) => {
      const hasDot = count > 0

      // Skip re-render if dot visibility hasn't changed
      if (hasDot === prevHasDot) return
      prevHasDot = hasDot

      renderFavicon(hasDot)
    },
    { immediate: true }
  )

  // Cleanup: stop watcher + restore plain SVG favicon when component unmounts
  onUnmounted(() => {
    stopWatch()
    resetToSvg()
    prevHasDot = null
  })
}
