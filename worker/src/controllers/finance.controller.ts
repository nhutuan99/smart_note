import { Env, UserData, NoteData, TransactionData, WalletData, NotificationData, PendingNotification, BudgetData, TradingConfigData, TradingCheckinData, TradingCheckinEntry } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId, hashPassword } from '../utils/crypto'
import { createJWT } from '../utils/jwt'
import { getJSON, putJSON } from '../services/kv.service'

// ====== Finance Handlers ======

export async function handleListWallets(userId: string, env: Env): Promise<Response> {
  const wallets =
    (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
  return jsonResponse({ success: true, data: wallets })
}

export async function handleCreateWallet(
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
    order: wallets.length,
    customLogoUrl: typeof body.customLogoUrl === 'string' ? body.customLogoUrl.substring(0, 5000) : undefined
  }

  wallets.push(wallet)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  return jsonResponse({ success: true, data: wallet }, 201)
}

export async function handleUpdateWallet(
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
  // Whitelist editable fields only — prevent direct balance/id manipulation
  if (body.name !== undefined) wallets[idx].name = body.name
  if (body.currency !== undefined) wallets[idx].currency = body.currency
  if (body.icon !== undefined) wallets[idx].icon = body.icon
  if (body.color !== undefined) wallets[idx].color = body.color
  if (typeof body.order === 'number') wallets[idx].order = body.order
  if (typeof body.balance === 'number') wallets[idx].balance = body.balance
  if (body.customLogoUrl !== undefined) wallets[idx].customLogoUrl = typeof body.customLogoUrl === 'string' ? body.customLogoUrl.substring(0, 5000) : undefined
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)
  return jsonResponse({ success: true, data: wallets[idx] })
}

export async function handleDeleteWallet(
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

export async function handleListTransactions(userId: string, env: Env): Promise<Response> {
  const txs =
    (await getJSON<TransactionData[]>(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/transactions`
    )) || []
  return jsonResponse({ success: true, data: txs })
}

export async function handleCreateTransaction(
  userId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const body = (await request.json()) as any

  // Input validation
  if (!body.type || !['income', 'expense'].includes(body.type)) {
    return errorResponse('Loại giao dịch không hợp lệ (income/expense)')
  }
  if (typeof body.amount !== 'number' || body.amount <= 0 || !isFinite(body.amount)) {
    return errorResponse('Số tiền phải là số dương hợp lệ')
  }
  if (!body.walletId || typeof body.walletId !== 'string') {
    return errorResponse('Wallet ID is required')
  }

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
    amount: Math.abs(body.amount),
    category: body.category || (body.type === 'expense' ? 'other_expense' : 'other_income'),
    note: typeof body.note === 'string' ? body.note.substring(0, 500) : '',
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

export async function handleDeleteTransaction(
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

// ====== Budget Handlers ======


export async function handleGetBudget(userId: string, env: Env): Promise<Response> {
  const budget = await getJSON<BudgetData>(env.SMART_NOTE_KV, `users/${userId}/finance/budget`)
  return jsonResponse({ success: true, data: budget || { amount: 0, dismissed: false, updatedAt: '' } })
}

export async function handleUpdateBudget(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  const budget: BudgetData = {
    amount: typeof body.amount === 'number' ? body.amount : 0,
    dismissed: !!body.dismissed,
    updatedAt: new Date().toISOString()
  }
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/budget`, budget)
  return jsonResponse({ success: true, data: budget })
}

// ====== Trading Journal Handlers ======

const TRADING_CONFIG_KEY = (userId: string) => `users/${userId}/trading/config`
const TRADING_CHECKINS_KEY = (userId: string) => `users/${userId}/trading/checkins`

export async function handleGetTradingConfig(userId: string, env: Env): Promise<Response> {
  const config = await getJSON<TradingConfigData>(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId))
  return jsonResponse({ success: true, data: config || { selectedWalletIds: [], createdAt: '', updatedAt: '' } })
}

export async function handleUpdateTradingConfig(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>

  if (!Array.isArray(body.selectedWalletIds)) {
    return errorResponse('selectedWalletIds must be an array')
  }

  const ids = (body.selectedWalletIds as unknown[]).filter((id): id is string => typeof id === 'string')

  const now = new Date().toISOString()
  const existing = await getJSON<TradingConfigData>(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId))

  const config: TradingConfigData = {
    selectedWalletIds: ids,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }

  await putJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId), config)
  return jsonResponse({ success: true, data: config })
}

export async function handleListTradingCheckins(userId: string, env: Env): Promise<Response> {
  const checkins = (await getJSON<TradingCheckinData[]>(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId))) || []
  return jsonResponse({ success: true, data: checkins })
}

export async function handleCreateTradingCheckin(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>

  const today = new Date().toISOString().substring(0, 10)
  const checkins = (await getJSON<TradingCheckinData[]>(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId))) || []

  // Prevent duplicate for the same day — use PUT to update instead
  if (checkins.some((c) => c.date === today)) {
    return errorResponse('Check-in for today already exists. Use PUT to update.', 409)
  }

  if (!Array.isArray(body.entries)) {
    return errorResponse('entries must be an array')
  }

  const entries: TradingCheckinEntry[] = (body.entries as unknown[])
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      walletId: typeof e.walletId === 'string' ? e.walletId : '',
      walletName: typeof e.walletName === 'string' ? e.walletName : '',
      inputMode: e.inputMode === 'percent' ? 'percent' : 'amount',
      inputValue: typeof e.inputValue === 'number' ? e.inputValue : 0,
      pnlAmount: typeof e.pnlAmount === 'number' ? e.pnlAmount : 0,
      depositAmount: typeof e.depositAmount === 'number' ? Math.max(0, e.depositAmount) : 0,
      balanceBefore: typeof e.balanceBefore === 'number' ? e.balanceBefore : 0,
      balanceAfter: typeof e.balanceAfter === 'number' ? e.balanceAfter : 0
    }))
    .filter((e) => e.walletId !== '')

  const now = new Date().toISOString()
  const checkin: TradingCheckinData = {
    id: generateId(),
    date: today,
    entries,
    note: typeof body.note === 'string' ? body.note.substring(0, 500) : '',
    totalPnl: entries.reduce((s, e) => s + e.pnlAmount, 0),
    totalDeposit: entries.reduce((s, e) => s + e.depositAmount, 0),
    createdAt: now,
    updatedAt: now
  }

  checkins.push(checkin)
  await putJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId), checkins)
  return jsonResponse({ success: true, data: checkin }, 201)
}

export async function handleUpdateTradingCheckin(
  userId: string,
  date: string,
  request: Request,
  env: Env
): Promise<Response> {
  const checkins = (await getJSON<TradingCheckinData[]>(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId))) || []
  const idx = checkins.findIndex((c) => c.date === date)

  if (idx === -1) return errorResponse('Check-in not found', 404)

  const body = (await request.json()) as Record<string, unknown>

  if (Array.isArray(body.entries)) {
    const entries: TradingCheckinEntry[] = (body.entries as unknown[])
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((e) => ({
        walletId: typeof e.walletId === 'string' ? e.walletId : '',
        walletName: typeof e.walletName === 'string' ? e.walletName : '',
        inputMode: e.inputMode === 'percent' ? 'percent' : 'amount',
        inputValue: typeof e.inputValue === 'number' ? e.inputValue : 0,
        pnlAmount: typeof e.pnlAmount === 'number' ? e.pnlAmount : 0,
        depositAmount: typeof e.depositAmount === 'number' ? Math.max(0, e.depositAmount) : 0,
        balanceBefore: typeof e.balanceBefore === 'number' ? e.balanceBefore : 0,
        balanceAfter: typeof e.balanceAfter === 'number' ? e.balanceAfter : 0
      }))
      .filter((e) => e.walletId !== '')

    checkins[idx].entries = entries
    checkins[idx].totalPnl = entries.reduce((s, e) => s + e.pnlAmount, 0)
    checkins[idx].totalDeposit = entries.reduce((s, e) => s + e.depositAmount, 0)
  }

  if (typeof body.note === 'string') {
    checkins[idx].note = body.note.substring(0, 500)
  }

  checkins[idx].updatedAt = new Date().toISOString()
  await putJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId), checkins)
  return jsonResponse({ success: true, data: checkins[idx] })
}


