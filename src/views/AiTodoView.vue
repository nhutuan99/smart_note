<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTodoStore } from '@/stores/todos'
import { useUiStore } from '@/stores/ui'
import type { TodoSuggestion, Reminder } from '@/types'
import TodoSuggestionModal from '@/components/ui/TodoSuggestionModal.vue'
import CreateReminderModal from '@/components/ui/CreateReminderModal.vue'
import LogoLoader from '@/components/ui/LogoLoader.vue'
import {
  Sparkles, Send, Clock, BellRing, Check, Trash2, ListTodo,
  CalendarDays, Loader2, CheckCircle2, Circle, LayoutList
} from 'lucide-vue-next'

const { t } = useI18n()
const store = useTodoStore()
const ui = useUiStore()

const prompt = ref('')
const generating = ref(false)
const suggestions = ref<TodoSuggestion[]>([])
const showSuggestions = ref(false)
const deletingId = ref<string | null>(null)

// Reminder modal state
const showReminderModal = ref(false)
const reminderTodoId = ref<string | null>(null)
const reminderPrefill = ref<Partial<Reminder> | null>(null)

onMounted(() => store.fetch())

const priorityColors: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#06b6d4', low: '#22c55e'
}
const categoryEmojis: Record<string, string> = {
  work: '🏢', personal: '🏠', health: '💪', finance: '💰', study: '📚', other: '📌'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// Progress ring
const ringRadius = 40
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = computed(() => {
  const pct = store.progressPercent / 100
  return ringCircumference * (1 - pct)
})

async function handleGenerate() {
  if (!prompt.value.trim() || generating.value) return
  generating.value = true
  try {
    const results = await store.generateFromAi(prompt.value.trim())
    if (results.length === 0) {
      ui.showToast('warning', t('aiTodo.noTasksFound'))
    } else {
      suggestions.value = results
      showSuggestions.value = true
    }
  } catch { ui.showToast('error', t('common.somethingWentWrong')) }
  finally { generating.value = false }
}

function onSuggestionsCreated() {
  showSuggestions.value = false
  suggestions.value = []
  prompt.value = ''
  store.fetch()
}

async function toggleDone(id: string) { await store.toggleStatus(id) }

async function handleDelete(id: string) {
  deletingId.value = id
  const ok = await store.remove(id)
  if (ok) ui.showToast('success', t('aiTodo.deleted'))
  deletingId.value = null
}

function openReminderModal(todoId: string) {
  const todo = store.todos.find(t => t.id === todoId)
  if (!todo) return
  reminderTodoId.value = todoId
  // Pre-fill the reminder modal with todo data
  reminderPrefill.value = {
    title: todo.title,
    description: todo.description || '',
    eventDate: todo.time,
    sourceType: 'manual',
  } as Partial<Reminder>
  showReminderModal.value = true
}

async function onReminderSaved() {
  showReminderModal.value = false
  // After reminder created, link it back to the todo
  if (reminderTodoId.value) {
    // Mark as having reminder (the store.create in modal already saved it)
    await store.update(reminderTodoId.value, { reminderId: 'linked' })
    ui.showToast('success', t('aiTodo.pushedToReminder'))
  }
  reminderTodoId.value = null
  reminderPrefill.value = null
}
</script>

<template>
  <div class="todo-page mx-auto max-w-[68rem]">
    <!-- Hero Header -->
    <div class="todo-hero">
      <div class="hero-glow hero-glow--1" />
      <div class="hero-glow hero-glow--2" />
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <Sparkles :size="28" class="hero-icon" />
            {{ t('aiTodo.title') }}
          </h1>
          <p class="hero-subtitle">{{ t('aiTodo.subtitle') }}</p>
        </div>
        <!-- Progress Ring -->
        <div v-if="store.totalCount > 0" class="progress-ring-wrap">
          <svg class="progress-ring" width="96" height="96" viewBox="0 0 96 96">
            <circle class="ring-bg" cx="48" cy="48" :r="ringRadius" fill="none" stroke-width="6" />
            <circle class="ring-fg" cx="48" cy="48" :r="ringRadius" fill="none" stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset"
              transform="rotate(-90 48 48)" />
          </svg>
          <div class="ring-label">
            <span class="ring-pct">{{ store.progressPercent }}%</span>
            <span class="ring-sub">{{ t('aiTodo.tasksDone', { done: store.doneCount, total: store.totalCount }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Chat Input -->
    <div 
      class="relative bg-bg-surface border border-border-default rounded-[1.5rem] p-2 pl-5 mb-8 flex items-end gap-3 transition-all duration-300 shadow-sm focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/10 focus-within:-translate-y-0.5 group"
    >
      <Sparkles :size="20" class="text-accent shrink-0 animate-pulse mb-3" />
      <textarea
        v-model="prompt"
        :placeholder="t('aiTodo.placeholder')"
        class="flex-1 bg-transparent border-none outline-none resize-none text-[0.9375rem] text-text-primary placeholder:text-text-tertiary py-3 min-h-[48px] max-h-[120px] scrollbar-thin"
        rows="1"
        @keydown.enter.exact.prevent="handleGenerate"
        @input="(e: Event) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }"
      />
      <button
        :disabled="!prompt.trim() || generating"
        @click="handleGenerate"
        class="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-accent text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-disabled hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(6,182,212,0.3)] hover:scale-105"
      >
        <LogoLoader v-if="generating" :size="18" />
        <Send v-else :size="18" class="-ml-0.5 mt-0.5" />
      </button>

      <!-- Absolute Status -->
      <div v-if="generating" class="absolute -bottom-6 left-5 flex items-center gap-1.5 text-[0.75rem] font-medium text-accent animate-pulse">
        <LogoLoader :size="12" />
        {{ t('aiTodo.processing') }}
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-bar" v-if="store.totalCount > 0">
      <button
        v-for="f in (['all', 'pending', 'done'] as const)"
        :key="f"
        class="filter-tab"
        :class="{ 'filter-tab--active': store.filter === f }"
        @click="store.filter = f"
      >
        {{ t(`aiTodo.${f}`) }}
        <span v-if="f === 'pending' && store.pendingCount > 0" class="filter-count">{{ store.pendingCount }}</span>
        <span v-if="f === 'done' && store.doneCount > 0" class="filter-count filter-count--done">{{ store.doneCount }}</span>
      </button>
    </div>

    <!-- Timeline -->
    <div v-if="store.loading && store.totalCount === 0" class="empty-state">
      <LogoLoader :size="32" :showGlow="true" />
    </div>

    <div v-else-if="store.groupedByDate.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <LayoutList :size="40" class="text-text-disabled" />
      </div>
      <h3 class="empty-title">{{ t('aiTodo.empty') }}</h3>
      <p class="empty-desc">{{ t('aiTodo.emptyDesc') }}</p>
    </div>

    <div v-else class="timeline">
      <div v-for="group in store.groupedByDate" :key="group.dateKey" class="timeline-group">
        <!-- Date Header -->
        <div class="date-header">
          <CalendarDays :size="15" class="date-icon" />
          <span class="date-label">{{ group.label }}</span>
          <span class="date-rel" :class="`date-rel--${group.level}`">{{ group.relative }}</span>
        </div>

        <!-- Todo Cards -->
        <div class="todo-list">
          <div
            v-for="(todo, idx) in group.todos"
            :key="todo.id"
            class="todo-card"
            :class="{ 'todo-card--done': todo.status === 'done' }"
            :style="{ '--i': idx, '--priority-color': priorityColors[todo.priority] }"
          >
            <!-- Checkbox -->
            <button class="todo-check" @click="toggleDone(todo.id)">
              <CheckCircle2 v-if="todo.status === 'done'" :size="22" class="check-done" />
              <Circle v-else :size="22" class="check-pending" />
            </button>

            <!-- Content -->
            <div class="todo-body">
              <div class="todo-meta">
                <span class="todo-time">
                  <Clock :size="12" />
                  {{ formatTime(todo.time) }}
                </span>
                <span v-if="todo.category" class="todo-cat">
                  {{ categoryEmojis[todo.category] || '📌' }}
                  {{ t(`aiTodo.cat${todo.category.charAt(0).toUpperCase() + todo.category.slice(1)}`) }}
                </span>
                <span
                  class="todo-priority"
                  :style="{ color: priorityColors[todo.priority], background: priorityColors[todo.priority] + '12', borderColor: priorityColors[todo.priority] + '30' }"
                >
                  {{ t(`aiTodo.priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`) }}
                </span>
              </div>
              <h4 class="todo-title" :class="{ 'todo-title--done': todo.status === 'done' }">{{ todo.title }}</h4>
              <p v-if="todo.description" class="todo-desc">{{ todo.description }}</p>
            </div>

            <!-- Actions -->
            <div class="todo-actions">
              <button
                v-if="!todo.reminderId && todo.status !== 'done'"
                class="action-btn action-btn--reminder"
                @click.stop="openReminderModal(todo.id)"
                :title="t('aiTodo.pushReminder')"
              >
                <BellRing :size="14" />
              </button>
              <span v-else-if="todo.reminderId" class="reminder-badge" :title="t('aiTodo.alreadyReminder')">
                <Check :size="12" />
              </span>
              <button
                class="action-btn action-btn--delete"
                :disabled="deletingId === todo.id"
                @click.stop="handleDelete(todo.id)"
                :title="t('aiTodo.deleteConfirm')"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Modal -->
    <TodoSuggestionModal
      v-if="showSuggestions && suggestions.length > 0"
      :suggestions="suggestions"
      @close="showSuggestions = false"
      @created="onSuggestionsCreated"
    />

    <!-- Reminder Modal — full customization -->
    <CreateReminderModal
      v-if="showReminderModal"
      :reminder="reminderPrefill as any"
      @close="showReminderModal = false; reminderTodoId = null; reminderPrefill = null"
      @saved="onReminderSaved"
    />
  </div>
</template>

<style scoped>
/* ═════════════════════════════════════════
   Hero Header — Liquid Glass 2026
   ═════════════════════════════════════════ */
.todo-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, rgba(6,182,212,0.18), rgba(6,182,212,0.04));
  border: 1px solid rgba(6,182,212,0.2);
  padding: 2rem;
  margin-bottom: 1.5rem;
}
.hero-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(60px);
}
.hero-glow--1 { width: 10rem; height: 10rem; top: -3rem; right: -2rem; background: rgba(6,182,212,0.25); }
.hero-glow--2 { width: 8rem; height: 8rem; bottom: -2rem; left: -2rem; background: rgba(6,182,212,0.12); }
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.hero-text { flex: 1; }
.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.hero-icon { color: #06b6d4; }
.hero-subtitle { color: var(--text-secondary); font-size: 0.9375rem; }

/* Progress Ring */
.progress-ring-wrap {
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 96px;
}
.ring-bg { stroke: var(--border-default); }
.ring-fg {
  stroke: #06b6d4;
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1);
}
.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-pct { font-size: 1.25rem; font-weight: 800; color: #06b6d4; }
.ring-sub { font-size: 0.5625rem; color: var(--text-tertiary); margin-top: 0.125rem; white-space: nowrap; }


/* ═════════════════════════════════════════
   Filter Bar
   ═════════════════════════════════════════ */
.filter-bar {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
}
.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.875rem;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab:hover { background: var(--bg-hover); }
.filter-tab--active {
  background: rgba(6,182,212,0.1);
  color: #06b6d4;
  border-color: rgba(6,182,212,0.3);
  font-weight: 600;
}
.filter-count {
  font-size: 0.625rem;
  font-weight: 700;
  min-width: 1.125rem;
  height: 1.125rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
  border-radius: 9999px;
  background: rgba(6,182,212,0.15);
  color: #06b6d4;
}
.filter-count--done { background: rgba(34,197,94,0.15); color: #22c55e; }

/* ═════════════════════════════════════════
   Empty State
   ═════════════════════════════════════════ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}
.empty-icon-wrap {
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background: var(--bg-elevated);
  margin-bottom: 1.25rem;
}
.empty-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }
.empty-desc { font-size: 0.875rem; color: var(--text-tertiary); max-width: 20rem; }

/* ═════════════════════════════════════════
   Timeline
   ═════════════════════════════════════════ */
.timeline { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 2rem; }
.timeline-group { display: flex; flex-direction: column; gap: 0.625rem; }
.date-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}
.date-icon { color: var(--text-disabled); }
.date-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
.date-rel {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}
.date-rel--normal { background: var(--bg-elevated); color: var(--text-tertiary); }
.date-rel--warning { background: rgba(249,115,22,0.1); color: #f97316; }
.date-rel--urgent { background: rgba(6,182,212,0.1); color: #06b6d4; }

/* ═════════════════════════════════════════
   Todo Card — Liquid Glass
   ═════════════════════════════════════════ */
.todo-list { display: flex; flex-direction: column; gap: 0.5rem; }
.todo-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-left: 3px solid var(--priority-color, #06b6d4);
  transition: all 0.25s ease;
  animation: cardEnter 0.35s ease both;
  animation-delay: calc(var(--i) * 60ms);
}
.todo-card:hover {
  border-color: rgba(6,182,212,0.3);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.todo-card--done {
  opacity: 0.55;
  border-left-color: #22c55e;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Checkbox */
.todo-check {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-top: 0.125rem;
  transition: transform 0.2s;
}
.todo-check:hover { transform: scale(1.15); }
.check-done { color: #22c55e; }
.check-pending { color: var(--border-default); }

/* Body */
.todo-body { flex: 1; min-width: 0; }
.todo-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.375rem;
}
.todo-time {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.todo-cat {
  font-size: 0.625rem;
  color: var(--text-secondary);
}
.todo-priority {
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.todo-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.125rem;
}
.todo-title--done {
  text-decoration: line-through;
  color: var(--text-disabled);
}
.todo-desc {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Actions */
.todo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex-shrink: 0;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-btn--reminder { color: #06b6d4; }
.action-btn--reminder:hover:not(:disabled) {
  background: rgba(6,182,212,0.1);
  border-color: rgba(6,182,212,0.3);
}
.action-btn--delete { color: var(--text-disabled); }
.action-btn--delete:hover:not(:disabled) {
  color: #ef4444;
  background: rgba(239,68,68,0.08);
  border-color: rgba(239,68,68,0.2);
}
.reminder-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(34,197,94,0.1);
  color: #22c55e;
}

/* Animate spin */
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ═════════════════════════════════════════
   Responsive
   ═════════════════════════════════════════ */
@media (max-width: 640px) {
  .hero-content { flex-direction: column; align-items: flex-start; }
  .progress-ring-wrap { align-self: center; }
  .hero-title { font-size: 1.375rem; }
  .todo-card { padding: 0.875rem 1rem; }
  .todo-actions { flex-direction: row; }
}
</style>
