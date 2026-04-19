<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import {
  formatVND,
  getCategoryConfig,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '@/constants/finance'
import { getWalletBrand } from '@/constants/walletBrands'
import type { TransactionType } from '@/types'
import { ArrowLeft, Check, ChevronDown, ArrowUpRight, ArrowDownRight, Calendar, Plus } from 'lucide-vue-next'

const router = useRouter()
const finance = useFinanceStore()

onMounted(() => finance.fetchWallets())

const type = ref<TransactionType>('expense')
const amount = ref('')
const category = ref('food')
const walletId = ref(finance.wallets[0]?.id || '')
const note = ref('')

// Get local date instead of UTC
function getLocalDateString() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().substring(0, 10)
}
const date = ref(getLocalDateString())
const showCategoryPicker = ref(false)

function getDisplayDate(isoString: string) {
  if (!isoString) return ''
  const parts = isoString.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}` // dd/mm/yyyy
  }
  return isoString
}

const availableCategories = computed(() =>
  type.value === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
)

const selectedCategory = computed(() => getCategoryConfig(category.value))

const isValid = computed(() => {
  const amt = parseFloat(amount.value.replace(/[,.]/g, ''))
  return amt > 0 && walletId.value && category.value
})

function handleAmountInput(e: Event) {
  const input = e.target as HTMLInputElement
  // Only allow numbers
  const raw = input.value.replace(/[^0-9]/g, '')
  amount.value = raw
}

function formattedAmount() {
  const num = parseInt(amount.value || '0')
  return num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : ''
}

// --- Date Picker Logic ---
const showDatePicker = ref(false)
const datePickerRef = ref<HTMLElement | null>(null)

const monthNames = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const blankDays = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return d === 0 ? 6 : d - 1 // 0 (Sun) becomes 6, 1 (Mon) becomes 0
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

function changeMonth(step: number) {
  let newMonth = currentMonth.value + step
  let newYear = currentYear.value
  if (newMonth > 11) { newMonth = 0; newYear++ }
  else if (newMonth < 0) { newMonth = 11; newYear-- }
  currentMonth.value = newMonth
  currentYear.value = newYear
}

function selectDate(day: number) {
  const y = currentYear.value
  const m = String(currentMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  date.value = `${y}-${m}-${d}`
  showDatePicker.value = false
}

function isSameDate(day: number) {
  if (!date.value) return false
  const [y, m, d] = date.value.split('-').map(Number)
  return d === day && m === currentMonth.value + 1 && y === currentYear.value
}

function selectToday() {
  date.value = getLocalDateString()
  const [y, m, d] = date.value.split('-').map(Number)
  currentMonth.value = m - 1
  currentYear.value = y
  showDatePicker.value = false
}

import { useEventListener } from '@/composables/useEventListener'
useEventListener(document, 'click', (e: MouseEvent) => {
  if (datePickerRef.value && !datePickerRef.value.contains(e.target as Node)) {
    showDatePicker.value = false
  }
})
// --- End Date Picker Logic ---

async function submit() {
  if (!isValid.value) return
  const amt = parseInt(amount.value.replace(/[,.]/g, ''))

  await finance.addTransaction({
    type: type.value,
    amount: amt,
    category: category.value,
    note: note.value,
    walletId: walletId.value,
    source: 'manual',
    date: date.value
  })

  router.push('/')
}
</script>

<template>
  <div class="mx-auto max-w-[31.25rem]">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <button
        @click="router.back()"
        class="text-text-secondary hover:bg-bg-hover hover:text-text-primary flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-lg transition-all duration-150"
      >
        <ArrowLeft :size="18" />
      </button>
      <h1 class="text-xl font-bold tracking-tight">Thêm giao dịch</h1>
    </div>

    <!-- Type Toggle -->
    <div class="border-border-default mb-6 flex overflow-hidden rounded-xl border">
      <button
        class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-150"
        :class="
          type === 'expense'
            ? 'bg-error/10 text-error border-border-default border-r'
            : 'bg-bg-surface text-text-tertiary border-border-default hover:bg-bg-hover border-r'
        "
        @click="type = 'expense'; category = 'food'"
      >
        <ArrowDownRight :size="16" />
        Chi tiêu
      </button>
      <button
        class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-150"
        :class="
          type === 'income'
            ? 'bg-success/10 text-success'
            : 'bg-bg-surface text-text-tertiary hover:bg-bg-hover'
        "
        @click="type = 'income'; category = 'salary'"
      >
        <ArrowUpRight :size="16" />
        Thu nhập
      </button>
    </div>

    <!-- Amount -->
    <div class="mb-6">
      <label class="text-text-secondary mb-2 block text-sm font-medium">Số tiền</label>
      <div class="relative">
        <input
          :value="formattedAmount()"
          @input="handleAmountInput"
          type="text"
          inputmode="numeric"
          placeholder="0"
          class="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-4 text-center text-3xl font-bold transition-all duration-150 focus:ring-2 focus:outline-none"
        />
        <span
          class="text-text-tertiary absolute top-1/2 right-4 -translate-y-1/2 text-lg font-medium"
        >
          đ
        </span>
      </div>
    </div>

    <!-- Category -->
    <div class="mb-6">
      <label class="text-text-secondary mb-2 block text-sm font-medium">Danh mục</label>
      <button
        class="border-border-default bg-bg-surface hover:border-border-strong flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-150"
        @click="showCategoryPicker = !showCategoryPicker"
      >
        <span class="flex items-center gap-2">
          <span class="text-lg">{{ selectedCategory.icon }}</span>
          <span class="text-text-primary text-sm">{{ selectedCategory.label }}</span>
        </span>
        <ChevronDown
          :size="16"
          class="text-text-tertiary transition-transform duration-150"
          :class="showCategoryPicker ? 'rotate-180' : ''"
        />
      </button>

      <!-- Picker -->
      <transition name="slide">
        <div
          v-if="showCategoryPicker"
          class="mt-2 grid grid-cols-3 gap-2"
        >
          <button
            v-for="cat in availableCategories"
            :key="cat.key"
            class="flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-150"
            :class="
              category === cat.key
                ? 'border-accent bg-accent-subtle'
                : 'border-border-default bg-bg-surface hover:border-border-strong'
            "
            @click="category = cat.key; showCategoryPicker = false"
          >
            <span class="text-xl">{{ cat.icon }}</span>
            <span class="text-text-secondary text-[0.6875rem]">{{ cat.label }}</span>
          </button>
        </div>
      </transition>
    </div>

    <!-- Wallet -->
    <div class="mb-6">
      <label class="text-text-secondary mb-2 block text-sm font-medium">Ví</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="w in finance.wallets"
          :key="w.id"
          class="flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-150"
          :class="
            walletId === w.id
              ? 'border-accent bg-accent-subtle'
              : 'border-border-default bg-bg-surface hover:border-border-strong'
          "
          @click="walletId = w.id"
        >
          <div v-if="getWalletBrand(w.name)?.logoUrl" class="flex h-7 w-7 shrink-0 overflow-hidden rounded-[4px] bg-white border border-border-default shadow-sm p-1">
            <img
              :src="getWalletBrand(w.name)!.logoUrl"
              :alt="w.name"
              class="h-full w-full object-contain object-center"
              loading="lazy"
            />
          </div>
          <div
            v-else-if="getWalletBrand(w.name)"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold shadow-sm"
            :style="{ backgroundColor: getWalletBrand(w.name)!.bgColor, color: getWalletBrand(w.name)!.textColor }"
          >
            {{ getWalletBrand(w.name)!.abbr }}
          </div>
          <span v-else class="text-lg">{{ w.icon }}</span>
          <span class="text-text-secondary w-full truncate text-center text-[0.6875rem]">
            {{ w.name }}
          </span>
        </button>

        <!-- Thêm ví mới -->
        <button
          class="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-bg-surface hover:bg-bg-hover hover:border-accent/50 p-3 transition-all duration-150"
          @click="router.push('/wallets')"
        >
          <div class="flex h-7 w-7 items-center justify-center rounded-[4px] bg-bg-elevated text-text-tertiary">
             <Plus :size="16" />
          </div>
          <span class="text-text-secondary w-full truncate text-center text-[0.6875rem]">
            Thêm ví
          </span>
        </button>
      </div>
    </div>

    <!-- Note -->
    <div class="mb-6">
      <label class="text-text-secondary mb-2 block text-sm font-medium">Ghi chú</label>
      <input
        v-model="note"
        type="text"
        placeholder="Ví dụ: Ăn sáng, Grab, ..."
        class="border-border-default bg-bg-surface text-text-primary placeholder:text-text-disabled focus:border-accent focus:ring-accent-subtle w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
      />
    </div>

    <!-- Date (Custom Picker) -->
    <div class="mb-8 relative" ref="datePickerRef">
      <label class="text-text-secondary mb-2 block text-sm font-medium">Ngày</label>
      <button
        @click="showDatePicker = !showDatePicker"
        class="border-border-default bg-bg-surface text-text-primary hover:border-border-strong focus:border-accent focus:ring-accent-subtle flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 focus:ring-2 focus:outline-none"
      >
        <span class="font-medium">{{ getDisplayDate(date) }}</span>
        <Calendar :size="16" class="text-text-tertiary" />
      </button>

      <!-- Dropdown Calendar Modal -->
      <transition name="slide">
        <div
          v-if="showDatePicker"
          class="absolute bottom-full left-0 z-50 mb-2 w-full max-w-[18rem] rounded-xl border border-border-default bg-bg-elevated p-4 shadow-xl"
        >
          <div class="mb-4 flex items-center justify-between">
            <button @click="changeMonth(-1)" class="p-1 hover:bg-bg-hover rounded-lg transition-colors"><ChevronDown :size="16" class="rotate-90" /></button>
            <span class="text-sm font-bold">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
            <button @click="changeMonth(1)" class="p-1 hover:bg-bg-hover rounded-lg transition-colors"><ChevronDown :size="16" class="-rotate-90" /></button>
          </div>
          <div class="grid grid-cols-7 gap-1 mb-2 text-center text-[0.6875rem] text-text-tertiary font-semibold">
            <span v-for="d in ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']" :key="d">{{ d }}</span>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div v-for="blank in blankDays" :key="'blank-' + blank" class="h-8"></div>
            <button
              v-for="day in daysInMonth"
              :key="day"
              @click="selectDate(day)"
              class="h-8 w-full rounded-lg text-sm flex items-center justify-center transition-all duration-150"
              :class="isSameDate(day) ? 'bg-accent text-white font-bold shadow-md' : 'hover:bg-bg-hover text-text-primary'"
            >
              {{ day }}
            </button>
          </div>
          <div class="mt-4 flex gap-2">
             <button @click="selectToday" class="btn-secondary w-full py-1.5 text-xs">Hôm nay</button>
             <button @click="showDatePicker = false" class="btn-secondary w-full py-1.5 text-xs">Đóng</button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Submit -->
    <button
      :disabled="!isValid"
      @click="submit"
      class="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-150"
      :class="
        type === 'expense'
          ? 'bg-error text-white hover:opacity-90 disabled:opacity-40'
          : 'bg-success text-white hover:opacity-90 disabled:opacity-40'
      "
    >
      <Check :size="18" />
      {{ type === 'expense' ? 'Ghi chi tiêu' : 'Ghi thu nhập' }}
    </button>
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
  max-height: 31.25rem;
  opacity: 1;
}
</style>
