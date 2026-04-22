/**
 * useClock — Reactive live clock (HH:mm, ss, date string).
 *
 * Uses a 1-second setInterval cleaned up via onUnmounted.
 * setInterval is NOT a DOM event → useEventListener does not apply here.
 */

import { ref, computed, onMounted, onUnmounted, type ComputedRef } from 'vue'

export interface ClockState {
  /** HH:mm part of current time */
  hhmm: ComputedRef<string>
  /** ss part of current time */
  seconds: ComputedRef<string>
  /** Full localized date string (weekday, day, month, year) */
  dateStr: ComputedRef<string>
}

export function useClock(): ClockState {
  const now = ref(new Date())
  let tid = 0

  onMounted(() => {
    tid = window.setInterval(() => { now.value = new Date() }, 1000)
  })

  onUnmounted(() => window.clearInterval(tid))

  const hhmm = computed(() =>
    now.value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  )

  const seconds = computed(() =>
    now.value.toLocaleTimeString('vi-VN', { second: '2-digit', hour12: false })
  )

  const dateStr = computed(() =>
    now.value.toLocaleDateString('vi-VN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  )

  return { hhmm, seconds, dateStr }
}
