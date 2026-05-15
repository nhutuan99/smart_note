import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reminder, ReminderSuggestion } from '@/types'
import { httpClient } from '@/shared/api/httpClient'
import { AUTH_TOKEN_KEY } from '@/constants/auth'
import i18n from '@/i18n'

export type ReminderFilter = 'all' | 'active' | 'completed'

export const useReminderStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>([])
  const loading = ref(false)
  const filter = ref<ReminderFilter>('all')

  const activeReminders = computed(() => reminders.value.filter(r => r.status === 'active'))
  const completedReminders = computed(() => reminders.value.filter(r => r.status === 'completed' || r.status === 'expired'))
  const activeCount = computed(() => activeReminders.value.length)

  const filtered = computed(() => {
    if (filter.value === 'active') return activeReminders.value
    if (filter.value === 'completed') return completedReminders.value
    return reminders.value
  })

  function getCountdown(eventDate: string): { text: string; level: 'normal' | 'warning' | 'urgent' } {
    const t = i18n.global.t
    const diff = new Date(eventDate).getTime() - Date.now()
    if (diff <= 0) return { text: t('reminders.expired'), level: 'urgent' }
    const minutes = Math.floor(diff / 60_000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 3) return { text: t('reminders.timelineDaysLeft', { n: days }), level: 'normal' }
    if (days > 1) return { text: t('reminders.timelineDaysLeft', { n: days }), level: 'warning' }
    if (days === 1) return { text: t('reminders.timelineDaysLeft', { n: 1 }), level: 'urgent' }
    if (hours > 0) return { text: t('reminders.timelineHoursLeft', { n: hours }), level: 'urgent' }
    return { text: t('reminders.timelineMinsLeft', { n: minutes }), level: 'urgent' }
  }

  function getRepeatLabel(interval?: string): string {
    const t = i18n.global.t
    if (!interval || interval === 'none') return ''
    const labelMap: Record<string, string> = {
      none: t('reminders.repeatNone'),
      daily: t('reminders.repeatDaily'),
      weekly: t('reminders.repeatWeekly'),
      monthly: t('reminders.repeatMonthly'),
    }
    if (labelMap[interval]) return labelMap[interval]
    const mins = parseInt(interval, 10)
    if (!isNaN(mins)) {
      if (mins >= 1440) return t('reminders.timelineDaysLeft', { n: Math.floor(mins / 1440) })
      if (mins >= 60) return t('reminders.timelineHoursLeft', { n: Math.floor(mins / 60) })
      return t('reminders.timelineMinsLeft', { n: mins })
    }
    return ''
  }

  async function fetch() {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
    loading.value = true
    try {
      const data = await httpClient.get<Reminder[]>('/api/reminders')
      reminders.value = data || []
    } catch {
      // silently fail
    } finally {
      loading.value = false
    }
  }

  async function create(reminder: {
    title: string
    description?: string
    url?: string
    eventDate: string
    offsets: string[]
    customRemindAt?: string
    repeatInterval?: string
    sourceType?: string
    sourceId?: string
  }): Promise<Reminder | null> {
    try {
      const data = await httpClient.post<Reminder>('/api/reminders', reminder)
      if (data) reminders.value.unshift(data)
      return data || null
    } catch {
      return null
    }
  }

  async function update(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    try {
      const data = await httpClient.put<Reminder>(`/api/reminders/${id}`, updates)
      if (data) {
        const idx = reminders.value.findIndex(r => r.id === id)
        if (idx !== -1) reminders.value[idx] = data
      }
      return data || null
    } catch {
      return null
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await httpClient.del(`/api/reminders/${id}`)
      reminders.value = reminders.value.filter(r => r.id !== id)
      return true
    } catch {
      return false
    }
  }

  async function clear(status: 'all' | 'completed' | 'active' | 'expired' = 'all'): Promise<boolean> {
    try {
      await httpClient.del(`/api/reminders?status=${status}`)
      if (status === 'all') {
        reminders.value = []
      } else {
        if (status === 'completed') {
          reminders.value = reminders.value.filter(r => r.status !== 'completed' && r.status !== 'expired')
        } else if (status === 'expired') {
          reminders.value = reminders.value.filter(r => r.status !== 'expired')
        } else {
          reminders.value = reminders.value.filter(r => r.status !== status)
        }
      }
      return true
    } catch {
      return false
    }
  }

  async function complete(id: string): Promise<boolean> {
    try {
      await httpClient.post(`/api/reminders/${id}/complete`)
      const idx = reminders.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        reminders.value[idx].status = 'completed'
        reminders.value[idx].acknowledged = true
        reminders.value[idx].updatedAt = new Date().toISOString()
      }
      return true
    } catch {
      return false
    }
  }

  async function acknowledge(id: string): Promise<boolean> {
    try {
      await httpClient.post(`/api/reminders/${id}/acknowledge`)
      const idx = reminders.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        reminders.value[idx].acknowledged = true
      }
      return true
    } catch {
      return false
    }
  }

  async function detectFromText(content: string): Promise<ReminderSuggestion[]> {
    try {
      const data = await httpClient.post<ReminderSuggestion[]>('/api/reminders/ai-detect', { content })
      return data || []
    } catch {
      return []
    }
  }

  return {
    reminders, loading, filter,
    activeReminders, completedReminders, activeCount, filtered,
    getCountdown, getRepeatLabel,
    fetch, create, update, remove, clear, complete, acknowledge, detectFromText,
  }
})
