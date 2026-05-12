import { Env, DebtData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { getJSON, putJSON } from '../services/kv.service'

const KEY = (userId: string) => `users/${userId}/debts`

function generateId(): string {
  return crypto.randomUUID()
}

export async function handleListDebts(userId: string, env: Env): Promise<Response> {
  const debts = (await getJSON<DebtData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  return jsonResponse({ success: true, data: debts })
}

export async function handleCreateDebt(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  if (!body.title?.trim()) return errorResponse('Title is required')

  const debts = (await getJSON<DebtData[]>(env.SMART_NOTE_KV, KEY(userId))) || []

  const debt: DebtData = {
    id: generateId(),
    title: body.title.trim(),
    type: body.type === 'lent' ? 'lent' : 'borrowed',
    amount: Number(body.amount) || 0,
    remainingAmount: body.remainingAmount !== undefined ? Number(body.remainingAmount) : Number(body.amount) || 0,
    interestRate: Number(body.interestRate) || 0,
    counterparty: body.counterparty || '',
    startDate: body.startDate || new Date().toISOString().substring(0, 10),
    dueDate: body.dueDate || '',
    note: body.note || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  debts.push(debt)
  await putJSON(env.SMART_NOTE_KV, KEY(userId), debts)
  return jsonResponse({ success: true, data: debt }, 201)
}

export async function handleUpdateDebt(userId: string, debtId: string, request: Request, env: Env): Promise<Response> {
  const debts = (await getJSON<DebtData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const idx = debts.findIndex(d => d.id === debtId)
  if (idx === -1) return errorResponse('Debt not found', 404)

  const body = (await request.json()) as any
  const d = debts[idx]

  if (body.title !== undefined) d.title = body.title.trim()
  if (body.type !== undefined) d.type = body.type
  if (body.amount !== undefined) d.amount = Number(body.amount)
  if (body.remainingAmount !== undefined) d.remainingAmount = Number(body.remainingAmount)
  if (body.interestRate !== undefined) d.interestRate = Number(body.interestRate)
  if (body.counterparty !== undefined) d.counterparty = body.counterparty
  if (body.startDate !== undefined) d.startDate = body.startDate
  if (body.dueDate !== undefined) d.dueDate = body.dueDate
  if (body.note !== undefined) d.note = body.note
  if (body.status !== undefined) d.status = body.status
  d.updatedAt = new Date().toISOString()

  debts[idx] = d
  await putJSON(env.SMART_NOTE_KV, KEY(userId), debts)
  return jsonResponse({ success: true, data: d })
}

export async function handleDeleteDebt(userId: string, debtId: string, env: Env): Promise<Response> {
  const debts = (await getJSON<DebtData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const filtered = debts.filter(d => d.id !== debtId)
  await putJSON(env.SMART_NOTE_KV, KEY(userId), filtered)
  return jsonResponse({ success: true })
}
