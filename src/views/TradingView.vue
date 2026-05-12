<script setup lang="ts">
// 1. Vue core
import { ref, onMounted } from 'vue'
// 2. Vue ecosystem
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
// 3. Composables / Stores
import { useTradingCheckin } from '@/composables/useTradingCheckin'
// 4. Components & icons
import TradingCheckinModal from '@/modules/finance/components/TradingCheckinModal.vue'
import TradingHistoryView from '@/modules/finance/components/TradingHistoryView.vue'
import { BookOpen, Plus, Edit2 } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { trading } = useTradingCheckin()
const showCheckinModal = ref(false)

onMounted(async () => {
  await trading.fetchAll()

  // Deep-link from push notification: /trading?checkin=1
  if (route.query.checkin === '1') {
    showCheckinModal.value = true
    // Clean up the URL without re-triggering navigation
    router.replace({ query: { ...route.query, checkin: undefined } })
  }
})
</script>


<template>
  <div class="w-full max-w-[90rem] mx-auto">
    <!-- Page Header -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <BookOpen :size="20" class="text-accent" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-text-primary">{{ t('trading.title') }}</h1>
          <p class="text-xs text-text-tertiary mt-0.5">{{ t('trading.subtitle') }}</p>
        </div>
      </div>
      <button @click="showCheckinModal = true" class="btn-primary gap-2">
        <component :is="trading.hasDoneCheckinToday ? Edit2 : Plus" :size="15" />
        {{ trading.hasDoneCheckinToday ? t('trading.editCheckinToday') : t('trading.checkinToday') }}
      </button>
    </div>

    <TradingHistoryView />
    <TradingCheckinModal v-model="showCheckinModal" />
  </div>
</template>
