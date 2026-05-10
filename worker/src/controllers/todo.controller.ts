import { Env, TodoData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId } from '../utils/crypto'
import { getJSON, putJSON } from '../services/kv.service'

// ====== Todo Handlers ======

const MAX_TODOS = 100
const DONE_CLEANUP_DAYS = 7

/** Auto-clean old done items and enforce max limit */
function cleanupTodos(todos: TodoData[]): TodoData[] {
  const cutoff = Date.now() - DONE_CLEANUP_DAYS * 24 * 60 * 60_000
  const cleaned = todos.filter(t =>
    t.status !== 'done' || new Date(t.updatedAt).getTime() > cutoff
  )
  // Keep most recent if over limit
  if (cleaned.length > MAX_TODOS) {
    cleaned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return cleaned.slice(0, MAX_TODOS)
  }
  return cleaned
}

export async function handleListTodos(userId: string, env: Env): Promise<Response> {
  const todos = (await getJSON<TodoData[]>(
    env.SMART_NOTE_KV, `users/${userId}/todos`
  )) || []

  // Sort: pending first (by time asc), then done
  todos.sort((a, b) => {
    if (a.status !== 'done' && b.status === 'done') return -1
    if (a.status === 'done' && b.status !== 'done') return 1
    return new Date(a.time).getTime() - new Date(b.time).getTime()
  })

  return jsonResponse({ success: true, data: todos })
}

export async function handleCreateTodo(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const { title, description, time, priority, category } = body

  if (!title || !time) {
    return errorResponse('Title and time are required')
  }

  const now = new Date().toISOString()
  const todo: TodoData = {
    id: generateId(),
    title: title.trim(),
    description: (description || '').trim(),
    time,
    priority: priority || 'medium',
    status: 'pending',
    category: category || undefined,
    createdAt: now,
    updatedAt: now,
  }

  let todos = (await getJSON<TodoData[]>(
    env.SMART_NOTE_KV, `users/${userId}/todos`
  )) || []

  todos.push(todo)
  todos = cleanupTodos(todos)

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, todos)

  return jsonResponse({ success: true, data: todo }, 201)
}

export async function handleUpdateTodo(
  userId: string, todoId: string, request: Request, env: Env
): Promise<Response> {
  const todos = (await getJSON<TodoData[]>(
    env.SMART_NOTE_KV, `users/${userId}/todos`
  )) || []

  const idx = todos.findIndex(t => t.id === todoId)
  if (idx === -1) return errorResponse('Todo not found', 404)

  const body = (await request.json()) as any
  const existing = todos[idx]

  if (body.title !== undefined) existing.title = body.title.trim()
  if (body.description !== undefined) existing.description = (body.description || '').trim()
  if (body.time !== undefined) existing.time = body.time
  if (body.priority !== undefined) existing.priority = body.priority
  if (body.status !== undefined) existing.status = body.status
  if (body.category !== undefined) existing.category = body.category || undefined
  if (body.reminderId !== undefined) existing.reminderId = body.reminderId || undefined

  existing.updatedAt = new Date().toISOString()
  todos[idx] = existing

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, todos)

  return jsonResponse({ success: true, data: existing })
}

export async function handleDeleteTodo(userId: string, todoId: string, env: Env): Promise<Response> {
  const todos = (await getJSON<TodoData[]>(
    env.SMART_NOTE_KV, `users/${userId}/todos`
  )) || []

  const filtered = todos.filter(t => t.id !== todoId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, filtered)

  return jsonResponse({ success: true })
}

export async function handleClearTodos(userId: string, request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status') || 'all'

  let todos = (await getJSON<TodoData[]>(
    env.SMART_NOTE_KV, `users/${userId}/todos`
  )) || []

  if (statusFilter === 'all') {
    todos = []
  } else if (statusFilter === 'done') {
    todos = todos.filter(t => t.status !== 'done')
  } else if (statusFilter === 'pending') {
    todos = todos.filter(t => t.status !== 'pending')
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, todos)

  return jsonResponse({ success: true })
}

/**
 * AI-powered todo generation from natural language input.
 */
export async function handleAiGenerateTodos(userId: string, request: Request, env: Env): Promise<Response> {
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const body = (await request.json()) as any
  const { content } = body
  if (!content) return errorResponse('Content is required')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentDay = String(now.getDate()).padStart(2, '0')
  const currentDateISO = now.toISOString()

  // Tomorrow date for AI reference
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  const systemPrompt = `Bạn là AI chuyên phân tích lịch trình và tạo to-do list từ văn bản tiếng Việt.
Phân tích nội dung và trả về danh sách công việc dưới dạng JSON ARRAY.

QUY TẮC BẮT BUỘC:
1. CHỈ trả về JSON ARRAY hợp lệ (tối đa 10 item). KHÔNG giải thích, KHÔNG thêm text bên ngoài.
2. Cấu trúc mỗi item: {"title": "string", "description": "string", "time": "ISO 8601", "priority": "low|medium|high|urgent", "category": "work|personal|health|finance|study|other"}
3. CÁCH PARSE THỜI GIAN:
   - "9h sáng" hoặc "9h" → ${currentYear}-${currentMonth}-${currentDay}T09:00:00.000Z
   - "2h chiều" hoặc "14h" → ${currentYear}-${currentMonth}-${currentDay}T14:00:00.000Z
   - "5h chiều" → ${currentYear}-${currentMonth}-${currentDay}T17:00:00.000Z
   - "8h tối" → ${currentYear}-${currentMonth}-${currentDay}T20:00:00.000Z
   - "mai" hoặc "ngày mai" → dùng ngày ${tomorrowStr}
   - "13/5" → ${currentYear}-05-13
   - Nếu KHÔNG nói rõ ngày → mặc định hôm nay ${currentYear}-${currentMonth}-${currentDay}
   - Nếu KHÔNG nói rõ giờ → mặc định 09:00:00
4. priority: Dựa trên từ khóa:
   - "gấp", "urgent", "khẩn cấp", "ngay" → "urgent"
   - "quan trọng", "important", "cần thiết" → "high"
   - "bình thường", mặc định → "medium"
   - "khi rảnh", "tùy", "không gấp" → "low"
5. category: Đoán từ context:
   - "họp", "meeting", "review", "deploy", "code", "jira", "sprint" → "work"
   - "gym", "tập", "chạy bộ", "yoga", "bác sĩ", "khám" → "health"
   - "ăn", "nấu", "giặt", "dọn", "mua sắm" → "personal"
   - "tiền", "chuyển khoản", "trả nợ", "đầu tư" → "finance"
   - "học", "đọc sách", "course", "bài tập" → "study"
   - Không rõ → "other"
6. Nếu KHÔNG tìm thấy task nào → trả về []

Thời gian hiện tại: ${currentDateISO}

VÍ DỤ:
Input: "9h sáng họp standup, 2h chiều code feature login, 5h gym"
Output: [{"title":"Họp standup","description":"Họp team buổi sáng","time":"${currentYear}-${currentMonth}-${currentDay}T09:00:00.000Z","priority":"medium","category":"work"},{"title":"Code feature login","description":"Phát triển tính năng đăng nhập","time":"${currentYear}-${currentMonth}-${currentDay}T14:00:00.000Z","priority":"medium","category":"work"},{"title":"Tập gym","description":"Tập luyện thể dục","time":"${currentYear}-${currentMonth}-${currentDay}T17:00:00.000Z","priority":"medium","category":"health"}]`

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast' as any, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content.substring(0, 3000) }
      ],
      max_tokens: 2048,
      temperature: 0.1
    }) as any

    const rawResponse = response?.response ?? response?.result ?? ''
    const text = String(typeof rawResponse === 'object' ? JSON.stringify(rawResponse) : rawResponse).trim()

    let tasks: any[] = []
    try {
      const parsed = JSON.parse(text)
      tasks = Array.isArray(parsed) ? parsed : []
    } catch {
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) tasks = JSON.parse(jsonMatch[0])
      } catch { tasks = [] }
    }

    // Post-process: validate and fix
    const validTasks = tasks
      .filter((t: any) => t?.title && t?.time)
      .map((t: any) => {
        let time = String(t.time)
        // Fix invalid ISO dates
        if (isNaN(new Date(time).getTime())) {
          time = `${currentYear}-${currentMonth}-${currentDay}T09:00:00.000Z`
        }
        const validPriorities = ['low', 'medium', 'high', 'urgent']
        const validCategories = ['work', 'personal', 'health', 'finance', 'study', 'other']
        return {
          title: String(t.title).substring(0, 100),
          description: String(t.description || '').substring(0, 300),
          time,
          priority: validPriorities.includes(t.priority) ? t.priority : 'medium',
          category: validCategories.includes(t.category) ? t.category : 'other',
        }
      })
      .filter((t: any) => !isNaN(new Date(t.time).getTime()))
      .slice(0, 10)

    return jsonResponse({ success: true, data: validTasks })
  } catch (err: any) {
    return errorResponse(err.message || 'AI todo generation failed', 500)
  }
}
