// ── Savings Goals ──

export interface SavingsGoal {
  id: string
  name: string
  icon: string
  color: string
  targetAmount: number
  currentAmount: number
  deadline?: string // ISO date string
  createdAt: string
}
