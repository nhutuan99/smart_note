<script setup lang="ts">
import FinanceOverview from '@/modules/finance/components/FinanceOverview.vue'
import FinanceAiAdvisor from '@/modules/finance/components/FinanceAiAdvisor.vue'
import FinanceWallets from '@/modules/finance/components/FinanceWallets.vue'
import FinanceCharts from '@/modules/finance/components/FinanceCharts.vue'
</script>

<template>
  <div class="max-w-[75rem]">
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
