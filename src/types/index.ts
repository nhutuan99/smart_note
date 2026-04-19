// ── User & Auth ──

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

// ── Notes ──

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
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
  source: 'manual' | 'telegram' | 'notification'
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
