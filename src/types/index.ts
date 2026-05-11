// ── User & Auth ──

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
  hasCompletedOnboarding?: boolean
}

// ── Notes ──

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  isPublic?: boolean
  sharedWith?: string[]
  createdAt: string
  updatedAt: string
}

export interface NoteListItem {
  id: string
  title: string
  excerpt: string
  tags: string[]
  pinned: boolean
  updatedAt: string
}

export type NoteFilter = 'all' | 'pinned' | 'recent'
export type ViewMode = 'grid' | 'list'

// ── Finance: Wallets ──

export interface Wallet {
  id: string
  name: string
  balance: number
  currency: string
  icon: string
  color: string
  order: number
  customLogoUrl?: string
}

// ── Finance: Transactions ──

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  walletId: string
  source: 'manual' | 'telegram' | 'notification' | 'sms'
  date: string
  createdAt: string
}

export interface TransactionFilter {
  type?: TransactionType | 'all'
  walletId?: string
  category?: string
  dateFrom?: string
  dateTo?: string
}

// ── Finance: Stats ──

export interface CategoryStat {
  category: string
  total: number
  count: number
  percentage: number
  icon: string
  color: string
}

export interface DailyStat {
  date: string
  income: number
  expense: number
  net: number
}

// ── Finance: Categories ──

export interface CategoryConfig {
  key: string
  label: string
  icon: string
  color: string
  type: TransactionType | 'both'
}

// ── API ──

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ── Blog ──

export interface Blog {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  imageUrl?: string
  author: {
    name: string
    email: string
  }
  seoMeta: {
    title: string
    description: string
    keywords: string
  }
  published: boolean
  viewCount?: number
  createdAt: string
  updatedAt: string
}

// ── Re-exports ──
export type { RecurringTransaction, RecurringFrequency } from './recurring'
export type { BudgetGoal, CategoryBudget } from './budget'
export type { SavingsGoal } from './savings'
export type { Debt, DebtType, DebtStatus } from './debt'
export type { FundPosition } from './fund'

export interface StockAlert {
  id: string
  symbol: string
  targetPrice: number
  direction: 'above' | 'below'
  label: string
  triggered: boolean
  notifiedAt?: string
  createdAt: string
}

export interface StockPosition {
  id: string
  symbol: string
  buyPrice: number
  quantity: number
  targetProfit?: number
  stopLoss?: number
  alerts?: StockAlert[]
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  title: string
  description: string
  url?: string
  eventDate: string
  remindAt: string[]
  offsets: string[]
  customRemindAt?: string
  repeatInterval?: string
  notifiedAt: string[]
  acknowledged: boolean
  lastChanceSent: boolean
  sourceType: 'note' | 'manual' | 'debt' | 'recurring'
  sourceId?: string
  status: 'active' | 'completed' | 'expired'
  createdAt: string
  updatedAt: string
}

export interface ReminderSuggestion {
  title: string
  eventDate: string
  description: string
  url?: string
}

export interface TodoItem {
  id: string
  title: string
  description: string
  time: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'done'
  category?: string
  reminderId?: string
  createdAt: string
  updatedAt: string
}

export interface TodoSuggestion {
  title: string
  description: string
  time: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
}

// ── Trading Journal ──

/** User config: which wallets to include in the daily trading check-in */
export interface TradingConfig {
  selectedWalletIds: string[]
  createdAt: string
  updatedAt: string
}

/** P&L entry for one wallet within a daily check-in */
export interface TradingCheckinEntry {
  walletId: string
  walletName: string
  /** 'percent' = user typed %, 'amount' = user typed VND */
  inputMode: 'percent' | 'amount'
  /** Raw value: % (e.g. 2.5) or VND absolute (e.g. 250000) */
  inputValue: number
  /** Calculated VND P&L (positive = profit, negative = loss) */
  pnlAmount: number
  /** Additional capital deposited this session (≥ 0) */
  depositAmount: number
  balanceBefore: number
  balanceAfter: number
}

/** One daily trading journal record */
export interface TradingCheckin {
  id: string
  /** YYYY-MM-DD */
  date: string
  entries: TradingCheckinEntry[]
  note: string
  totalPnl: number
  totalDeposit: number
  createdAt: string
  updatedAt: string
}

