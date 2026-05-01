import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import type { Router } from 'vue-router'

import { AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/constants/auth'

const SYNC_GUIDE_KEY = 'sn_sync_guide_shown'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(AUTH_TOKEN_KEY))
  const refreshToken = ref<string | null>(localStorage.getItem(AUTH_REFRESH_TOKEN_KEY))
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

  /**
   * True once the auth state has been read from storage.
   * Since localStorage is synchronous, this is always true on creation —
   * but it gives App.vue a stable boolean to gate rendering and prevents
   * flash of authenticated layout when not logged in.
   */
  const authReady = ref(true)

  function setAuth(newToken: string, newUser: User, newRefreshToken?: string) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser))
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshToken)
    }
  }

  /** Lightweight token-only update (used by silent refresh) */
  function setTokens(newToken: string, newRefreshToken: string) {
    token.value = newToken
    refreshToken.value = newRefreshToken
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshToken)
  }

  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    // Clear tips guide cache so it resets for next session/user
    localStorage.removeItem(SYNC_GUIDE_KEY)
  }

  function getToken(): string | null {
    return token.value
  }

  function getRefreshToken(): string | null {
    return refreshToken.value
  }

  function updateUser(updatedUser: User) {
    user.value = { ...user.value, ...updatedUser }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.value))
  }

  /**
   * Check if user is authenticated. If not, redirect to /login.
   * Call this before any action that requires syncing data to server.
   * Returns true if authenticated, false if redirecting.
   */
  function guardAuth(router: Router): boolean {
    if (isAuthenticated.value) return true
    router.push('/login')
    return false
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    authReady,
    setAuth,
    setTokens,
    logout,
    getToken,
    getRefreshToken,
    updateUser,
    guardAuth
  }
})
