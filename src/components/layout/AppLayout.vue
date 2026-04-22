<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PinDialog from '@/components/PinDialog.vue'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import { useNotesStore } from '@/stores/notes'
import { useFinanceStore } from '@/stores/finance'
import { useEventListener } from '@/composables/useEventListener'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const ui = useUiStore()
const notificationStore = useNotificationStore()
const notesStore = useNotesStore()
const financeStore = useFinanceStore()
const router = useRouter()
const { t } = useI18n()

let _lastSyncTime = 0

function syncOnVisible() {
  if (document.visibilityState === 'visible' && Date.now() - _lastSyncTime > 5_000) {
    notificationStore.fetch(true)
    financeStore.silentRefresh()
    _lastSyncTime = Date.now()
  }
}

onMounted(() => {
  // Initial fetches
  notificationStore.fetch()
  // Fetch notes so sidebar "Ghi chú gần đây" is populated on first load
  if (notesStore.notes.length === 0) {
    notesStore.fetchNotes()
  }
  _lastSyncTime = Date.now()

  // Handle mini tip guide for auto-sync
  const syncGuideKey = 'sn_sync_guide_shown'
  if (!localStorage.getItem(syncGuideKey)) {
    setTimeout(async () => {
      const confirmed = await ui.requestConfirm({
        title: t('guide.syncTitle'),
        message: t('guide.syncMessage'),
        confirmText: t('guide.syncAction'),
        cancelText: t('common.close'),
        danger: false
      })
      // Cache after user clicks to dismiss/confirm
      localStorage.setItem(syncGuideKey, 'true')
      if (confirmed) {
        router.push('/auto-sync')
      }
    }, 1500)
  }
})

// Sync when user switches back to the app
useEventListener(document, 'visibilitychange', syncOnVisible)
</script>

<template>
  <div class="bg-bg-primary min-h-screen">
    <AppHeader />
    <AppSidebar />
    <main
      class="fixed top-[3.5rem] right-0 bottom-0 w-full overflow-y-auto transition-all duration-300"
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
    <ToastContainer />
    <ConfirmDialog />
    <PinDialog 
      :show="ui.pinState.isOpen"
      :title="ui.pinState.title"
      :message="ui.pinState.message"
      @confirmed="ui.resolvePin(true)"
      @cancelled="ui.resolvePin(false)"
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
