import { Env, RecurringData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { getJSON, putJSON } from '../services/kv.service'

const KEY = (userId: string) => `users/${userId}/recurring`

function generateId(): string {
  return crypto.randomUUID()
}

/** Advance nextDate by one frequency period */
function advanceNextDate(nextDate: string, frequency: RecurringData['frequency']): string {
  const d = new Date(nextDate)
  switch (frequency) {
    case 'daily': d.setUTCDate(d.getUTCDate() + 1); break
    case 'weekly': d.setUTCDate(d.getUTCDate() + 7); break
    case 'monthly': d.setUTCMonth(d.getUTCMonth() + 1); break
    case 'yearly': d.setUTCFullYear(d.getUTCFullYear() + 1); break
  }
  return d.toISOString().substring(0, 10)
}

export async function handleListRecurring(userId: string, env: Env): Promise<Response> {
  const items = (await getJSON<RecurringData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  return jsonResponse({ success: true, data: items })
}

export async function handleCreateRecurring(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  if (!body.note?.trim() && !body.category) return errorResponse('Category or note is required')

  const items = (await getJSON<RecurringData[]>(env.SMART_NOTE_KV, KEY(userId))) || []

  const item: RecurringData = {
    id: generateId(),
    type: body.type === 'income' ? 'income' : 'expense',
    amount: Number(body.amount) || 0,
    category: body.category || '',
    walletId: body.walletId || '',
    note: body.note || '',
    frequency: body.frequency || 'monthly',
    nextDate: body.nextDate || new Date().toISOString().substring(0, 10),
    endDate: body.endDate || undefined,
    enabled: body.enabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  items.push(item)
  await putJSON(env.SMART_NOTE_KV, KEY(userId), items)
  return jsonResponse({ success: true, data: item }, 201)
}

export async function handleUpdateRecurring(userId: string, itemId: string, request: Request, env: Env): Promise<Response> {
  const items = (await getJSON<RecurringData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const idx = items.findIndex(r => r.id === itemId)
  if (idx === -1) return errorResponse('Recurring not found', 404)

  const body = (await request.json()) as any
  const r = items[idx]

  if (body.type !== undefined) r.type = body.type
  if (body.amount !== undefined) r.amount = Number(body.amount)
  if (body.category !== undefined) r.category = body.category
  if (body.walletId !== undefined) r.walletId = body.walletId
  if (body.note !== undefined) r.note = body.note
  if (body.frequency !== undefined) r.frequency = body.frequency
  if (body.nextDate !== undefined) r.nextDate = body.nextDate
  if (body.endDate !== undefined) r.endDate = body.endDate || undefined
  if (body.enabled !== undefined) r.enabled = body.enabled
  if (body.lastExecuted !== undefined) r.lastExecuted = body.lastExecuted
  r.updatedAt = new Date().toISOString()

  items[idx] = r
  await putJSON(env.SMART_NOTE_KV, KEY(userId), items)
  return jsonResponse({ success: true, data: r })
}

export async function handleDeleteRecurring(userId: string, itemId: string, env: Env): Promise<Response> {
  const items = (await getJSON<RecurringData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const filtered = items.filter(r => r.id !== itemId)
  await putJSON(env.SMART_NOTE_KV, KEY(userId), filtered)
  return jsonResponse({ success: true })
}

/** Mark a recurring as executed: advance nextDate, update lastExecuted */
export async function handleExecuteRecurring(userId: string, itemId: string, env: Env): Promise<Response> {
  const items = (await getJSON<RecurringData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const idx = items.findIndex(r => r.id === itemId)
  if (idx === -1) return errorResponse('Recurring not found', 404)

  const r = items[idx]
  r.lastExecuted = r.nextDate
  r.nextDate = advanceNextDate(r.nextDate, r.frequency)
  r.updatedAt = new Date().toISOString()

  // If past endDate → disable
  if (r.endDate && r.nextDate > r.endDate) {
    r.enabled = false
  }

  items[idx] = r
  await putJSON(env.SMART_NOTE_KV, KEY(userId), items)
  return jsonResponse({ success: true, data: r })
}
