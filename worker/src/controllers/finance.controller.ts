import { Env, UserData, NoteData, TransactionData, WalletData, NotificationData, PendingNotification, BudgetData } from '../types'
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
    order: wallets.length
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
  wallets[idx] = { ...wallets[idx], ...body, id: walletId }
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
  const body = (await request.json()) as any
  const budget: BudgetData = {
    amount: typeof body.amount === 'number' ? body.amount : 0,
    dismissed: !!body.dismissed,
    updatedAt: new Date().toISOString()
  }
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/budget`, budget)
  return jsonResponse({ success: true, data: budget })
}

