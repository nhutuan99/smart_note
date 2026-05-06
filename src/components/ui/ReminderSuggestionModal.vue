<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReminderStore } from '@/stores/reminders'
import { useUiStore } from '@/stores/ui'
import type { ReminderSuggestion } from '@/types'
import CreateReminderModal from './CreateReminderModal.vue'
import { Sparkles, Bell, X, ChevronRight, Loader } from 'lucide-vue-next'

const props = defineProps<{
  suggestions: ReminderSuggestion[]
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const { t } = useI18n()
const store = useReminderStore()
const ui = useUiStore()

const showCreateModal = ref(false)
const selectedSuggestion = ref<ReminderSuggestion | null>(null)
const creating = ref<string | null>(null)

function selectSuggestion(suggestion: ReminderSuggestion) {
  selectedSuggestion.value = suggestion
  showCreateModal.value = true
}

async function quickCreate(suggestion: ReminderSuggestion) {
  creating.value = suggestion.title
  const result = await store.create({
    title: suggestion.title,
    description: suggestion.description,
    eventDate: suggestion.eventDate,
    offsets: ['1h', '1d'],
    sourceType: 'note',
  })
  creating.value = null
  if (result) {
    ui.showToast('success', t('reminders.created'))
    emit('created')
  }
}

function handleModalSaved() {
  showCreateModal.value = false
  selectedSuggestion.value = null
  emit('created')
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
</script>

<template>
  <!-- Bottom sheet style suggestion panel -->
  <div class="suggestion-overlay">
    <div class="suggestion-sheet">
      <!-- Header -->
      <div class="sheet-header">
        <div class="flex items-center gap-2">
          <div class="ai-badge">
            <Sparkles :size="14" />
            AI
          </div>
          <span class="text-sm font-semibold">{{ t('reminders.aiDetected') }}</span>
        </div>
        <button @click="emit('close')" class="sheet-close">
          <X :size="16" />
        </button>
      </div>

      <p class="text-text-tertiary text-xs px-4 mb-3">
        {{ t('reminders.aiDetectedDesc') }}
      </p>

      <!-- Suggestions List -->
      <div class="sheet-body">
        <div
          v-for="(s, idx) in suggestions"
          :key="idx"
          class="suggestion-item"
        >
          <div class="suggestion-info" @click="selectSuggestion(s)">
            <Bell :size="14" class="text-accent shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold truncate">{{ s.title }}</div>
              <div class="text-[0.6875rem] text-text-tertiary">{{ formatDate(s.eventDate) }}</div>
              <div v-if="s.description" class="text-xs text-text-disabled mt-0.5 truncate">{{ s.description }}</div>
            </div>
            <ChevronRight :size="14" class="text-text-disabled shrink-0" />
          </div>
          <button
            @click="quickCreate(s)"
            :disabled="creating === s.title"
            class="quick-create-btn"
          >
            <Loader v-if="creating === s.title" :size="13" class="animate-spin" />
            <template v-else>+ {{ t('reminders.quickAdd') }}</template>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Full Create Modal (when user clicks to customize) -->
  <CreateReminderModal
    v-if="showCreateModal && selectedSuggestion"
    :reminder="{
      id: '',
      title: selectedSuggestion.title,
      description: selectedSuggestion.description,
      eventDate: selectedSuggestion.eventDate,
      remindAt: [],
      offsets: ['1h', '1d'],
      notifiedAt: [],
      acknowledged: false,
      lastChanceSent: false,
      sourceType: 'note' as const,
      status: 'active' as const,
      createdAt: '',
      updatedAt: ''
    }"
    @close="showCreateModal = false"
    @saved="handleModalSaved"
  />
</template>

<style scoped>
.suggestion-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: fadeIn 0.15s ease;
}

.suggestion-sheet {
  width: 100%;
  max-width: 28rem;
  max-height: 60vh;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: rgba(18, 18, 18, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (min-width: 768px) {
  .suggestion-overlay {
    align-items: center;
  }
  .suggestion-sheet {
    border-radius: var(--radius-xl);
    border-bottom: 1px solid var(--border-default);
    max-height: 70vh;
  }
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
}
.sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.sheet-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(142, 125, 250, 0.2), rgba(255, 143, 171, 0.2));
  color: var(--accent);
}

.sheet-body {
  padding: 0 1rem 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.15s ease;
}
.suggestion-item:hover { 
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(142, 125, 250, 0.3); /* subtle accent */
}

.suggestion-info {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
}

.quick-create-btn {
  align-self: flex-end;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-subtle);
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}
.quick-create-btn:hover { background: rgba(142, 125, 250, 0.2); }
.quick-create-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
