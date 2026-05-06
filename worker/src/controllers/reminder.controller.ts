import { Env, ReminderData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId } from '../utils/crypto'
import { getJSON, putJSON } from '../services/kv.service'
import { registerReminderUser, unregisterReminderUserIfEmpty } from '../services/reminder.service'

// ====== Reminder Handlers ======

const OFFSET_MS: Record<string, number> = {
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  '1h': 60 * 60_000,
  '2h': 2 * 60 * 60_000,
  '3h': 3 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
  '2d': 2 * 24 * 60 * 60_000,
  '3d': 3 * 24 * 60 * 60_000,
  '1w': 7 * 24 * 60 * 60_000,
}

/** Calculate remindAt ISO strings from eventDate + offsets + optional custom datetime */
function calculateRemindAt(eventDate: string, offsets: string[], customRemindAt?: string): string[] {
  const eventMs = new Date(eventDate).getTime()
  if (isNaN(eventMs)) return []

  const results: string[] = []

  // Preset offsets
  for (const offset of offsets) {
    const ms = OFFSET_MS[offset]
    if (!ms) continue
    const fireTime = eventMs - ms
    if (fireTime > Date.now()) {
      results.push(new Date(fireTime).toISOString())
    }
  }

  // Custom user-defined datetime
  if (customRemindAt) {
    const customMs = new Date(customRemindAt).getTime()
    if (!isNaN(customMs) && customMs > Date.now()) {
      results.push(new Date(customMs).toISOString())
    }
  }

  // Deduplicate and sort
  return [...new Set(results)].sort()
}

export async function handleListReminders(userId: string, env: Env): Promise<Response> {
  const reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  // Auto-expire old reminders (non-repeating only)
  const now = Date.now()
  let modified = false
  for (const r of reminders) {
    if (r.status === 'active' && new Date(r.eventDate).getTime() < now && (!r.repeatInterval || r.repeatInterval === 'none')) {
      r.status = 'expired'
      r.updatedAt = new Date().toISOString()
      modified = true
    }
  }
  if (modified) {
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders)
  }

  // Sort: active first (by eventDate asc), then completed/expired
  reminders.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  })

  return jsonResponse({ success: true, data: reminders })
}

export async function handleCreateReminder(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const { title, description, eventDate, offsets, customRemindAt, repeatInterval, sourceType, sourceId, url } = body

  if (!title || !eventDate) {
    return errorResponse('Title and eventDate are required')
  }

  const validOffsets = (offsets || ['1h', '1d']).filter((o: string) => OFFSET_MS[o])
  const remindAt = calculateRemindAt(eventDate, validOffsets, customRemindAt)

  const now = new Date().toISOString()
  const reminder: ReminderData = {
    id: generateId(),
    title: title.trim(),
    description: (description || '').trim(),
    url: url ? url.trim() : undefined,
    eventDate,
    remindAt,
    offsets: validOffsets,
    customRemindAt: customRemindAt || undefined,
    repeatInterval: repeatInterval || 'none',
    notifiedAt: [],
    acknowledged: false,
    lastChanceSent: false,
    sourceType: sourceType || 'manual',
    sourceId: sourceId || undefined,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  const reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  reminders.push(reminder)

  // Clean old expired/completed reminders (keep last 30 days only)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60_000
  const cleaned = reminders.filter(r =>
    r.status === 'active' || new Date(r.updatedAt).getTime() > thirtyDaysAgo
  )

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, cleaned)
  await registerReminderUser(userId, env)

  return jsonResponse({ success: true, data: reminder }, 201)
}

export async function handleUpdateReminder(
  userId: string, reminderId: string, request: Request, env: Env
): Promise<Response> {
  const reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  const idx = reminders.findIndex(r => r.id === reminderId)
  if (idx === -1) return errorResponse('Reminder not found', 404)

  const body = (await request.json()) as any
  const existing = reminders[idx]

  if (body.title !== undefined) existing.title = body.title.trim()
  if (body.description !== undefined) existing.description = body.description.trim()
  if (body.url !== undefined) existing.url = body.url ? body.url.trim() : undefined
  if (body.eventDate !== undefined) existing.eventDate = body.eventDate
  if (body.offsets !== undefined) existing.offsets = body.offsets.filter((o: string) => OFFSET_MS[o])
  if (body.customRemindAt !== undefined) existing.customRemindAt = body.customRemindAt || undefined
  if (body.repeatInterval !== undefined) existing.repeatInterval = body.repeatInterval
  if (body.acknowledged !== undefined) existing.acknowledged = body.acknowledged

  // Recalculate remindAt when eventDate, offsets, or customRemindAt change
  if (body.eventDate !== undefined || body.offsets !== undefined || body.customRemindAt !== undefined) {
    existing.remindAt = calculateRemindAt(existing.eventDate, existing.offsets, existing.customRemindAt)
    existing.notifiedAt = []
    existing.lastChanceSent = false
  }

  if (body.status !== undefined) existing.status = body.status
  existing.updatedAt = new Date().toISOString()

  reminders[idx] = existing
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders)

  return jsonResponse({ success: true, data: existing })
}

export async function handleDeleteReminder(userId: string, reminderId: string, env: Env): Promise<Response> {
  const reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  const filtered = reminders.filter(r => r.id !== reminderId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, filtered)
  await unregisterReminderUserIfEmpty(userId, env)

  return jsonResponse({ success: true })
}

export async function handleClearReminders(userId: string, request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status') || 'all'
  
  let reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  if (statusFilter === 'all') {
    reminders = []
  } else if (statusFilter === 'completed') {
    reminders = reminders.filter(r => r.status !== 'completed' && r.status !== 'expired')
  } else if (statusFilter === 'active') {
    reminders = reminders.filter(r => r.status !== 'active')
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders)
  if (reminders.length === 0) {
    await unregisterReminderUserIfEmpty(userId, env)
  }

  return jsonResponse({ success: true })
}

export async function handleCompleteReminder(userId: string, reminderId: string, env: Env): Promise<Response> {
  const reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  const idx = reminders.findIndex(r => r.id === reminderId)
  if (idx === -1) return errorResponse('Reminder not found', 404)

  reminders[idx].status = 'completed'
  reminders[idx].acknowledged = true
  reminders[idx].updatedAt = new Date().toISOString()

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders)
  await unregisterReminderUserIfEmpty(userId, env)

  return jsonResponse({ success: true })
}

/**
 * Acknowledge a reminder (user has seen it — prevents last-chance noti).
 */
export async function handleAcknowledgeReminder(userId: string, reminderId: string, env: Env): Promise<Response> {
  const reminders = (await getJSON<ReminderData[]>(
    env.SMART_NOTE_KV, `users/${userId}/reminders`
  )) || []

  const idx = reminders.findIndex(r => r.id === reminderId)
  if (idx === -1) return errorResponse('Reminder not found', 404)

  reminders[idx].acknowledged = true
  reminders[idx].updatedAt = new Date().toISOString()
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders)

  return jsonResponse({ success: true })
}

/**
 * AI Detection: Analyze text content for events/deadlines, return structured suggestions.
 */
export async function handleAiDetectReminders(userId: string, request: Request, env: Env): Promise<Response> {
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const body = (await request.json()) as any
  const { content } = body
  if (!content) return errorResponse('Content is required')

  const systemPrompt = `Bạn là AI chuyên trích xuất sự kiện, task, deadline từ văn bản tiếng Việt.
Phân tích nội dung và trả về danh sách các sự kiện.

Quy tắc BẮT BUỘC:
1. CHỈ trả về JSON ARRAY hợp lệ (tối đa 5 item), KHÔNG giải thích thêm.
2. Cấu trúc mỗi item: {"title": "tên ngắn gọn", "eventDate": "ISO 8601 datetime", "description": "CHI TIẾT ĐẦY ĐỦ", "url": "URL nguyên bản"}
3. "description": Phải giữ lại toàn bộ mô tả, note, task name trong văn bản gốc. KHÔNG ĐƯỢC TÓM TẮT LƯỢC BỎ.
4. "url": Bắt buộc tìm và trích xuất MỌI đường link (http/https). Nếu link nằm trong markdown dạng [text](url) thì lấy phần url. KHÔNG ĐƯỢC BỎ SÓT LINK NÀO!
5. "eventDate": Nếu chỉ có ngày (VD: "13/5"), lấy năm hiện tại và gán giờ mặc định 09:00. Tính từ hiện tại: ${new Date().toISOString()}
6. Nếu KHÔNG có sự kiện nào, trả về mảng rỗng [].`

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content.substring(0, 2000) }
      ],
      max_tokens: 512,
      temperature: 0.3
    }) as any

    const text = (response?.response || '').trim()

    let events: any[] = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) events = JSON.parse(jsonMatch[0])
    } catch { events = [] }

    const validEvents = events
      .filter((e: any) => e?.title && e?.eventDate)
      .map((e: any) => ({
        title: String(e.title).substring(0, 100),
        eventDate: String(e.eventDate),
        description: String(e.description || '').substring(0, 200),
      }))
      .slice(0, 5)

    return jsonResponse({ success: true, data: validEvents })
  } catch (err: any) {
    return errorResponse(err.message || 'AI detection failed', 500)
  }
}
