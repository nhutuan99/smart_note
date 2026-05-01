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
 * Public pages (blog) — rendered without sidebar, accessible without login.
 */
const isPublicPage = computed(() => !!route.meta.isPublic)

/**
 * Gate: only render AppLayout when:
 * 1. Auth state has been resolved (authReady)
 * 2. User is authenticated
 * 3. Current route is NOT the login page or public page
 */
const showLayout = computed(
  () => auth.authReady && auth.isAuthenticated && !isAuthPage.value && !isPublicPage.value
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
      Public pages (blog) — full-width, no sidebar, no auth required.
    -->
    <div v-else-if="isPublicPage" class="public-layout">
      <!-- Public Header for Unauthenticated Users to discover the app -->
      <header v-if="!auth.isAuthenticated" class="public-header">
        <div class="public-header__container">
          <router-link to="/" class="public-header__logo">
            <img src="/images/logo-512.png" alt="FinNote" class="w-8 h-8 object-contain" />
            <span class="font-bold text-[1.125rem] text-text-primary tracking-tight">FinNote</span>
          </router-link>
          <router-link to="/login" class="public-header__btn">
            Mở ứng dụng
          </router-link>
        </div>
      </header>
      <!-- Safe area spacer for authenticated users (no public-header shown) -->
      <div v-else class="public-safe-spacer"></div>

      <div class="public-layout__content custom-scrollbar">
        <router-view />
      </div>
    </div>

    <!--
      Authenticated app shell.
    -->
    <AppLayout v-else-if="showLayout" />

    <!-- While auth resolves — render nothing -->
  </div>
</template>

<style>
#finnote-app {
  min-height: 100vh;
  min-height: 100dvh;
}

/* ── Public Layout (Blog pages — no sidebar) ── */
.public-layout {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
}
.public-header {
  border-bottom: 1px solid var(--color-border-subtle);
  background: rgba(13, 14, 18, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
  /* iOS PWA: push below system status bar */
  padding-top: env(safe-area-inset-top, 0px);
}
.public-header__container {
  max-width: 52rem;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.public-header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  transition: opacity 0.2s;
}
.public-header__logo:hover {
  opacity: 0.8;
}
.public-header__btn {
  background: var(--color-accent);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px 0 rgba(124, 111, 247, 0.25);
}
.public-header__btn:hover {
  transform: translateY(-1px);
  background: var(--color-accent-hover);
  box-shadow: 0 6px 20px rgba(124, 111, 247, 0.23);
}
.public-layout__content {
  flex: 1;
  max-width: 100%;
  padding: 2rem 1.5rem;
  padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
@media (min-width: 768px) {
  .public-layout__content {
    padding: 3rem 2rem;
    padding-bottom: calc(3rem + env(safe-area-inset-bottom, 0px));
  }
}

/* Spacer for authenticated users on public pages (replaces hidden public-header) */
.public-safe-spacer {
  height: env(safe-area-inset-top, 0px);
  flex-shrink: 0;
  background: var(--color-bg-primary);
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

  /* ── Safe Area: Public Layout (Blog pages) ── */
  .public-layout {
    height: 100%;
    height: 100dvh;
    overflow: hidden;
  }

  .public-header {
    padding-top: max(env(safe-area-inset-top), 24px) !important;
    flex-shrink: 0;
  }

  .public-layout__content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding-bottom: max(env(safe-area-inset-bottom), 20px) !important;
  }

  .public-safe-spacer {
    height: max(env(safe-area-inset-top), 24px) !important;
  }

  /* Blog CTA floating button — push above home indicator */
  .cta-float {
    bottom: calc(1.5rem + max(env(safe-area-inset-bottom), 16px)) !important;
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
