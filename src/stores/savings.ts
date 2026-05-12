import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SavingsGoal } from '@/types'
import { httpClient } from '@/shared/api/httpClient'
import { AUTH_TOKEN_KEY } from '@/constants/auth'

function isLoggedIn() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * useSavingsStore
 *
 * Manages savings goals via the backend API (KV store).
 * Replaces the previous localStorage-only approach so the server
 * can send push notification reminders.
 */
export const useSavingsStore = defineStore('savings', () => {
  const goals = ref<SavingsGoal[]>([])
  const loading = ref(false)

  async function fetchGoals() {
    if (!isLoggedIn()) return
    loading.value = true
    try {
      const data = await httpClient.get<SavingsGoal[]>('/api/savings')
      goals.value = data ?? []
    } catch (err) {
      console.error('[Savings] fetchGoals failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function createGoal(payload: {
    name: string
    icon: string
    color: string
    targetAmount: number
    currentAmount?: number
    deadline?: string
    reminderTime?: string | null
  }): Promise<SavingsGoal | null> {
    try {
      const data = await httpClient.post<SavingsGoal>('/api/savings', payload)
      if (data) {
        goals.value = [...goals.value, data]
        return data
      }
      return null
    } catch (err) {
      console.error('[Savings] createGoal failed:', err)
      return null
    }
  }

  async function updateGoal(id: string, payload: Partial<SavingsGoal>): Promise<SavingsGoal | null> {
    try {
      const data = await httpClient.put<SavingsGoal>(`/api/savings/${id}`, payload)
      if (data) {
        goals.value = goals.value.map(g => g.id === id ? data : g)
        return data
      }
      return null
    } catch (err) {
      console.error('[Savings] updateGoal failed:', err)
      return null
    }
  }

  /** Deposit money into a goal (currentAmount += amount, capped at targetAmount) */
  async function deposit(id: string, amount: number): Promise<SavingsGoal | null> {
    const goal = goals.value.find(g => g.id === id)
    if (!goal) return null
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount)
    return updateGoal(id, { currentAmount: newAmount })
  }

  /** Withdraw money from a goal (currentAmount -= amount, floored at 0) */
  async function withdraw(id: string, amount: number): Promise<SavingsGoal | null> {
    const goal = goals.value.find(g => g.id === id)
    if (!goal) return null
    const newAmount = Math.max(goal.currentAmount - amount, 0)
    return updateGoal(id, { currentAmount: newAmount })
  }

  /** Set or clear daily reminder time for a goal */
  async function setReminder(id: string, time: string | null): Promise<boolean> {
    const data = await updateGoal(id, { reminderTime: time })
    return data !== null
  }

  async function deleteGoal(id: string): Promise<boolean> {
    try {
      await httpClient.del(`/api/savings/${id}`)
      goals.value = goals.value.filter(g => g.id !== id)
      return true
    } catch (err) {
      console.error('[Savings] deleteGoal failed:', err)
      return false
    }
  }

  function reset() {
    goals.value = []
    loading.value = false
  }

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deposit,
    withdraw,
    setReminder,
    deleteGoal,
    reset
  }
})
