<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { formatVND } from '@/constants/finance'
import { Plus, Trash2, Edit3, X, Check } from 'lucide-vue-next'

const finance = useFinanceStore()

onMounted(() => finance.fetchWallets())

const showAdd = ref(false)
const editId = ref<string | null>(null)
const newWallet = ref({ name: '', icon: '💰', color: '#10b981' })

const ICONS = ['🏦', '🏧', '📱', '💙', '💳', '💵', '💰', '🪙', '💎', '🔐']
const COLORS = [
  '#e62e2e',
  '#7b2d8e',
  '#d82d8b',
  '#0068ff',
  '#1a1f71',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444'
]

async function addWallet() {
  if (!newWallet.value.name.trim()) return
  await finance.addWallet({
    name: newWallet.value.name.trim(),
    balance: 0,
    currency: 'VND',
    icon: newWallet.value.icon,
    color: newWallet.value.color,
    order: finance.wallets.length
  })
  newWallet.value = { name: '', icon: '💰', color: '#10b981' }
  showAdd.value = false
}

async function deleteWallet(id: string) {
  if (confirm('Xóa ví này? Các giao dịch liên quan sẽ không bị xóa.')) {
    await finance.deleteWallet(id)
  }
}

function startEdit(id: string) {
  editId.value = id
}

async function saveEdit(id: string, newBalance: string) {
  const bal = parseInt(newBalance.replace(/[^0-9-]/g, '') || '0')
  await finance.updateWallet(id, { balance: bal })
  editId.value = null
}
</script>

<template>
  <div class="mx-auto max-w-[50rem]">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold tracking-tight">Ví của tôi</h1>
      <button
        @click="showAdd = !showAdd"
        class="btn-primary"
      >
        <Plus :size="16" />
        Thêm ví
      </button>
    </div>

    <!-- Add Wallet Form -->
    <transition name="slide">
      <div
        v-if="showAdd"
        class="bg-bg-surface border-border-default mb-6 rounded-xl border p-5"
      >
        <h3 class="mb-4 text-sm font-semibold">Thêm ví mới</h3>
        <div class="flex flex-col gap-4">
          <input
            v-model="newWallet.name"
            placeholder="Tên ví (VD: Agribank)"
            class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
          />
          <div>
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">Icon</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="icon in ICONS"
                :key="icon"
                class="flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all duration-150"
                :class="
                  newWallet.icon === icon
                    ? 'border-accent bg-accent-subtle'
                    : 'border-border-default hover:border-border-strong'
                "
                @click="newWallet.icon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>
          <div>
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">Màu</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in COLORS"
                :key="color"
                class="h-7 w-7 rounded-full border-2 transition-all duration-150"
                :class="newWallet.color === color ? 'scale-110 border-white' : 'border-transparent'"
                :style="{ backgroundColor: color }"
                @click="newWallet.color = color"
              ></button>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="showAdd = false"
              class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-lg border py-2 text-sm transition-all duration-150"
            >
              Hủy
            </button>
            <button
              @click="addWallet"
              :disabled="!newWallet.name.trim()"
              class="btn-primary flex-1 justify-center py-2 disabled:opacity-40"
            >
              Thêm
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Wallet List -->
    <div class="space-y-3">
      <div
        v-for="w in finance.wallets"
        :key="w.id"
        class="bg-bg-surface border-border-default hover:border-border-strong flex items-center gap-4 rounded-xl border p-5 transition-all duration-150"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          :style="{ backgroundColor: w.color + '20' }"
        >
          {{ w.icon }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">{{ w.name }}</div>
          <div class="text-text-tertiary text-[0.6875rem]">{{ w.currency }}</div>
        </div>

        <div
          v-if="editId === w.id"
          class="flex items-center gap-2"
        >
          <input
            :value="w.balance"
            @keydown.enter="saveEdit(w.id, ($event.target as HTMLInputElement).value)"
            type="text"
            class="border-accent bg-bg-elevated text-text-primary w-[8rem] rounded-lg border px-2 py-1 text-right text-sm focus:outline-none"
            autofocus
          />
          <button
            @click="editId = null"
            class="text-text-tertiary hover:text-text-primary p-1"
          >
            <X :size="14" />
          </button>
        </div>

        <div
          v-else
          class="flex items-center gap-2"
        >
          <span
            class="text-base font-bold"
            :class="w.balance >= 0 ? 'text-text-primary' : 'text-error'"
          >
            {{ formatVND(w.balance) }}
          </span>
          <button
            @click="startEdit(w.id)"
            class="text-text-disabled hover:text-text-primary hover:bg-bg-hover rounded p-1.5 transition-all duration-150"
            title="Sửa số dư"
          >
            <Edit3 :size="14" />
          </button>
          <button
            @click="deleteWallet(w.id)"
            class="text-text-disabled hover:text-error hover:bg-bg-hover rounded p-1.5 transition-all duration-150"
            title="Xóa ví"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Total -->
    <div
      class="bg-bg-elevated border-border-default mt-6 flex items-center justify-between rounded-xl border p-5"
    >
      <span class="text-text-secondary text-sm font-medium">Tổng tất cả ví</span>
      <span
        class="text-xl font-bold"
        :class="finance.totalBalance >= 0 ? 'text-accent' : 'text-error'"
      >
        {{ formatVND(finance.totalBalance) }}
      </span>
    </div>
  </div>
</template>

<style>
.slide-enter-active,
.slide-leave-active {
  transition:
    max-height 200ms ease,
    opacity 200ms ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 37.5rem;
  opacity: 1;
}
</style>
