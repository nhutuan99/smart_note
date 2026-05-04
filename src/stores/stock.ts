import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stockApi } from '@/services/api/stock.api'
import type { StockPosition } from '@/types'

export const useStockStore = defineStore('stock', () => {
  const positions = ref<StockPosition[]>([])
  const loading = ref(false)
  const prices = ref<Record<string, number>>({})

  async function fetchPositions() {
    loading.value = true
    try {
      const data = await stockApi.getPositions()
      positions.value = data || []
      
      // Fetch current prices in background
      data?.forEach(p => fetchPrice(p.symbol))
    } catch (error) {
      console.error('Failed to fetch stocks:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchPrice(symbol: string) {
    try {
      const data = await stockApi.getCurrentPrice(symbol)
      if (data?.currentPrice) {
        prices.value[symbol] = data.currentPrice
      }
    } catch (e) {
      // Ignore
    }
  }

  async function addPosition(data: Partial<StockPosition>) {
    try {
      const newPos = await stockApi.createPosition(data)
      if (newPos) {
        positions.value.push(newPos)
        fetchPrice(newPos.symbol)
      }
    } catch (e) {
      throw e
    }
  }

  async function updatePosition(id: string, data: Partial<StockPosition>) {
    try {
      const updated = await stockApi.updatePosition(id, data)
      if (updated) {
        const index = positions.value.findIndex(p => p.id === id)
        if (index !== -1) positions.value[index] = updated
        fetchPrice(updated.symbol)
      }
    } catch (e) {
      throw e
    }
  }

  async function deletePosition(id: string) {
    try {
      await stockApi.deletePosition(id)
      positions.value = positions.value.filter(p => p.id !== id)
    } catch (e) {
      throw e
    }
  }

  return {
    positions,
    loading,
    prices,
    fetchPositions,
    fetchPrice,
    addPosition,
    updatePosition,
    deletePosition
  }
})
