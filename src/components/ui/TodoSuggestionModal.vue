<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTodoStore } from '@/stores/todos'
import { useUiStore } from '@/stores/ui'
import type { TodoSuggestion } from '@/types'
import { X, Clock, Sparkles, Check, ListTodo } from 'lucide-vue-next'

const props = defineProps<{
  suggestions: TodoSuggestion[]
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const { t } = useI18n()
const store = useTodoStore()
const ui = useUiStore()

const selected = ref<boolean[]>(props.suggestions.map(() => true))
const creating = ref(false)

const selectedCount = computed(() => selected.value.filter(Boolean).length)

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#06b6d4',
  low: '#22c55e',
}

const categoryEmojis: Record<string, string> = {
  work: '🏢',
  personal: '🏠',
  health: '💪',
  finance: '💰',
  study: '📚',
  other: '📌',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

async function handleConfirm() {
  creating.value = true
  let count = 0
  try {
    for (let i = 0; i < props.suggestions.length; i++) {
      if (!selected.value[i]) continue
      const s = props.suggestions[i]
      const result = await store.create({
        title: s.title,
        description: s.description,
        time: s.time,
        priority: s.priority,
        category: s.category,
      })
      if (result) count++
    }
    if (count > 0) {
      ui.showToast('success', t('aiTodo.created', { n: count }))
      emit('created')
    }
  } catch {
    ui.showToast('error', t('common.somethingWentWrong'))
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="flex items-center gap-3">
            <div class="header-icon">
              <Sparkles :size="20" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-text-primary">{{ t('aiTodo.suggestTitle') }}</h2>
              <p class="text-xs text-text-tertiary mt-0.5">{{ t('aiTodo.suggestDesc') }}</p>
            </div>
          </div>
          <button @click="emit('close')" class="close-btn">
            <X :size="18" />
          </button>
        </div>

        <!-- Suggestions List -->
        <div class="modal-body custom-scrollbar">
          <div
            v-for="(s, i) in suggestions"
            :key="i"
            class="suggest-card"
            :class="{ 'suggest-card--disabled': !selected[i] }"
            @click="selected[i] = !selected[i]"
          >
            <div class="suggest-check">
              <div
                class="check-box"
                :class="{ 'check-box--checked': selected[i] }"
              >
                <Check v-if="selected[i]" :size="12" />
              </div>
            </div>
            <div class="suggest-content">
              <div class="flex items-center gap-2 mb-1">
                <span class="suggest-time">
                  <Clock :size="11" class="opacity-60" />
                  {{ formatTime(s.time) }}
                </span>
                <span class="suggest-date">{{ formatDate(s.time) }}</span>
                <span
                  class="suggest-priority"
                  :style="{ color: priorityColors[s.priority], background: priorityColors[s.priority] + '15', borderColor: priorityColors[s.priority] + '30' }"
                >
                  {{ t(`aiTodo.priority${s.priority.charAt(0).toUpperCase() + s.priority.slice(1)}`) }}
                </span>
              </div>
              <h4 class="suggest-title">{{ s.title }}</h4>
              <p v-if="s.description" class="suggest-desc">{{ s.description }}</p>
              <span v-if="s.category" class="suggest-cat">
                {{ categoryEmojis[s.category] || '📌' }}
                {{ t(`aiTodo.cat${s.category.charAt(0).toUpperCase() + s.category.slice(1)}`) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button @click="emit('close')" class="btn-skip">
            {{ t('aiTodo.suggestSkip') }}
          </button>
          <button
            @click="handleConfirm"
            :disabled="selectedCount === 0 || creating"
            class="btn-confirm"
          >
            <ListTodo :size="16" />
            {{ creating ? t('common.saving') : t('aiTodo.suggestConfirm') }}
            <span v-if="selectedCount > 0" class="confirm-count">{{ selectedCount }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-container {
  width: 100%;
  max-width: 32rem;
  max-height: 85vh;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-default);
}
.header-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgba(6, 182, 212, 0.12);
  color: #06b6d4;
}
.close-btn {
  padding: 0.375rem;
  border-radius: 0.5rem;
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.suggest-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.2s ease;
}
.suggest-card:hover {
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.suggest-card--disabled {
  opacity: 0.4;
}
.suggest-check {
  flex-shrink: 0;
  padding-top: 0.125rem;
}
.check-box {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.375rem;
  border: 2px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: transparent;
}
.check-box--checked {
  background: #06b6d4;
  border-color: #06b6d4;
  color: white;
}
.suggest-content {
  flex: 1;
  min-width: 0;
}
.suggest-time {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.suggest-date {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
}
.suggest-priority {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  border: 1px solid;
}
.suggest-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}
.suggest-desc {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.suggest-cat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  color: var(--text-secondary);
  margin-top: 0.375rem;
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-default);
}
.btn-skip {
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-skip:hover {
  background: var(--bg-hover);
}
.btn-confirm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  background: #06b6d4;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.25);
}
.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.35);
}
.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.confirm-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.25rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.25);
}
</style>
