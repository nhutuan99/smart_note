<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReminderStore, type ReminderFilter } from '@/stores/reminders'
import { useUiStore } from '@/stores/ui'
import type { Reminder, ReminderSuggestion } from '@/types'
import CreateReminderModal from '@/components/ui/CreateReminderModal.vue'
import ReminderSuggestionModal from '@/components/ui/ReminderSuggestionModal.vue'
import {
  Bell, Plus, Check, Clock, CalendarDays, Trash2,
  CheckCircle2, AlertCircle, Timer, BellRing, Repeat, Eye,
  Sparkles, Loader, Link
} from 'lucide-vue-next'

const { t } = useI18n()
const store = useReminderStore()
const ui = useUiStore()

const showCreateModal = ref(false)
const editingReminder = ref<Reminder | null>(null)

const tabs: { key: ReminderFilter; label: string }[] = [
  { key: 'all', label: 'reminders.all' },
  { key: 'active', label: 'reminders.active' },
  { key: 'completed', label: 'reminders.completed' },
]

const aiInput = ref('')
const processingAi = ref(false)
const aiSuggestions = ref<ReminderSuggestion[]>([])

async function handleAiSubmit() {
  if (!aiInput.value.trim() || processingAi.value) return
  processingAi.value = true
  try {
    const suggestions = await store.detectFromText(aiInput.value)
    if (suggestions.length > 0) {
      aiSuggestions.value = suggestions
      aiInput.value = '' // clear on success
    } else {
      ui.showToast('info', t('reminders.noEventsFound'))
    }
  } catch (e) {
    ui.showToast('error', t('common.somethingWentWrong'))
  } finally {
    processingAi.value = false
  }
}

onMounted(() => {
  store.fetch()
})

function openCreate() {
  editingReminder.value = null
  showCreateModal.value = true
}

function openEdit(reminder: Reminder) {
  editingReminder.value = reminder
  showCreateModal.value = true
}

function getDisplayUrl(url: string) {
  try {
    const obj = new URL(url)
    return obj.hostname + (obj.pathname !== '/' ? '...' : '')
  } catch {
    return url.length > 30 ? url.substring(0, 30) + '...' : url
  }
}

async function handleDelete(id: string) {
  const confirmed = await ui.requestConfirm({
    title: t('reminders.deleteConfirm'),
    message: t('reminders.deleteMessage'),
    danger: true,
    confirmText: t('common.delete')
  })
  if (confirmed) {
    const ok = await store.remove(id)
    if (ok) ui.showToast('success', t('reminders.deleted'))
  }
}

async function handleComplete(id: string) {
  const ok = await store.complete(id)
  if (ok) ui.showToast('success', t('reminders.markedComplete'))
}

async function handleAcknowledge(id: string) {
  const ok = await store.acknowledge(id)
  if (ok) ui.showToast('success', t('reminders.acknowledged'))
}

function handleModalClose() {
  showCreateModal.value = false
  editingReminder.value = null
}

function handleModalSaved() {
  showCreateModal.value = false
  editingReminder.value = null
  store.fetch()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const offsetLabels: Record<string, string> = {
  '15m': '15p', '30m': '30p', '1h': '1h', '2h': '2h', '3h': '3h',
  '1d': '1 ngày', '2d': '2 ngày', '3d': '3 ngày', '1w': '1 tuần',
}

function getStatusIcon(status: string) {
  if (status === 'active') return BellRing
  if (status === 'completed') return CheckCircle2
  return AlertCircle
}

function getStatusColor(status: string) {
  if (status === 'active') return 'text-accent'
  if (status === 'completed') return 'text-success'
  return 'text-text-disabled'
}
</script>

<template>
  <div class="reminders-page mx-auto max-w-[50rem]">
    <!-- Header -->
    <div class="reminders-hero mb-8">
      <div class="hero-glow hero-glow--1" />
      <div class="hero-glow hero-glow--2" />
      <div class="hero-content">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-3 flex items-center gap-3">
            <Bell :size="28" class="text-accent" />
            {{ t('reminders.title') }}
          </h1>
          <p class="text-text-secondary text-base max-w-xl">
            {{ t('reminders.subtitle') }}
          </p>
        </div>
        <button
          id="create-reminder-btn"
          @click="openCreate"
          class="hero-create-btn"
        >
          <Plus :size="18" />
          <span class="hidden sm:inline">{{ t('reminders.create') }}</span>
        </button>
      </div>
    </div>

    <!-- AI Quick Add -->
    <div class="mb-6 relative group">
      <div class="absolute top-4 left-4 text-accent pointer-events-none">
        <Sparkles :size="18" />
      </div>
      <textarea
        v-model="aiInput"
        @keydown.enter.prevent="handleAiSubmit"
        :disabled="processingAi"
        rows="3"
        placeholder="Nhập nội dung để AI tạo nhanh...&#10;(vd: Hẹn gặp khách lúc 3h chiều mai, nhắc trước 1 tiếng)"
        class="w-full pl-11 pr-14 py-4 bg-bg-surface border border-border-default hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent-subtle rounded-2xl text-sm transition-all duration-200 outline-none text-text-primary placeholder:text-text-disabled shadow-sm resize-none"
      />
      <div class="absolute bottom-3 right-3 flex items-center">
        <button
          @click="handleAiSubmit"
          :disabled="!aiInput.trim() || processingAi"
          class="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          title="Tạo nhanh"
        >
          <Loader v-if="processingAi" :size="16" class="animate-spin" />
          <Plus v-else :size="16" />
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="mb-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="store.filter = tab.key"
        class="flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.8125rem] font-medium whitespace-nowrap transition-all duration-150 border"
        :class="store.filter === tab.key
          ? 'bg-accent/10 border-accent/30 text-accent font-semibold shadow-[0_0_12px_rgba(142,125,250,0.1)]'
          : 'bg-bg-elevated border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary hover:border-border-strong'"
      >
        {{ t(tab.label) }}
        <span v-if="tab.key === 'active' && store.activeCount > 0" 
              class="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-bold bg-accent text-white shadow-sm">
          {{ store.activeCount }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading && store.reminders.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="skeleton-card">
        <div class="skeleton h-5 w-2/3 mb-3" />
        <div class="skeleton h-4 w-1/2 mb-2" />
        <div class="skeleton h-3 w-1/3" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="store.filtered.length === 0" class="flex flex-col items-center justify-center py-16 px-4">
      <div class="w-20 h-20 flex items-center justify-center rounded-3xl bg-accent/10 text-accent mb-6 shadow-[0_0_30px_rgba(142,125,250,0.15)] border border-accent/20">
        <Bell :size="40" />
      </div>
      <h3 class="text-xl font-bold mb-2">{{ t('reminders.empty') }}</h3>
      <p class="text-text-tertiary text-sm mb-8 max-w-[280px] text-center leading-relaxed">
        {{ t('reminders.emptyDesc') }}
      </p>
      <button @click="openCreate" class="flex items-center gap-2 px-6 py-3 rounded-full text-[0.875rem] font-bold text-white bg-accent hover:bg-accent-hover transition-all duration-200 shadow-[0_4px_16px_rgba(142,125,250,0.3)] hover:shadow-[0_6px_24px_rgba(142,125,250,0.4)] hover:-translate-y-0.5">
        <Plus :size="18" />
        {{ t('reminders.create') }}
      </button>
    </div>

    <!-- Reminders List -->
    <div v-else class="reminders-grid">
      <TransitionGroup name="reminder-card">
        <div
          v-for="reminder in store.filtered"
          :key="reminder.id"
          class="reminder-card"
          :class="[`reminder-card--${reminder.status}`]"
          @click="openEdit(reminder)"
        >
          <!-- Status & Countdown -->
          <div class="reminder-card__header">
            <div class="flex items-center gap-2">
              <component
                :is="getStatusIcon(reminder.status)"
                :size="16"
                :class="getStatusColor(reminder.status)"
              />
              <span
                v-if="reminder.status === 'active'"
                class="countdown-badge"
                :class="`countdown-badge--${store.getCountdown(reminder.eventDate).level}`"
              >
                <Timer :size="12" />
                {{ store.getCountdown(reminder.eventDate).text }}
              </span>
              <span v-else class="text-[0.6875rem] font-medium" :class="getStatusColor(reminder.status)">
                {{ reminder.status === 'completed' ? t('reminders.completed') : t('reminders.expired') }}
              </span>
            </div>
            <!-- Actions -->
            <div class="reminder-card__actions" @click.stop>
              <button
                v-if="reminder.status === 'active'"
                @click="handleComplete(reminder.id)"
                class="action-btn action-btn--check"
                :title="t('reminders.markComplete')"
              >
                <Check :size="14" />
              </button>
              <button
                @click="handleDelete(reminder.id)"
                class="action-btn action-btn--delete"
                :title="t('common.delete')"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <h3 class="reminder-card__title">{{ reminder.title }}</h3>
          <p v-if="reminder.description" class="reminder-card__desc">
            {{ reminder.description }}
          </p>
          <a
            v-if="reminder.url"
            :href="reminder.url"
            target="_blank"
            class="reminder-card__url"
            @click.stop
            title="Mở liên kết"
          >
            <Link :size="12" class="shrink-0" />
            <span class="truncate">{{ getDisplayUrl(reminder.url) }}</span>
          </a>

          <!-- Date & Offsets -->
          <div class="reminder-card__footer">
            <div class="reminder-date">
              <CalendarDays :size="13" class="text-text-disabled" />
              <span>{{ formatDate(reminder.eventDate) }}</span>
              <Clock :size="13" class="text-text-disabled ml-1" />
              <span>{{ formatTime(reminder.eventDate) }}</span>
            </div>
            <div class="reminder-offsets">
              <span
                v-for="offset in reminder.offsets"
                :key="offset"
                class="offset-pill"
              >
                {{ offsetLabels[offset] || offset }}
              </span>
            </div>
          </div>

          <!-- Meta: Repeat + Acknowledge + Source -->
          <div class="reminder-card__meta">
            <!-- Repeat badge -->
            <span
              v-if="reminder.repeatInterval && reminder.repeatInterval !== 'none'"
              class="repeat-badge"
            >
              <Repeat :size="11" />
              {{ store.getRepeatLabel(reminder.repeatInterval) }}
            </span>

            <!-- Acknowledge button (anti-forget shield) -->
            <button
              v-if="reminder.status === 'active' && !reminder.acknowledged"
              @click.stop="handleAcknowledge(reminder.id)"
              class="ack-btn"
              :title="t('reminders.markAcknowledged')"
            >
              <Eye :size="13" />
              {{ t('reminders.iRemember') }}
            </button>
            <span v-else-if="reminder.acknowledged && reminder.status === 'active'" class="ack-done">
              ✓ {{ t('reminders.remembered') }}
            </span>

            <!-- Source badge -->
            <span v-if="reminder.sourceType === 'note'" class="reminder-source">
              📝 {{ t('reminders.fromNote') }}
            </span>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- FAB (mobile) -->
    <button
      v-if="store.reminders.length > 0"
      @click="openCreate"
      class="fab pwa-fab-safe"
    >
      <Plus :size="22" />
    </button>

    <!-- Create/Edit Modal -->
    <CreateReminderModal
      v-if="showCreateModal"
      :reminder="editingReminder"
      @close="handleModalClose"
      @saved="handleModalSaved"
    />

    <!-- AI Suggestion Modal -->
    <ReminderSuggestionModal
      v-if="aiSuggestions.length > 0"
      :suggestions="aiSuggestions"
      @close="aiSuggestions = []"
      @created="() => { aiSuggestions = []; store.fetch(); }"
    />
  </div>
</template>

<style scoped>
/* ── Hero ── */
.reminders-hero {
  position: relative;
  overflow: hidden;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, rgba(142, 125, 250, 0.2), rgba(142, 125, 250, 0.05));
  padding: 2rem;
  border: 1px solid rgba(142, 125, 250, 0.2);
}
.hero-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(3rem);
}
.hero-glow--1 { right: -2.5rem; top: -2.5rem; width: 10rem; height: 10rem; background: rgba(142, 125, 250, 0.2); }
.hero-glow--2 { left: -2.5rem; bottom: -2.5rem; width: 10rem; height: 10rem; background: rgba(142, 125, 250, 0.1); }
.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.hero-create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(142, 125, 250, 0.25);
  white-space: nowrap;
  flex-shrink: 0;
}
.hero-create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(142, 125, 250, 0.35);
  background: var(--accent-hover);
}
.hero-create-btn:active {
  transform: translateY(0);
}

/* ── Filter Tabs ── */
.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.filter-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
.filter-tab--active {
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 600;
}
.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.25rem;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
}

/* ── Skeleton ── */
.skeleton-card {
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
}
.skeleton {
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
}
.empty-icon {
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background: var(--accent-subtle);
  color: var(--accent);
  margin-bottom: 1.5rem;
}
.empty-cta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(142, 125, 250, 0.25);
}
.empty-cta:hover {
  transform: translateY(-1px);
  background: var(--accent-hover);
}

/* ── Reminder Cards ── */
.reminders-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.reminder-card {
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.2s ease;
}
.reminder-card:hover {
  border-color: rgba(142, 125, 250, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}
.reminder-card:active {
  transform: translateY(0);
}
.reminder-card--completed,
.reminder-card--expired {
  opacity: 0.6;
}
.reminder-card--active {
  border-left: 3px solid var(--accent);
}
.reminder-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
}
.reminder-card__actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.reminder-card:hover .reminder-card__actions {
  opacity: 1;
}
@media (max-width: 640px) {
  .reminder-card__actions { opacity: 1; }
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-elevated);
  color: var(--text-tertiary);
}
.action-btn:hover { background: var(--bg-hover); }
.action-btn--check:hover { color: var(--success); }
.action-btn--delete:hover { color: var(--error); }

.reminder-card__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.reminder-card__desc {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-bottom: 0.75rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.reminder-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.reminder-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.reminder-offsets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.offset-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
  background: var(--accent-subtle);
  color: var(--accent);
}
.reminder-source {
  font-size: 0.6875rem;
  color: var(--text-disabled);
}

/* ── Card Meta row ── */
.reminder-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.625rem;
}
.repeat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
  background: rgba(96, 165, 250, 0.12);
  color: var(--info);
}
.ack-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.1);
  color: var(--warning);
  border: 1px solid rgba(251, 191, 36, 0.2);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ack-btn:hover {
  background: rgba(251, 191, 36, 0.18);
  border-color: rgba(251, 191, 36, 0.35);
}
.ack-done {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--success);
  opacity: 0.7;
}

/* ── Countdown Badge ── */
.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid rgba(142, 125, 250, 0.2);
}
.countdown-badge--warning {
  background: rgba(251, 191, 36, 0.15);
  color: var(--warning);
  border-color: rgba(251, 191, 36, 0.3);
}
.countdown-badge--urgent {
  background: rgba(251, 113, 133, 0.15);
  color: var(--error);
  border-color: rgba(251, 113, 133, 0.3);
  animation: urgentPulse 2s ease-in-out infinite;
}
@keyframes urgentPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ── FAB ── */
.fab {
  position: fixed;
  right: 1.25rem;
  bottom: 1.5rem;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(142, 125, 250, 0.35);
  transition: all 0.2s ease;
  z-index: 30;
}
.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(142, 125, 250, 0.45);
}
.fab:active { transform: scale(0.95); }

@media (min-width: 768px) {
  .fab { display: none; }
}

/* ── Transition ── */
.reminder-card-enter-active,
.reminder-card-leave-active {
  transition: all 0.3s ease;
}
.reminder-card-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.reminder-card-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ── Scrollbar hide ── */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
