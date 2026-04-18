/**
 * HTTP Client — Single source of truth for all API calls.
 *
 * Features:
 * - Auto-inject JWT token from auth store
 * - Unwrap { success, data, error } response format
 * - 401 → auto logout + redirect to /login
 * - Configurable base URL (dev proxy vs production worker)
 *
 * @see vue-expert.md §5 Repository Pattern
 */

import type { ApiResponse } from '@/types'

// In dev, Vite proxy handles /api → localhost:8787
// In production, use the full worker URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

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
    // Token expired or invalid — clear auth and redirect
    localStorage.removeItem('smart_note_token')
    localStorage.removeItem('smart_note_user')
    window.location.href = '/login'
    throw new Error('Session expired')
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
    headers: buildHeaders(false)
  })
  return handleResponse<T>(response)
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(response)
}

async function put<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: body ? JSON.stringify(body) : undefined
  })
  return handleResponse<T>(response)
}

async function del(url: string): Promise<void> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: 'DELETE',
    headers: buildHeaders(false)
  })
  await handleResponse<void>(response)
}

export const httpClient = { get, post, put, del }
