export interface Env {
  SMART_NOTE_KV: KVNamespace
  JWT_SECRET: string
  TELEGRAM_WEBHOOK_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  AI: any // Cloudflare AI binding
  GEMINI_API_KEY?: string
}

export interface UserData {
  id: string
  email: string
  name: string
  avatarUrl?: string
  passwordHash: string
  createdAt: string
  pinHash?: string
  hasCompletedOnboarding?: boolean
  lastWeeklyEvent?: number
}

export interface NoteData {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface TransactionData {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note: string
  walletId: string
  source: 'manual' | 'telegram' | 'notification' | 'sms'
  date: string
  createdAt: string
}

export interface PendingNotification {
  id: string
  rawText: string
  appName: string
  status: 'pending' | 'resolved'
  createdAt: string
}

export interface WalletData {
  id: string
  name: string
  balance: number
  currency: string
  icon: string
  color: string
  order: number
}

export interface NotificationData {
  id: string
  type: 'bank_in' | 'bank_out' | 'system'
  title: string
  body: string
  read: boolean
  createdAt: string
  meta?: {
    amount?: number
    txType?: 'income' | 'expense'
    walletName?: string
    bankName?: string
  }
}

export interface PushSubscriptionRecord {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  createdAt: string
}

export interface BudgetData {
  amount: number
  dismissed: boolean
  updatedAt: string
}

export interface BlogData {
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
  createdAt: string
  updatedAt: string
}
