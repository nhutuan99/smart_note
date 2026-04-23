<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PinDialog from '@/components/PinDialog.vue'
import BugReportModal from '@/components/ui/BugReportModal.vue'
import { ArrowUp } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import { useNotesStore } from '@/stores/notes'
import { useFinanceStore } from '@/stores/finance'
import { useAuthStore } from '@/stores/auth'
import { useEventListener } from '@/composables/useEventListener'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const ui = useUiStore()
const notificationStore = useNotificationStore()
const notesStore = useNotesStore()
const financeStore = useFinanceStore()
const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const showScrollTop = ref(false)
const mainRef = ref<HTMLElement | null>(null)

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  showScrollTop.value = target.scrollTop > 300
}

function scrollToTop() {
  if (mainRef.value) {
    mainRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

let _lastSyncTime = 0

function syncOnVisible() {
  if (document.visibilityState === 'visible' && Date.now() - _lastSyncTime > 5_000) {
    notificationStore.fetch(true)
    financeStore.silentRefresh()
    _lastSyncTime = Date.now()
  }
}

// ── Sync Guide: 5-minute delay ──
// sessionStorage: don't show again in this tab
// localStorage ('sn_sync_guide_shown'): permanent dismiss after clicking "Tìm hiểu"
// On logout → localStorage key is cleared so guide resets for next user/session

const GUIDE_LOCAL_KEY = 'sn_sync_guide_shown'
const GUIDE_SESSION_KEY = 'sn_sync_guide_session'
const GUIDE_DELAY_MS = 5 * 60 * 1000 // 5 minutes

let guideTimer: ReturnType<typeof setTimeout> | null = null

function scheduleGuide() {
  // Already permanently dismissed (user clicked "Tìm hiểu" before)
  if (localStorage.getItem(GUIDE_LOCAL_KEY)) return
  // Already shown in this tab session
  if (sessionStorage.getItem(GUIDE_SESSION_KEY)) return
  // Only show to logged-in users
  if (!auth.isAuthenticated) return

  guideTimer = setTimeout(async () => {
    // Re-check conditions (user may have logged out or navigated away)
    if (localStorage.getItem(GUIDE_LOCAL_KEY)) return
    if (sessionStorage.getItem(GUIDE_SESSION_KEY)) return
    if (!auth.isAuthenticated) return

    // Mark as shown for this tab (sessionStorage)
    sessionStorage.setItem(GUIDE_SESSION_KEY, 'true')

    const confirmed = await ui.requestConfirm({
      title: t('guide.syncTitle'),
      message: t('guide.syncMessage'),
      confirmText: t('guide.syncAction'),
      cancelText: t('common.close'),
      danger: false
    })

    if (confirmed) {
      // User clicked "Tìm hiểu" → permanent cache in localStorage
      localStorage.setItem(GUIDE_LOCAL_KEY, 'true')
      router.push('/auto-sync')
    }
  }, GUIDE_DELAY_MS)
}

onMounted(() => {
  // Initial data fetches (guarded by auth inside each store)
  notificationStore.fetch(true)   // force fetch — always get latest on mount
  financeStore.silentRefresh()    // also refresh finance data immediately
  if (notesStore.notes.length === 0) {
    notesStore.fetchNotes()
  }
  _lastSyncTime = Date.now()

  // Schedule sync guide after 5 minutes
  scheduleGuide()
})

onBeforeUnmount(() => {
  if (guideTimer) {
    clearTimeout(guideTimer)
    guideTimer = null
  }
})

// Sync when user switches back to the app
useEventListener(document, 'visibilitychange', syncOnVisible)
</script>

<template>
  <div class="bg-bg-primary min-h-screen relative">
    <AppHeader />
    <AppSidebar />
    <main
      ref="mainRef"
      @scroll="handleScroll"
      class="fixed top-[3.5rem] right-0 bottom-0 w-full overflow-y-auto transition-all duration-300 scroll-smooth"
      :class="ui.sidebarOpen ? 'md:w-[calc(100%-16.25rem)]' : 'md:w-[calc(100%-3.75rem)]'"
    >
      <div class="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Scroll To Top Button -->
    <transition name="fade">
      <button 
        v-if="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary text-text-primary shadow-lg ring-1 ring-border-default hover:bg-bg-tertiary transition-all active:scale-95"
        title="Lên đầu trang"
      >
        <ArrowUp class="h-5 w-5" />
      </button>
    </transition>

    <ToastContainer />
    <ConfirmDialog />
    <PinDialog 
      :show="ui.pinState.isOpen"
      :title="ui.pinState.title"
      :message="ui.pinState.message"
      @confirmed="ui.resolvePin(true)"
      @cancelled="ui.resolvePin(false)"
    />
    <BugReportModal 
      :show="ui.showBugReport" 
      @close="ui.showBugReport = false" 
    />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
