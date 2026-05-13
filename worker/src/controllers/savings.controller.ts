import { Env, SavingsGoalData, WalletData, TransactionData, NotificationData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId } from '../utils/crypto'
import { getJSON, putJSON } from '../services/kv.service'

const SAVINGS_KEY = (userId: string) => `users/${userId}/savings`

export async function handleListSavings(userId: string, env: Env): Promise<Response> {
  const savings = (await getJSON<SavingsGoalData[]>(env.SMART_NOTE_KV, SAVINGS_KEY(userId))) || []
  return jsonResponse({ success: true, data: savings })
}

export async function handleCreateSaving(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const savings = (await getJSON<SavingsGoalData[]>(env.SMART_NOTE_KV, SAVINGS_KEY(userId))) || []

  const saving: SavingsGoalData = {
    id: generateId(),
    name: body.name,
    icon: body.icon || '🎯',
    color: body.color || '#10b981',
    targetAmount: body.targetAmount || 0,
    currentAmount: 0,
    deadline: body.deadline,
    autoSaveEnabled: !!body.autoSaveEnabled,
    autoSaveAmount: body.autoSaveAmount,
    autoSaveWalletId: body.autoSaveWalletId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  savings.push(saving)
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings)
  return jsonResponse({ success: true, data: saving }, 201)
}

export async function handleUpdateSaving(userId: string, id: string, request: Request, env: Env): Promise<Response> {
  const savings = (await getJSON<SavingsGoalData[]>(env.SMART_NOTE_KV, SAVINGS_KEY(userId))) || []
  const idx = savings.findIndex(s => s.id === id)
  if (idx === -1) return errorResponse('Saving goal not found', 404)

  const body = (await request.json()) as any
  if (body.name !== undefined) savings[idx].name = body.name
  if (body.icon !== undefined) savings[idx].icon = body.icon
  if (body.color !== undefined) savings[idx].color = body.color
  if (body.targetAmount !== undefined) savings[idx].targetAmount = body.targetAmount
  if (body.deadline !== undefined) savings[idx].deadline = body.deadline
  
  if (body.autoSaveEnabled !== undefined && body.autoSaveEnabled !== savings[idx].autoSaveEnabled) {
    savings[idx].autoSaveEnabled = !!body.autoSaveEnabled
    // If auto save was just enabled, trigger a notification
    if (body.autoSaveEnabled) {
      const notifs = await getJSON<NotificationData[]>(env.SMART_NOTE_KV, `users/${userId}/notifications`) || []
      notifs.unshift({
        id: generateId(),
        type: 'system',
        title: `Tiết kiệm thông minh: ${savings[idx].name}`,
        body: `Bạn đã bật trích tiền tự động. Bạn có muốn chuyển ${body.autoSaveAmount || 0} đ vào mục tiêu này ngay bây giờ không?`,
        read: false,
        createdAt: new Date().toISOString(),
        meta: {
          amount: body.autoSaveAmount || 0,
          savingId: savings[idx].id
        }
      })
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notifs)
    }
  }

  if (body.autoSaveAmount !== undefined) savings[idx].autoSaveAmount = body.autoSaveAmount
  if (body.autoSaveWalletId !== undefined) savings[idx].autoSaveWalletId = body.autoSaveWalletId

  savings[idx].updatedAt = new Date().toISOString()
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings)

  return jsonResponse({ success: true, data: savings[idx] })
}

export async function handleDeleteSaving(userId: string, id: string, env: Env): Promise<Response> {
  const savings = (await getJSON<SavingsGoalData[]>(env.SMART_NOTE_KV, SAVINGS_KEY(userId))) || []
  const filtered = savings.filter(s => s.id !== id)
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), filtered)
  return jsonResponse({ success: true })
}

export async function handleDepositSaving(userId: string, id: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const amount = body.amount
  const walletId = body.walletId

  if (!amount || amount <= 0) return errorResponse('Invalid amount')

  const savings = (await getJSON<SavingsGoalData[]>(env.SMART_NOTE_KV, SAVINGS_KEY(userId))) || []
  const idx = savings.findIndex(s => s.id === id)
  if (idx === -1) return errorResponse('Saving goal not found', 404)

  // Sub wallet
  if (walletId) {
    const wallets = (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
    const wIdx = wallets.findIndex(w => w.id === walletId)
    if (wIdx !== -1) {
      if (wallets[wIdx].balance < amount) return errorResponse('Số dư ví không đủ để trích')
      wallets[wIdx].balance -= amount
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)

      const txs = (await getJSON<TransactionData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`)) || []
      txs.push({
        id: generateId(),
        type: 'expense',
        amount: amount,
        category: 'saving',
        note: `Trích tiền vào quỹ: ${savings[idx].name}`,
        walletId,
        source: 'manual',
        date: new Date().toISOString().substring(0, 10),
        createdAt: new Date().toISOString()
      })
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)
    } else {
      return errorResponse('Wallet not found')
    }
  }

  // Deposit
  savings[idx].currentAmount += amount
  savings[idx].updatedAt = new Date().toISOString()
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings)

  return jsonResponse({ success: true, data: savings[idx] })
}

export async function handleWithdrawSaving(userId: string, id: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const amount = body.amount
  const walletId = body.walletId 

  if (!amount || amount <= 0) return errorResponse('Invalid amount')

  const savings = (await getJSON<SavingsGoalData[]>(env.SMART_NOTE_KV, SAVINGS_KEY(userId))) || []
  const idx = savings.findIndex(s => s.id === id)
  if (idx === -1) return errorResponse('Saving goal not found', 404)

  if (savings[idx].currentAmount < amount) return errorResponse('Not enough balance in saving goal')

  if (walletId) {
    const wallets = (await getJSON<WalletData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`)) || []
    const wIdx = wallets.findIndex(w => w.id === walletId)
    if (wIdx !== -1) {
      wallets[wIdx].balance += amount
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets)

      const txs = (await getJSON<TransactionData[]>(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`)) || []
      txs.push({
        id: generateId(),
        type: 'income',
        amount: amount,
        category: 'saving_withdraw',
        note: `Rút tiền từ quỹ: ${savings[idx].name}`,
        walletId,
        source: 'manual',
        date: new Date().toISOString().substring(0, 10),
        createdAt: new Date().toISOString()
      })
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs)
    } else {
       return errorResponse('Wallet not found')
    }
  }

  savings[idx].currentAmount -= amount
  savings[idx].updatedAt = new Date().toISOString()
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings)

  return jsonResponse({ success: true, data: savings[idx] })
}
