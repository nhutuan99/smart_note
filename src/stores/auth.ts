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

  const isGuest = ref(localStorage.getItem('guest_mode') === 'true')
  const isAuthenticated = computed(() => (!!token.value && !!user.value) || isGuest.value)

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

  /** Wipes all local data except preferences. Use before login or on logout. */
  function wipeLocalData() {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !PRESERVE_ON_LOGOUT.includes(key)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  }

  function setAuth(newToken: string, newUser: User, newRefreshToken?: string) {
    // When logging in, wipe ALL previous guest/local data to start fresh.
    wipeLocalData()

    token.value = newToken
    user.value = newUser
    isGuest.value = false
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

  function startGuestMode(router: Router) {
    wipeLocalData()
    isGuest.value = true
    // Simulate a basic user profile for the UI
    user.value = {
      id: 'guest',
      email: 'guest@local.app',
      name: 'Khách',
      createdAt: new Date().toISOString(),
      hasCompletedOnboarding: true
    }
    localStorage.setItem('guest_mode', 'true')
    localStorage.setItem('guest_start_time', Date.now().toString())
    router.push('/')
  }

  function checkGuestExpiry(): boolean {
    if (!isGuest.value) return false
    const start = parseInt(localStorage.getItem('guest_start_time') || '0', 10)
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - start > sevenDays) {
      logout()
      return true // Expired
    }
    return false // Valid
  }

  /**
   * Logout: clear ALL user-specific data from localStorage.
   * Only device-level preferences (theme, locale) are preserved.
   */
  function logout() {
    token.value = null
    refreshToken.value = null
    user.value = null
    isGuest.value = false

    wipeLocalData()
  }

  function getToken(): string | null {
    return token.value
  }

  function getRefreshToken(): string | null {
    return refreshToken.value
  }

  function updateUser(updatedUser: User) {
    user.value = { ...user.value, ...updatedUser }
    if (!isGuest.value) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.value))
    }
  }

  /**
   * Check if user is authenticated. If not, redirect to /login.
   * Call this before any action that requires syncing data to server.
   * Returns true if authenticated, false if redirecting.
   */
  function guardAuth(router: Router): boolean {
    if (isAuthenticated.value) {
      if (checkGuestExpiry()) {
        router.push('/login?expired=1')
        return false
      }
      return true
    }
    router.push('/login')
    return false
  }

  async function completeOnboarding() {
    if (!user.value) return
    if (isGuest.value) {
      updateUser({ ...user.value, hasCompletedOnboarding: true })
      return
    }

    try {
      const { httpClient } = await import('@/shared/api/httpClient')
      
      // We don't await the API call so the UI feels instant.
      // httpClient automatically unwraps { success, data } responses.
      httpClient.put<User>('/api/auth/profile', { hasCompletedOnboarding: true })
        .then(updatedUser => {
          if (updatedUser) updateUser(updatedUser)
        })
        .catch(err => console.error('Failed to save onboarding state:', err))

      // Optimistic local update
      updateUser({ ...user.value, hasCompletedOnboarding: true })
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
      updateUser({ ...user.value, hasCompletedOnboarding: true })
    }
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    isGuest,
    authReady,
    setAuth,
    setTokens,
    startGuestMode,
    checkGuestExpiry,
    logout,
    getToken,
    getRefreshToken,
    updateUser,
    guardAuth,
    completeOnboarding
  }
})

