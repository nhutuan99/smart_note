<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notifications'
import { useFinanceStore } from '@/stores/finance'
import { useEventListener } from '@/composables/useEventListener'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Menu, Bell, Settings, LogOut, Sparkles, ArrowUpRight, ArrowDownRight, CheckCheck, Trash2, BellOff, Zap, Sun, Moon } from 'lucide-vue-next'

const { t } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const notiStore = useNotificationStore()
const finance = useFinanceStore()
const router = useRouter()

const imgError = ref(false)
watch(() => auth.user?.avatarUrl, () => {
  imgError.value = false
})

// ─── Bell Dropdown ─────────────────────────────────────────────────────────
const bellOpen = ref(false)
const bellRef = ref<HTMLElement | null>(null)

function toggleBell() {
  bellOpen.value = !bellOpen.value
  if (bellOpen.value) notiStore.fetch()
}

function handleOutsideClick(e: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    bellOpen.value = false
  }
}

useEventListener(document, 'click', handleOutsideClick as EventListener)

// Initial fetch is handled by AppLayout.vue (single source of truth).
// AppHeader only re-fetches when the user explicitly opens the bell dropdown.

// ─── Auth ───────────────────────────────────────────────────────────────────
function handleLogout() {
  finance.reset()  // clear cached transactions/wallets before leaving
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header
    class="border-border-default fixed top-0 right-0 left-0 z-50 flex h-[3.5rem] items-center justify-between border-b bg-bg-surface/85 px-4 backdrop-blur-xl transition-colors duration-300"
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
        class="text-text-primary group flex items-center gap-2.5 text-base font-bold tracking-tight no-underline"
      >
        <div class="bg-bg-elevated border-border-default flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-[0.4rem] border shadow-sm transition-all duration-150 group-hover:scale-105 group-hover:shadow-md">
          <Sparkles :size="16" class="text-accent" />
        </div>
        <span class="hidden md:inline group-hover:text-accent transition-colors duration-150">Smart Note</span>
      </router-link>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-1">
      <!-- Theme Toggle -->
      <button
        class="text-text-secondary hover:bg-bg-hover hover:text-accent relative flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
        title="Toggle Theme"
        @click="ui.toggleTheme()"
      >
        <Sun v-if="ui.theme === 'dark'" :size="18" />
        <Moon v-else :size="18" />
      </button>

      <!-- Auto Sync -->
      <router-link
        to="/auto-sync"
        class="text-text-secondary hover:bg-bg-hover hover:text-accent relative flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
        :title="t('nav.autoSync')"
      >
        <Zap :size="18" />
      </router-link>

      <!-- ── Bell Notification ── -->
      <div ref="bellRef" class="relative">
        <button
          id="notifications-btn"
          class="text-text-secondary hover:bg-bg-hover hover:text-text-primary relative flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
          :class="bellOpen ? 'bg-bg-hover text-text-primary' : ''"
          @click.stop="toggleBell"
        >
          <Bell :size="18" />
          <!-- Unread badge -->
          <span
            v-if="notiStore.unreadCount > 0"
            class="bg-error absolute top-1 right-1 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full text-[0.5625rem] font-bold text-white"
          >
            {{ notiStore.unreadCount > 9 ? '9+' : notiStore.unreadCount }}
          </span>
        </button>

        <!-- Dropdown Panel -->
        <transition name="dropdown">
          <div
            v-if="bellOpen"
            class="
              fixed left-1/2 top-[4.25rem] z-50 w-[calc(100vw-2rem)] -translate-x-1/2
              sm:absolute sm:left-auto sm:top-full sm:translate-x-0 sm:-right-2 sm:w-[22rem] sm:mt-3
              bg-bg-surface border-border-default overflow-hidden rounded-xl border shadow-xl
            "
            @click.stop
          >
            <!-- Header -->
            <div class="border-border-default flex items-center justify-between border-b px-4 py-3">
              <div class="flex items-center gap-2">
                <Bell :size="15" class="text-text-secondary" />
                <span class="text-sm font-semibold">{{ t('notifications.title') }}</span>
                <span
                  v-if="notiStore.unreadCount > 0"
                  class="bg-error/15 text-error rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold"
                >
                  {{ t('notifications.new', { n: notiStore.unreadCount }) }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <button
                  v-if="notiStore.unreadCount > 0"
                  class="text-text-tertiary hover:bg-bg-hover hover:text-accent flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.6875rem] transition-colors duration-150"
                  :title="t('notifications.readAll')"
                  @click="notiStore.markAllRead()"
                >
                  <CheckCheck :size="14" />
                  <span class="hidden sm:inline">{{ t('notifications.readAll') }}</span>
                </button>
                <button
                  v-if="notiStore.notifications.length > 0"
                  class="text-text-tertiary hover:bg-error/10 hover:text-error flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.6875rem] transition-colors duration-150"
                  :title="t('notifications.deleteAll')"
                  @click="notiStore.clearAll()"
                >
                  <Trash2 :size="14" />
                  <span class="hidden sm:inline">{{ t('notifications.deleteAll') }}</span>
                </button>
              </div>
            </div>

            <!-- Filter Tabs -->
            <div class="border-border-default flex border-b">
              <button
                v-for="tab in [{ key: 'all', labelKey: 'notifications.tabAll' }, { key: 'unread', labelKey: 'notifications.tabUnread' }]"
                :key="tab.key"
                class="border-border-default flex-1 border-r py-2 text-[0.75rem] font-medium transition-colors duration-150 last:border-r-0"
                :class="notiStore.filter === tab.key
                  ? 'bg-accent-subtle text-accent'
                  : 'text-text-secondary hover:bg-bg-hover'"
                @click="notiStore.filter = tab.key as any"
              >
                {{ t(tab.labelKey) }}
              </button>
            </div>

            <!-- Notification List -->
            <div class="max-h-[60vh] sm:max-h-[24rem] overflow-y-auto">
              <!-- Loading -->
              <div v-if="notiStore.loading" class="flex flex-col gap-2 p-3">
                <div v-for="i in 3" :key="i" class="skeleton h-14 rounded-lg" />
              </div>

              <!-- Items -->
              <template v-else-if="notiStore.filtered.length">
                <button
                  v-for="n in notiStore.filtered"
                  :key="n.id"
                  class="hover:bg-bg-hover flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150"
                  :class="!n.read ? 'bg-bg-elevated' : ''"
                  @click="notiStore.markRead(n.id)"
                >
                  <!-- Icon -->
                  <div
                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    :class="n.type === 'bank_in' ? 'bg-success/15' : n.type === 'bank_out' ? 'bg-error/15' : 'bg-info/15'"
                  >
                    <ArrowUpRight v-if="n.type === 'bank_in'" :size="15" class="text-success" />
                    <ArrowDownRight v-else-if="n.type === 'bank_out'" :size="15" class="text-error" />
                    <Bell v-else :size="15" class="text-info" />
                  </div>

                  <!-- Content -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <span
                        class="text-[0.8125rem] leading-tight"
                        :class="!n.read ? 'text-text-primary font-semibold' : 'text-text-secondary font-medium'"
                      >
                        {{ n.title }}
                      </span>
                      <!-- Unread dot -->
                      <span v-if="!n.read" class="bg-accent mt-1 h-2 w-2 shrink-0 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <p class="text-text-tertiary mt-0.5 truncate text-[0.75rem]">{{ n.body }}</p>
                    <span class="text-text-disabled mt-1 block text-[0.6875rem]">
                      {{ notiStore.timeSince(n.createdAt) }}
                    </span>
                  </div>
                </button>
              </template>

              <!-- Empty -->
              <div v-else class="flex flex-col items-center py-10 text-center">
                <BellOff :size="32" class="text-text-disabled mb-3" />
                <p class="text-text-tertiary text-sm font-medium">
                  {{ notiStore.filter === 'unread' ? t('notifications.emptyUnread') : t('notifications.empty') }}
                </p>
                <p class="text-text-disabled mt-1 text-[0.75rem]">
                  {{ t('notifications.emptyHint') }}
                </p>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Settings -->
      <router-link
        to="/settings"
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
        id="settings-btn"
      >
        <Settings :size="18" />
      </router-link>

      <div class="bg-border-default mx-2 h-6 w-px"></div>

      <!-- User / Logout -->
      <template v-if="auth.isAuthenticated">
        <button
          id="user-menu-btn"
          class="hover:bg-bg-hover group flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150"
          @click="handleLogout"
        >
          <div
            v-if="!auth.user?.avatarUrl || imgError"
            class="bg-accent-subtle text-accent flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
          >
            {{ auth.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <img
            v-else
            v-show="!imgError"
            :src="auth.user?.avatarUrl"
            alt="Avatar"
            class="h-7 w-7 rounded-full object-cover"
            referrerpolicy="no-referrer"
            @error="imgError = true"
          />
          <LogOut
            :size="14"
            class="text-text-tertiary opacity-100 md:opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          />
        </button>
      </template>
      <template v-else>
        <router-link
          to="/login"
          class="bg-accent text-bg-primary hover:bg-accent-hover flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors"
        >
          {{ t('common.login') }}
        </router-link>
      </template>
    </div>
  </header>
</template>

<style scoped>
.dropdown-enter-active {
  transition: opacity 150ms ease, transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-leave-active {
  transition: opacity 100ms ease, transform 100ms ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-0.375rem) scale(0.97);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
</style>
