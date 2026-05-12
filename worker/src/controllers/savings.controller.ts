import { Env, SavingsData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { getJSON, putJSON } from '../services/kv.service'

const KEY = (userId: string) => `users/${userId}/savings`
const REGISTRY_KEY = 'public/finance-reminder-users'

function generateId(): string {
  return crypto.randomUUID()
}

/** Register user in finance-reminder registry (idempotent) */
async function registerFinanceReminderUser(userId: string, env: Env): Promise<void> {
  const users = (await getJSON<string[]>(env.SMART_NOTE_KV, REGISTRY_KEY)) || []
  if (!users.includes(userId)) {
    users.push(userId)
    await putJSON(env.SMART_NOTE_KV, REGISTRY_KEY, users)
  }
}

/** Unregister if no active goals with reminder */
async function maybeUnregisterFinanceReminderUser(userId: string, env: Env): Promise<void> {
  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const hasReminder = goals.some(g => g.reminderTime && g.currentAmount < g.targetAmount)
  if (!hasReminder) {
    const users = (await getJSON<string[]>(env.SMART_NOTE_KV, REGISTRY_KEY)) || []
    await putJSON(env.SMART_NOTE_KV, REGISTRY_KEY, users.filter(u => u !== userId))
  }
}

export async function handleListSavings(userId: string, env: Env): Promise<Response> {
  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  return jsonResponse({ success: true, data: goals })
}

export async function handleCreateSavings(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  if (!body.name?.trim()) return errorResponse('Name is required')

  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, KEY(userId))) || []

  const goal: SavingsData = {
    id: generateId(),
    name: body.name.trim(),
    icon: body.icon || '🎯',
    color: body.color || '#10b981',
    targetAmount: Number(body.targetAmount) || 0,
    currentAmount: Number(body.currentAmount) || 0,
    deadline: body.deadline || undefined,
    reminderTime: body.reminderTime || null,
    reminderNotifiedDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  goals.push(goal)
  await putJSON(env.SMART_NOTE_KV, KEY(userId), goals)

  if (goal.reminderTime) {
    await registerFinanceReminderUser(userId, env)
  }

  return jsonResponse({ success: true, data: goal }, 201)
}

export async function handleUpdateSavings(userId: string, goalId: string, request: Request, env: Env): Promise<Response> {
  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const idx = goals.findIndex(g => g.id === goalId)
  if (idx === -1) return errorResponse('Goal not found', 404)

  const body = (await request.json()) as any
  const g = goals[idx]

  if (body.name !== undefined) g.name = body.name.trim()
  if (body.icon !== undefined) g.icon = body.icon
  if (body.color !== undefined) g.color = body.color
  if (body.targetAmount !== undefined) g.targetAmount = Number(body.targetAmount)
  if (body.currentAmount !== undefined) g.currentAmount = Math.max(0, Number(body.currentAmount))
  if (body.deadline !== undefined) g.deadline = body.deadline || undefined
  if (body.reminderTime !== undefined) {
    g.reminderTime = body.reminderTime || null
    // Reset notified date so reminder fires on the new time
    g.reminderNotifiedDate = null
  }
  g.updatedAt = new Date().toISOString()

  goals[idx] = g
  await putJSON(env.SMART_NOTE_KV, KEY(userId), goals)

  if (g.reminderTime) {
    await registerFinanceReminderUser(userId, env)
  } else {
    await maybeUnregisterFinanceReminderUser(userId, env)
  }

  return jsonResponse({ success: true, data: g })
}

export async function handleDeleteSavings(userId: string, goalId: string, env: Env): Promise<Response> {
  const goals = (await getJSON<SavingsData[]>(env.SMART_NOTE_KV, KEY(userId))) || []
  const filtered = goals.filter(g => g.id !== goalId)
  await putJSON(env.SMART_NOTE_KV, KEY(userId), filtered)
  await maybeUnregisterFinanceReminderUser(userId, env)
  return jsonResponse({ success: true })
}
