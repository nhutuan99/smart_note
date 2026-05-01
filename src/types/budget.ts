// ── Budget Goals ──

export interface CategoryBudget {
  category: string
  limit: number
  spent: number
}

export interface BudgetGoal {
  id: string
  month: string // "2026-05"
  totalLimit: number
  categoryBudgets: CategoryBudget[]
  alertThreshold: number // 0-1 (default 0.8 = 80%)
  createdAt: string
}
