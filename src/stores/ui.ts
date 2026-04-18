import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const searchOpen = ref(false)
  const toasts = ref<Toast[]>([])
  let toastId = 0

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

  return {
    sidebarOpen,
    searchOpen,
    toasts,
    toggleSidebar,
    toggleSearch,
    showToast,
    removeToast
  }
})
