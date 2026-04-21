/**
 * HTTP Client — Single source of truth for all API calls.
 *
 * Features:
 * - Auto-inject JWT token from auth store
 * - Unwrap { success, data, error } response format
 * - 401 → cancel all in-flight requests, then navigate to /login via Vue Router
 * - Configurable base URL (dev proxy vs production worker)
 *
 * @see vue-expert.md §5 Repository Pattern
 */

import type { ApiResponse } from '@/types'
import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// In dev, Vite proxy handles /api → localhost:8787
// In production, use the full worker URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ── 401 handling state ────────────────────────────────────────────────────────

let _router: Router | null = null
let _isHandling401 = false

/** Call once from main.ts after router is created. */
export function setHttpClientRouter(router: Router) {
  _router = router
}

// AbortController to cancel all in-flight requests on 401
let _abortController = new AbortController()

function cancelAllRequests() {
  _abortController.abort()
  _abortController = new AbortController() // reset for future requests
}

function handle401() {
  if (_isHandling401) return
  _isHandling401 = true

  // Cancel all in-flight requests immediately
  cancelAllRequests()

  // Clear auth: MUST call logout() to clear Pinia reactive state,
  // not just localStorage — otherwise router guard still sees isAuthenticated=true
  // and redirects away from /login → black screen redirect loop.
  try {
    const auth = useAuthStore()
    auth.logout()
  } catch {
    // Fallback if Pinia not ready
    localStorage.removeItem('smart_note_token')
    localStorage.removeItem('smart_note_user')
  }

  // Navigate via Vue Router (SPA-safe, no page reload)
  if (_router) {
    _router.push('/login').finally(() => {
      _isHandling401 = false
    })
  } else {
    // Fallback if router not injected yet
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    _isHandling401 = false
  }
}

// ── Core ──────────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('smart_note_token')
}

function buildHeaders(hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {}
  const token = getToken()

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handle401()
    throw new Error('Session expired')
  }

  // Handle non-JSON error responses (e.g. 500 plain text from worker)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`Request failed (${response.status})`)
  }

  const json: ApiResponse<T> = await response.json()

  if (!json.success) {
    throw new Error(json.error || `Request failed (${response.status})`)
  }

  return json.data as T
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'GET',
    headers: buildHeaders(false),
    signal: _abortController.signal
  })
  return handleResponse<T>(response)
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
    signal: _abortController.signal
  })
  return handleResponse<T>(response)
}

async function put<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
    signal: _abortController.signal
  })
  return handleResponse<T>(response)
}

async function del(url: string): Promise<void> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
    signal: _abortController.signal
  })
  await handleResponse<void>(response)
}

export const httpClient = { get, post, put, del }
