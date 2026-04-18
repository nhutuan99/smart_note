import { onMounted, onBeforeUnmount, type Ref, watch, unref } from 'vue'

type MaybeRef<T> = T | Ref<T>

/**
 * Vue 3 composable to register DOM event listeners with automatic cleanup.
 *
 * Replaces manual `document.addEventListener` / `removeEventListener` patterns
 * with Vue lifecycle-aware registration.
 *
 * @param target - EventTarget (e.g. document, window) or a Ref to an element
 * @param event - Event name (e.g. 'click', 'keydown')
 * @param handler - Event handler function
 * @param options - addEventListener options
 *
 * @example
 * // Listen to keydown on document
 * useEventListener(document, 'keydown', (e) => { ... })
 *
 * // Listen to click on window
 * useEventListener(window, 'click', (e) => { ... })
 *
 * // Listen on a template ref element
 * const el = ref<HTMLElement | null>(null)
 * useEventListener(el, 'scroll', (e) => { ... })
 */
export function useEventListener<K extends keyof DocumentEventMap>(
  target: MaybeRef<Document | null>,
  event: K,
  handler: (evt: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void

export function useEventListener<K extends keyof WindowEventMap>(
  target: MaybeRef<Window | null>,
  event: K,
  handler: (evt: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void

export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: MaybeRef<HTMLElement | null>,
  event: K,
  handler: (evt: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void

export function useEventListener(
  target: MaybeRef<EventTarget | null>,
  event: string,
  handler: (evt: Event) => void,
  options?: boolean | AddEventListenerOptions
): void {
  let cleanup: (() => void) | undefined

  const register = (el: EventTarget | null) => {
    // Remove previous listener if target changed
    cleanup?.()
    cleanup = undefined

    if (!el) return

    el.addEventListener(event, handler, options)
    cleanup = () => el.removeEventListener(event, handler, options)
  }

  // If target is a Ref, watch it and re-register when it changes
  if (typeof target === 'object' && target !== null && 'value' in target) {
    watch(
      () => unref(target as Ref<EventTarget | null>),
      (newTarget) => register(newTarget),
      { immediate: true }
    )
  } else {
    // Static target (document, window) — register on mount
    onMounted(() => register(target as EventTarget | null))
  }

  onBeforeUnmount(() => {
    cleanup?.()
  })
}
