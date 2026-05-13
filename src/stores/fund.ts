import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fundApi } from '@/services/api/fund.api'
import type { FundPosition } from '@/types'

export const useFundStore = defineStore('fund', () => {
  const positions = ref<FundPosition[]>([])
  const loading = ref(false)
  const navs = ref<Record<string, number>>({})                 // symbol → current NAV
  const histories = ref<Record<string, { nav: number; time: number }[]>>({}) // symbol → history

  async function fetchPositions(force = false) {
    loading.value = true
    try {
      const data = await fundApi.getPositions()
      positions.value = data || []
      // Fetch market data in background
      data?.forEach(p => {
        fetchNav(p.symbol, force)
        fetchHistory(p.symbol, force)
      })
    } catch (e) {
      console.error('Failed to fetch fund positions:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchNav(symbol: string, force = false) {
    try {
      const data = await fundApi.getCurrentNav(symbol, force)
      if (data?.nav) {
        navs.value[symbol] = data.nav
      }
    } catch (e) {
      // ignore background error
    }
  }

  async function fetchAllNavs(force = false) {
    const symbols = [...new Set(positions.value.map(p => p.symbol))]
    await Promise.allSettled(symbols.map(s => fetchNav(s, force)))
  }

  async function fetchHistory(symbol: string, force = false) {
    try {
      const data = await fundApi.getNavHistory(symbol, 7, force)
      if (data?.history) {
        histories.value[symbol] = data.history
      }
    } catch (e) { /* silent */ }
  }

  async function addPosition(data: Partial<FundPosition>) {
    try {
      const newPos = await fundApi.createPosition(data)
      if (newPos) {
        positions.value.push(newPos)
        fetchNav(newPos.symbol)
        fetchHistory(newPos.symbol)
      }
    } catch (e) {
      throw e
    }
  }

  async function updatePosition(id: string, data: Partial<FundPosition>) {
    try {
      const updated = await fundApi.updatePosition(id, data)
      if (updated) {
        const idx = positions.value.findIndex((p: FundPosition) => p.id === id)
        if (idx !== -1) positions.value[idx] = updated
      }
    } catch (e) {
      throw e
    }
  }

  async function deletePosition(id: string) {
    try {
      await fundApi.deletePosition(id)
      positions.value = positions.value.filter((p: FundPosition) => p.id !== id)
    } catch (e) {
      throw e
    }
  }

  return {
    positions,
    loading,
    navs,
    histories,
    fetchPositions,
    fetchNav,
    fetchAllNavs,
    fetchHistory,
    addPosition,
    updatePosition,
    deletePosition
  }
})
