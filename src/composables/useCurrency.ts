/**
 * Currency composable — manages VND/USD toggle with live exchange rate.
 *
 * - Stores user preference in localStorage ('sn_currency')
 * - Fetches VND→USD rate from Frankfurter API (free, no key)
 * - Caches rate for 4 hours to avoid rate limiting
 * - Provides formatMoney() / formatMoneyShort() that respect the selected currency
 */
import { ref, computed, watch } from 'vue'
import { httpClient } from '@/shared/api/httpClient'

// ── State (singleton — shared across all imports) ──
const CACHE_KEY = 'sn_currency'
const RATE_CACHE_KEY = 'sn_fx_rate'
const RATE_CACHE_TTL = 4 * 60 * 60 * 1000 // 4 hours

export type CurrencyCode = 'VND' | 'USD'

const currency = ref<CurrencyCode>(
  (localStorage.getItem(CACHE_KEY) as CurrencyCode) || 'VND'
)

// Exchange rate: 1 VND = ? USD
const exchangeRate = ref<number>(loadCachedRate())
const rateLoading = ref(false)
const rateError = ref('')

// Persist preference
watch(currency, (val) => {
  localStorage.setItem(CACHE_KEY, val)
  if (val === 'USD' && !hasFreshRate()) {
    fetchExchangeRate()
  }
})

function loadCachedRate(): number {
  try {
    const cached = localStorage.getItem(RATE_CACHE_KEY)
    if (!cached) return 0
    const { rate, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < RATE_CACHE_TTL) return rate
  } catch {}
  return 0
}

function hasFreshRate(): boolean {
  try {
    const cached = localStorage.getItem(RATE_CACHE_KEY)
    if (!cached) return false
    const { timestamp } = JSON.parse(cached)
    return Date.now() - timestamp < RATE_CACHE_TTL
  } catch {
    return false
  }
}

async function fetchExchangeRate(): Promise<void> {
  if (rateLoading.value) return
  rateLoading.value = true
  rateError.value = ''
  try {
    // Using @fawazahmed0/currency-api (Free, no key, heavily cached via jsDelivr, supports VND)
    const data = await httpClient.get<any>('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/vnd.json')
    const rate = data?.vnd?.usd
    if (rate && typeof rate === 'number') {
      exchangeRate.value = rate
      localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({
        rate,
        timestamp: Date.now()
      }))
    } else {
      throw new Error('Invalid rate data')
    }
  } catch (err: any) {
    rateError.value = err.message || 'Failed to fetch exchange rate'
    if (!exchangeRate.value) {
      exchangeRate.value = 0.0000392 // ~1 USD = 25,500 VND (rough fallback)
    }
  } finally {
    rateLoading.value = false
  }
}

// ── Format functions ──

function convertToUSD(vndAmount: number): number {
  return vndAmount * exchangeRate.value
}

/**
 * Format money amount according to selected currency.
 * All internal amounts are stored in VND — this converts for display only.
 * @param amount - Amount in VND
 * @param hideBalances - Whether to mask the amount (from UI store)
 */
export function formatMoney(amount: number, hideBalances = false): string {
  if (hideBalances) return '******'

  if (currency.value === 'USD') {
    const usd = convertToUSD(amount)
    if (Math.abs(usd) < 0.01 && usd !== 0) {
      return '$' + usd.toFixed(4)
    }
    return '$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usd)
  }

  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

/**
 * Format money in short form (e.g., 1.5tr, 300k, $12.50).
 */
export function formatMoneyShort(amount: number, hideBalances = false): string {
  if (hideBalances) return '******'

  if (currency.value === 'USD') {
    const usd = convertToUSD(amount)
    if (Math.abs(usd) >= 1_000_000) return '$' + (usd / 1_000_000).toFixed(1) + 'M'
    if (Math.abs(usd) >= 1_000) return '$' + (usd / 1_000).toFixed(1) + 'K'
    return '$' + usd.toFixed(2)
  }

  if (Math.abs(amount) >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + 'tỷ'
  if (Math.abs(amount) >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'tr'
  if (Math.abs(amount) >= 1_000) return (amount / 1_000).toFixed(0) + 'k'
  return amount + 'đ'
}

const currencySymbol = computed(() => currency.value === 'USD' ? '$' : 'đ')

const rateDisplay = computed(() => {
  if (!exchangeRate.value) return ''
  const oneUsdInVnd = Math.round(1 / exchangeRate.value)
  return `1 USD ≈ ${new Intl.NumberFormat('vi-VN').format(oneUsdInVnd)} VND`
})

// Pre-fetch rate if user has USD selected
if (currency.value === 'USD' && !hasFreshRate()) {
  fetchExchangeRate()
}

export function useCurrency() {
  return {
    currency,
    exchangeRate,
    rateLoading,
    rateError,
    currencySymbol,
    rateDisplay,
    formatMoney,
    formatMoneyShort,
    fetchExchangeRate,
    setCurrency(code: CurrencyCode) {
      currency.value = code
    }
  }
}
