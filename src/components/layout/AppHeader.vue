<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'
import { Menu, Search, Bell, Settings, LogOut, Sparkles } from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header
    class="border-border-default fixed top-0 right-0 left-0 z-50 flex h-[3.5rem] items-center justify-between border-b bg-black/75 px-4 backdrop-blur-xl"
  >
    <!-- Left -->
    <div class="flex items-center gap-3">
      <button
        id="toggle-sidebar-btn"
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-8.5 w-8.5 items-center justify-center rounded-lg transition-all duration-150"
        @click="ui.toggleSidebar"
      >
        <Menu :size="18" />
      </button>
      <router-link
        to="/"
        class="text-text-primary flex items-center gap-2 text-base font-semibold tracking-tight no-underline"
      >
        <Sparkles
          :size="20"
          class="text-accent"
        />
        <span class="hidden md:inline">SmartNote</span>
      </router-link>
    </div>

    <!-- Center: Search -->
    <div class="mx-auto hidden max-w-[30rem] flex-1 justify-center md:flex">
      <button
        id="search-trigger-btn"
        class="border-border-default bg-bg-surface text-text-tertiary hover:border-border-strong hover:bg-bg-elevated flex h-[2.125rem] w-full max-w-[23.75rem] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-all duration-150"
        @click="ui.toggleSearch"
      >
        <Search :size="14" />
        <span class="flex-1 text-left">Search notes...</span>
        <kbd
          class="border-border-default bg-bg-elevated text-text-tertiary rounded border px-1.5 py-0.5 font-sans text-[0.6875rem]"
        >
          ⌘K
        </kbd>
      </button>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-1">
      <button
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
        id="notifications-btn"
      >
        <Bell :size="18" />
      </button>
      <router-link
        to="/settings"
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
        id="settings-btn"
      >
        <Settings :size="18" />
      </router-link>
      <div class="bg-border-default mx-2 h-6 w-px"></div>
      <button
        id="user-menu-btn"
        class="hover:bg-bg-hover group flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150"
        @click="handleLogout"
      >
        <div
          class="bg-accent-subtle text-accent flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
        >
          {{ auth.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <LogOut
          :size="14"
          class="text-text-tertiary opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
      </button>
    </div>
  </header>
</template>
