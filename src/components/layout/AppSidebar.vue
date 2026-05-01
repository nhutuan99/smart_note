<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useFinanceStore } from '@/stores/finance'
import { useNotesStore } from '@/stores/notes'
import { useDevice } from '@/composables/useDevice'
import { formatVNDShort } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FileText,
  Settings,
  Pin,
  Clock,
  Plus,
  Bug,
  Newspaper,
  PenLine,
  Waypoints
} from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()
const finance = useFinanceStore()
const notesStore = useNotesStore()
const { isMobileOrTablet } = useDevice()

const navItems = [
  { key: 'nav.dashboard', icon: LayoutDashboard, route: '/' },
  { key: 'nav.transactions', icon: ArrowLeftRight, route: '/transactions' },
  { key: 'nav.wallets', icon: Wallet, route: '/wallets' },
  { key: 'nav.planning', icon: Waypoints, route: '/planning' },
  { key: 'nav.notes', icon: FileText, route: '/notes' },
  { key: 'nav.blog', icon: Newspaper, route: '/blog' },
  { key: 'nav.settings', icon: Settings, route: '/settings' }
]

const isActive = (path: string) => (path === '/' ? route.path === '/' : route.path.startsWith(path))

/** Đóng sidebar trên mobile/tablet sau mỗi action navigate */
function closeSidebarOnMobile() {
  if (isMobileOrTablet.value) {
    ui.closeSidebar()
  }
}

async function quickAdd() {
  router.push('/transactions/add')
  closeSidebarOnMobile()
}

function navigateWallet(walletId: string) {
  finance.filter = { walletId }
  router.push('/transactions')
  closeSidebarOnMobile()
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="ui.sidebarOpen"
    class="fixed inset-0 z-30 bg-black/50 md:hidden"
    @click="ui.toggleSidebar"
  ></div>

  <aside
    class="pwa-sidebar-safe bg-bg-surface border-border-default fixed top-[3.5rem] bottom-0 z-40 flex -translate-x-full flex-col overflow-hidden border-r transition-all duration-300 md:translate-x-0"
    :class="[
      ui.sidebarOpen ? 'w-[16.25rem] translate-x-0' : 'w-[3.75rem] md:w-[3.75rem]',
      ui.sidebarOpen ? '' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <div class="flex flex-1 flex-col overflow-x-hidden overflow-y-auto p-3">
      <!-- Quick Add Transaction -->
      <button
        @click="quickAdd"
        class="btn-secondary mb-4 w-full whitespace-nowrap"
        :class="{ 'justify-center px-2': !ui.sidebarOpen }"
      >
        <Plus class="shrink-0" :size="ui.sidebarOpen ? 16 : 22" />
        <span v-if="ui.sidebarOpen">{{ t('nav.addTransaction') }}</span>
      </button>

      <!-- Nav -->
      <nav class="mb-4">
        <div
          v-if="ui.sidebarOpen"
          class="text-text-tertiary px-3 py-2 text-[0.6875rem] font-semibold tracking-wider"
        >
          {{ t('common.menu') }}
        </div>
        <router-link
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap no-underline transition-all duration-150"
          :class="[
            isActive(item.route) ? 'bg-bg-hover text-accent font-medium' : '',
            !ui.sidebarOpen ? 'justify-center px-2' : ''
          ]"
          @click="closeSidebarOnMobile"
        >
          <component
            :is="item.icon"
            :size="ui.sidebarOpen ? 18 : 22"
          />
          <span v-if="ui.sidebarOpen">{{ t(item.key) }}</span>
        </router-link>

        <router-link
          v-if="auth.user?.email === 'tintphcm@gmail.com'"
          to="/admin/blog"
          class="admin-blog-btn mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap no-underline transition-all duration-200"
          :class="[
            isActive('/admin/blog') ? 'admin-blog-btn--active' : '',
            !ui.sidebarOpen ? 'justify-center px-2' : ''
          ]"
          @click="closeSidebarOnMobile"
        >
          <PenLine :size="ui.sidebarOpen ? 16 : 20" />
          <span v-if="ui.sidebarOpen">{{ t('blog.manageTitle') }}</span>
        </router-link>

      </nav>

      <!-- Wallet Balances -->
      <div
        v-if="ui.sidebarOpen && finance.wallets.length > 0"
        class="mb-4"
      >
        <div class="text-text-tertiary px-3 py-2 text-[0.6875rem] font-semibold tracking-wider">
          {{ t('nav.walletSection') }}
        </div>
        <div
          v-for="w in finance.wallets.slice(0, 5)"
          :key="w.id"
          class="hover:bg-bg-hover flex cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
          @click="navigateWallet(w.id)"
        >
          <span class="text-text-secondary flex items-center gap-2">
            <template v-if="getWalletBrand(w.name)">
              <div v-if="getWalletBrand(w.name)?.logoUrl" class="flex h-4 w-4 shrink-0 overflow-hidden rounded-[3px] bg-white border border-border-default/50 p-[2px]">
                <img
                  :src="getWalletBrand(w.name)!.logoUrl"
                  class="h-full w-full object-contain object-center"
                />
              </div>
              <span v-else class="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold"
                :style="{ backgroundColor: getWalletBrand(w.name)!.bgColor, color: getWalletBrand(w.name)!.textColor }"
              >
                {{ getWalletBrand(w.name)!.abbr }}
              </span>
            </template>
            <span v-else class="text-sm font-emoji">{{ w.icon }}</span>
            <span class="truncate text-[0.75rem]">{{ w.name }}</span>
          </span>
          <span
            class="text-[0.6875rem] font-medium"
            :class="w.balance >= 0 ? 'text-text-secondary' : 'text-error'"
          >
            {{ formatVNDShort(w.balance) }}
          </span>
        </div>
      </div>

      <!-- Recent Notes -->
      <div
        v-if="ui.sidebarOpen && notesStore.notes.length > 0"
        class="mb-4"
      >
        <div class="text-text-tertiary px-3 py-2 text-[0.6875rem] font-semibold tracking-wider uppercase">
          {{ t('nav.recentNotes') }}
        </div>
        <div
          v-for="note in notesStore.notes.slice(0, 5)"
          :key="note.id"
          class="hover:bg-bg-hover flex cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
          @click="router.push('/notes/' + note.id); closeSidebarOnMobile()"
        >
          <span class="text-text-secondary flex items-center gap-2 min-w-0">
            <FileText :size="14" class="shrink-0 text-text-tertiary" />
            <span class="truncate text-[0.75rem]">{{ note.title || t('notes.untitledNote') }}</span>
          </span>
        </div>
      </div>

      <!-- Stats Footer -->
      <div
        v-if="ui.sidebarOpen"
        class="border-border-default mt-auto border-t pt-3"
      >
        <div class="flex items-center justify-between px-3 py-1">
          <span class="text-text-tertiary text-[0.6875rem]">{{ t('nav.totalBalance') }}</span>
          <span class="text-accent text-[0.6875rem] font-semibold">
            {{ formatVNDShort(finance.totalBalance) }}
          </span>
        </div>
        <div class="flex items-center justify-between px-3 py-1">
          <span class="text-text-tertiary text-[0.6875rem]">{{ t('nav.notes') }}</span>
          <span class="text-text-secondary text-[0.6875rem] font-medium">
            {{ notesStore.totalNotes }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.admin-blog-btn {
  position: relative;
  background: linear-gradient(135deg, rgba(124, 111, 247, 0.12), rgba(168, 85, 247, 0.08));
  border: 1px solid rgba(124, 111, 247, 0.25);
  color: var(--color-accent);
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: 0.01em;
  overflow: hidden;
}
.admin-blog-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(124, 111, 247, 0.15), rgba(168, 85, 247, 0.1));
  opacity: 0;
  transition: opacity 0.2s ease;
}
.admin-blog-btn:hover::before {
  opacity: 1;
}
.admin-blog-btn:hover {
  border-color: rgba(124, 111, 247, 0.45);
  box-shadow: 0 0 16px rgba(124, 111, 247, 0.15);
  transform: translateY(-1px);
}
.admin-blog-btn--active {
  background: linear-gradient(135deg, rgba(124, 111, 247, 0.2), rgba(168, 85, 247, 0.12));
  border-color: rgba(124, 111, 247, 0.4);
  box-shadow: 0 0 12px rgba(124, 111, 247, 0.12);
}
</style>
