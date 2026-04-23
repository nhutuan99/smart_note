<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { httpClient } from '@/shared/api/httpClient'
import { Copy, ShieldCheck, Smartphone, CheckCircle, Activity, ArrowUpRight, ArrowDownRight, Server, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useFinanceStore } from '@/stores/finance'
import { formatVND, getCategoryConfig } from '@/constants/finance'

const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()
const financeStore = useFinanceStore()

const webhookUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin
  const userId = auth.user?.id || 'YOUR_USER_ID'
  return `${baseUrl}/api/webhook/sms?userId=${userId}`
})

function copyWebhookUrl() {
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/webhook/sms?userId=${auth.user?.id}`
  navigator.clipboard.writeText(url).then(() => {
    ui.showToast('success', t('autoSync.copySuccess'))
  }).catch(() => {
    ui.showToast('error', t('autoSync.copyFailed'))
  })
}

// ── Webhook Debug Log ──
const debugLog = ref<any>(null)
const debugLoading = ref(false)

async function fetchDebugLog() {
  debugLoading.value = true
  try {
    debugLog.value = await httpClient.get('/api/webhook/sms/latest')
  } catch {
    debugLog.value = null
  } finally {
    debugLoading.value = false
  }
}

function formatDebugTime(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  } catch {
    return iso
  }
}

onMounted(() => {
  financeStore.fetchTransactions()
  fetchDebugLog()
})
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="mb-8">
      <h2 class="mb-2 text-2xl font-bold tracking-tight">{{ t('autoSync.title') }}</h2>
      <p class="text-text-secondary text-sm">{{ t('autoSync.desc') }}</p>
    </div>

    <!-- Intro Card -->
    <div class="card-premium mb-8 overflow-hidden p-0 border-accent/20">
      <div class="bg-accent/10 px-6 py-6 sm:px-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div class="bg-bg-primary border-border-default flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-sm">
            <Smartphone class="text-accent h-8 w-8" />
          </div>
          <div class="flex-1">
            <h3 class="mb-2 text-lg font-bold text-text-primary">{{ t('autoSync.whyTitle') }}</h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex items-start gap-2">
                <ShieldCheck class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]" v-html="t('autoSync.security')"></p>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]" v-html="t('autoSync.native')"></p>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]" v-html="t('autoSync.free')"></p>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle class="text-success h-5 w-5 shrink-0" />
                <p class="text-text-secondary text-[0.8125rem]" v-html="t('autoSync.instant')"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Config URL -->
    <div class="mb-8">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">{{ t('autoSync.step1Title') }}</h3>
      <div class="card-premium p-6">
        <p class="mb-4 text-sm text-text-secondary">{{ t('autoSync.step1Desc') }}</p>
        <div class="bg-bg-elevated border-border-default flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
          <code class="text-accent flex-1 break-all text-[0.8125rem] leading-relaxed">
            {{ webhookUrl }}
          </code>
          <button
            class="bg-accent text-bg-primary hover:bg-accent-hover shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            @click="copyWebhookUrl"
          >
            <Copy :size="16" />
            {{ t('common.copyLink') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Setup Guide -->
    <div>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">{{ t('autoSync.step2Title') }}</h3>
      <div class="card-premium divide-border-default divide-y p-0">
        
        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">1</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">{{ t('autoSync.s1Title') }}</h4>
            <p class="text-text-secondary mb-3 text-sm" v-html="t('autoSync.s1Desc')"></p>
          </div>
        </div>

        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">2</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">{{ t('autoSync.s2Title') }}</h4>
            <p class="text-text-secondary mb-3 text-sm" v-html="t('autoSync.s2Desc')"></p>
            <ul class="text-text-secondary list-inside list-disc space-y-1 text-sm">
              <li v-html="t('autoSync.s2Li1')"></li>
              <li v-html="t('autoSync.s2Li2')"></li>
            </ul>
            <p class="text-text-secondary mt-3 text-sm" v-html="t('autoSync.s2Next')"></p>
          </div>
        </div>

        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">3</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">{{ t('autoSync.s3Title') }}</h4>
            <p class="text-text-secondary mb-3 text-sm" v-html="t('autoSync.s3Desc')"></p>
          </div>
        </div>

        <div class="flex items-start gap-5 px-6 py-5">
          <div class="bg-bg-elevated border-border-default flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-text-primary">4</div>
          <div class="flex-1 pt-1">
            <h4 class="mb-1 font-semibold text-text-primary">{{ t('autoSync.s4Title') }}</h4>
            <p class="text-text-secondary mb-3 text-sm" v-html="t('autoSync.s4Desc')"></p>
            <ul class="text-text-secondary list-inside list-disc space-y-2 text-sm">
              <li v-html="t('autoSync.s4Li1')"></li>
              <li v-html="t('autoSync.s4Li2')"></li>
              <li v-html="t('autoSync.s4Li3')"></li>
              <li v-html="t('autoSync.s4Li4')"></li>
            </ul>
            <div class="bg-success/10 border-success/20 mt-4 flex items-center gap-3 rounded-lg border px-4 py-3">
              <CheckCircle class="text-success h-5 w-5 shrink-0" />
              <p class="text-sm font-medium text-text-primary" v-html="t('autoSync.s4Done')"></p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Debug Panel: Latest Webhook Request -->
    <div class="mt-8">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-text-tertiary">🔍 Webhook Debug Log</h3>
        <button
          class="text-text-secondary hover:text-accent flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-bg-hover"
          :class="debugLoading ? 'opacity-50 pointer-events-none' : ''"
          @click="fetchDebugLog"
        >
          <RefreshCw :size="14" :class="debugLoading ? 'animate-spin' : ''" />
          Refresh
        </button>
      </div>

      <div class="card-premium p-0 overflow-hidden">
        <!-- Loading -->
        <div v-if="debugLoading && !debugLog" class="p-6 text-center">
          <div class="skeleton h-20 rounded-lg" />
        </div>

        <!-- No data -->
        <div v-else-if="!debugLog" class="p-6 text-center">
          <Server :size="28" class="mx-auto mb-2 text-text-disabled" />
          <p class="text-text-tertiary text-sm">Chưa có webhook request nào</p>
        </div>

        <!-- Debug Data -->
        <div v-else class="divide-border-default divide-y">
          <!-- Status badge -->
          <div class="flex items-center justify-between px-5 py-3">
            <span class="text-sm font-semibold text-text-primary">Request gần nhất</span>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-bold"
              :class="debugLog.status === 'success'
                ? 'bg-success/15 text-success'
                : debugLog.status === 'pending'
                  ? 'bg-warning/15 text-warning'
                  : 'bg-error/15 text-error'"
            >
              {{ debugLog.status === 'success' ? '✅ Thành công' : debugLog.status === 'pending' ? '⏳ Pending' : '❌ Lỗi' }}
            </span>
          </div>

          <!-- Time -->
          <div class="px-5 py-2.5 flex items-center justify-between">
            <span class="text-xs text-text-tertiary">Thời gian</span>
            <span class="text-xs font-medium text-text-secondary">{{ formatDebugTime(debugLog.time) }}</span>
          </div>

          <!-- Raw SMS -->
          <div class="px-5 py-3">
            <span class="text-xs text-text-tertiary block mb-1.5">SMS gốc (raw)</span>
            <div class="bg-bg-elevated border-border-default rounded-lg border p-3 text-xs text-text-primary font-mono leading-relaxed whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {{ debugLog.rawDump || '(trống)' }}
            </div>
          </div>

          <!-- Error (if pending/failed) -->
          <div v-if="debugLog.error" class="px-5 py-3">
            <span class="text-xs text-text-tertiary block mb-1">Lỗi</span>
            <p class="text-xs text-error font-medium">{{ debugLog.error }}</p>
          </div>

          <!-- Parsed Data (if success) -->
          <div v-if="debugLog.parsedData" class="px-5 py-3">
            <span class="text-xs text-text-tertiary block mb-2">Kết quả parse</span>
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-bg-elevated rounded-lg px-3 py-2">
                <span class="text-[0.625rem] text-text-disabled block">Loại</span>
                <span class="text-xs font-bold" :class="debugLog.parsedData.type === 'income' ? 'text-success' : 'text-error'">
                  {{ debugLog.parsedData.type === 'income' ? '📈 Thu nhập' : '📉 Chi tiêu' }}
                </span>
              </div>
              <div class="bg-bg-elevated rounded-lg px-3 py-2">
                <span class="text-[0.625rem] text-text-disabled block">Số tiền</span>
                <span class="text-xs font-bold text-text-primary">{{ debugLog.parsedData.amount?.toLocaleString('vi-VN') }}đ</span>
              </div>
              <div class="bg-bg-elevated rounded-lg px-3 py-2">
                <span class="text-[0.625rem] text-text-disabled block">Ngân hàng</span>
                <span class="text-xs font-medium text-text-secondary">{{ debugLog.parsedData.bankName || '—' }}</span>
              </div>
              <div class="bg-bg-elevated rounded-lg px-3 py-2">
                <span class="text-[0.625rem] text-text-disabled block">Ví</span>
                <span class="text-xs font-medium text-text-secondary">{{ debugLog.parsedData.walletName || '—' }}</span>
              </div>
              <div v-if="debugLog.parsedData.txRef" class="bg-bg-elevated rounded-lg px-3 py-2 col-span-2">
                <span class="text-[0.625rem] text-text-disabled block">Mã GD (SO GD)</span>
                <span class="text-xs font-mono text-text-secondary">{{ debugLog.parsedData.txRef }}</span>
              </div>
              <div v-if="debugLog.parsedData.note" class="bg-bg-elevated rounded-lg px-3 py-2 col-span-2">
                <span class="text-[0.625rem] text-text-disabled block">Nội dung (ND)</span>
                <span class="text-xs text-text-secondary">{{ debugLog.parsedData.note }}</span>
              </div>
              <div v-if="debugLog.parsedData.balance" class="bg-bg-elevated rounded-lg px-3 py-2 col-span-2">
                <span class="text-[0.625rem] text-text-disabled block">Số dư (SD)</span>
                <span class="text-xs font-medium text-text-secondary">{{ debugLog.parsedData.balance?.toLocaleString('vi-VN') }}đ</span>
              </div>
            </div>
          </div>

          <!-- Transaction ID -->
          <div v-if="debugLog.transactionId" class="px-5 py-2.5 flex items-center justify-between">
            <span class="text-xs text-text-tertiary">Transaction ID</span>
            <span class="text-xs font-mono text-accent">{{ debugLog.transactionId }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
