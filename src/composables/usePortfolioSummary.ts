/**
 * usePortfolioSummary
 * Aggregates wallet balances + stock portfolio value + fund portfolio value
 * into a single Net Worth figure.
 *
 * Follows ISP: components only import what they need via this composable.
 * Avoids cross-store imports at store level (SRP).
 */
import { computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useStockStore } from '@/stores/stock'
import { useFundStore } from '@/stores/fund'

export function usePortfolioSummary() {
  const finance = useFinanceStore()
  const stockStore = useStockStore()
  const fundStore = useFundStore()

  /** Total current market value of all stock positions (VND) */
  const stockPortfolioValue = computed(() =>
    stockStore.positions.reduce((sum, pos) => {
      const price = stockStore.prices[pos.symbol] ?? pos.buyPrice
      return sum + price * pos.quantity * 1000 // stock prices are in thousands VND
    }, 0)
  )

  /** Total cost basis of stock positions (VND) */
  const stockCostBasis = computed(() =>
    stockStore.positions.reduce((sum, pos) => sum + pos.buyPrice * pos.quantity * 1000, 0)
  )

  /** Unrealised P&L from stocks (VND) */
  const stockProfit = computed(() => stockPortfolioValue.value - stockCostBasis.value)

  /** Total current NAV value of all fund positions (VND) */
  const fundPortfolioValue = computed(() =>
    fundStore.positions.reduce((sum, pos) => {
      const nav = fundStore.navs[pos.symbol] ?? pos.buyPrice
      return sum + nav * pos.quantity
    }, 0)
  )

  /** Total cost basis of fund positions (VND) */
  const fundCostBasis = computed(() =>
    fundStore.positions.reduce((sum, pos) => sum + pos.buyPrice * pos.quantity, 0)
  )

  /** Unrealised P&L from funds (VND) */
  const fundProfit = computed(() => fundPortfolioValue.value - fundCostBasis.value)

  /** Combined unrealised P&L */
  const totalInvestmentProfit = computed(() => stockProfit.value + fundProfit.value)

  /**
   * Net Worth = wallet balances + stock market value + fund NAV value
   * This is what the user *actually* has today.
   */
  const totalNetWorth = computed(
    () => finance.totalBalance + stockPortfolioValue.value + fundPortfolioValue.value
  )

  /** Whether any investment data is currently loading */
  const investmentLoading = computed(() => stockStore.loading || fundStore.loading)

  /** Whether the user has any investment positions */
  const hasInvestments = computed(
    () => stockStore.positions.length > 0 || fundStore.positions.length > 0
  )

  return {
    // Wallet
    walletBalance: computed(() => finance.totalBalance),

    // Stocks
    stockPortfolioValue,
    stockCostBasis,
    stockProfit,
    hasStocks: computed(() => stockStore.positions.length > 0),

    // Funds
    fundPortfolioValue,
    fundCostBasis,
    fundProfit,
    hasFunds: computed(() => fundStore.positions.length > 0),

    // Combined
    totalInvestmentProfit,
    totalNetWorth,
    investmentLoading,
    hasInvestments,
  }
}
