<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import CatMascot from '@/components/ui/CatMascot.vue'
import FinanceOverview from '@/modules/finance/components/FinanceOverview.vue'
import FinanceAiAdvisor from '@/modules/finance/components/FinanceAiAdvisor.vue'
import FinanceWallets from '@/modules/finance/components/FinanceWallets.vue'
import FinanceCharts from '@/modules/finance/components/FinanceCharts.vue'

const auth = useAuthStore()
const { t } = useI18n()
</script>

<template>
  <div class="max-w-[75rem]">
    <!-- Welcome Header with Mascot -->
    <div class="mb-6 flex items-center justify-between bg-bg-surface border border-border-default rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
      <div class="relative z-10 max-w-[65%]">
        <h2 class="text-xl sm:text-2xl font-bold text-text-primary mb-1">
          {{ t('dashboard.welcomeBack', { name: auth.user?.name?.split(' ')[0] || 'User' }) }}
        </h2>
        <p class="text-sm text-text-tertiary">{{ t('dashboard.welcomeDesc') }}</p>
      </div>
      <!-- Mascot -->
      <div class="hidden sm:flex absolute right-6 -bottom-6 z-0 pointer-events-none">
        <CatMascot type="orange" size="xl" animation="float" />
      </div>
      <!-- Mobile mascot -->
      <div class="sm:hidden flex absolute -right-2 -bottom-8 z-0 pointer-events-none">
        <CatMascot type="orange" size="lg" animation="float" />
      </div>
    </div>

    <!-- Balance + Income/Expense Cards -->
    <FinanceOverview />

    <!-- AI Finance Advisor (collapsed bar) -->
    <FinanceAiAdvisor />

    <!-- Wallets -->
    <FinanceWallets />

    <!-- Chart + Category Breakdown -->
    <FinanceCharts />
  </div>
</template>
