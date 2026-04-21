/**
 * Smart Note - Cloudflare Worker API (KV Storage)
 *
 * Includes: Auth, Notes CRUD, Finance CRUD, Telegram Webhook (OpenClaw)
 *
 * Setup:
 * 1. Create KV namespace: `npx wrangler kv namespace create "SMART_NOTE_KV"`
 * 2. Deploy first: `npx wrangler deploy`
 * 3. Set secrets:
 *    - `npx wrangler secret put JWT_SECRET`
 *    - `npx wrangler secret put TELEGRAM_WEBHOOK_SECRET`
 */

interface Env {
  SMART_NOTE_KV: KVNamespace
  JWT_SECRET: string
  TELEGRAM_WEBHOOK_SECRET: string
  CASSO_WEBHOOK_SECRET: string
  RESEND_API_KEY?: string
  AI: Ai
}

interface UserData {
  id: string
  email: string
  name: string
  avatarUrl?: string
  passwordHash: string
  createdAt: string
}

interface NoteData {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

interface TransactionData {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note: string
  walletId: string
  source: 'manual' | 'telegram' | 'notification' | 'casso' | 'sms'
  date: string
  createdAt: string
}

interface PendingNotification {
  id: string
  rawText: string
  appName: string
  status: 'pending' | 'resolved'
  createdAt: string
}

interface WalletData {
  id: string
  name: string
  balance: number
  currency: string
  icon: string
  color: string
  order: number
}

interface NotificationData {
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

// ====== Default Wallets (created on register) ======

const DEFAULT_WALLETS: Omit<WalletData, 'id'>[] = [
  { name: 'Ngân hàng', balance: 0, currency: 'VND', icon: '🏦', color: '#3b82f6', order: 0 },
  { name: 'Ví điện tử', balance: 0, currency: 'VND', icon: '📱', color: '#8b5cf6', order: 1 },
  { name: 'Tiền mặt',   balance: 0, currency: 'VND', icon: '💵', color: '#10b981', order: 2 },
]

// ====== Utility Functions ======

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Secret',
    'Content-Type': 'application/json'
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status)
}

// ====== Crypto Helpers ======

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function createJWT(payload: object, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(
    JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  )
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${body}`)
  )
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${header}.${body}.${sig}`
}

async function verifyJWT(
  token: string,
  secret: string
): Promise<{ userId: string } | null> {
  try {
    const [header, body, sig] = token.split('.')
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      Uint8Array.from(atob(sig), (c) => c.charCodeAt(0)),
      encoder.encode(`${header}.${body}`)
    )
    if (!valid) return null
    const payload = JSON.parse(atob(body))
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ====== KV Helpers ======

async function getJSON<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return kv.get<T>(key, 'json')
}

async function putJSON(kv: KVNamespace, key: string, data: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(data))
}

// ====== Auth Handlers ======

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const { email, password, name } = (await request.json()) as any
  if (!email || !password) return errorResponse('Email and password required')

  const usersIndex =
    (await getJSON<Record<string, string>>(env.SMART_NOTE_KV, 'users/_index')) || {}
  if (usersIndex[email]) return errorResponse('Email already registered')

  const id = generateId()
  const user: UserData = {
    id,
    email,
    name: name || email.split('@')[0],
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  }

  await putJSON(env.SMART_NOTE_KV, `users/${id}/profile`, user)
  usersIndex[email] = id
  await putJSON(env.SMART_NOTE_KV, 'users/_index', usersIndex)
  await putJSON(env.SMART_NOTE_KV, `users/${id}/notes/_index`, { notes: [] })

  // Create default wallets with generated IDs
  const defaultWallets: WalletData[] = DEFAULT_WALLETS.map((w) => ({
    ...w,
    id: generateId()
  }))
  await putJSON(env.SMART_NOTE_KV, `users/${id}/finance/wallets`, defaultWallets)
  await putJSON(env.SMART_NOTE_KV, `users/${id}/finance/transactions`, [])

  const token = await createJWT({ userId: id }, env.JWT_SECRET)
  return jsonResponse({
    success: true,
    data: {
      token,
      user: {
        id,
        email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    }
  })
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const { email, password } = (await request.json()) as any
  if (!email || !password) return errorResponse('Email and password required')

  const usersIndex =
    (await getJSON<Record<string, string>>(env.SMART_NOTE_KV, 'users/_index')) || {}
  const userId = usersIndex[email]
  if (!userId) return errorResponse('Invalid credentials', 401)

  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) return errorResponse('Invalid credentials', 401)

  const token = await createJWT({ userId: user.id }, env.JWT_SECRET)
  return jsonResponse({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    }
  })
}

async function handleUpdateProfile(userId: string, request: Request, env: Env): Promise<Response> {
  const { name, avatarUrl } = (await request.json()) as any
  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  if (name) user.name = name
  if (avatarUrl !== undefined) {
    if (!avatarUrl || avatarUrl.trim() === '') {
      delete user.avatarUrl
    } else {
      user.avatarUrl = avatarUrl.trim()
    }
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user)

  return jsonResponse({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt
    }
  })
}

async function handleDeleteAccount(userId: string, request: Request, env: Env): Promise<Response> {
  const { password } = (await request.json()) as any
  if (!password) return errorResponse('Password is required', 400)

  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) {
    return errorResponse('Mật khẩu không chính xác', 401)
  }

  // Cleanup data
  // Remove from _index
  const usersIndex = (await getJSON<Record<string, string>>(env.SMART_NOTE_KV, 'users/_index')) || {}
  delete usersIndex[user.email]
  await putJSON(env.SMART_NOTE_KV, 'users/_index', usersIndex)

  // In KV, deleting individual resources or setting expiration is needed.
  // For simplicity, we just delete the main entry points so data becomes inaccessible.
  await env.SMART_NOTE_KV.delete(`users/${userId}/profile`)
  await env.SMART_NOTE_KV.delete(`users/${userId}/notes/_index`)
  await env.SMART_NOTE_KV.delete(`users/${userId}/finance/wallets`)
  await env.SMART_NOTE_KV.delete(`users/${userId}/finance/transactions`)
  await env.SMART_NOTE_KV.delete(`users/${userId}/pin`)
  await env.SMART_NOTE_KV.delete(`users/${userId}/otp`)

  return jsonResponse({ success: true, message: 'Account deleted successfully' })
}

// ====== Note Handlers ======

async function handleListNotes(userId: string, env: Env): Promise<Response> {
  const index = await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )
  return jsonResponse({ success: true, data: index?.notes || [] })
}

async function handleGetNote(userId: string, noteId: string, env: Env): Promise<Response> {
  const note = await getJSON<NoteData>(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`)
  if (!note) return errorResponse('Note not found', 404)
  return jsonResponse({ success: true, data: note })
}

async function handleCreateNote(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const id = generateId()
  const now = new Date().toISOString()
  const note: NoteData = {
    id,
    title: body.title || 'Untitled',
    content: body.content || '',
    tags: body.tags || [],
    pinned: body.pinned || false,
    createdAt: now,
    updatedAt: now
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${id}`, note)

  const index = (await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )) || { notes: [] }
  index.notes.push({
    id: note.id,
    title: note.title,
    excerpt: note.content.substring(0, 120),
    tags: note.tags,
    pinned: note.pinned,
    updatedAt: note.updatedAt
  })
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index)

  return jsonResponse({ success: true, data: note }, 201)
}

async function handleUpdateNote(
  userId: string,
  noteId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const existing = await getJSON<NoteData>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/${noteId}`
  )
  if (!existing) return errorResponse('Note not found', 404)

  const body = (await request.json()) as any
  const updated: NoteData = {
    ...existing,
    ...body,
    id: noteId,
    updatedAt: new Date().toISOString()
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`, updated)

  const index = (await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )) || { notes: [] }
  const idx = index.notes.findIndex((n: any) => n.id === noteId)
  if (idx !== -1) {
    index.notes[idx] = {
      id: updated.id,
      title: updated.title,
      excerpt: updated.content.substring(0, 120),
      tags: updated.tags,
      pinned: updated.pinned,
      updatedAt: updated.updatedAt
    }
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index)
  }

  return jsonResponse({ success: true, data: updated })
}

async function handleDeleteNote(userId: string, noteId: string, env: Env): Promise<Response> {
  await env.SMART_NOTE_KV.delete(`users/${userId}/notes/${noteId}`)

  const index = (await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )) || { notes: [] }
  index.notes = index.notes.filter((n: any) => n.id !== noteId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index)

  return jsonResponse({ success: true })
}

// ====== Finance Handlers ======

async function handleListWallets(userId: string, env: Env): Promise<Response> {
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  return jsonResponse({ success: true, data: wallets })
}

async function handleCreateWallet(
  userId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const body = (await request.json()) as any
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []

  const wallet: WalletData = {
    id: generateId(),
    name: body.name,
    balance: body.balance || 0,
    currency: body.currency || 'VND',
    icon: body.icon || '💰',
    color: body.color || '#10b981',
    order: wallets.length
  }

  wallets.push(wallet)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  return jsonResponse({ success: true, data: wallet }, 201)
}

async function handleUpdateWallet(
  userId: string,
  walletId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  const idx = wallets.findIndex((w) => w.id === walletId)
  if (idx === -1) return errorResponse('Wallet not found', 404)

  const body = (await request.json()) as any
  wallets[idx] = { ...wallets[idx], ...body, id: walletId }
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  return jsonResponse({ success: true, data: wallets[idx] })
}

async function handleDeleteWallet(
  userId: string,
  walletId: string,
  env: Env
): Promise<Response> {
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  const filtered = wallets.filter((w) => w.id !== walletId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, filtered)
  return jsonResponse({ success: true })
}

async function handleListTransactions(userId: string, env: Env): Promise<Response> {
  const txs =
    (await getJSON<TransactionData[]>(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/transactions`
    )) || []
  return jsonResponse({ success: true, data: txs })
}

async function handleCreateTransaction(
  userId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const body = (await request.json()) as any
  const txs =
    (await getJSON<TransactionData[]>(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/transactions`
    )) || []
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []

  const tx: TransactionData = {
    id: generateId(),
    type: body.type,
    amount: body.amount,
    category: body.category,
    note: body.note || '',
    walletId: body.walletId,
    source: body.source || 'manual',
    date: body.date || new Date().toISOString().substring(0, 10),
    createdAt: new Date().toISOString()
  }

  txs.push(tx)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)

  // Update wallet balance
  const walletIdx = wallets.findIndex((w) => w.id === tx.walletId)
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += tx.type === 'income' ? tx.amount : -tx.amount
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  }

  return jsonResponse({ success: true, data: tx }, 201)
}

async function handleDeleteTransaction(
  userId: string,
  txId: string,
  env: Env
): Promise<Response> {
  const txs =
    (await getJSON<TransactionData[]>(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/transactions`
    )) || []
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []

  const tx = txs.find((t) => t.id === txId)
  if (tx) {
    // Revert wallet balance
    const walletIdx = wallets.findIndex((w) => w.id === tx.walletId)
    if (walletIdx !== -1) {
      wallets[walletIdx].balance += tx.type === 'income' ? -tx.amount : tx.amount
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
    }
  }

  const filtered = txs.filter((t) => t.id !== txId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, filtered)

  return jsonResponse({ success: true })
}

// ====== Telegram Webhook (OpenClaw) ======

async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return errorResponse('Unauthorized webhook', 401)
  }

  const body = (await request.json()) as any
  const { userId, type, amount, category, note, wallet } = body

  if (!userId || !amount || !type) {
    return errorResponse('Missing required fields: userId, amount, type')
  }

  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []

  let walletId = wallets[0]?.id || ''
  if (wallet) {
    const found = wallets.find((w) => w.name.toLowerCase().includes(wallet.toLowerCase()))
    if (found) walletId = found.id
  }

  const txs =
    (await getJSON<TransactionData[]>(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/transactions`
    )) || []

  const tx: TransactionData = {
    id: generateId(),
    type,
    amount: Math.abs(amount),
    category: category || (type === 'expense' ? 'other_expense' : 'other_income'),
    note: note || '',
    walletId,
    source: 'telegram',
    date: new Date().toISOString().substring(0, 10),
    createdAt: new Date().toISOString()
  }

  txs.push(tx)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)

  const walletIdx = wallets.findIndex((w) => w.id === walletId)
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += tx.type === 'income' ? tx.amount : -tx.amount
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  }

  return jsonResponse({
    success: true,
    data: tx,
    message: `Đã ghi ${tx.type === 'income' ? 'thu' : 'chi'} ${tx.amount.toLocaleString('vi-VN')}đ vào ${wallets[walletIdx]?.name || 'ví'}`
  })
}

// ====== Bank Notification Parser ======

interface ParsedTransaction {
  type: 'income' | 'expense'
  amount: number
  walletHint: string
  note: string
}

function parseAmount(text: string): number {
  // Match Vietnamese amount formats: 500,000 or 500.000 or 500000
  const match = text.match(/([\d.,]+)\s*(?:VND|đ|d|vnd)/i)
  if (!match) return 0
  // Remove separators, keep only digits
  return parseInt(match[1].replace(/[.,]/g, ''), 10) || 0
}

function parseNotification(appName: string, text: string): ParsedTransaction | null {
  const lowerApp = appName.toLowerCase()
  const lowerText = text.toLowerCase()

  // Detect bank from app name or text content
  let walletHint = ''
  if (lowerApp.includes('vietcombank') || lowerApp.includes('vcb') || lowerText.includes('vietcombank'))
    walletHint = 'Vietcombank'
  else if (lowerApp.includes('techcombank') || lowerApp.includes('tcb') || lowerText.includes('techcombank'))
    walletHint = 'Techcombank'
  else if (lowerApp.includes('mbbank') || lowerApp.includes('mb bank') || lowerText.includes('mbbank'))
    walletHint = 'MBBank'
  else if (lowerApp.includes('tpbank') || lowerApp.includes('tpb') || lowerText.includes('tpbank'))
    walletHint = 'TPBank'
  else if (lowerApp.includes('momo') || lowerText.includes('momo'))
    walletHint = 'MoMo'
  else if (lowerApp.includes('zalopay') || lowerApp.includes('zalo pay') || lowerText.includes('zalopay'))
    walletHint = 'ZaloPay'
  else if (lowerApp.includes('bidv') || lowerText.includes('bidv'))
    walletHint = 'BIDV'
  else if (lowerApp.includes('agribank') || lowerText.includes('agribank'))
    walletHint = 'Agribank'
  else if (lowerApp.includes('vietinbank') || lowerText.includes('vietinbank'))
    walletHint = 'VietinBank'
  else if (lowerApp.includes('acb') || lowerText.includes('acb'))
    walletHint = 'ACB'

  // Extract amount
  const amount = parseAmount(text)
  if (amount <= 0) return null

  // Determine transaction type
  let type: 'income' | 'expense' = 'expense'

  // Income indicators
  const incomeKeywords = ['ghi có', 'ghi co', 'nhận', 'nhan', 'nhận được', '+', 'credited', 'received', 'cộng']
  // Expense indicators  
  const expenseKeywords = ['ghi nợ', 'ghi no', 'thanh toán', 'thanh toan', 'trừ', 'tru', '-', 'debited', 'chi', 'chuyển', 'chuyen']

  if (incomeKeywords.some(k => lowerText.includes(k))) type = 'income'
  if (expenseKeywords.some(k => lowerText.includes(k))) type = 'expense'

  // Check for +/- sign before amount
  const signMatch = text.match(/([+-])\s*[\d.,]+\s*(?:VND|đ|d)/i)
  if (signMatch) {
    type = signMatch[1] === '+' ? 'income' : 'expense'
  }

  // Extract note/description (ND:, Noi dung:, etc.)
  let note = ''
  const ndMatch = text.match(/(?:ND|Noi dung|Ref|nội dung)[:\s]+(.*?)(?:\.|$)/i)
  if (ndMatch) note = ndMatch[1].trim()

  return { type, amount, walletHint, note }
}

async function handleNotificationWebhook(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return errorResponse('Unauthorized webhook', 401)
  }

  const body = (await request.json()) as any
  const { userId, appName, text, title } = body

  if (!userId || !text) {
    return errorResponse('Missing required fields: userId, text')
  }

  const fullText = title ? `${title} ${text}` : text
  const parsed = parseNotification(appName || '', fullText)

  // If parsing failed, save as pending notification
  if (!parsed) {
    const pending = (await getJSON<PendingNotification[]>(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/pending`
    )) || []

    pending.push({
      id: generateId(),
      rawText: fullText,
      appName: appName || 'Unknown',
      status: 'pending',
      createdAt: new Date().toISOString()
    })

    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`, pending)

    return jsonResponse({
      success: false,
      error: 'Không thể detect giao dịch, đã lưu vào pending',
      data: { rawText: fullText, status: 'pending' }
    })
  }

  // Match wallet by hint
  const wallets = (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  let walletId = wallets[0]?.id || ''
  if (parsed.walletHint) {
    const found = wallets.find(w => w.name.toLowerCase().includes(parsed.walletHint.toLowerCase()))
    if (found) walletId = found.id
  }

  // Create transaction
  const txs = (await getJSON<TransactionData[]>(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  )) || []

  const tx: TransactionData = {
    id: generateId(),
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.type === 'expense' ? 'other_expense' : 'other_income',
    note: parsed.note || `Auto: ${appName || 'notification'}`,
    walletId,
    source: 'notification',
    date: new Date().toISOString().substring(0, 10),
    createdAt: new Date().toISOString()
  }

  txs.push(tx)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)

  const walletIdx = wallets.findIndex(w => w.id === walletId)
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += tx.type === 'income' ? tx.amount : -tx.amount
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  }

  return jsonResponse({
    success: true,
    data: tx,
    message: `Auto: ${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}đ → ${wallets[walletIdx]?.name || 'ví'}`
  })
}

// ====== Notification Handlers ======

async function handleListNotifications(userId: string, env: Env): Promise<Response> {
  const notifications = (await getJSON<NotificationData[]>(
    env.SMART_NOTE_KV, `users/${userId}/notifications`
  )) || []
  // Newest first
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return jsonResponse({ success: true, data: notifications })
}

async function handleMarkNotificationRead(userId: string, notiId: string, env: Env): Promise<Response> {
  const notifications = (await getJSON<NotificationData[]>(
    env.SMART_NOTE_KV, `users/${userId}/notifications`
  )) || []
  const idx = notifications.findIndex(n => n.id === notiId)
  if (idx !== -1) {
    notifications[idx].read = true
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notifications)
  }
  return jsonResponse({ success: true })
}

async function handleMarkAllNotificationsRead(userId: string, env: Env): Promise<Response> {
  const notifications = (await getJSON<NotificationData[]>(
    env.SMART_NOTE_KV, `users/${userId}/notifications`
  )) || []
  notifications.forEach(n => n.read = true)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notifications)
  return jsonResponse({ success: true })
}

async function handleClearNotifications(userId: string, env: Env): Promise<Response> {
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, [])
  return jsonResponse({ success: true })
}

// ====== Casso Bank Webhook ======
// Docs: https://docs.casso.vn
// Casso gửi POST mỗi khi có giao dịch mới vào tài khoản ngân hàng đã liên kết.
// Payload example:
// {
//   "error": 0,
//   "data": {
//     "id": 1234567, "tid": "FT23123456789",
//     "description": "MBVCB.123456. Nguyen Van A chuyen tien",
//     "amount": 500000,             // dương = nhận (income), âm = chi (expense)
//     "cusum_balance": 2500000,
//     "when": "2024-01-20 08:30:00",
//     "bankSubAccId": "0123456789",
//     "bankName": "Techcombank",
//     "bankAbbr": "TCB"
//   }
// }

// Map Casso bankAbbr/bankName → tên ví trong SmartNote
const CASSO_BANK_MAP: Record<string, string[]> = {
  'Techcombank':  ['techcombank', 'tcb'],
  'TPBank':       ['tpbank', 'tpb', 'tp bank'],
  'MBBank':       ['mbbank', 'mb bank', 'mb', 'quân đội'],
  'Vietcombank':  ['vietcombank', 'vcb'],
  'BIDV':         ['bidv'],
  'Agribank':     ['agribank', 'agr'],
  'VietinBank':   ['vietinbank', 'viettin', 'ctg'],
  'ACB':          ['acb'],
  'VPBank':       ['vpbank', 'vp bank'],
  'SHBank':       ['shbank', 'sh bank'],
  'MSB':          ['msb', 'maritime'],
  'MoMo':         ['momo'],
  'ZaloPay':      ['zalopay', 'zalo pay'],
}

function matchWalletByCasso(wallets: WalletData[], bankName: string, bankAbbr: string): string {
  const needle = (bankName + ' ' + bankAbbr).toLowerCase()

  // 1. Tìm theo mapping chuẩn
  for (const [walletKey, aliases] of Object.entries(CASSO_BANK_MAP)) {
    const isMatch = aliases.some(alias => needle.includes(alias))
    if (isMatch) {
      const found = wallets.find(w => w.name.toLowerCase().includes(walletKey.toLowerCase()))
      if (found) return found.id
    }
  }

  // 2. Fuzzy: tìm thẳng theo bankAbbr trong tên ví
  if (bankAbbr) {
    const found = wallets.find(w => w.name.toLowerCase().includes(bankAbbr.toLowerCase()))
    if (found) return found.id
  }

  // 3. Fallback: ví đầu tiên
  return wallets[0]?.id || ''
}

function parseCassoDate(when: string): string {
  // Casso format: "2024-01-20 08:30:00" → "2024-01-20"
  try {
    return when.substring(0, 10)
  } catch {
    return new Date().toISOString().substring(0, 10)
  }
}

async function handleCassoWebhook(request: Request, env: Env): Promise<Response> {
  // Xác thực webhook key từ Casso (cấu hình trong Casso dashboard)
  const secret = request.headers.get('secure-token') ||
                 request.headers.get('Authorization')?.replace('Bearer ', '') || ''

  if (env.CASSO_WEBHOOK_SECRET && secret !== env.CASSO_WEBHOOK_SECRET) {
    console.warn('[CASSO] Unauthorized webhook attempt')
    return errorResponse('Unauthorized', 401)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  // Casso gửi object hoặc array các giao dịch
  const records: any[] = Array.isArray(body?.data) ? body.data
    : body?.data ? [body.data]
    : []

  if (records.length === 0) {
    return jsonResponse({ success: true, message: 'No records to process' })
  }

  // Lấy userId từ query param: /api/webhook/casso?userId=xxx
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return errorResponse('Missing userId query param')

  // Verify user exists
  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  const wallets = (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  const txs = (await getJSON<TransactionData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`)) || []

  const created: TransactionData[] = []

  for (const record of records) {
    const rawAmount: number = record.amount ?? 0
    if (rawAmount === 0) continue

    const type: 'income' | 'expense' = rawAmount > 0 ? 'income' : 'expense'
    const amount = Math.abs(rawAmount)
    const bankName: string = record.bankName ?? record.bank_name ?? ''
    const bankAbbr: string = record.bankAbbr ?? record.bank_abbr ?? ''
    const description: string = record.description ?? record.memo ?? ''
    const when: string = record.when ?? record.createdAt ?? ''

    const walletId = matchWalletByCasso(wallets, bankName, bankAbbr)

    // Tránh duplicate: kiểm tra theo Casso transaction ID
    const cassoTid: string = String(record.tid ?? record.id ?? '')
    const alreadyExists = txs.some(t => t.note?.includes(`[casso:${cassoTid}]`))
    if (alreadyExists) {
      console.log(`[CASSO] Duplicate skipped: ${cassoTid}`)
      continue
    }

    const tx: TransactionData = {
      id: generateId(),
      type,
      amount,
      category: type === 'income' ? 'other_income' : 'other_expense',
      note: `${description} [casso:${cassoTid}]`.trim(),
      walletId,
      source: 'casso',
      date: parseCassoDate(when),
      createdAt: new Date().toISOString()
    }

    txs.push(tx)
    created.push(tx)

    // Cập nhật số dư ví
    const walletIdx = wallets.findIndex(w => w.id === walletId)
    if (walletIdx !== -1) {
      wallets[walletIdx].balance += type === 'income' ? amount : -amount
    }

    // Tạo notification
    const walletName = wallets.find(w => w.id === walletId)?.name || 'ví'
    const notiList = (await getJSON<NotificationData[]>(
      env.SMART_NOTE_KV, `users/${userId}/notifications`
    )) || []
    notiList.unshift({
      id: generateId(),
      type: type === 'income' ? 'bank_in' : 'bank_out',
      title: type === 'income' ? 'Tiền vào tài khoản' : 'Tiền ra tài khoản',
      body: `${type === 'income' ? '+' : '-'}${amount.toLocaleString('vi-VN')}đ • ${walletName} • ${bankName || bankAbbr}`,
      read: false,
      createdAt: new Date().toISOString(),
      meta: { amount, txType: type, walletName, bankName: bankName || bankAbbr }
    })
    // Giữ tối đa 100 noti
    if (notiList.length > 100) notiList.splice(100)
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notiList)
  }

  if (created.length > 0) {
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  }

  console.log(`[CASSO] Processed ${created.length}/${records.length} transactions for user ${userId}`)

  return jsonResponse({
    success: true,
    message: `Đã ghi ${created.length} giao dịch từ ngân hàng`,
    data: created
  })
}

// ─── iOS SMS Webhook ──────────────────────────────────────────────────────────

/**
 * Parse structured SMS from Vietnamese banks.
 * 
 * TPBank format:
 *   (TPBank): 21/04/26;08:12
 *   TK: xxxx8505201
 *   PS:-22.000VND
 *   SD: 257.093VND
 *   SD KHA DUNG: 257.093VND
 *   ND: NAP TIEN VI MOMO - 0812122501
 *   SO GD: 918TTMB261
 * 
 * Also handles generic: +500,000VND or -300.000VND
 */
interface SmsParsedResult {
  type: 'income' | 'expense'
  amount: number
  note: string        // extracted ND or truncated text
  txRef: string       // SO GD / transaction reference for dedup
  account: string     // TK number
  balance: number     // SD (current balance)
  bankName: string    // detected bank name
  rawText: string     // original SMS (truncated for storage)
}

function parseSmsTransaction(text: string): SmsParsedResult | null {
  if (!text) return null

  // ── Detect bank name ──
  let bankName = ''
  const lowerText = text.toLowerCase()
  if (lowerText.includes('tpbank') || lowerText.includes('(tpbank)'))  bankName = 'TPBank'
  else if (lowerText.includes('techcombank') || lowerText.includes('tcb')) bankName = 'Techcombank'
  else if (lowerText.includes('vietcombank') || lowerText.includes('vcb')) bankName = 'Vietcombank'
  else if (lowerText.includes('mbbank') || lowerText.includes('mb bank')) bankName = 'MBBank'
  else if (lowerText.includes('bidv'))       bankName = 'BIDV'
  else if (lowerText.includes('agribank'))   bankName = 'Agribank'
  else if (lowerText.includes('vietinbank')) bankName = 'VietinBank'
  else if (lowerText.includes('acb'))        bankName = 'ACB'
  else if (lowerText.includes('vpbank'))     bankName = 'VPBank'
  else if (lowerText.includes('sacombank'))  bankName = 'Sacombank'
  else if (lowerText.includes('momo'))       bankName = 'MoMo'
  else if (lowerText.includes('zalopay'))    bankName = 'ZaloPay'

  // ── Extract structured fields (TPBank, Techcombank, etc.) ──
  // PS (Phát sinh): PS:-22.000VND or PS:+500.000VND
  const psMatch = text.match(/PS\s*:\s*([+-])\s*([\d.,]+)\s*(?:VND|đ)/i)
  // TK (Tài khoản): TK: xxxx8505201
  const tkMatch = text.match(/TK\s*:\s*([^\n\r]+)/i)
  // SD (Số dư): SD: 257.093VND
  const sdMatch = text.match(/(?:^|\n)\s*SD\s*:\s*([\d.,]+)\s*(?:VND|đ)/im)
  // ND (Nội dung): ND: NAP TIEN VI MOMO...
  const ndMatch = text.match(/ND\s*:\s*([^\n\r]+)/i)
  // SO GD (Số giao dịch): SO GD: 918TTMB261
  const soGdMatch = text.match(/SO\s*GD\s*:\s*([^\n\r\s]+)/i)

  let type: 'income' | 'expense' = 'expense'
  let amount = 0
  let note = ''
  let txRef = ''
  let account = ''
  let balance = 0

  // ── Strategy 1: Structured PS field (best for TPBank, etc.) ──
  if (psMatch) {
    type = psMatch[1] === '+' ? 'income' : 'expense'
    amount = parseInt(psMatch[2].replace(/[.,]/g, ''), 10) || 0
  }

  // ── Strategy 2: Generic +/- amount format ──
  if (amount <= 0) {
    const genericMatch = text.match(/([+-])\s*([\d.,]+)\s*(?:VND|đ)/i)
    if (genericMatch) {
      type = genericMatch[1] === '+' ? 'income' : 'expense'
      amount = parseInt(genericMatch[2].replace(/[.,]/g, ''), 10) || 0
    }
  }

  // ── Strategy 3: "da bi tru" / "da duoc cong" format ──
  if (amount <= 0) {
    const truMatch = text.match(/(?:bi tru|ghi no|ghi nợ|trừ)\s*([\d.,]+)\s*(?:VND|đ)/i)
    if (truMatch) {
      type = 'expense'
      amount = parseInt(truMatch[1].replace(/[.,]/g, ''), 10) || 0
    }
    const congMatch = text.match(/(?:duoc cong|ghi co|ghi có|cộng|nhận)\s*([\d.,]+)\s*(?:VND|đ)/i)
    if (congMatch) {
      type = 'income'
      amount = parseInt(congMatch[1].replace(/[.,]/g, ''), 10) || 0
    }
  }

  if (amount <= 0) return null

  // Extract optional fields
  if (tkMatch) account = tkMatch[1].trim()
  if (sdMatch) balance = parseInt(sdMatch[1].replace(/[.,]/g, ''), 10) || 0
  if (ndMatch) note = ndMatch[1].trim()
  if (soGdMatch) txRef = soGdMatch[1].trim()

  // Fallback note if ND not found
  if (!note) {
    const ndFallback = text.match(/(?:Noi dung|nội dung|Ref)[:\s]+(.+?)(?:\.|$)/im)
    if (ndFallback) note = ndFallback[1].trim()
  }
  if (!note) {
    note = text.substring(0, 80) + (text.length > 80 ? '...' : '')
  }

  return {
    type,
    amount,
    note,
    txRef,
    account,
    balance,
    bankName,
    rawText: text.substring(0, 200) + (text.length > 200 ? '...' : '')
  }
}

async function handleSmsWebhook(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get('content-type') || ''
  
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  const cloned = request.clone()
  
  // ── Debug: save raw request to KV for troubleshooting ──
  let rawTextDump = ''
  try {
    rawTextDump = await cloned.text()
    if (userId) {
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/latest_request`, {
        contentType,
        rawDump: rawTextDump,
        headers: Object.fromEntries([...request.headers]),
        time: new Date().toISOString()
      })
    }
  } catch (e) {}

  // ── Extract SMS text from various content-types ──
  let text = ''
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json() as any
      // iOS Shortcuts sends: {"text": "SMS content"} or {"text": {"body": "..."}}
      const raw = body?.text ?? body?.message ?? body?.body ?? body?.content ?? ''
      text = typeof raw === 'string' ? raw : (raw?.body ?? raw?.content ?? raw?.text ?? JSON.stringify(raw))
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      text = (formData.get('text') || formData.get('message') || formData.get('body') || '').toString()
    } else {
      text = await request.text()
    }
  } catch (err) {
    return errorResponse('Invalid webhook payload')
  }

  text = text.trim()
  if (!text) {
    return jsonResponse({
      success: false,
      error: 'Missing SMS text',
      hint: 'Nếu bạn test thủ công bằng nút Play thì sẽ trống. Hãy đợi SMS ngân hàng thật để trigger tự động.'
    }, 400)
  }

  if (!userId) return errorResponse('Missing userId query param')

  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  // ── Parse SMS ──
  const parsed = parseSmsTransaction(text)

  if (!parsed) {
    // Fallback: try legacy parseNotification
    const notiParsed = parseNotification('SMS', text)
    if (notiParsed) {
      // Use notiParsed as fallback — create a minimal parsed result
      const fallbackParsed: SmsParsedResult = {
        type: notiParsed.type,
        amount: notiParsed.amount,
        note: notiParsed.note || text.substring(0, 80),
        txRef: '',
        account: '',
        balance: 0,
        bankName: notiParsed.walletHint || '',
        rawText: text.substring(0, 200)
      }
      // Continue processing with fallback
      return await processSmsTransaction(fallbackParsed, text, userId, env)
    }

    // Save as pending
    const pending = (await getJSON<PendingNotification[]>(env.SMART_NOTE_KV, `users/${userId}/finance/pending`)) || []
    pending.push({
      id: generateId(),
      rawText: text,
      appName: 'SMS',
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`, pending)
    
    return jsonResponse({
      success: false,
      error: 'Không thể nhận diện cú pháp giao dịch từ SMS, đã lưu vào mục pending',
      data: { rawText: text, status: 'pending' }
    })
  }

  return await processSmsTransaction(parsed, text, userId, env)
}

async function processSmsTransaction(
  parsed: SmsParsedResult, 
  originalText: string, 
  userId: string, 
  env: Env
): Promise<Response> {
  const wallets = (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  const txs = (await getJSON<TransactionData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`)) || []

  // ── Match wallet by bank name ──
  let walletId = wallets[0]?.id || ''
  if (parsed.bankName) {
    // Direct match
    const found = wallets.find(w => w.name.toLowerCase().includes(parsed.bankName.toLowerCase()))
    if (found) {
      walletId = found.id
    } else {
      // Try CASSO_BANK_MAP aliases
      for (const [walletKey, aliases] of Object.entries(CASSO_BANK_MAP)) {
        if (aliases.some(a => parsed.bankName.toLowerCase().includes(a))) {
          const w = wallets.find(w => w.name.toLowerCase().includes(walletKey.toLowerCase()))
          if (w) { walletId = w.id; break }
        }
      }
    }
  }
  
  // ── Duplicate detection ──
  // Priority 1: Use SO GD (transaction reference) — most reliable
  if (parsed.txRef) {
    const alreadyExists = txs.some(t => t.note?.includes(`[ref:${parsed.txRef}]`))
    if (alreadyExists) {
      return jsonResponse({ 
        success: true, 
        message: 'Duplicate SMS skipped (same SO GD)',
        data: { txRef: parsed.txRef, skipped: true }
      })
    }
  }
  // Priority 2: Fallback hash using amount + date portion of text
  const safeText = originalText.replace(/[^a-zA-Z0-9]/g, '')
  const smsHash = parsed.txRef 
    ? `[ref:${parsed.txRef}]` 
    : `[sms:${safeText.substring(0, 40)}]`
  
  if (!parsed.txRef) {
    const alreadyExists = txs.some(t => t.note?.includes(smsHash))
    if (alreadyExists) {
      return jsonResponse({ success: true, message: 'Duplicate SMS skipped' })
    }
  }

  // ── Build note ──
  const noteContent = parsed.note || parsed.rawText.substring(0, 80)
  const bankLabel = parsed.bankName ? ` • ${parsed.bankName}` : ''

  const tx: TransactionData = {
    id: generateId(),
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.type === 'income' ? 'other_income' : 'other_expense',
    note: `${noteContent}${bankLabel} ${smsHash}`.trim(),
    walletId,
    source: 'sms',
    date: new Date().toISOString().substring(0, 10),
    createdAt: new Date().toISOString()
  }

  txs.push(tx)

  // Cập nhật số dư
  const walletIdx = wallets.findIndex(w => w.id === walletId)
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += parsed.type === 'income' ? parsed.amount : -parsed.amount
  }

  // Notification
  const walletName = wallets.find(w => w.id === walletId)?.name || 'ví'
  const notiList = (await getJSON<NotificationData[]>(env.SMART_NOTE_KV, `users/${userId}/notifications`)) || []
  notiList.unshift({
    id: generateId(),
    type: parsed.type === 'income' ? 'bank_in' : 'bank_out',
    title: parsed.type === 'income' ? 'Tiền vào tài khoản' : 'Tiền ra tài khoản',
    body: `${parsed.type === 'income' ? '+' : '-'}${parsed.amount.toLocaleString('vi-VN')}đ • ${walletName} • ${parsed.bankName || 'SMS'}`,
    read: false,
    createdAt: new Date().toISOString(),
    meta: { amount: parsed.amount, txType: parsed.type, walletName, bankName: parsed.bankName || 'SMS' }
  })
  if (notiList.length > 100) notiList.splice(100)
  
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notiList)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)

  return jsonResponse({ 
    success: true, 
    message: `${parsed.type === 'income' ? '+' : '-'}${parsed.amount.toLocaleString('vi-VN')}đ → ${walletName}`,
    data: {
      transactionId: tx.id,
      type: parsed.type,
      amount: parsed.amount,
      note: parsed.note,
      bankName: parsed.bankName,
      walletName,
      txRef: parsed.txRef,
      balance: parsed.balance || undefined
    }
  })
}

// ====== PIN System ======

async function handleSetPin(userId: string, request: Request, env: Env): Promise<Response> {
  const { pin, currentPin } = (await request.json()) as any
  if (!pin || pin.length < 4 || pin.length > 6) {
    return errorResponse('PIN phải từ 4-6 chữ số')
  }
  if (!/^\d+$/.test(pin)) {
    return errorResponse('PIN chỉ được chứa số')
  }

  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  // If PIN already exists, verify current PIN first
  const existingPin = await getJSON<string>(env.SMART_NOTE_KV, `users/${userId}/pin`)
  if (existingPin) {
    if (!currentPin) return errorResponse('Cần nhập PIN hiện tại')
    const currentHash = await hashPassword(currentPin)
    if (currentHash !== existingPin) return errorResponse('PIN hiện tại không đúng', 401)
  }

  const pinHash = await hashPassword(pin)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/pin`, pinHash)

  return jsonResponse({ success: true, message: 'PIN đã được thiết lập' })
}

async function handleVerifyPin(userId: string, request: Request, env: Env): Promise<Response> {
  const { pin } = (await request.json()) as any
  if (!pin) return errorResponse('PIN is required')

  const storedHash = await getJSON<string>(env.SMART_NOTE_KV, `users/${userId}/pin`)
  if (!storedHash) return errorResponse('Chưa thiết lập PIN', 404)

  const inputHash = await hashPassword(pin)
  if (inputHash !== storedHash) return errorResponse('PIN không đúng', 401)

  return jsonResponse({ success: true, message: 'PIN verified' })
}

async function handleCheckPin(userId: string, env: Env): Promise<Response> {
  const storedHash = await getJSON<string>(env.SMART_NOTE_KV, `users/${userId}/pin`)
  return jsonResponse({ success: true, data: { hasPin: !!storedHash } })
}

async function handleListPending(userId: string, env: Env): Promise<Response> {
  const pending = (await getJSON<PendingNotification[]>(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/pending`
  )) || []
  return jsonResponse({ success: true, data: pending.filter(p => p.status === 'pending') })
}

async function handleResolvePending(userId: string, pendingId: string, env: Env): Promise<Response> {
  const pending = (await getJSON<PendingNotification[]>(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/pending`
  )) || []
  const idx = pending.findIndex(p => p.id === pendingId)
  if (idx === -1) return errorResponse('Pending notification not found', 404)
  pending[idx].status = 'resolved'
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`, pending)
  return jsonResponse({ success: true })
}

// ====== Cloudflare Workers AI ======

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct'

const AI_SYSTEM_PROMPTS: Record<string, string> = {
  summarize: 'You are a concise summarizer. Summarize the user content into bullet points (max 5). Reply in the same language as the content. Return ONLY the bullet list, no intro or explanation.',
  continue: 'You are a writing assistant. Continue the user text naturally in 2-3 sentences. Match the tone and language. Return ONLY the continuation, no explanation.',
  improve: 'You are an editor. Improve the grammar and style of the user text. Keep the original meaning and language. Return ONLY the improved text.',
  tags: 'You are a tagging assistant. Suggest 3-5 relevant tags for the content. Return ONLY a comma-separated list of lowercase tags, nothing else.',
  ask: 'You are a helpful assistant. Answer the user question based on the provided note content. Be concise and clear.'
}

async function handleAi(request: Request, env: Env): Promise<Response> {
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const body = (await request.json()) as any
  const { action, content, question } = body

  if (!action) return errorResponse('Missing action')
  if (!content && action !== 'ask') return errorResponse('Note content is required')
  if (action === 'ask' && !question) return errorResponse('Missing question')

  const systemPrompt = AI_SYSTEM_PROMPTS[action]
  if (!systemPrompt) return errorResponse(`Unknown action: ${action}`)

  let userMessage: string
  if (action === 'ask') {
    userMessage = content
      ? `Note content:\n${content}\n\nQuestion: ${question}`
      : `Question: ${question}`
  } else if (action === 'tags') {
    userMessage = `Title: ${body.title || ''}\nContent: ${content.substring(0, 600)}`
  } else {
    userMessage = content
  }

  try {
    const response = await env.AI.run(AI_MODEL as any, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7
    }) as any

    const text = response?.response || ''
    return jsonResponse({ success: true, data: text })
  } catch (err: any) {
    return errorResponse(err.message || 'AI request failed', 500)
  }
}

async function handleAiStream(request: Request, env: Env): Promise<Response> {
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const body = (await request.json()) as any
  const { action, content, question } = body

  if (!action) return errorResponse('Missing action')
  if (!content && action !== 'ask') return errorResponse('Note content is required')
  if (action === 'ask' && !question) return errorResponse('Missing question')

  const systemPrompt = AI_SYSTEM_PROMPTS[action]
  if (!systemPrompt) return errorResponse(`Unknown action: ${action}`)

  let userMessage: string
  if (action === 'ask') {
    userMessage = content
      ? `Note content:\n${content}\n\nQuestion: ${question}`
      : `Question: ${question}`
  } else if (action === 'tags') {
    userMessage = `Title: ${body.title || ''}\nContent: ${content.substring(0, 600)}`
  } else {
    userMessage = content
  }

  try {
    const stream = await (env.AI as any).run(AI_MODEL, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: true
    }) as ReadableStream

    const cors = corsHeaders()
    return new Response(stream, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'AI stream failed', 500)
  }
}

// ====== Main Router ======

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // Auth routes (no token needed)
      if (path === '/api/auth/register' && request.method === 'POST') {
        return handleRegister(request, env)
      }
      if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env)
      }

      // Webhooks (use webhook secret, not JWT)
      if (path === '/api/webhook/telegram' && request.method === 'POST') {
        return handleTelegramWebhook(request, env)
      }
      if (path === '/api/webhook/notification' && request.method === 'POST') {
        return handleNotificationWebhook(request, env)
      }
      // Casso Bank Webhook — POST /api/webhook/casso?userId=<userId>
      if (path === '/api/webhook/casso' && request.method === 'POST') {
        return handleCassoWebhook(request, env)
      }
      if (path === '/api/webhook/sms' && request.method === 'POST') {
        return handleSmsWebhook(request, env)
      }

      // Protected routes - verify JWT
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401)
      }

      const token = authHeader.substring(7)
      const payload = await verifyJWT(token, env.JWT_SECRET)
      if (!payload) return errorResponse('Invalid token', 401)

      const userId = payload.userId

      // User Profile & Account
      if (path === '/api/auth/profile' && request.method === 'PUT') {
        return handleUpdateProfile(userId, request, env)
      }
      if (path === '/api/auth/delete-account' && request.method === 'POST') {
        return handleDeleteAccount(userId, request, env)
      }

      // Notes CRUD
      if (path === '/api/notes' && request.method === 'GET') {
        return handleListNotes(userId, env)
      }
      if (path === '/api/notes' && request.method === 'POST') {
        return handleCreateNote(userId, request, env)
      }

      const noteMatch = path.match(/^\/api\/notes\/(.+)$/)
      if (noteMatch) {
        const noteId = noteMatch[1]
        if (request.method === 'GET') return handleGetNote(userId, noteId, env)
        if (request.method === 'PUT') return handleUpdateNote(userId, noteId, request, env)
        if (request.method === 'DELETE') return handleDeleteNote(userId, noteId, env)
      }

      // Finance: Wallets
      if (path === '/api/wallets' && request.method === 'GET') {
        return handleListWallets(userId, env)
      }
      if (path === '/api/wallets' && request.method === 'POST') {
        return handleCreateWallet(userId, request, env)
      }

      const walletMatch = path.match(/^\/api\/wallets\/(.+)$/)
      if (walletMatch) {
        const walletId = walletMatch[1]
        if (request.method === 'PUT') return handleUpdateWallet(userId, walletId, request, env)
        if (request.method === 'DELETE') return handleDeleteWallet(userId, walletId, env)
      }

      // Finance: Transactions
      if (path === '/api/transactions' && request.method === 'GET') {
        return handleListTransactions(userId, env)
      }
      if (path === '/api/transactions' && request.method === 'POST') {
        return handleCreateTransaction(userId, request, env)
      }

      const txMatch = path.match(/^\/api\/transactions\/(.+)$/)
      if (txMatch && request.method === 'DELETE') {
        return handleDeleteTransaction(userId, txMatch[1], env)
      }

      // PIN
      if (path === '/api/pin' && request.method === 'GET') {
        return handleCheckPin(userId, env)
      }
      if (path === '/api/pin' && request.method === 'POST') {
        return handleSetPin(userId, request, env)
      }
      if (path === '/api/pin/verify' && request.method === 'POST') {
        return handleVerifyPin(userId, request, env)
      }

      // Notifications
      if (path === '/api/notifications' && request.method === 'GET') {
        return handleListNotifications(userId, env)
      }
      if (path === '/api/notifications/read-all' && request.method === 'POST') {
        return handleMarkAllNotificationsRead(userId, env)
      }
      if (path === '/api/notifications' && request.method === 'DELETE') {
        return handleClearNotifications(userId, env)
      }
      const notiReadMatch = path.match(/^\/api\/notifications\/(.+)\/read$/)
      if (notiReadMatch && request.method === 'POST') {
        return handleMarkNotificationRead(userId, notiReadMatch[1], env)
      }

      // Pending notifications
      if (path === '/api/pending' && request.method === 'GET') {
        return handleListPending(userId, env)
      }
      const pendingMatch = path.match(/^\/api\/pending\/(.+)\/resolve$/)
      if (pendingMatch && request.method === 'POST') {
        return handleResolvePending(userId, pendingMatch[1], env)
      }

      // AI
      if (path === '/api/ai/stream' && request.method === 'POST') {
        return handleAiStream(request, env)
      }
      if (path === '/api/ai' && request.method === 'POST') {
        return handleAi(request, env)
      }

      return errorResponse('Not found', 404)
    } catch (err: any) {
      return errorResponse(err.message || 'Internal error', 500)
    }
  }
}
