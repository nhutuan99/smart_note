<script setup lang="ts">
// 1. Vue core
import { computed } from 'vue'

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

  /* The fixed header needs top offset for the notch/dynamic island */
  .pwa-header-safe {
    padding-top: env(safe-area-inset-top) !important;
  }

  /* Main content area needs to account for the taller header */
  .pwa-main-safe {
    top: calc(3.5rem + env(safe-area-inset-top)) !important;
  }

  /* Bottom elements (scroll-to-top, toast) need bottom safe area */
  .pwa-bottom-safe {
    padding-bottom: env(safe-area-inset-bottom);
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

/* ── Apple Liquid Glass Effect (iOS 26+) ─────────────────────────────────────── */
/* Enhanced glassmorphism for devices supporting advanced backdrop-filter */
@supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or (backdrop-filter: saturate(180%) blur(20px))) {
  @media (display-mode: standalone) {
    .liquid-glass {
      background: rgba(18, 18, 28, 0.55) !important;
      -webkit-backdrop-filter: saturate(180%) blur(24px) brightness(1.1) !important;
      backdrop-filter: saturate(180%) blur(24px) brightness(1.1) !important;
      border-bottom: 1px solid rgba(124, 111, 247, 0.12) !important;
      box-shadow:
        0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
        0 4px 16px rgba(0, 0, 0, 0.25) !important;
    }

    .liquid-glass-card {
      background: rgba(22, 22, 35, 0.6) !important;
      -webkit-backdrop-filter: saturate(150%) blur(16px) !important;
      backdrop-filter: saturate(150%) blur(16px) !important;
      border: 1px solid rgba(124, 111, 247, 0.08) !important;
      box-shadow:
        0 1px 0 0 rgba(255, 255, 255, 0.03) inset,
        0 2px 8px rgba(0, 0, 0, 0.2) !important;
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

/* Cho phép select text trong các input/textarea */
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
