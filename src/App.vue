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

  /* ── Prevent pull-to-refresh (iOS PWA bouncy reload) ── */
  html, body {
    overscroll-behavior-y: none;
    overflow: hidden; /* body doesn't scroll — only <main> scrolls */
    height: 100%;
    height: 100dvh;
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

/* ── Apple Liquid Glass Effect (iOS 26+) ─────────────────────────────────────── */
/* Ultra-premium glassmorphism mimicking iOS 26+ native rendering */
@supports ((-webkit-backdrop-filter: saturate(180%) blur(20px)) or (backdrop-filter: saturate(180%) blur(20px))) {
  @media (display-mode: standalone) {
    /* ── Header glass ── */
    .liquid-glass {
      background: rgba(15, 15, 25, 0.4) !important;
      -webkit-backdrop-filter: saturate(200%) blur(40px) brightness(1.05) !important;
      backdrop-filter: saturate(200%) blur(40px) brightness(1.05) !important;
      border-bottom: 0.5px solid rgba(255, 255, 255, 0.15) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
    }

    /* ── Cards glass ── */
    .liquid-glass-card,
    .card-premium,
    .glass {
      background: rgba(25, 25, 38, 0.45) !important;
      -webkit-backdrop-filter: saturate(180%) blur(24px) !important;
      backdrop-filter: saturate(180%) blur(24px) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
    }

    /* ── Sidebar glass ── */
    .liquid-glass-sidebar {
      background: rgba(10, 10, 18, 0.55) !important;
      -webkit-backdrop-filter: saturate(180%) blur(30px) brightness(1.02) !important;
      backdrop-filter: saturate(180%) blur(30px) brightness(1.02) !important;
      border-right: 0.5px solid rgba(255, 255, 255, 0.08) !important;
    }

    /* ── Modal / Dialog glass overlay ── */
    .liquid-glass-modal {
      background: rgba(18, 18, 30, 0.65) !important;
      -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
      backdrop-filter: saturate(180%) blur(20px) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
    }

    /* ── Toast glass ── */
    .liquid-glass-toast {
      background: rgba(22, 22, 35, 0.6) !important;
      -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
      backdrop-filter: saturate(180%) blur(20px) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
    }

    /* ── Notification dropdown glass ── */
    .liquid-glass-dropdown {
      background: rgba(15, 15, 28, 0.75) !important;
      -webkit-backdrop-filter: saturate(200%) blur(30px) !important;
      backdrop-filter: saturate(200%) blur(30px) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
    }

    /* ── Light theme glass adjustments ── */
    [data-theme='light'] .liquid-glass {
      background: rgba(255, 255, 255, 0.55) !important;
      -webkit-backdrop-filter: saturate(180%) blur(40px) brightness(1.1) !important;
      backdrop-filter: saturate(180%) blur(40px) brightness(1.1) !important;
      border-bottom: 0.5px solid rgba(255, 255, 255, 0.6) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7) !important;
    }

    [data-theme='light'] .liquid-glass-card,
    [data-theme='light'] .card-premium,
    [data-theme='light'] .glass {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.5) !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
    }

    [data-theme='light'] .liquid-glass-sidebar {
      background: rgba(255, 255, 255, 0.45) !important;
      border-right: 0.5px solid rgba(255, 255, 255, 0.4) !important;
    }

    [data-theme='light'] .liquid-glass-modal {
      background: rgba(255, 255, 255, 0.7) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.5) !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
    }

    [data-theme='light'] .liquid-glass-dropdown {
      background: rgba(255, 255, 255, 0.8) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.5) !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06) !important;
    }

    [data-theme='light'] .liquid-glass-toast {
      background: rgba(255, 255, 255, 0.65) !important;
      border: 0.5px solid rgba(255, 255, 255, 0.5) !important;
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
