import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const searchOpen = ref(false)
  const toasts = ref<Toast[]>([])
  let toastId = 0

  const confirmState = ref<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null
  })

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function toggleSearch() {
    searchOpen.value = !searchOpen.value
  }

  function showToast(type: Toast['type'], message: string, duration = 4000) {
    const id = ++toastId
    toasts.value.push({ id, type, message })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function requestConfirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmState.value = {
        isOpen: true,
        options,
        resolve
      }
    })
  }

  function resolveConfirm(result: boolean) {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(result)
    }
    confirmState.value.isOpen = false
    // Delay clearing options to prevent UI flash during fade-out
    setTimeout(() => {
       confirmState.value.resolve = null
    }, 200)
  }

  return {
    sidebarOpen,
    searchOpen,
    toasts,
    confirmState,
    toggleSidebar,
    toggleSearch,
    showToast,
    removeToast,
    requestConfirm,
    resolveConfirm
  }
})
