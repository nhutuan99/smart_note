<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Bug } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const ui = useUiStore()
</script>

<template>
  <div class="mb-6">
    <div class="text-text-secondary mb-3 flex items-center gap-2">
      <Bug :size="18" />
      <h3 class="text-sm font-semibold">{{ t('bugReport.sectionTitle') }}</h3>
    </div>
    <div class="card-premium p-5">
      <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h4 class="mb-0.5 text-sm font-semibold">{{ t('bugReport.sendReport') }}</h4>
          <p class="text-text-tertiary text-[0.8125rem]">{{ t('bugReport.sendReportDesc') }}</p>
        </div>
        <button
          @click="ui.showBugReport = true"
          class="border-danger text-danger hover:bg-danger/10 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
        >
          <Bug :size="16" />
          {{ t('bugReport.reportNow') }}
        </button>
      </div>
    </div>
  </div>
</template>
