<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string   // ISO date: 'YYYY-MM-DD'
  label?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const { t, tm } = useI18n()

// ─── State ──────────────────────────────────────────────────────────────────
const showPicker = ref(false)
const showMonthYearPanel = ref(false)   // header click → month+year selector
const pickerRef = ref<HTMLElement | null>(null)

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear  = ref(today.getFullYear())

// Year panel navigation: show a range of years
const yearRangeStart = ref(Math.floor(today.getFullYear() / 12) * 12)

// ─── Sync view to selected value ─────────────────────────────────────────────
watch(() => props.modelValue, (val) => {
  if (val) {
    const [y, m] = val.split('-').map(Number)
    currentYear.value  = y
    currentMonth.value = m - 1
  }
}, { immediate: true })

// ─── Calendar grid ───────────────────────────────────────────────────────────
const blankDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  // Start on Monday: Sun=0→6, Mon=1→0, Tue=2→1 …
  return firstDay === 0 ? 6 : firstDay - 1
})

const daysInMonth = computed(() =>
  new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
)

// ─── Display ─────────────────────────────────────────────────────────────────
function getDisplayDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const monthNames = computed(() => tm('months') as string[])
const shortDays  = computed(() => tm('days.short') as string[])

// Start week on Monday: reorder Su→end
const weekDays = computed(() => {
  const d = [...shortDays.value]  // Sun Mon Tue … Sat
  d.push(d.shift()!)              // Mon Tue … Sat Sun
  return d
})

// ─── Navigation ──────────────────────────────────────────────────────────────
function changeMonth(step: number) {
  let m = currentMonth.value + step
  let y = currentYear.value
  if (m > 11) { m = 0; y++ }
  else if (m < 0) { m = 11; y-- }
  currentMonth.value = m
  currentYear.value  = y
}

function selectMonth(m: number) {
  currentMonth.value = m
  showMonthYearPanel.value = false
}

function selectYear(y: number) {
  currentYear.value = y
  // After picking year, fall back to month grid (don't close MonthYear panel)
  // Keep panel open so user can then pick month
}

function prevYearRange() { yearRangeStart.value -= 12 }
function nextYearRange() { yearRangeStart.value += 12 }

const yearRange = computed(() => {
  return Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i)
})

// ─── Selection ───────────────────────────────────────────────────────────────
function isSameDate(day: number) {
  if (!props.modelValue) return false
  const [y, m, d] = props.modelValue.split('-').map(Number)
  return d === day && m === currentMonth.value + 1 && y === currentYear.value
}

function isToday(day: number) {
  return day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value  === today.getFullYear()
}

function selectDate(day: number) {
  const y = currentYear.value
  const m = String(currentMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  emit('update:modelValue', `${y}-${m}-${d}`)
  showPicker.value = false
  showMonthYearPanel.value = false
}

function selectToday() {
  const d = new Date()
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().substring(0, 10)
  emit('update:modelValue', iso)
  currentMonth.value = d.getMonth()
  currentYear.value  = d.getFullYear()
  showPicker.value = false
  showMonthYearPanel.value = false
}

function clearDate() {
  emit('update:modelValue', '')
  showPicker.value = false
}

// ─── Outside-click close ─────────────────────────────────────────────────────
import { useEventListener } from '@/composables/useEventListener'
useEventListener(document, 'click', (e: MouseEvent) => {
  if (pickerRef.value && !pickerRef.value.contains(e.target as Node)) {
    showPicker.value = false
    showMonthYearPanel.value = false
  }
})

function togglePicker() {
  showPicker.value = !showPicker.value
  if (!showPicker.value) showMonthYearPanel.value = false
}

function toggleMonthYear() {
  showMonthYearPanel.value = !showMonthYearPanel.value
  // sync year range to current view
  yearRangeStart.value = Math.floor(currentYear.value / 12) * 12
}
</script>

<template>
  <div class="cdp-wrapper" ref="pickerRef">
    <!-- Label -->
    <label v-if="label" class="cdp-label">{{ label }}</label>

    <!-- Trigger button -->
    <button
      type="button"
      class="cdp-trigger"
      :class="{ 'cdp-trigger--active': showPicker }"
      @click="togglePicker"
    >
      <span class="cdp-trigger__text" :class="{ 'cdp-trigger__text--placeholder': !modelValue }">
        {{ modelValue ? getDisplayDate(modelValue) : (placeholder || t('addTx.date')) }}
      </span>
      <Calendar :size="16" class="cdp-trigger__icon" />
    </button>

    <!-- Dropdown Panel -->
    <Transition name="cdp-slide">
      <div v-if="showPicker" class="cdp-panel" @click.stop>

        <!-- ── Month/Year Header ── -->
        <div class="cdp-nav">
          <button type="button" class="cdp-nav__arrow" @click.stop="changeMonth(-1)">
            <ChevronLeft :size="15" />
          </button>

          <!-- Clickable Month+Year badge → opens panel -->
          <button
            type="button"
            class="cdp-nav__title"
            :class="{ 'cdp-nav__title--active': showMonthYearPanel }"
            @click.stop="toggleMonthYear"
          >
            {{ monthNames[currentMonth] }} {{ currentYear }}
            <ChevronDown :size="13" class="cdp-nav__caret" :class="{ 'rotate-180': showMonthYearPanel }" />
          </button>

          <button type="button" class="cdp-nav__arrow" @click.stop="changeMonth(1)">
            <ChevronRight :size="15" />
          </button>
        </div>

        <!-- ── Month+Year Picker Panel (fast jump) ── -->
        <Transition name="cdp-fade">
          <div v-if="showMonthYearPanel" class="cdp-my-panel">
            <!-- Year navigation -->
            <div class="cdp-my-panel__year-nav">
              <button type="button" class="cdp-nav__arrow cdp-nav__arrow--sm" @click.stop="prevYearRange">
                <ChevronLeft :size="13" />
              </button>
              <span class="cdp-my-panel__year-range">
                {{ yearRange[0] }} – {{ yearRange[yearRange.length - 1] }}
              </span>
              <button type="button" class="cdp-nav__arrow cdp-nav__arrow--sm" @click.stop="nextYearRange">
                <ChevronRight :size="13" />
              </button>
            </div>
            <!-- Year grid -->
            <div class="cdp-my-panel__year-grid">
              <button
                v-for="y in yearRange"
                :key="y"
                type="button"
                class="cdp-my-panel__year-btn"
                :class="{
                  'cdp-my-panel__year-btn--active': y === currentYear,
                  'cdp-my-panel__year-btn--today': y === today.getFullYear()
                }"
                @click.stop="selectYear(y)"
              >{{ y }}</button>
            </div>
            <!-- Divider -->
            <div class="cdp-my-panel__divider" />
            <!-- Month grid -->
            <div class="cdp-my-panel__month-grid">
              <button
                v-for="(m, idx) in monthNames"
                :key="idx"
                type="button"
                class="cdp-my-panel__month-btn"
                :class="{
                  'cdp-my-panel__month-btn--active': idx === currentMonth,
                  'cdp-my-panel__month-btn--today': idx === today.getMonth() && currentYear === today.getFullYear()
                }"
                @click.stop="selectMonth(idx)"
              >{{ m.substring(0, 3) }}</button>
            </div>
          </div>
        </Transition>

        <!-- ── Day Grid (shown when month/year panel is closed) ── -->
        <Transition name="cdp-fade">
          <div v-if="!showMonthYearPanel">
            <!-- Weekday headers -->
            <div class="cdp-days-header">
              <span v-for="d in weekDays" :key="d">{{ d }}</span>
            </div>
            <!-- Day buttons -->
            <div class="cdp-days-grid">
              <div v-for="b in blankDays" :key="'b' + b" />
              <button
                v-for="day in daysInMonth"
                :key="day"
                type="button"
                class="cdp-day"
                :class="{
                  'cdp-day--selected': isSameDate(day),
                  'cdp-day--today': !isSameDate(day) && isToday(day)
                }"
                @click.stop="selectDate(day)"
              >{{ day }}</button>
            </div>
          </div>
        </Transition>

        <!-- ── Footer Actions ── -->
        <div class="cdp-footer">
          <button type="button" class="cdp-footer__btn cdp-footer__btn--today" @click.stop="selectToday">
            {{ t('common.today') }}
          </button>
          <button type="button" class="cdp-footer__btn cdp-footer__btn--clear" @click.stop="clearDate">
            <X :size="11" />
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Wrapper ─────────────────────────────────────────────────────────── */
.cdp-wrapper {
  position: relative;
}

.cdp-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

/* ─── Trigger button ──────────────────────────────────────────────────── */
.cdp-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
}
.cdp-trigger:hover { border-color: var(--color-border-strong); }
.cdp-trigger--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.12);
}
.cdp-trigger__text--placeholder { color: var(--color-text-disabled); font-weight: 400; }
.cdp-trigger__icon { color: var(--color-text-tertiary); flex-shrink: 0; }

/* ─── Panel ───────────────────────────────────────────────────────────── */
.cdp-panel {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  z-index: 999;
  width: 19rem;
  max-width: calc(100vw - 2rem);
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-elevated);
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.45),
    0 4px 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255,255,255,0.04);
  backdrop-filter: blur(16px);
}

/* ─── Navigation ──────────────────────────────────────────────────────── */
.cdp-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
  gap: 0.25rem;
}

.cdp-nav__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}
.cdp-nav__arrow:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
.cdp-nav__arrow--sm { width: 1.625rem; height: 1.625rem; }

.cdp-nav__title {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}
.cdp-nav__title:hover { background: var(--color-bg-hover); }
.cdp-nav__title--active { background: var(--color-accent-subtle); color: var(--color-accent); }
.cdp-nav__caret {
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

/* ─── Month+Year panel ────────────────────────────────────────────────── */
.cdp-my-panel {
  margin-bottom: 0.5rem;
}
.cdp-my-panel__year-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 0.25rem;
}
.cdp-my-panel__year-range {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  letter-spacing: 0.03em;
}

.cdp-my-panel__year-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.625rem;
}
.cdp-my-panel__year-btn {
  padding: 0.3rem 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}
.cdp-my-panel__year-btn:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
.cdp-my-panel__year-btn--active {
  background: var(--color-accent) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(124,111,247,0.35);
}
.cdp-my-panel__year-btn--today {
  color: var(--color-accent);
  font-weight: 700;
}

.cdp-my-panel__divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 0.5rem 0;
}

.cdp-my-panel__month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}
.cdp-my-panel__month-btn {
  padding: 0.35rem 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}
.cdp-my-panel__month-btn:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
.cdp-my-panel__month-btn--active {
  background: var(--color-accent) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(124,111,247,0.3);
}
.cdp-my-panel__month-btn--today {
  color: var(--color-accent);
  font-weight: 700;
}

/* ─── Weekday headers ─────────────────────────────────────────────────── */
.cdp-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
  margin-bottom: 0.375rem;
}
.cdp-days-header span {
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-text-disabled);
  letter-spacing: 0.03em;
}

/* ─── Day grid ────────────────────────────────────────────────────────── */
.cdp-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
}

.cdp-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.12s ease;
  line-height: 1;
}
.cdp-day:hover { background: var(--color-bg-hover); }
.cdp-day--today {
  color: var(--color-accent);
  font-weight: 700;
  border: 1px solid rgba(124,111,247,0.3);
}
.cdp-day--selected {
  background: var(--color-accent) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(124,111,247,0.4);
}

/* ─── Footer ──────────────────────────────────────────────────────────── */
.cdp-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-subtle);
}
.cdp-footer__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.4rem 0;
  border-radius: 0.5rem;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cdp-footer__btn--today {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}
.cdp-footer__btn--today:hover {
  background: rgba(124,111,247,0.2);
}
.cdp-footer__btn--clear {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}
.cdp-footer__btn--clear:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

/* ─── Transitions ─────────────────────────────────────────────────────── */
.cdp-slide-enter-active { transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1); }
.cdp-slide-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.cdp-slide-enter-from { opacity: 0; transform: translateY(6px) scale(0.97); }
.cdp-slide-leave-to  { opacity: 0; transform: translateY(4px) scale(0.98); }

.cdp-fade-enter-active { transition: opacity 0.15s ease; }
.cdp-fade-leave-active { transition: opacity 0.1s ease; }
.cdp-fade-enter-from, .cdp-fade-leave-to { opacity: 0; }
</style>
