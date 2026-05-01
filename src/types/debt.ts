export interface Debt {
  id: string
  title: string
  type: 'borrowed' | 'lent'
  amount: number
  remainingAmount: number
  interestRate: number
  counterparty: string
  startDate: string
  dueDate: string
  note: string
  status: 'active' | 'paid'
  createdAt: string
}

export type DebtType = Debt['type']
export type DebtStatus = Debt['status']
