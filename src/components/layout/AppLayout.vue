<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PinDialog from '@/components/PinDialog.vue'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import { useEventListener } from '@/composables/useEventListener'

const ui = useUiStore()
const notificationStore = useNotificationStore()

let _lastSyncTime = 0

function syncOnVisible() {
  if (document.visibilityState === 'visible' && Date.now() - _lastSyncTime > 5_000) {
    notificationStore.fetch(true)
    _lastSyncTime = Date.now()
  }
}

onMounted(() => {
  // Initial fetch
  notificationStore.fetch()
  _lastSyncTime = Date.now()
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
