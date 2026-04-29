<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from 'lucide-vue-next'
import { useFinancePolling } from '@/composables/useFinancePolling'
import { getWalletBrand } from '@/constants/walletBrands'
import { formatVNDShort } from '@/constants/finance'

const { t } = useI18n()
const router = useRouter()
const finance = useFinancePolling()
</script>

<template>
  <div class="mb-6">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ t('dashboard.myWallets') }}</h3>
      <router-link
        to="/wallets"
        class="text-accent hover:text-accent-text flex items-center gap-1 text-sm transition-colors"
      >
        {{ t('dashboard.manage') }}
        <ArrowRight :size="14" />
      </router-link>
    </div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="w in finance.wallets"
        :key="w.id"
        class="bg-bg-surface border-border-default hover:border-border-strong cursor-pointer rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5"
        @click="finance.filter = { walletId: w.id }; router.push('/transactions')"
      >
        <!-- Brand Logo -->
        <div class="mb-2 h-8 w-8">
          <img
            v-if="getWalletBrand(w.name)?.logoUrl"
            :src="getWalletBrand(w.name)!.logoUrl"
            :alt="w.name"
            class="h-8 w-8 rounded-lg object-contain"
            loading="lazy"
            @error="($event.target as HTMLImageElement).style.display = 'none'; ($event.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden')"
          />
          <div
            v-if="getWalletBrand(w.name) && !getWalletBrand(w.name)!.logoUrl"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            :style="{ backgroundColor: getWalletBrand(w.name)!.bgColor, color: getWalletBrand(w.name)!.textColor }"
          >
            {{ getWalletBrand(w.name)!.abbr }}
          </div>
          <div
            v-if="!getWalletBrand(w.name)"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-xl"
            :style="{ backgroundColor: w.color + '20' }"
          >
            {{ w.icon }}
          </div>
        </div>
        <div class="text-text-tertiary mb-1 truncate text-[0.6875rem]">
          {{ w.name }}
        </div>
        <div
          class="text-sm font-semibold"
          :class="w.balance >= 0 ? 'text-text-primary' : 'text-error'"
        >
          {{ formatVNDShort(w.balance) }}
        </div>
      </div>
    </div>
  </div>
</template>
