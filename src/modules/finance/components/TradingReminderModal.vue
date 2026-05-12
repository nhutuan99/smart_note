<script setup lang="ts">
// 1. Vue core
import { ref, computed } from 'vue'
// 2. Vue ecosystem
import { useI18n } from 'vue-i18n'
// 3. Stores
import { useTradingStore } from '@/stores/trading'
import { useUiStore } from '@/stores/ui'
// 4. Icons
import { X, Bell, BellOff, Clock, Check } from 'lucide-vue-next'

const { t } = useI18n()
const trading = useTradingStore()
const ui = useUiStore()

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

// ── Time selection state ──
const PRESET_TIMES = ['19:00', '20:00', '21:00', '22:00']

const selectedTime = ref<string>(trading.reminderTime ?? '21:00')
const isSaving = ref(false)

// Sync selected time when the modal opens
function onOpen() {
  selectedTime.value = trading.reminderTime ?? '21:00'
}

function close() {
  emit('update:modelValue', false)
}

// Whether the currently selected time differs from what is saved
const isDirty = computed(() => selectedTime.value !== (trading.reminderTime ?? null))

async function save() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const ok = await trading.saveReminderTime(selectedTime.value)
    if (ok) {
      ui.showToast('success', t('trading.reminderSaved', { time: selectedTime.value }))
      close()
    } else {
      ui.showToast('error', t('trading.reminderSaveError'))
    }
  } finally {
    isSaving.value = false
  }
}

async function turnOff() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const ok = await trading.saveReminderTime(null)
    if (ok) {
      ui.showToast('success', t('trading.reminderDisabled'))
      close()
    } else {
      ui.showToast('error', t('trading.reminderSaveError'))
    }
  } finally {
    isSaving.value = false
  }
}

/** Format "HH:MM" → "HH giờ MM phút" for display */
function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return m === '00' ? `${h}:00` : `${h}:${m}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" @after-enter="onOpen">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <div
          class="relative z-10 w-full sm:max-w-sm bg-bg-surface rounded-t-2xl sm:rounded-2xl border border-border-default shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-modal-title"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Bell :size="16" class="text-accent" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 id="reminder-modal-title" class="text-sm font-bold text-text-primary">
                {{ t('trading.reminderTitle') }}
              </h2>
              <p class="text-[11px] text-text-tertiary">{{ t('trading.reminderDesc') }}</p>
            </div>
            <button
              @click="close"
              class="flex h-7 w-7 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
              :aria-label="t('common.close')"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-5 space-y-4">

            <!-- Current status badge -->
            <div
              class="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border text-sm"
              :class="trading.reminderTime
                ? 'border-accent/30 bg-accent/5 text-accent'
                : 'border-border-default bg-bg-elevated text-text-tertiary'"
            >
              <Bell v-if="trading.reminderTime" :size="14" />
              <BellOff v-else :size="14" />
              <span class="font-medium">
                {{
                  trading.reminderTime
                    ? t('trading.reminderActive', { time: trading.reminderTime })
                    : t('trading.reminderOff')
                }}
              </span>
            </div>

            <!-- Preset time buttons -->
            <div class="space-y-2">
              <p class="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                {{ t('trading.reminderPresets') }}
              </p>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="preset in PRESET_TIMES"
                  :key="preset"
                  @click="selectedTime = preset"
                  class="relative flex flex-col items-center justify-center py-2.5 rounded-xl border text-sm font-semibold transition-all"
                  :class="selectedTime === preset
                    ? 'border-accent bg-accent text-white shadow-sm shadow-accent/25'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent/50 hover:text-accent'"
                >
                  <Clock :size="13" class="mb-0.5 opacity-70" />
                  {{ formatTime(preset) }}
                </button>
              </div>
            </div>

            <!-- Custom time input -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide flex items-center gap-1">
                <Clock :size="11" />
                {{ t('trading.reminderCustom') }}
              </label>
              <input
                v-model="selectedTime"
                type="time"
                class="w-full rounded-xl border border-border-default bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 pb-5 flex flex-col gap-2">
            <!-- Save button -->
            <button
              @click="save"
              :disabled="isSaving"
              class="w-full btn-primary justify-center py-2.5 disabled:opacity-40"
            >
              <span v-if="isSaving" class="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <template v-else>
                <Check :size="15" />
                <span>{{ t('common.save') }} — {{ formatTime(selectedTime) }}</span>
              </template>
            </button>

            <!-- Turn off (only if currently active) -->
            <button
              v-if="trading.reminderTime"
              @click="turnOff"
              :disabled="isSaving"
              class="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border-default py-2.5 text-sm text-text-tertiary hover:text-error hover:border-error/40 transition-colors disabled:opacity-40"
            >
              <BellOff :size="13" />
              {{ t('trading.reminderTurnOff') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 200ms ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative {
  transform: translateY(20px);
}
</style>
