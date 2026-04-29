import { Env, UserData, NoteData, TransactionData, WalletData, NotificationData, PendingNotification, BudgetData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId, hashPassword } from '../utils/crypto'
import { createJWT } from '../utils/jwt'
import { getJSON, putJSON } from '../services/kv.service'
import { sendPushToUser } from './push.controller'

// ====== Telegram Webhook (OpenClaw) ======

export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
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

export interface ParsedTransaction {
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

export function parseNotification(appName: string, text: string): ParsedTransaction | null {
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

export async function handleNotificationWebhook(request: Request, env: Env): Promise<Response> {
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
    category: parsed.type === 'expense' ? 'bank_transfer' : 'bank_receive',
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

  // Create notification (was missing — only transaction was created before)
  const walletName = wallets.find(w => w.id === walletId)?.name || 'ví'
  const notiList = (await getJSON<NotificationData[]>(
    env.SMART_NOTE_KV, `users/${userId}/notifications`
  )) || []
  notiList.unshift({
    id: generateId(),
    type: parsed.type === 'income' ? 'bank_in' : 'bank_out',
    title: `[Notification] ${parsed.type === 'income' ? 'Tiền vào tài khoản' : 'Tiền ra tài khoản'}`,
    body: `${parsed.type === 'income' ? '+' : '-'}${parsed.amount.toLocaleString('vi-VN')}đ • Ghi vào ví: ${walletName}`,
    read: false,
    createdAt: new Date().toISOString(),
    meta: { amount: parsed.amount, txType: parsed.type, walletName, bankName: parsed.walletHint || appName || '' }
  })
  if (notiList.length > 100) notiList.splice(100)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notiList)

  // Send push notification to user's devices
  try {
    const pushTitle = parsed.type === 'income' ? '💰 Tiền vào tài khoản' : '💸 Tiền ra tài khoản'
    const pushBody = `${parsed.type === 'income' ? '+' : '-'}${parsed.amount.toLocaleString('vi-VN')}đ • ${walletName}`
    const unreadCount = notiList.filter(n => !n.read).length
    await sendPushToUser(userId, env, { title: pushTitle, body: pushBody, tag: `tx-${tx.id}`, url: '/', unreadCount })
  } catch { /* push is best-effort */ }

  return jsonResponse({
    success: true,
    data: tx,
    message: `[Notification] ${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}đ → Ghi vào ví: ${walletName}`
  })
}

