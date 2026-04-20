<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="bg-bg-primary min-h-screen">
    <AppHeader />
    <AppSidebar />
    <main
      class="fixed top-[3.5rem] right-0 bottom-0 w-full overflow-y-auto transition-all duration-300"
      :class="ui.sidebarOpen ? 'md:w-[calc(100%-16.25rem)]' : 'md:w-[calc(100%-3.75rem)]'"
    >
      <div class="max-w-7xl p-4 md:p-6 lg:px-10 lg:py-8">
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
