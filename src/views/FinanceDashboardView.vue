<script setup lang="ts">
// 1. Vue ecosystem
import { useI18n } from 'vue-i18n'
// 2. Stores
import { useAuthStore } from '@/stores/auth'
// 3. Finance module components
import FinanceOverview from '@/modules/finance/components/FinanceOverview.vue'
import FinanceWallets from '@/modules/finance/components/FinanceWallets.vue'
import FinanceCharts from '@/modules/finance/components/FinanceCharts.vue'
import HomeRemindersWidget from '@/modules/finance/components/HomeRemindersWidget.vue'
import HomeNotesWidget from '@/modules/finance/components/HomeNotesWidget.vue'

const _auth = useAuthStore()
const { t } = useI18n()
</script>

<template>
  <div class="w-full max-w-[90rem] mx-auto">
    <!-- Balance + Income/Expense + Weather Hero -->
    <FinanceOverview />

    <!-- Wallet scrollable row -->
    <FinanceWallets />

    <!-- 7-day chart + Spending by wallet -->
    <FinanceCharts />

    <!-- ── Quick Glance Hub: Reminders + Notes ── -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <HomeRemindersWidget />
      <HomeNotesWidget />
    </div>
  </div>
</template>
