<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Smartphone } from 'lucide-vue-next'

const { t } = useI18n()
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
      </div>
    </div>
  </div>
</template>
