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
  /* iOS PWA safe area — prevent content from being hidden behind notch/home indicator */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* ── Prevent text-selection zoom on touch devices ───────────────────────────── */
.device--mobile,
.device--tablet {
  /* Ngăn iOS double-tap zoom vào text */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  /* Ngăn tap highlight flash */
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
