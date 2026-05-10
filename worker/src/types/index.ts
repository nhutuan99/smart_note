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

export interface StockAlert {
  id: string
  symbol: string
  targetPrice: number
  direction: 'above' | 'below' // above = sell target, below = buy target
  label: string
  triggered: boolean
  notifiedAt?: string
  createdAt: string
}

export interface StockData {
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

export interface ContactFeedback {
  id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  message: string
  createdAt: string
}

export interface ReminderData {
  id: string
  title: string
  description: string
  /** An optional URL relevant to the reminder (e.g. Jira link) */
  url?: string
  /** The target event datetime (ISO string) */
  eventDate: string
  /** Pre-calculated reminder fire times (ISO strings) */
  remindAt: string[]
  /** User-selected offsets: '15m','30m','1h','2h','3h','1d','2d','3d','1w' */
  offsets: string[]
  /** User-defined custom reminder datetime (ISO string, optional) */
  customRemindAt?: string
  /** Repeat interval: 'none','daily','weekly','monthly', or custom minutes number */
  repeatInterval?: string
  /** Which remindAt entries have been notified (ISO strings) */
  notifiedAt: string[]
  /** Whether user has acknowledged/seen the reminder */
  acknowledged: boolean
  /** Whether the auto last-chance noti (1h before deadline) has been sent */
  lastChanceSent: boolean
  /** Source feature that created this reminder */
  sourceType: 'note' | 'manual' | 'debt' | 'recurring'
  sourceId?: string
  status: 'active' | 'completed' | 'expired'
  createdAt: string
  updatedAt: string
}

export interface TodoData {
  id: string
  title: string
  description: string
  /** The target datetime for this task (ISO string) */
  time: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'done'
  category?: string
  /** Linked reminder ID when pushed to reminders */
  reminderId?: string
  createdAt: string
  updatedAt: string
}
