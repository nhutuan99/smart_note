// ── Recurring Transactions ──

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  walletId: string
  note: string
  frequency: RecurringFrequency
  nextDate: string // ISO date string (YYYY-MM-DD)
  endDate?: string // optional end date
  enabled: boolean
  createdAt: string
  lastExecuted?: string
}
