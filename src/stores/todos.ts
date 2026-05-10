import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TodoItem, TodoSuggestion } from '@/types'
import { httpClient } from '@/shared/api/httpClient'
import { AUTH_TOKEN_KEY } from '@/constants/auth'
import { useReminderStore } from '@/stores/reminders'
import { useUiStore } from '@/stores/ui'

export type TodoFilter = 'all' | 'pending' | 'done'

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<TodoItem[]>([])
  const loading = ref(false)
  const filter = ref<TodoFilter>('all')

  // ── Computed ──
  const pendingTodos = computed(() => todos.value.filter(t => t.status === 'pending' || t.status === 'in_progress'))
  const doneTodos = computed(() => todos.value.filter(t => t.status === 'done'))
  const pendingCount = computed(() => pendingTodos.value.length)
  const doneCount = computed(() => doneTodos.value.length)
  const totalCount = computed(() => todos.value.length)
  const progressPercent = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.round((doneCount.value / totalCount.value) * 100)
  })

  const filtered = computed(() => {
    if (filter.value === 'pending') return pendingTodos.value
    if (filter.value === 'done') return doneTodos.value
    return todos.value
  })

  // ── Timeline grouping ──
  interface DateGroup {
    dateKey: string
    label: string
    relative: string
    level: 'normal' | 'warning' | 'urgent'
    todos: TodoItem[]
  }

  const groupedByDate = computed<DateGroup[]>(() => {
    const groups = new Map<string, TodoItem[]>()
    for (const t of filtered.value) {
      const d = new Date(t.time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, items]) => {
        const d = new Date(dateKey + 'T00:00:00')
        const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000)
        let relative = ''
        let level: 'normal' | 'warning' | 'urgent' = 'normal'

        if (diffDays < 0) { relative = `${Math.abs(diffDays)} ngày trước`; level = 'urgent' }
        else if (diffDays === 0) { relative = 'Hôm nay'; level = 'urgent' }
        else if (diffDays === 1) { relative = 'Ngày mai'; level = 'warning' }
        else if (diffDays <= 3) { relative = `${diffDays} ngày nữa`; level = 'warning' }
        else { relative = `${diffDays} ngày nữa`; level = 'normal' }

        return {
          dateKey,
          label: d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
          relative,
          level,
          todos: items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
        }
      })
  })

  // ── Actions ──
  async function fetch() {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
    loading.value = true
    try {
      const data = await httpClient.get<TodoItem[]>('/api/todos')
      todos.value = data || []
    } catch {
      // silently fail
    } finally {
      loading.value = false
    }
  }

  async function create(todo: {
    title: string
    description?: string
    time: string
    priority?: string
    category?: string
  }): Promise<TodoItem | null> {
    try {
      const data = await httpClient.post<TodoItem>('/api/todos', todo)
      if (data) todos.value.push(data)
      return data || null
    } catch {
      return null
    }
  }

  async function update(id: string, updates: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      const data = await httpClient.put<TodoItem>(`/api/todos/${id}`, updates)
      if (data) {
        const idx = todos.value.findIndex(t => t.id === id)
        if (idx !== -1) todos.value[idx] = data
      }
      return data || null
    } catch {
      return null
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await httpClient.del(`/api/todos/${id}`)
      todos.value = todos.value.filter(t => t.id !== id)
      return true
    } catch {
      return false
    }
  }

  async function clear(status: 'all' | 'done' | 'pending' = 'all'): Promise<boolean> {
    try {
      await httpClient.del(`/api/todos?status=${status}`)
      if (status === 'all') {
        todos.value = []
      } else {
        todos.value = todos.value.filter(t => t.status !== status)
      }
      return true
    } catch {
      return false
    }
  }

  async function toggleStatus(id: string): Promise<boolean> {
    const todo = todos.value.find(t => t.id === id)
    if (!todo) return false
    const newStatus = todo.status === 'done' ? 'pending' : 'done'
    const result = await update(id, { status: newStatus })
    return !!result
  }

  async function generateFromAi(prompt: string): Promise<TodoSuggestion[]> {
    try {
      const data = await httpClient.post<TodoSuggestion[]>('/api/todos/ai-generate', { content: prompt })
      return data || []
    } catch {
      return []
    }
  }

  async function pushToReminder(todoId: string): Promise<boolean> {
    const todo = todos.value.find(t => t.id === todoId)
    if (!todo || todo.reminderId) return false

    try {
      const reminderStore = useReminderStore()
      const reminder = await reminderStore.create({
        title: todo.title,
        description: todo.description || '',
        eventDate: todo.time,
        offsets: ['30m', '1h'],
        sourceType: 'manual',
      })

      if (reminder) {
        await update(todoId, { reminderId: reminder.id })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return {
    todos, loading, filter,
    pendingTodos, doneTodos, pendingCount, doneCount, totalCount, progressPercent,
    filtered, groupedByDate,
    fetch, create, update, remove, clear, toggleStatus, generateFromAi, pushToReminder,
  }
})
