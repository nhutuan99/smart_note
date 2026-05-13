import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { httpClient } from '@/shared/api/httpClient'
import type { SavingsGoalData } from '../../worker/src/types'

export const useSavingsStore = defineStore('savings', () => {
  const goals = ref<SavingsGoalData[]>([])
  const loading = ref(false)

  const totalSaved = computed(() => goals.value.reduce((s, g) => s + g.currentAmount, 0))
  const totalTarget = computed(() => goals.value.reduce((s, g) => s + g.targetAmount, 0))

  async function fetch() {
    loading.value = true
    try {
      const data = await httpClient.get<SavingsGoalData[]>('/api/savings')
      if (data) {
        goals.value = data
      }
    } finally {
      loading.value = false
    }
  }

  async function create(payload: Partial<SavingsGoalData>) {
    const res = await httpClient.post<SavingsGoalData>('/api/savings', payload)
    if (res) {
      goals.value.push(res)
    }
    return res
  }

  async function update(id: string, payload: Partial<SavingsGoalData>) {
    const res = await httpClient.put<SavingsGoalData>(`/api/savings/${id}`, payload)
    if (res) {
      const idx = goals.value.findIndex(g => g.id === id)
      if (idx !== -1) goals.value[idx] = res
    }
    return res
  }

  async function remove(id: string) {
    await httpClient.del(`/api/savings/${id}`)
    goals.value = goals.value.filter(g => g.id !== id)
  }

  async function deposit(id: string, amount: number, walletId?: string) {
    const res = await httpClient.post<SavingsGoalData>(`/api/savings/${id}/deposit`, { amount, walletId })
    if (res) {
      const idx = goals.value.findIndex(g => g.id === id)
      if (idx !== -1) goals.value[idx] = res
    }
    return res
  }

  async function withdraw(id: string, amount: number, walletId?: string) {
    const res = await httpClient.post<SavingsGoalData>(`/api/savings/${id}/withdraw`, { amount, walletId })
    if (res) {
      const idx = goals.value.findIndex(g => g.id === id)
      if (idx !== -1) goals.value[idx] = res
    }
    return res
  }

  // Migrate from local storage to API
  async function migrateFromLocal() {
    try {
      const local = localStorage.getItem('finnote_savings')
      if (local) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            // Check if already migrated
            if (!goals.value.some(g => g.name === item.name)) {
               await create({
                 name: item.name,
                 icon: item.icon,
                 color: item.color,
                 targetAmount: item.targetAmount,
               })
               // if they had balance we could deposit, but let's just do base goal
               const newlyCreated = goals.value[goals.value.length - 1]
               if (item.currentAmount > 0 && newlyCreated) {
                  await httpClient.post(`/api/savings/${newlyCreated.id}/deposit`, { amount: item.currentAmount })
               }
            }
          }
        }
        localStorage.removeItem('finnote_savings')
        await fetch()
      }
    } catch(e) {}
  }

  return { 
    goals, loading, totalSaved, totalTarget, 
    fetch, create, update, remove, deposit, withdraw, migrateFromLocal 
  }
})
