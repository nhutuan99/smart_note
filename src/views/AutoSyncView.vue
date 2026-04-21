<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { httpClient } from '@/shared/api/httpClient'
import { Copy, ShieldCheck, Smartphone, CheckCircle, ArrowRight, Activity, Zap, Server, AlertCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { formatVND } from '@/constants/finance'

const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

function copyWebhookUrl() {
  const url = `https://smart-note-api.tintphcm1.workers.dev/api/webhook/sms?userId=${auth.user?.id}`
  navigator.clipboard.writeText(url).then(() => {
    ui.showToast('success', t('autoSync.copySuccess'))
  }).catch(() => {
    ui.showToast('error', t('autoSync.copyFailed'))
  })
}

// --- Live Webhook Log Polling ---
const latestLog = ref<any>(null)
let pollInterval: number | null = null

async function fetchLatestLog() {
  try {
    const res = await httpClient.get<{ data: any }>('/api/webhook/sms/latest')
    if (res?.data) {
      latestLog.value = res.data
    }
  } catch (err) {
    // silently fail
  }
}

onMounted(() => {
  fetchLatestLog()
  pollInterval = window.setInterval(fetchLatestLog, 3000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

function formatTime(isoString: string) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString('vi-VN', { hour12: false }) + ' - ' + d.toLocaleDateString('vi-VN')
}
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
            https://smart-note-api.tintphcm1.workers.dev/api/webhook/sms?userId={{ auth.user?.id || 'YOUR_USER_ID' }}
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
    <!-- Live Webhook Log Viewer -->
    <div class="mt-8">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Trạng thái nhận SMS trực tiếp</h3>
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
          <span class="text-text-tertiary text-[0.6875rem] font-medium uppercase tracking-wider">Live</span>
        </div>
      </div>
      
      <div class="card-premium p-0 overflow-hidden bg-bg-surface border-border-default border">
        <!-- Header -->
        <div class="bg-bg-elevated flex items-center justify-between border-b border-border-default px-5 py-3">
          <div class="flex items-center gap-2 text-text-primary">
            <Activity :size="16" class="text-accent" />
            <span class="font-semibold text-sm">Latest Webhook Payload</span>
          </div>
          <div class="text-[0.75rem] text-text-tertiary font-mono">
            {{ latestLog ? formatTime(latestLog.time) : 'Đang chờ...' }}
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="!latestLog" class="p-8 text-center flex flex-col items-center">
          <Server :size="32" class="text-text-disabled mb-3" />
          <p class="text-text-secondary text-sm font-medium">Chưa có dữ liệu</p>
          <p class="text-text-tertiary text-[0.8125rem] mt-1 max-w-sm">
            Gửi SMS thử nghiệm từ iPhone để xem data xuất hiện ở đây ngay lập tức.
          </p>
        </div>

        <!-- Data State -->
        <div v-else class="flex flex-col divide-y divide-border-default">
          
          <!-- Status Banner -->
          <div 
            class="px-5 py-3 flex items-center gap-3 text-sm font-medium"
            :class="{
              'bg-success/10 text-success': latestLog.status === 'success',
              'bg-error/10 text-error': latestLog.status === 'error',
              'bg-warning/10 text-warning': latestLog.status === 'pending'
            }"
          >
            <CheckCircle v-if="latestLog.status === 'success'" :size="18" />
            <AlertCircle v-else :size="18" />
            <span class="uppercase tracking-wider text-[0.75rem]">
              Trạng thái: {{ latestLog.status }}
            </span>
            <span v-if="latestLog.error" class="ml-auto opacity-90 truncate max-w-sm" :title="latestLog.error">
              {{ latestLog.error }}
            </span>
          </div>

          <!-- Parsed Data (if success) -->
          <div v-if="latestLog.parsedData" class="px-5 py-4 bg-bg-elevated/50">
            <h4 class="text-[0.6875rem] uppercase tracking-wider text-text-tertiary mb-3 font-semibold">Dữ liệu bóc tách (Parsed)</h4>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div class="text-[0.6875rem] text-text-tertiary mb-1">Loại</div>
                <div class="text-sm font-semibold capitalize" :class="latestLog.parsedData.type === 'income' ? 'text-success' : 'text-error'">
                  {{ latestLog.parsedData.type }}
                </div>
              </div>
              <div>
                <div class="text-[0.6875rem] text-text-tertiary mb-1">Số tiền</div>
                <div class="text-sm font-semibold text-text-primary">
                  {{ formatVND(latestLog.parsedData.amount) }}
                </div>
              </div>
              <div>
                <div class="text-[0.6875rem] text-text-tertiary mb-1">Ngân hàng</div>
                <div class="text-sm font-semibold text-text-primary">
                  {{ latestLog.parsedData.bankName || 'N/A' }}
                </div>
              </div>
              <div>
                <div class="text-[0.6875rem] text-text-tertiary mb-1">Mã GD (TxRef)</div>
                <div class="text-sm font-mono text-text-primary truncate" :title="latestLog.parsedData.txRef">
                  {{ latestLog.parsedData.txRef || 'N/A' }}
                </div>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-[0.6875rem] text-text-tertiary mb-1">Nội dung (Note)</div>
              <div class="text-sm text-text-primary bg-bg-primary px-3 py-2 rounded-lg border border-border-default break-all">
                {{ latestLog.parsedData.note || 'N/A' }}
              </div>
            </div>
          </div>

          <!-- Raw Dump -->
          <div class="px-5 py-4">
            <h4 class="text-[0.6875rem] uppercase tracking-wider text-text-tertiary mb-2 font-semibold">Raw Payload (Từ iPhone)</h4>
            <pre class="bg-bg-primary text-text-secondary p-3 rounded-lg text-[0.75rem] overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed border border-border-default">{{ latestLog.rawDump }}</pre>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
