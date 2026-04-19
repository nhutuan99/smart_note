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
  source: 'manual' | 'telegram' | 'notification'
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

// ====== Default Wallets (created on register) ======

const DEFAULT_WALLETS: Omit<WalletData, 'id'>[] = [
  { name: 'Techcombank', balance: 0, currency: 'VND', icon: '🏦', color: '#e62e2e', order: 0 },
  { name: 'TPBank', balance: 0, currency: 'VND', icon: '🏧', color: '#7b2d8e', order: 1 },
  { name: 'MoMo', balance: 0, currency: 'VND', icon: '📱', color: '#d82d8b', order: 2 },
  { name: 'ZaloPay', balance: 0, currency: 'VND', icon: '💙', color: '#0068ff', order: 3 },
  { name: 'Visa', balance: 0, currency: 'VND', icon: '💳', color: '#1a1f71', order: 4 },
  { name: 'Tiền mặt', balance: 0, currency: 'VND', icon: '💵', color: '#10b981', order: 5 }
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
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user)

  return jsonResponse({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    }
  })
}

async function handleSendOtp(userId: string, env: Env): Promise<Response> {
  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

  // Generate a mock 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Store OTP in KV with an expiration time of 5 minutes (300 seconds)
  await env.SMART_NOTE_KV.put(`users/${userId}/otp`, otp, { expirationTtl: 300 })

  // Note: In a real app, integrate Resend, Mailgun, or SendGrid here
  console.log(`[MOCK EMAIL] To: ${user.email} -> Your OTP for account deletion is: ${otp}`)

  return jsonResponse({ 
    success: true, 
    message: 'OTP sent to email successfully. (Dev note: Check worker console for the OTP or use standard dev OTP if configured)'
  })
}

async function handleDeleteAccount(userId: string, request: Request, env: Env): Promise<Response> {
  const { otp } = (await request.json()) as any
  if (!otp) return errorResponse('OTP is required')

  const storedOtp = await env.SMART_NOTE_KV.get(`users/${userId}/otp`)
  if (!storedOtp || storedOtp !== otp) {
    return errorResponse('Invalid or expired OTP', 400)
  }

  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  if (!user) return errorResponse('User not found', 404)

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
      if (path === '/api/auth/otp/send' && request.method === 'POST') {
        return handleSendOtp(userId, env)
      }
      if (path === '/api/auth/account/delete' && request.method === 'POST') {
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

      // Pending notifications
      if (path === '/api/pending' && request.method === 'GET') {
        return handleListPending(userId, env)
      }
      const pendingMatch = path.match(/^\/api\/pending\/(.+)\/resolve$/)
      if (pendingMatch && request.method === 'POST') {
        return handleResolvePending(userId, pendingMatch[1], env)
      }

      return errorResponse('Not found', 404)
    } catch (err: any) {
      return errorResponse(err.message || 'Internal error', 500)
    }
  }
}
