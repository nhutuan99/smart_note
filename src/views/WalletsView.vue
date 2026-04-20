<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { formatVND } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
import { httpClient } from '@/shared/api/httpClient'
import { Plus, Trash2, Edit3, X, GripVertical } from 'lucide-vue-next'
import PinDialog from '@/components/PinDialog.vue'
import { useUiStore } from '@/stores/ui'
import type { Wallet } from '@/types'

const ui = useUiStore()
const finance = useFinanceStore()

onMounted(() => finance.fetchWallets())

const showAdd = ref(false)
const editId = ref<string | null>(null)
const newWallet = ref({ name: '', icon: '💰', color: '#10b981' })

// PIN state
const hasPin = ref(false)
const showPinDialog = ref(false)
const pendingDeleteId = ref<string | null>(null)

onMounted(async () => {
  try {
    const data = await httpClient.get<{ hasPin: boolean }>('/api/pin')
    hasPin.value = data?.hasPin || false
  } catch { /* no pin set */ }
})

const COLORS = [
  '#e62e2e', '#7b2d8e', '#d82d8b', '#0068ff', '#1a1f71',
  '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444',
  '#006838', '#1e3765', '#00529b', '#d11f26', '#003c7d'
]

async function addWallet() {
  if (!newWallet.value.name.trim()) return
  const brand = getWalletBrand(newWallet.value.name)
  await finance.addWallet({
    name: newWallet.value.name.trim(),
    balance: 0,
    currency: 'VND',
    icon: newWallet.value.icon,
    color: brand?.bgColor || newWallet.value.color,
    order: finance.wallets.length
  })
  newWallet.value = { name: '', icon: '💰', color: '#10b981' }
  showAdd.value = false
}

async function requestDelete(id: string) {
  if (hasPin.value) {
    pendingDeleteId.value = id
    showPinDialog.value = true
  } else {
    const confirmed = await ui.requestConfirm({
      title: 'Xóa ví',
      message: 'Bạn có chắc chắn muốn xóa ví này?\nCác giao dịch hiện tại sẽ không bị xóa.',
      danger: true,
      confirmText: 'Chắc chắn xóa'
    })
    if (confirmed) finance.deleteWallet(id)
  }
}

async function onPinConfirmed() {
  showPinDialog.value = false
  if (pendingDeleteId.value) {
    await finance.deleteWallet(pendingDeleteId.value)
    pendingDeleteId.value = null
  }
}

function startEdit(id: string) { editId.value = id }

async function saveEdit(id: string, newBalance: string) {
  const bal = parseInt(newBalance.replace(/[^0-9-]/g, '') || '0')
  await finance.updateWallet(id, { balance: bal })
  editId.value = null
}

// ── Drag & Drop ──

const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const isDraggingSaving = ref(false)

function onDragStart(e: DragEvent, wallet: Wallet) {
  draggedId.value = wallet.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', wallet.id)
  }
}

function onDragOver(e: DragEvent, wallet: Wallet) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  if (draggedId.value !== wallet.id) {
    dragOverId.value = wallet.id
  }
}

function onDragLeave() {
  dragOverId.value = null
}

async function onDrop(e: DragEvent, targetWallet: Wallet) {
  e.preventDefault()
  dragOverId.value = null

  if (!draggedId.value || draggedId.value === targetWallet.id) {
    draggedId.value = null
    return
  }

  const wallets = [...finance.wallets]
  const fromIdx = wallets.findIndex(w => w.id === draggedId.value)
  const toIdx = wallets.findIndex(w => w.id === targetWallet.id)

  if (fromIdx === -1 || toIdx === -1) { draggedId.value = null; return }

  // Reorder locally first (optimistic)
  const [moved] = wallets.splice(fromIdx, 1)
  wallets.splice(toIdx, 0, moved)
  wallets.forEach((w, i) => { w.order = i })
  finance.wallets = wallets

  // Persist to backend sequentially to prevent Cloudflare KV race conditions
  isDraggingSaving.value = true
  try {
    for (let i = 0; i < wallets.length; i++) {
      await finance.updateWallet(wallets[i].id, { order: i })
    }
  } catch {
    ui.showToast('error', 'Không thể lưu thứ tự ví')
    await finance.fetchWallets()
  } finally {
    isDraggingSaving.value = false
  }

  draggedId.value = null
}

function onDragEnd() {
  draggedId.value = null
  dragOverId.value = null
}
</script>

<template>
  <div class="mx-auto max-w-[50rem]">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold tracking-tight">Ví của tôi</h1>
        <span v-if="isDraggingSaving" class="text-text-disabled flex items-center gap-1 text-xs">
          <span class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Đang lưu...
        </span>
      </div>
      <button @click="showAdd = !showAdd" class="btn-primary">
        <Plus :size="16" />
        Thêm ví
      </button>
    </div>

    <!-- Add Wallet Form -->
    <transition name="slide">
      <div v-if="showAdd" class="bg-bg-surface border-border-default mb-6 rounded-xl border p-5">
        <h3 class="mb-4 text-sm font-semibold">Thêm ví mới</h3>
        <div class="flex flex-col gap-4">
          <input
            v-model="newWallet.name"
            placeholder="Tên ví (VD: Vietcombank, MoMo, Tiền mặt...)"
            class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
          />

          <div class="mb-2">
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">Ngân hàng & Ví phổ biến</span>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="brand in ['MoMo', 'ZaloPay', 'Techcombank', 'TPBank', 'Vietcombank', 'MBBank', 'Visa', 'Tiền mặt']"
                :key="brand"
                @click="newWallet.name = brand"
                class="border-border-default hover:border-accent hover:text-accent bg-bg-surface text-text-secondary rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150"
                :class="newWallet.name === brand ? 'border-accent bg-accent/10 text-accent' : ''"
              >
                {{ brand }}
              </button>
            </div>
          </div>

          <!-- Brand preview -->
          <div v-if="newWallet.name.trim()">
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">Preview</span>
            <div class="flex items-center gap-3">
              <div
                v-if="getWalletBrand(newWallet.name)"
                class="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold"
                :style="{ backgroundColor: getWalletBrand(newWallet.name)!.bgColor, color: getWalletBrand(newWallet.name)!.textColor }"
              >
                {{ getWalletBrand(newWallet.name)!.abbr }}
              </div>
              <div v-else class="flex h-10 w-10 items-center justify-center rounded-xl text-lg" :style="{ backgroundColor: newWallet.color + '30' }">
                {{ newWallet.icon }}
              </div>
              <span class="text-sm font-medium">{{ newWallet.name }}</span>
            </div>
          </div>

          <div>
            <span class="text-text-tertiary mb-2 block text-[0.6875rem]">Màu (cho ví tùy chỉnh)</span>
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
            <button @click="showAdd = false" class="border-border-default text-text-secondary hover:bg-bg-hover flex-1 rounded-lg border py-2 text-sm transition-all duration-150">Hủy</button>
            <button @click="addWallet" :disabled="!newWallet.name.trim()" class="btn-primary flex-1 justify-center py-2 disabled:opacity-40">Thêm</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Wallet List -->
    <div class="space-y-3">
      <!-- Loading Skeletons -->
      <template v-if="finance.loading">
        <div v-for="i in 3" :key="'skel-' + i" class="bg-bg-surface border-border-default flex items-center gap-4 rounded-xl border p-5">
          <div class="skeleton h-12 w-12 rounded-xl"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-32"></div>
            <div class="skeleton h-3 w-16"></div>
          </div>
          <div class="skeleton h-6 w-24"></div>
        </div>
      </template>

      <!-- Actual List (Draggable) -->
      <template v-else>
        <div
          v-for="w in finance.wallets"
          :key="w.id"
          draggable="true"
          class="wallet-item bg-bg-surface border-border-default flex items-center gap-4 rounded-xl border p-5 transition-all duration-150"
          :class="{
            'dragging': draggedId === w.id,
            'drag-over': dragOverId === w.id,
            'hover:border-border-strong': draggedId === null
          }"
          @dragstart="onDragStart($event, w)"
          @dragover="onDragOver($event, w)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, w)"
          @dragend="onDragEnd"
        >
          <!-- Drag Handle -->
          <div class="drag-handle text-text-disabled hover:text-text-tertiary shrink-0 cursor-grab active:cursor-grabbing">
            <GripVertical :size="18" />
          </div>

          <!-- Brand Logo -->
          <div class="flex h-12 w-12 shrink-0 items-center justify-center">
            <div v-if="getWalletBrand(w.name)?.logoUrl" class="flex h-12 w-12 overflow-hidden rounded-xl bg-white border border-border-default shadow-sm p-1.5">
              <img :src="getWalletBrand(w.name)!.logoUrl" :alt="w.name" class="h-full w-full object-contain object-center" loading="lazy" />
            </div>
            <div
              v-else-if="getWalletBrand(w.name)"
              class="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
              :style="{ backgroundColor: getWalletBrand(w.name)!.bgColor, color: getWalletBrand(w.name)!.textColor }"
            >
              {{ getWalletBrand(w.name)!.abbr }}
            </div>
            <div v-else class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" :style="{ backgroundColor: w.color + '20' }">
              {{ w.icon }}
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold">{{ w.name }}</div>
            <div class="text-text-tertiary text-[0.6875rem]">{{ w.currency }}</div>
          </div>

          <!-- Edit mode -->
          <div v-if="editId === w.id" class="flex items-center gap-2">
            <input
              :value="w.balance"
              @keydown.enter="saveEdit(w.id, ($event.target as HTMLInputElement).value)"
              type="text"
              class="border-accent bg-bg-elevated text-text-primary w-[8rem] rounded-lg border px-2 py-1 text-right text-sm focus:outline-none"
              autofocus
            />
            <button @click="editId = null" class="text-text-tertiary hover:text-text-primary p-1">
              <X :size="14" />
            </button>
          </div>

          <!-- Normal mode -->
          <div v-else class="flex items-center gap-2">
            <span class="text-base font-bold" :class="w.balance >= 0 ? 'text-text-primary' : 'text-error'">
              {{ formatVND(w.balance) }}
            </span>
            <button @click="startEdit(w.id)" class="text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded p-2 transition-all duration-150 touch-target" title="Sửa số dư">
              <Edit3 :size="16" />
            </button>
            <button @click="requestDelete(w.id)" class="text-text-tertiary hover:text-error hover:bg-bg-hover rounded p-2 transition-all duration-150 touch-target" title="Xóa ví">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Total -->
    <div class="bg-bg-elevated border-border-default mt-6 flex items-center justify-between rounded-xl border p-5">
      <span class="text-text-secondary text-sm font-medium">Tổng tất cả ví</span>
      <span class="text-xl font-bold" :class="finance.totalBalance >= 0 ? 'text-accent' : 'text-error'">
        {{ formatVND(finance.totalBalance) }}
      </span>
    </div>

    <!-- PIN Dialog -->
    <PinDialog
      :show="showPinDialog"
      title="Xác nhận xóa ví"
      message="Nhập mã PIN để xóa ví này"
      @confirmed="onPinConfirmed"
      @cancelled="showPinDialog = false; pendingDeleteId = null"
    />
  </div>
</template>

<style>
.wallet-item {
  user-select: none;
}

.wallet-item.dragging {
  opacity: 0.4;
  scale: 0.98;
}

.wallet-item.drag-over {
  border-color: var(--accent) !important;
  background: var(--accent-subtle);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.drag-handle {
  transition: color 120ms;
}

.slide-enter-active,
.slide-leave-active {
  transition: max-height 200ms ease, opacity 200ms ease;
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
