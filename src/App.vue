<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDevice } from '@/composables/useDevice'
import { useEventListener } from '@/composables/useEventListener'

const route = useRoute()
const { deviceType, isMobileOrTablet } = useDevice()

const isAuthPage = computed(() => route.name === 'login')

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
    id="smart-note-app"
    :class="[`device--${deviceType}`]"
  >
    <!-- Auth pages: no layout -->
    <router-view v-if="isAuthPage" />
    <!-- App pages: with layout -->
    <AppLayout v-else />
  </div>
</template>

<style>
#smart-note-app {
  min-height: 100vh;
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
