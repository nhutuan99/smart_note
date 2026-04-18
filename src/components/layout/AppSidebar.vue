<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useFinanceStore } from '@/stores/finance'
import { useNotesStore } from '@/stores/notes'
import { formatVNDShort } from '@/constants/finance'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FileText,
  Settings,
  Pin,
  Clock,
  Plus,
  ChevronLeft
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const ui = useUiStore()
const finance = useFinanceStore()
const notesStore = useNotesStore()

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/' },
  { label: 'Giao dịch', icon: ArrowLeftRight, route: '/transactions' },
  { label: 'Ví', icon: Wallet, route: '/wallets' },
  { label: 'Notes', icon: FileText, route: '/notes' },
  { label: 'Cài đặt', icon: Settings, route: '/settings' }
]

const isActive = (path: string) => (path === '/' ? route.path === '/' : route.path.startsWith(path))

async function quickAdd() {
  router.push('/transactions/add')
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
    class="bg-bg-surface border-border-default fixed top-[3.5rem] bottom-0 z-40 flex -translate-x-full flex-col overflow-hidden border-r transition-all duration-300 md:translate-x-0"
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
        <Plus :size="16" />
        <span v-if="ui.sidebarOpen">Thêm giao dịch</span>
      </button>

      <!-- Nav -->
      <nav class="mb-4">
        <div
          v-if="ui.sidebarOpen"
          class="text-text-tertiary px-3 py-2 text-[0.6875rem] font-semibold tracking-wider"
        >
          MENU
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
        >
          <component
            :is="item.icon"
            :size="18"
          />
          <span v-if="ui.sidebarOpen">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Wallet Balances -->
      <div
        v-if="ui.sidebarOpen"
        class="mb-4"
      >
        <div class="text-text-tertiary px-3 py-2 text-[0.6875rem] font-semibold tracking-wider">
          VÍ
        </div>
        <div
          v-for="w in finance.wallets.slice(0, 5)"
          :key="w.id"
          class="hover:bg-bg-hover flex cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-all duration-150"
          @click="finance.filter = { walletId: w.id }; router.push('/transactions')"
        >
          <span class="text-text-secondary flex items-center gap-2">
            <span class="text-sm">{{ w.icon }}</span>
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

      <!-- Stats Footer -->
      <div
        v-if="ui.sidebarOpen"
        class="border-border-default mt-auto border-t pt-3"
      >
        <div class="flex items-center justify-between px-3 py-1">
          <span class="text-text-tertiary text-[0.6875rem]">Tổng ví</span>
          <span class="text-accent text-[0.6875rem] font-semibold">
            {{ formatVNDShort(finance.totalBalance) }}
          </span>
        </div>
        <div class="flex items-center justify-between px-3 py-1">
          <span class="text-text-tertiary text-[0.6875rem]">Notes</span>
          <span class="text-text-secondary text-[0.6875rem] font-medium">
            {{ notesStore.totalNotes }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
