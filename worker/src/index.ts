/**
 * Smart Note - Cloudflare Worker API
 *
 * Includes: Auth, Notes CRUD, Finance CRUD, Telegram Webhook (OpenClaw)
 *
 * Setup:
 * 1. Create R2 bucket: `npx wrangler r2 bucket create smart-note-data`
 * 2. Set secrets:
 *    - `npx wrangler secret put JWT_SECRET`
 *    - `npx wrangler secret put TELEGRAM_WEBHOOK_SECRET`
 * 3. Deploy: `npx wrangler deploy`
 */

interface Env {
  NOTES_BUCKET: R2Bucket
  JWT_SECRET: string
  TELEGRAM_WEBHOOK_SECRET: string
}

interface UserData {
  id: string
  email: string
  name: string
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
  source: 'manual' | 'telegram'
  date: string
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

// ====== R2 Helpers ======

async function getJSON<T>(bucket: R2Bucket, key: string): Promise<T | null> {
  const obj = await bucket.get(key)
  if (!obj) return null
  return obj.json() as Promise<T>
}

async function putJSON(
  bucket: R2Bucket,
  key: string,
  data: unknown
): Promise<void> {
  await bucket.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: 'application/json' }
  })
}

// ====== Auth Handlers ======

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const { email, password, name } = (await request.json()) as any
  if (!email || !password) return errorResponse('Email and password required')

  const usersIndex =
    (await getJSON<Record<string, string>>(
      env.NOTES_BUCKET,
      'users/_index.json'
    )) || {}
  if (usersIndex[email]) return errorResponse('Email already registered')

  const id = generateId()
  const user: UserData = {
    id,
    email,
    name: name || email.split('@')[0],
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  }

  await putJSON(env.NOTES_BUCKET, `users/${id}/profile.json`, user)
  usersIndex[email] = id
  await putJSON(env.NOTES_BUCKET, 'users/_index.json', usersIndex)
  await putJSON(env.NOTES_BUCKET, `users/${id}/notes/_index.json`, {
    notes: []
  })
  await putJSON(env.NOTES_BUCKET, `users/${id}/finance/wallets.json`, [])
  await putJSON(env.NOTES_BUCKET, `users/${id}/finance/transactions.json`, [])

  const token = await createJWT({ userId: id }, env.JWT_SECRET)
  return jsonResponse({
    success: true,
    data: {
      token,
      user: { id, email, name: user.name, createdAt: user.createdAt }
    }
  })
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const { email, password } = (await request.json()) as any
  if (!email || !password) return errorResponse('Email and password required')

  const usersIndex =
    (await getJSON<Record<string, string>>(
      env.NOTES_BUCKET,
      'users/_index.json'
    )) || {}
  const userId = usersIndex[email]
  if (!userId) return errorResponse('Invalid credentials', 401)

  const user = await getJSON<UserData>(
    env.NOTES_BUCKET,
    `users/${userId}/profile.json`
  )
  if (!user) return errorResponse('User not found', 404)

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash)
    return errorResponse('Invalid credentials', 401)

  const token = await createJWT({ userId: user.id }, env.JWT_SECRET)
  return jsonResponse({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    }
  })
}

// ====== Note Handlers ======

async function handleListNotes(userId: string, env: Env): Promise<Response> {
  const index = await getJSON<{ notes: any[] }>(
    env.NOTES_BUCKET,
    `users/${userId}/notes/_index.json`
  )
  return jsonResponse({ success: true, data: index?.notes || [] })
}

async function handleGetNote(
  userId: string,
  noteId: string,
  env: Env
): Promise<Response> {
  const note = await getJSON<NoteData>(
    env.NOTES_BUCKET,
    `users/${userId}/notes/${noteId}.json`
  )
  if (!note) return errorResponse('Note not found', 404)
  return jsonResponse({ success: true, data: note })
}

async function handleCreateNote(
  userId: string,
  request: Request,
  env: Env
): Promise<Response> {
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

  await putJSON(env.NOTES_BUCKET, `users/${userId}/notes/${id}.json`, note)

  const index = (await getJSON<{ notes: any[] }>(
    env.NOTES_BUCKET,
    `users/${userId}/notes/_index.json`
  )) || { notes: [] }
  index.notes.push({
    id: note.id,
    title: note.title,
    excerpt: note.content.substring(0, 120),
    tags: note.tags,
    pinned: note.pinned,
    updatedAt: note.updatedAt
  })
  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/notes/_index.json`,
    index
  )

  return jsonResponse({ success: true, data: note }, 201)
}

async function handleUpdateNote(
  userId: string,
  noteId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const existing = await getJSON<NoteData>(
    env.NOTES_BUCKET,
    `users/${userId}/notes/${noteId}.json`
  )
  if (!existing) return errorResponse('Note not found', 404)

  const body = (await request.json()) as any
  const updated: NoteData = {
    ...existing,
    ...body,
    id: noteId,
    updatedAt: new Date().toISOString()
  }

  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/notes/${noteId}.json`,
    updated
  )

  const index = (await getJSON<{ notes: any[] }>(
    env.NOTES_BUCKET,
    `users/${userId}/notes/_index.json`
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
    await putJSON(
      env.NOTES_BUCKET,
      `users/${userId}/notes/_index.json`,
      index
    )
  }

  return jsonResponse({ success: true, data: updated })
}

async function handleDeleteNote(
  userId: string,
  noteId: string,
  env: Env
): Promise<Response> {
  await env.NOTES_BUCKET.delete(`users/${userId}/notes/${noteId}.json`)

  const index = (await getJSON<{ notes: any[] }>(
    env.NOTES_BUCKET,
    `users/${userId}/notes/_index.json`
  )) || { notes: [] }
  index.notes = index.notes.filter((n: any) => n.id !== noteId)
  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/notes/_index.json`,
    index
  )

  return jsonResponse({ success: true })
}

// ====== Finance Handlers ======

async function handleListWallets(
  userId: string,
  env: Env
): Promise<Response> {
  const wallets =
    (await getJSON<WalletData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`
    )) || []
  return jsonResponse({ success: true, data: wallets })
}

async function handleCreateWallet(
  userId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const body = (await request.json()) as any
  const wallets =
    (await getJSON<WalletData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`
    )) || []

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
  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/finance/wallets.json`,
    wallets
  )
  return jsonResponse({ success: true, data: wallet }, 201)
}

async function handleListTransactions(
  userId: string,
  env: Env
): Promise<Response> {
  const txs =
    (await getJSON<TransactionData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/transactions.json`
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
      env.NOTES_BUCKET,
      `users/${userId}/finance/transactions.json`
    )) || []
  const wallets =
    (await getJSON<WalletData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`
    )) || []

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
  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/finance/transactions.json`,
    txs
  )

  // Update wallet balance
  const walletIdx = wallets.findIndex((w) => w.id === tx.walletId)
  if (walletIdx !== -1) {
    wallets[walletIdx].balance +=
      tx.type === 'income' ? tx.amount : -tx.amount
    await putJSON(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`,
      wallets
    )
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
      env.NOTES_BUCKET,
      `users/${userId}/finance/transactions.json`
    )) || []
  const wallets =
    (await getJSON<WalletData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`
    )) || []

  const tx = txs.find((t) => t.id === txId)
  if (tx) {
    // Revert wallet balance
    const walletIdx = wallets.findIndex((w) => w.id === tx.walletId)
    if (walletIdx !== -1) {
      wallets[walletIdx].balance +=
        tx.type === 'income' ? -tx.amount : tx.amount
      await putJSON(
        env.NOTES_BUCKET,
        `users/${userId}/finance/wallets.json`,
        wallets
      )
    }
  }

  const filtered = txs.filter((t) => t.id !== txId)
  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/finance/transactions.json`,
    filtered
  )

  return jsonResponse({ success: true })
}

// ====== Telegram Webhook (OpenClaw) ======

/**
 * OpenClaw sends parsed transaction data to this endpoint.
 *
 * Expected POST body:
 * {
 *   "userId": "abc123",
 *   "type": "expense",
 *   "amount": 50000,
 *   "category": "food",
 *   "note": "ăn sáng phở",
 *   "wallet": "momo"
 * }
 *
 * OpenClaw skill config:
 * - Trigger: any message in Telegram chat
 * - Action: parse message → extract amount, type, category, wallet
 * - Webhook: POST to https://your-worker.workers.dev/api/webhook/telegram
 * - Header: X-Webhook-Secret: <your-secret>
 */
async function handleTelegramWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify webhook secret
  const secret = request.headers.get('X-Webhook-Secret')
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return errorResponse('Unauthorized webhook', 401)
  }

  const body = (await request.json()) as any
  const { userId, type, amount, category, note, wallet } = body

  if (!userId || !amount || !type) {
    return errorResponse('Missing required fields: userId, amount, type')
  }

  // Find wallet by name (case-insensitive)
  const wallets =
    (await getJSON<WalletData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`
    )) || []

  let walletId = wallets[0]?.id || ''
  if (wallet) {
    const found = wallets.find(
      (w) => w.name.toLowerCase().includes(wallet.toLowerCase())
    )
    if (found) walletId = found.id
  }

  // Create transaction
  const txs =
    (await getJSON<TransactionData[]>(
      env.NOTES_BUCKET,
      `users/${userId}/finance/transactions.json`
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
  await putJSON(
    env.NOTES_BUCKET,
    `users/${userId}/finance/transactions.json`,
    txs
  )

  // Update wallet balance
  const walletIdx = wallets.findIndex((w) => w.id === walletId)
  if (walletIdx !== -1) {
    wallets[walletIdx].balance +=
      tx.type === 'income' ? tx.amount : -tx.amount
    await putJSON(
      env.NOTES_BUCKET,
      `users/${userId}/finance/wallets.json`,
      wallets
    )
  }

  return jsonResponse({
    success: true,
    data: tx,
    message: `Đã ghi ${tx.type === 'income' ? 'thu' : 'chi'} ${tx.amount.toLocaleString('vi-VN')}đ vào ${wallets[walletIdx]?.name || 'ví'}`
  })
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

      // Telegram webhook (uses webhook secret, not JWT)
      if (
        path === '/api/webhook/telegram' &&
        request.method === 'POST'
      ) {
        return handleTelegramWebhook(request, env)
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
        if (request.method === 'GET')
          return handleGetNote(userId, noteId, env)
        if (request.method === 'PUT')
          return handleUpdateNote(userId, noteId, request, env)
        if (request.method === 'DELETE')
          return handleDeleteNote(userId, noteId, env)
      }

      // Finance: Wallets
      if (path === '/api/wallets' && request.method === 'GET') {
        return handleListWallets(userId, env)
      }
      if (path === '/api/wallets' && request.method === 'POST') {
        return handleCreateWallet(userId, request, env)
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

      return errorResponse('Not found', 404)
    } catch (err: any) {
      return errorResponse(err.message || 'Internal error', 500)
    }
  }
}
