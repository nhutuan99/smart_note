<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import CatMascot from '@/components/ui/CatMascot.vue'
import FinanceOverview from '@/modules/finance/components/FinanceOverview.vue'
import FinanceWallets from '@/modules/finance/components/FinanceWallets.vue'
import FinanceCharts from '@/modules/finance/components/FinanceCharts.vue'

const auth = useAuthStore()
const { t } = useI18n()
</script>

<template>
  <div class="max-w-[75rem]">


    <!-- Balance + Income/Expense Cards -->
    <FinanceOverview />

    <!-- Wallets -->
    <FinanceWallets />

    <!-- Chart + Category Breakdown -->
    <FinanceCharts />
  </div>
</template>
