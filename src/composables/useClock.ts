/**
 * useClock — Reactive live clock (HH:mm, ss, date string).
 *
 * Uses a 1-second setInterval cleaned up via onUnmounted.
 * setInterval is NOT a DOM event → useEventListener does not apply here.
 */

import { ref, computed, onMounted, onUnmounted, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export interface ClockState {
  /** HH:mm part of current time */
  hhmm: ComputedRef<string>
  /** ss part of current time */
  seconds: ComputedRef<string>
  /** Full localized date string (weekday, day, month, year) */
  dateStr: ComputedRef<string>
}

export function useClock(): ClockState {
  const { locale } = useI18n()
  const lang = computed(() => locale.value === 'vi' ? 'vi-VN' : 'en-US')
  const now = ref(new Date())
  let tid = 0

  onMounted(() => {
    tid = window.setInterval(() => { now.value = new Date() }, 1000)
  })

  onUnmounted(() => window.clearInterval(tid))

  const hhmm = computed(() =>
    now.value.toLocaleTimeString(lang.value, { hour: '2-digit', minute: '2-digit', hour12: false })
  )

  const seconds = computed(() =>
    now.value.toLocaleTimeString(lang.value, { second: '2-digit', hour12: false })
  )

  const dateStr = computed(() =>
    now.value.toLocaleDateString(lang.value, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  )

  return { hhmm, seconds, dateStr }
}
