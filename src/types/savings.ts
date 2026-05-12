// ── Savings Goals ──

export interface SavingsGoal {
  id: string
  name: string
  icon: string
  color: string
  targetAmount: number
  currentAmount: number
  deadline?: string // ISO date string
  /** "HH:MM" VN time — daily reminder, null = disabled */
  reminderTime?: string | null
  reminderNotifiedDate?: string | null
  createdAt: string
  updatedAt: string
}
