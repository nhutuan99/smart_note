import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/constants/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(AUTH_TOKEN_KEY))
  const user = ref<User | null>(
    (() => {
      try {
        const raw = localStorage.getItem(AUTH_USER_KEY)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    })()
  )

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }

  function getToken(): string | null {
    return token.value
  }

  function updateUser(updatedUser: User) {
    user.value = { ...user.value, ...updatedUser }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.value))
  }

  return {
    token,
    user,
    isAuthenticated,
    setAuth,
    logout,
    getToken,
    updateUser
  }
})
