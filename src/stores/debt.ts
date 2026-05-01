import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Debt } from '@/types'

const STORAGE_KEY = 'finnote_debts'

function loadFromStorage(): Debt[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveToStorage(debts: Debt[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts))
}

export const useDebtStore = defineStore('debt', () => {
  // ── State ──
  const debts = ref<Debt[]>(loadFromStorage())

  // ── Computed ──
  const activeDebts = computed(() =>
    debts.value.filter((d) => d.status === 'active')
  )

  const completedDebts = computed(() =>
    debts.value.filter((d) => d.status === 'paid')
  )

  const totalBorrowed = computed(() =>
    activeDebts.value
      .filter((d) => d.type === 'borrowed')
      .reduce((sum, d) => sum + d.remainingAmount, 0)
  )

  const totalLent = computed(() =>
    activeDebts.value
      .filter((d) => d.type === 'lent')
      .reduce((sum, d) => sum + d.remainingAmount, 0)
  )

  const overdueDebts = computed(() => {
    const today = new Date().toISOString().substring(0, 10)
    return activeDebts.value.filter((d) => d.dueDate && d.dueDate < today)
  })

  const dueSoonDebts = computed(() => {
    const today = new Date()
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)
    const todayStr = today.toISOString().substring(0, 10)
    const weekStr = weekLater.toISOString().substring(0, 10)
    return activeDebts.value.filter(
      (d) => d.dueDate && d.dueDate >= todayStr && d.dueDate <= weekStr
    )
  })

  // ── Actions ──
  function addDebt(data: Omit<Debt, 'id' | 'createdAt'>): Debt {
    const debt: Debt = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
    debts.value.push(debt)
    saveToStorage(debts.value)
    return debt
  }

  function updateDebt(id: string, updates: Partial<Debt>): void {
    const idx = debts.value.findIndex((d) => d.id === id)
    if (idx !== -1) {
      debts.value[idx] = { ...debts.value[idx], ...updates }
      saveToStorage(debts.value)
    }
  }

  function deleteDebt(id: string): void {
    debts.value = debts.value.filter((d) => d.id !== id)
    saveToStorage(debts.value)
  }

  function markPaid(id: string): void {
    updateDebt(id, { status: 'paid', remainingAmount: 0 })
  }

  return {
    debts,
    activeDebts,
    completedDebts,
    totalBorrowed,
    totalLent,
    overdueDebts,
    dueSoonDebts,
    addDebt,
    updateDebt,
    deleteDebt,
    markPaid
  }
})
