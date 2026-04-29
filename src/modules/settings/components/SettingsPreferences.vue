<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe, DollarSign } from 'lucide-vue-next'
import { setLocale, currentLocale } from '@/i18n'
import { useCurrency, type CurrencyCode } from '@/composables/useCurrency'

const { t } = useI18n()

// Language
const selectedLocale = ref(currentLocale())

function changeLocale(locale: 'vi' | 'en') {
  selectedLocale.value = locale
  setLocale(locale)
}

// Currency
const { currency, rateDisplay, rateLoading, rateError, setCurrency } = useCurrency()

function changeCurrency(code: CurrencyCode) {
  setCurrency(code)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Language -->
    <div>
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <Globe :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.language') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.language') }}</h4>
            <p class="text-text-tertiary text-sm">{{ t('settings.languageDesc') }}</p>
          </div>
          <div class="border-border-default flex overflow-hidden rounded-lg border">
            <button
              class="px-4 py-2 text-sm font-medium transition-all duration-150"
              :class="
                selectedLocale === 'vi'
                  ? 'bg-accent-subtle text-accent'
                  : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
              "
              @click="changeLocale('vi')"
            >
              Tiếng Việt
            </button>
            <button
              class="border-border-default border-l px-4 py-2 text-sm font-medium transition-all duration-150"
              :class="
                selectedLocale === 'en'
                  ? 'bg-accent-subtle text-accent'
                  : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
              "
              @click="changeLocale('en')"
            >
              English
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Currency -->
    <div>
      <div class="text-text-secondary mb-3 flex items-center gap-2">
        <DollarSign :size="18" />
        <h3 class="text-sm font-semibold">{{ t('settings.currency') }}</h3>
      </div>
      <div class="card-premium p-5">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 class="mb-0.5 text-sm font-semibold">{{ t('settings.currencyDisplay') }}</h4>
            <p class="text-text-tertiary text-sm">{{ t('settings.currencyDesc') }}</p>
            <p v-if="currency === 'USD' && rateDisplay" class="text-accent mt-1 text-xs font-medium">
              💡 {{ rateDisplay }}
            </p>
            <p v-if="rateError && currency === 'USD'" class="text-warning mt-1 text-xs">
              ⚠️ {{ rateError }} ({{ t('settings.fallbackRate') }})
            </p>
          </div>
          <div class="border-border-default flex overflow-hidden rounded-lg border">
            <button
              class="px-4 py-2 text-sm font-medium transition-all duration-150"
              :class="
                currency === 'VND'
                  ? 'bg-accent-subtle text-accent'
                  : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
              "
              @click="changeCurrency('VND')"
            >
              🇻🇳 VND (đ)
            </button>
            <button
              class="border-border-default border-l px-4 py-2 text-sm font-medium transition-all duration-150"
              :class="
                currency === 'USD'
                  ? 'bg-accent-subtle text-accent'
                  : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
              "
              @click="changeCurrency('USD')"
            >
              <span v-if="rateLoading" class="border-text-disabled border-l-accent mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2"></span>
              🇺🇸 USD ($)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
