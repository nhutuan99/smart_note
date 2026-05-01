import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import type { Router } from 'vue-router'

import { AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/constants/auth'

// Keys that should SURVIVE logout (device-level preferences, not user data)
const PRESERVE_ON_LOGOUT = [
  'sn_theme',
  'sn_locale',
]

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

  // ── One-time cleanup of dead/legacy keys on app boot ──────────────────────
  ;(function cleanupLegacyKeys() {
    const LEGACY_KEYS = [
      'access_token',         // old token key
      'sn_gemini_api_key',    // API key should NEVER be in localStorage
      'sn_transactions',      // legacy offline cache
      'sn_wallets',           // legacy offline cache
      'sn_users',             // legacy offline cache
      'user_profile',         // legacy profile cache
      'pusherTransportTLS',   // 3rd party leftover
    ]
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key)
    }
    // Remove orphaned note cache keys (sn_{userId}_note_* and sn_{userId}_notes_index)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && /^sn_[a-z0-9]+_note/.test(key)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  })()

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

  /**
   * Logout: clear ALL user-specific data from localStorage.
   * Only device-level preferences (theme, locale) are preserved.
   */
  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null

    // Collect all keys, then remove everything except device preferences
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !PRESERVE_ON_LOGOUT.includes(key)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
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
