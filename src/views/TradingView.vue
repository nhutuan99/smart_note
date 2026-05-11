<script setup lang="ts">
// 1. Vue core
import { ref, onMounted } from 'vue'
// 2. Composables / Stores
import { useTradingCheckin } from '@/composables/useTradingCheckin'
// 3. Components & icons
import TradingCheckinModal from '@/modules/finance/components/TradingCheckinModal.vue'
import TradingHistoryView from '@/modules/finance/components/TradingHistoryView.vue'
import { BookOpen, Plus, Edit2 } from 'lucide-vue-next'

const { trading } = useTradingCheckin()
const showCheckinModal = ref(false)

onMounted(() => {
  // Ensure data is always fresh when navigating to this page
  trading.fetchAll()
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
          <h1 class="text-xl font-bold text-text-primary">Trading Journal</h1>
          <p class="text-xs text-text-tertiary mt-0.5">Theo dõi lãi/lỗ theo ngày · Phân tích hiệu suất</p>
        </div>
      </div>
      <button
        @click="showCheckinModal = true"
        class="btn-primary gap-2"
      >
        <component :is="trading.hasDoneCheckinToday ? Edit2 : Plus" :size="15" />
        {{ trading.hasDoneCheckinToday ? 'Sửa check-in hôm nay' : 'Check-in hôm nay' }}
      </button>
    </div>

    <!-- History & Charts -->
    <TradingHistoryView />

    <!-- Modal -->
    <TradingCheckinModal v-model="showCheckinModal" />
  </div>
</template>
