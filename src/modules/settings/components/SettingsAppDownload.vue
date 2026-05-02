<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DownloadCloud, Smartphone } from 'lucide-vue-next'

const { t } = useI18n()

function downloadIOSApp() {
  // Trigger file download
  const link = document.createElement('a')
  link.href = '/downloads/FinNote.ipa'
  link.download = 'FinNote.ipa'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div>
    <div class="text-text-secondary mb-3 flex items-center gap-2">
      <Smartphone :size="18" />
      <h3 class="text-sm font-semibold">{{ t('settings.appDownload') }}</h3>
    </div>
    <div class="card-premium p-5">
      <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.iosApp') }}</h4>
          <p class="text-text-tertiary text-sm">{{ t('settings.iosAppDesc') }}</p>
        </div>
        <div>
          <button
            @click="downloadIOSApp"
            class="btn-primary whitespace-nowrap bg-gradient-to-r from-accent to-pink-500 hover:from-accent-hover hover:to-pink-600 border-none shadow-[0_4px_15px_rgba(142,125,250,0.3)]"
          >
            <DownloadCloud :size="16" />
            {{ t('settings.downloadApp') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
