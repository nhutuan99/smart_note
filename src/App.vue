<script setup lang="ts">
// 1. Vue core
import { computed, onMounted } from 'vue'

// 2. Vue ecosystem
import { useRoute } from 'vue-router'

// 3. Stores
import { useAuthStore } from '@/stores/auth'

// 4. Composables
import { useDevice } from '@/composables/useDevice'
import { useEventListener } from '@/composables/useEventListener'

// 5. Components
import AppLayout from '@/components/layout/AppLayout.vue'

const route  = useRoute()
const auth   = useAuthStore()
const { deviceType, isMobileOrTablet } = useDevice()

/**
 * True when the current route is the login page.
 * Used to conditionally render AppLayout vs router-view.
 */
const isAuthPage = computed(() => route.name === 'login')

/**
 * Gate: only render AppLayout when:
 * 1. Auth state has been resolved (authReady)
 * 2. User is authenticated
 * 3. Current route is NOT the login page
 *
 * This eliminates the 1-frame flash of the dashboard that occurred
 * because `v-else` previously rendered AppLayout before the router
 * guard could fire and redirect to /login.
 */
const showLayout = computed(
  () => auth.authReady && auth.isAuthenticated && !isAuthPage.value
)

// ─── Block double-tap zoom (mobile/tablet) ────────────────────────────────────
let lastTouchEnd = 0

function preventDoubleTapZoom(e: TouchEvent) {
  const now = Date.now()
  if (now - lastTouchEnd < 300) {
    e.preventDefault()
  }
  lastTouchEnd = now
}

if (isMobileOrTablet.value) {
  useEventListener(document, 'touchend', preventDoubleTapZoom as EventListener, { passive: false })
}

// ─── Clear PWA App Badge on open/focus ─────────────────────────────────────────
onMounted(() => {
  const clearBadge = () => {
    if (navigator && 'clearAppBadge' in navigator) {
      ;(navigator as any).clearAppBadge().catch(() => {})
    }
  }

  clearBadge()

  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      clearBadge()
    }
  })
})
</script>

<template>
  <div
    id="finnote-app"
    :class="[`device--${deviceType}`]"
  >
    <!--
      Auth pages (login, forgot-password, etc.)
      Rendered via router-view directly — no AppLayout wrapper.
    -->
    <router-view v-if="isAuthPage" />

    <!--
      Authenticated app shell.
      Only rendered when authReady=true AND isAuthenticated=true.
      This prevents the flash of the dashboard layout before the
      router guard has a chance to redirect to /login.
    -->
    <AppLayout v-else-if="showLayout" />

    <!--
      While auth resolves or redirecting — render nothing (black screen).
      In practice this is near-instant since localStorage is synchronous,
      but the guard still fires on the next microtask tick.
    -->
    <!-- intentional empty: router guard will redirect before next paint -->
  </div>
</template>

<style>
#finnote-app {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height — accounts for iOS bottom bar */
}

/* ── iOS PWA Standalone Mode ─────────────────────────────────────────────────── */

/* When running as installed PWA (Add to Home Screen), push fixed header below status bar */
@media (display-mode: standalone) {
  :root {
    --sat: env(safe-area-inset-top, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
    --sar: env(safe-area-inset-right, 0px);
  }

  /* ── Prevent pull-to-refresh (iOS PWA bouncy reload) ── */
  html, body {
    overscroll-behavior-y: none;
    overflow: hidden; /* body doesn't scroll — only <main> scrolls */
    height: 100%;
    height: 100dvh;
    background: var(--bg-primary); /* Prevent black flash at edges */
  }

  #finnote-app {
    height: 100%;
    height: 100dvh;
    overflow: hidden;
  }

  /* ── Hide scrollbar in PWA mode (native feel) ── */
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }
  *::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  /* ── Safe Area: Header ── */
  .pwa-header-safe {
    /* Use max() to ensure at least 24px padding for older iPhones without notches */
    padding-top: max(env(safe-area-inset-top), 24px) !important;
    height: calc(3.5rem + max(env(safe-area-inset-top), 24px)) !important;
  }

  /* ── Safe Area: Main content ── */
  .pwa-main-safe {
    top: calc(3.5rem + max(env(safe-area-inset-top), 24px)) !important;
    /* Bottom padding so content doesn't hide behind home indicator */
    padding-bottom: max(env(safe-area-inset-bottom), 20px) !important;
    /* Smooth momentum scrolling */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain; /* prevent pull-to-refresh on main scroll area */
  }

  /* ── Safe Area: Sidebar ── */
  .pwa-sidebar-safe {
    top: calc(3.5rem + max(env(safe-area-inset-top), 24px)) !important;
    padding-bottom: max(env(safe-area-inset-bottom), 16px) !important;
  }

  /* ── Safe Area: Bottom-positioned elements ── */
  .pwa-bottom-safe {
    padding-bottom: max(env(safe-area-inset-bottom), 16px) !important;
  }

  /* Fixed bottom buttons (scroll-to-top, FABs) */
  .pwa-fab-safe {
    bottom: calc(1.5rem + max(env(safe-area-inset-bottom), 16px)) !important;
  }

  /* Toast container needs bottom safe area */
  #toast-container {
    bottom: calc(1rem + max(env(safe-area-inset-bottom), 16px)) !important;
  }

  /* Modal/dialog bottom padding (buttons at bottom of modals) */
  .pwa-modal-safe {
    padding-bottom: max(env(safe-area-inset-bottom), 16px) !important;
  }
}

/* iOS Safari standalone fallback (older iOS versions) */
@supports (-webkit-touch-callout: none) {
  @media (display-mode: standalone) {
    body {
      /* Prevent rubber-band bouncing at edges */
      overscroll-behavior-y: none;
    }
  }
}


/* ── Prevent text-selection zoom on touch devices ───────────────────────────── */
.device--mobile,
.device--tablet {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Allow select text in inputs/textareas */
.device--mobile input,
.device--mobile textarea,
.device--mobile [contenteditable],
.device--tablet input,
.device--tablet textarea,
.device--tablet [contenteditable] {
  -webkit-user-select: text;
  user-select: text;
}
</style>
