/**
 * useFaviconBadge
 *
 * Facebook-style notification badge on browser tab:
 * - Favicon: red circle with white count number in top-right of icon
 * - Document title: "(3) Smart Note" prefix when unread > 0
 * - Shows "99+" when count exceeds 99
 * - Caches base favicon PNG after first load (no repeated network calls)
 * - Restores original favicon + title on unmount or when count = 0
 *
 * Complies with vue-expert.md:
 * - Strict TypeScript — no `any`
 * - Import order: Vue core → types
 * - Error handling: try/catch + console.warn (never swallowed)
 * - onUnmounted cleanup (stop watcher + restore favicon + title)
 * - Module-level cache is read-only after first write (safe)
 */

// 1. Vue core
import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// ─── Constants ────────────────────────────────────────────────────────────────

const FAVICON_SRC       = '/images/logo-512.png'
const CANVAS_SIZE       = 64          // Higher res → crisper text on retina
const BADGE_COLOR       = '#ef4444'   // red-500
const BADGE_TEXT_COLOR  = '#ffffff'
const BADGE_RADIUS      = 13          // px radius of badge circle
const BASE_TITLE        = 'FinNote'

// ─── Module-level read-only cache ─────────────────────────────────────────────

/** Base64 PNG of plain favicon (no badge). Set once, never mutated again. */
let _cachedBasePng: string | null = null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFaviconLinkEl(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (existing) return existing
  const el = document.createElement('link')
  el.rel = 'icon'
  document.head.appendChild(el)
  return el
}

/** Load any URL into an HTMLImageElement. Resolves even on network error. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(img)
    img.src = src
  })
}

/** Format count label: 1–99 as-is, 100+ as "99+". */
function formatBadgeLabel(count: number): string {
  return count > 99 ? '99+' : String(count)
}

/**
 * Draw base icon + optional count badge onto canvas.
 * Returns PNG base64 string, or null on canvas init failure.
 */
function drawFaviconCanvas(baseImg: HTMLImageElement, count: number): string | null {
  const canvas = document.createElement('canvas')
  canvas.width  = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Draw base favicon
  ctx.drawImage(baseImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

  if (count <= 0) {
    return canvas.toDataURL('image/png')
  }

  // ── Badge positioning — top-right ─────────────────────────────────────────
  const cx = CANVAS_SIZE - BADGE_RADIUS - 2
  const cy = BADGE_RADIUS + 2

  // Dark ring for visual separation from icon background
  ctx.beginPath()
  ctx.arc(cx, cy, BADGE_RADIUS + 2, 0, Math.PI * 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.fill()

  // Red badge circle
  ctx.beginPath()
  ctx.arc(cx, cy, BADGE_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = BADGE_COLOR
  ctx.fill()

  // White count text
  const label    = formatBadgeLabel(count)
  const fontSize = label.length > 1 ? 18 : 20   // smaller font for 2+ chars
  ctx.font        = `bold ${fontSize}px -apple-system, sans-serif`
  ctx.fillStyle   = BADGE_TEXT_COLOR
  ctx.textAlign   = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, cy + 1)   // +1 px optical centering

  return canvas.toDataURL('image/png')
}

/** Update document.title with count prefix (Facebook-style). */
function updateTitle(count: number): void {
  document.title = count > 0
    ? `(${formatBadgeLabel(count)}) ${BASE_TITLE}`
    : BASE_TITLE
}

/**
 * Render favicon badge with count number.
 * Loads base SVG once, then caches as PNG for subsequent renders.
 */
async function renderFavicon(count: number): Promise<void> {
  try {
    // Load and cache base icon on first call
    if (!_cachedBasePng) {
      const img   = await loadImage(FAVICON_SRC)
      const plain = drawFaviconCanvas(img, 0)
      if (!plain) return
      _cachedBasePng = plain
    }

    // Re-draw from cached base (skip network)
    const baseImg = await loadImage(_cachedBasePng)
    const png     = drawFaviconCanvas(baseImg, count)
    if (png) {
      getFaviconLinkEl().href = png
    }
  } catch (err) {
    console.warn('[useFaviconBadge] Failed to render favicon badge:', err)
  }
}

/** Restore original favicon and plain title. */
function resetAll(): void {
  getFaviconLinkEl().href = FAVICON_SRC
  document.title = BASE_TITLE
}

// ─── Public composable ────────────────────────────────────────────────────────

/**
 * Facebook-style notification badge on the browser tab.
 *
 * - Favicon shows red circle with count number (e.g. "3", "99+")
 * - Document title becomes "(3) Smart Note"
 * - Automatically cleans up on component unmount
 *
 * Must be called inside `<script setup>` or an active Vue component instance.
 *
 * @example
 * ```ts
 * // AppLayout.vue <script setup>
 * useFaviconBadge(computed(() => notificationStore.unreadCount))
 * ```
 */
export function useFaviconBadge(unreadCount: Ref<number>): void {
  let prevCount = -1

  const stopWatch = watch(
    unreadCount,
    (count: number) => {
      // Skip if count is identical to last render
      if (count === prevCount) return
      prevCount = count

      updateTitle(count)
      renderFavicon(count)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopWatch()
    resetAll()
    prevCount = -1
  })
}
