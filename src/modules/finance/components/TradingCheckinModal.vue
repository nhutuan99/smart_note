<script setup lang="ts">
// 1. Vue core
import { ref, computed, watch } from 'vue'
// 2. Stores & composables
import { useTradingCheckin } from '@/composables/useTradingCheckin'
import { useUiStore } from '@/stores/ui'
// 3. Types
import type { TradingCheckinEntry } from '@/types'
// 4. Utils / constants
import { formatVND } from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
// 5. Components & icons
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import LogoLoader from '@/components/ui/LogoLoader.vue'
import { X, TrendingUp, TrendingDown, DollarSign, Percent, Check, ChevronRight, BookOpen } from 'lucide-vue-next'

// ── Props / Emits ──

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const ui = useUiStore()
const { trading, finance, getSelectedWallets } = useTradingCheckin()

// ── Step management: 'setup' | 'input' | 'summary' ──

type Step = 'setup' | 'input' | 'summary'
const step = ref<Step>(trading.hasWalletsConfigured ? 'input' : 'setup')

// Reset step when modal opens
watch(() => props.modelValue, (open) => {
  if (open) step.value = trading.hasWalletsConfigured ? 'input' : 'setup'
})

// ── Step 1: Wallet setup ──

const pendingWalletIds = ref<string[]>([...trading.config.selectedWalletIds])
const isSavingConfig = ref(false)

function toggleWallet(id: string) {
  const idx = pendingWalletIds.value.indexOf(id)
  if (idx === -1) pendingWalletIds.value.push(id)
  else pendingWalletIds.value.splice(idx, 1)
}

async function confirmSetup() {
  if (pendingWalletIds.value.length === 0) {
    ui.showToast('warning', 'Chọn ít nhất 1 ví để theo dõi.')
    return
  }
  isSavingConfig.value = true
  await trading.saveConfig(pendingWalletIds.value)
  isSavingConfig.value = false
  step.value = 'input'
}

// ── Step 2: P&L input per wallet ──

interface EntryDraft {
  walletId: string
  walletName: string
  inputMode: 'percent' | 'amount'
  inputValue: number      // raw user input
  depositAmount: number
  balanceBefore: number
}

const drafts = ref<EntryDraft[]>([])
const sessionNote = ref('')

// Rebuild drafts when step becomes 'input' or wallets change
watch(
  [() => step.value, () => trading.config.selectedWalletIds, () => finance.wallets],
  ([s]) => {
    if (s !== 'input') return
    const wallets = getSelectedWallets()
    drafts.value = wallets.map((w) => ({
      walletId: w.id,
      walletName: w.name,
      inputMode: 'percent',
      inputValue: 0,
      depositAmount: 0,
      balanceBefore: w.balance
    }))
  },
  { immediate: true }
)

/** Computed P&L amount (VND) for a draft entry */
function calcPnl(d: EntryDraft): number {
  if (d.inputMode === 'percent') {
    return Math.round(d.balanceBefore * (d.inputValue / 100))
  }
  return d.inputValue
}

/** Computed balance after for a draft */
function calcBalanceAfter(d: EntryDraft): number {
  return d.balanceBefore + calcPnl(d) + d.depositAmount
}

function goToSummary() {
  const hasInput = drafts.value.some((d) => d.inputValue !== 0 || d.depositAmount !== 0)
  if (!hasInput) {
    ui.showToast('warning', 'Nhập lãi/lỗ hoặc nạp tiền cho ít nhất 1 ví.')
    return
  }
  step.value = 'summary'
}

// ── Step 3: Summary ──

const summaryEntries = computed<TradingCheckinEntry[]>(() =>
  drafts.value.map((d) => ({
    walletId: d.walletId,
    walletName: d.walletName,
    inputMode: d.inputMode,
    inputValue: d.inputValue,
    pnlAmount: calcPnl(d),
    depositAmount: d.depositAmount,
    balanceBefore: d.balanceBefore,
    balanceAfter: calcBalanceAfter(d)
  }))
)

const totalPnl = computed(() => summaryEntries.value.reduce((s, e) => s + e.pnlAmount, 0))
const totalDeposit = computed(() => summaryEntries.value.reduce((s, e) => s + e.depositAmount, 0))

const isSubmitting = ref(false)

async function submit() {
  isSubmitting.value = true
  const ok = await trading.submitCheckin(summaryEntries.value, sessionNote.value)
  isSubmitting.value = false
  if (ok) {
    ui.showToast('success', 'Check-in thành công! 🎯')
    emit('update:modelValue', false)
  } else {
    ui.showToast('error', 'Không thể lưu check-in. Vui lòng thử lại.')
  }
}

// ── Helpers ──

function getWalletLogo(name: string, customLogoUrl?: string): string {
  if (customLogoUrl) return customLogoUrl
  return getWalletBrand(name)?.logoUrl ?? ''
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <!-- Panel -->
        <div
          class="relative z-10 w-full sm:max-w-lg bg-bg-surface rounded-t-2xl sm:rounded-2xl border border-border-default shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkin-modal-title"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-border-subtle shrink-0">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <BookOpen :size="16" class="text-accent" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 id="checkin-modal-title" class="text-sm font-bold text-text-primary">
                Trading Check-in
              </h2>
              <p class="text-[11px] text-text-tertiary">
                {{ step === 'setup' ? 'Chọn ví theo dõi' : step === 'input' ? 'Nhập kết quả hôm nay' : 'Xác nhận check-in' }}
              </p>
            </div>
            <!-- Step indicator -->
            <div class="flex items-center gap-1 mr-2">
              <span
                v-for="s in ['setup', 'input', 'summary']"
                :key="s"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="s === step ? 'w-4 bg-accent' : 'w-1.5 bg-border-strong'"
              />
            </div>
            <button
              @click="close"
              class="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
              aria-label="Đóng"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Scrollable content -->
          <div class="flex-1 overflow-y-auto overscroll-contain">

            <!-- ═══ STEP 1: Wallet Setup ═══ -->
            <div v-if="step === 'setup'" class="p-5 space-y-3">
              <p class="text-xs text-text-secondary leading-relaxed">
                Chọn các ví bạn muốn theo dõi lãi/lỗ mỗi ngày. Bạn có thể thay đổi sau.
              </p>

              <div v-if="finance.loading" class="space-y-2">
                <div v-for="i in 3" :key="i" class="skeleton h-14 rounded-xl" />
              </div>

              <div v-else-if="finance.wallets.length === 0" class="text-center py-8 text-text-tertiary text-sm">
                Chưa có ví nào. Hãy tạo ví trước.
              </div>

              <div v-else class="space-y-2">
                <button
                  v-for="w in finance.wallets"
                  :key="w.id"
                  @click="toggleWallet(w.id)"
                  class="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left"
                  :class="pendingWalletIds.includes(w.id)
                    ? 'border-accent bg-accent/5'
                    : 'border-border-default bg-bg-elevated hover:border-border-strong'"
                >
                  <!-- Logo -->
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-border-default/30">
                    <img
                      v-if="getWalletLogo(w.name, w.customLogoUrl)"
                      :src="getWalletLogo(w.name, w.customLogoUrl)"
                      :alt="w.name"
                      class="h-6 w-6 object-contain"
                      loading="lazy"
                    />
                    <span v-else class="text-sm" :style="{ color: w.color }">{{ w.icon }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-text-primary truncate">{{ w.name }}</div>
                    <div class="text-[11px] text-text-tertiary">{{ formatVND(w.balance) }}</div>
                  </div>
                  <!-- Checkbox -->
                  <div
                    class="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    :class="pendingWalletIds.includes(w.id) ? 'border-accent bg-accent' : 'border-border-strong'"
                  >
                    <Check v-if="pendingWalletIds.includes(w.id)" :size="11" class="text-white" />
                  </div>
                </button>
              </div>
            </div>

            <!-- ═══ STEP 2: P&L Input ═══ -->
            <div v-else-if="step === 'input'" class="p-5 space-y-4">

              <div v-if="trading.configLoading" class="space-y-3">
                <div v-for="i in 2" :key="i" class="skeleton h-28 rounded-xl" />
              </div>

              <div v-else-if="drafts.length === 0" class="text-center py-8 text-text-tertiary text-sm">
                Chưa có ví nào được chọn.
              </div>

              <div
                v-for="(draft, idx) in drafts"
                :key="draft.walletId"
                class="rounded-xl border border-border-default bg-bg-elevated p-4 space-y-3"
              >
                <!-- Wallet header -->
                <div class="flex items-center gap-2.5">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-border-default/30">
                    <img
                      v-if="getWalletLogo(draft.walletName)"
                      :src="getWalletLogo(draft.walletName)"
                      :alt="draft.walletName"
                      class="h-5 w-5 object-contain"
                      loading="lazy"
                    />
                    <span v-else class="text-xs font-bold text-text-secondary">{{ draft.walletName.substring(0,2) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-text-primary">{{ draft.walletName }}</div>
                    <div class="text-[11px] text-text-disabled">Số dư: {{ formatVND(draft.balanceBefore) }}</div>
                  </div>
                  <!-- Live P&L preview -->
                  <div
                    class="text-sm font-bold tabular-nums"
                    :class="calcPnl(draft) >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ calcPnl(draft) >= 0 ? '+' : '' }}{{ formatVND(calcPnl(draft)) }}
                  </div>
                </div>

                <!-- Input mode toggle -->
                <div class="flex items-center gap-1 p-0.5 bg-bg-surface rounded-lg border border-border-default">
                  <button
                    @click="drafts[idx].inputMode = 'percent'; drafts[idx].inputValue = 0"
                    class="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                    :class="draft.inputMode === 'percent' ? 'bg-accent text-white shadow-sm' : 'text-text-tertiary hover:text-text-primary'"
                  >
                    <Percent :size="11" /> %
                  </button>
                  <button
                    @click="drafts[idx].inputMode = 'amount'; drafts[idx].inputValue = 0"
                    class="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                    :class="draft.inputMode === 'amount' ? 'bg-accent text-white shadow-sm' : 'text-text-tertiary hover:text-text-primary'"
                  >
                    <DollarSign :size="11" /> VND
                  </button>
                </div>

                <!-- P&L input -->
                <div class="space-y-1">
                  <label class="text-[11px] text-text-tertiary font-medium">
                    Lãi / Lỗ
                    <span class="text-text-disabled">(âm = lỗ)</span>
                  </label>
                  <div class="relative">
                    <!-- Percent input -->
                    <input
                      v-if="draft.inputMode === 'percent'"
                      v-model.number="drafts[idx].inputValue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 pr-8 text-sm text-right focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                    />
                    <!-- VND input -->
                    <CurrencyInput
                      v-else
                      :modelValue="draft.inputValue"
                      @update:modelValue="drafts[idx].inputValue = $event"
                      :allowNegative="true"
                      :placeholder="'0'"
                      :className="'w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 pr-8 text-sm text-right focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors'"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-disabled pointer-events-none">
                      {{ draft.inputMode === 'percent' ? '%' : '₫' }}
                    </span>
                  </div>
                </div>

                <!-- Deposit input -->
                <div class="space-y-1">
                  <label class="text-[11px] text-text-tertiary font-medium">
                    Nạp thêm vốn
                    <span class="text-text-disabled">(tuỳ chọn)</span>
                  </label>
                  <div class="relative">
                    <CurrencyInput
                      :modelValue="draft.depositAmount"
                      @update:modelValue="drafts[idx].depositAmount = $event"
                      placeholder="0"
                      :className="'w-full rounded-lg border border-border-default bg-bg-surface px-3 py-2 pr-6 text-sm text-right focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors'"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-disabled pointer-events-none">₫</span>
                  </div>
                </div>

                <!-- Balance after preview -->
                <div class="flex items-center justify-between text-[11px] rounded-lg bg-bg-surface px-3 py-2 border border-border-subtle">
                  <span class="text-text-tertiary">Số dư sau:</span>
                  <span class="font-bold tabular-nums" :class="calcBalanceAfter(draft) >= 0 ? 'text-text-primary' : 'text-error'">
                    {{ formatVND(calcBalanceAfter(draft)) }}
                  </span>
                </div>
              </div>

              <!-- Session note -->
              <div class="space-y-1">
                <label class="text-[11px] text-text-tertiary font-medium">Ghi chú phiên (tuỳ chọn)</label>
                <textarea
                  v-model="sessionNote"
                  rows="2"
                  placeholder="Nhận xét ngắn về phiên giao dịch hôm nay..."
                  maxlength="500"
                  class="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <!-- ═══ STEP 3: Summary ═══ -->
            <div v-else-if="step === 'summary'" class="p-5 space-y-4">

              <!-- Total P&L card -->
              <div
                class="rounded-2xl p-4 text-center border"
                :class="totalPnl >= 0
                  ? 'bg-success/5 border-success/20'
                  : 'bg-error/5 border-error/20'"
              >
                <p class="text-xs text-text-tertiary mb-1">Tổng lãi / lỗ hôm nay</p>
                <div
                  class="text-2xl font-bold tabular-nums flex items-center justify-center gap-1"
                  :class="totalPnl >= 0 ? 'text-success' : 'text-error'"
                >
                  <TrendingUp v-if="totalPnl >= 0" :size="20" />
                  <TrendingDown v-else :size="20" />
                  {{ totalPnl >= 0 ? '+' : '' }}{{ formatVND(totalPnl) }}
                </div>
                <p v-if="totalDeposit > 0" class="mt-1 text-[11px] text-text-disabled">
                  + {{ formatVND(totalDeposit) }} nạp thêm
                </p>
              </div>

              <!-- Per-wallet breakdown -->
              <div class="space-y-2">
                <div
                  v-for="e in summaryEntries"
                  :key="e.walletId"
                  class="flex items-center gap-3 rounded-xl border border-border-default bg-bg-elevated px-3.5 py-3"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-border-default/30">
                    <img
                      v-if="getWalletLogo(e.walletName)"
                      :src="getWalletLogo(e.walletName)"
                      :alt="e.walletName"
                      class="h-5 w-5 object-contain"
                      loading="lazy"
                    />
                    <span v-else class="text-xs font-bold text-text-secondary">{{ e.walletName.substring(0,2) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-text-primary">{{ e.walletName }}</div>
                    <div class="text-[11px] text-text-disabled">
                      {{ formatVND(e.balanceBefore) }} → {{ formatVND(e.balanceAfter) }}
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <div
                      class="text-sm font-bold tabular-nums"
                      :class="e.pnlAmount >= 0 ? 'text-success' : 'text-error'"
                    >
                      {{ e.pnlAmount >= 0 ? '+' : '' }}{{ formatVND(e.pnlAmount) }}
                    </div>
                    <div v-if="e.depositAmount > 0" class="text-[10px] text-text-disabled">
                      +{{ formatVND(e.depositAmount) }} nạp
                    </div>
                  </div>
                </div>
              </div>

              <!-- Note preview -->
              <div v-if="sessionNote" class="rounded-lg border border-border-subtle bg-bg-elevated px-3.5 py-2.5">
                <p class="text-[11px] text-text-tertiary mb-0.5">Ghi chú</p>
                <p class="text-sm text-text-secondary">{{ sessionNote }}</p>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="shrink-0 px-5 py-4 border-t border-border-subtle">

            <!-- Step 1: Setup -->
            <div v-if="step === 'setup'" class="flex gap-2">
              <button @click="close" class="flex-1 rounded-xl border border-border-default py-2.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors">
                Huỷ
              </button>
              <button
                @click="confirmSetup"
                :disabled="isSavingConfig || pendingWalletIds.length === 0"
                class="flex-1 btn-primary justify-center py-2.5 disabled:opacity-40"
              >
                <LogoLoader v-if="isSavingConfig" :size="14" />
                <span v-else>Tiếp theo</span>
                <ChevronRight v-if="!isSavingConfig" :size="14" />
              </button>
            </div>

            <!-- Step 2: Input -->
            <div v-else-if="step === 'input'" class="flex gap-2">
              <button
                @click="step = 'setup'"
                class="rounded-xl border border-border-default px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
              >
                ← Ví
              </button>
              <button
                @click="goToSummary"
                class="flex-1 btn-primary justify-center py-2.5"
              >
                Xem tổng kết
                <ChevronRight :size="14" />
              </button>
            </div>

            <!-- Step 3: Summary -->
            <div v-else-if="step === 'summary'" class="flex gap-2">
              <button
                @click="step = 'input'"
                class="rounded-xl border border-border-default px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
              >
                ← Sửa
              </button>
              <button
                @click="submit"
                :disabled="isSubmitting"
                class="flex-1 btn-primary justify-center py-2.5 disabled:opacity-40"
              >
                <LogoLoader v-if="isSubmitting" :size="14" />
                <Check v-else :size="14" />
                <span>{{ isSubmitting ? 'Đang lưu...' : 'Xác nhận check-in' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 200ms ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative {
  transform: translateY(24px);
}
</style>
