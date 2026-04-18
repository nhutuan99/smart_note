import { useAuthStore } from '@/stores/auth'
import type { Note, NoteListItem, User } from '@/types'

interface AuthPayload {
  email: string
  password: string
  name?: string
}

interface AuthResponse {
  token: string
  user: User
}

/**
 * API composable - Currently uses localStorage as mock backend.
 * When Cloudflare Worker + R2 is deployed, just update the methods
 * to call fetch('/api/...') instead.
 */

const STORAGE_PREFIX = 'sn_'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function getStorageKey(key: string): string {
  const auth = useAuthStore()
  return `${STORAGE_PREFIX}${auth.user?.id || 'anon'}_${key}`
}

function getFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getStorageKey(key))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setToStorage<T>(key: string, data: T): void {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data))
}

function removeFromStorage(key: string): void {
  localStorage.removeItem(getStorageKey(key))
}

export function useApi() {
  async function get<T>(url: string): Promise<T | null> {
    // Mock: parse URL to determine what data to return
    if (url === '/api/notes') {
      const notes = getFromStorage<NoteListItem[]>('notes_index') || []
      return notes as unknown as T
    }
    if (url.startsWith('/api/notes/')) {
      const id = url.split('/').pop()
      const note = getFromStorage<Note>(`note_${id}`)
      return note as unknown as T
    }
    if (url === '/api/user/profile') {
      const auth = useAuthStore()
      return auth.user as unknown as T
    }
    return null
  }

  async function post<T>(url: string, body?: unknown): Promise<T | null> {
    if (url === '/api/auth/login') {
      return handleLogin(body as AuthPayload) as unknown as T
    }
    if (url === '/api/auth/register') {
      return handleRegister(body as AuthPayload) as unknown as T
    }
    if (url === '/api/notes') {
      return handleCreateNote(body as Partial<Note>) as unknown as T
    }
    return null
  }

  async function put<T>(url: string, body?: unknown): Promise<T | null> {
    if (url.startsWith('/api/notes/')) {
      const id = url.split('/').pop()!
      return handleUpdateNote(id, body as Partial<Note>) as unknown as T
    }
    return null
  }

  async function del(url: string): Promise<void> {
    if (url.startsWith('/api/notes/')) {
      const id = url.split('/').pop()!
      handleDeleteNote(id)
    }
  }

  // === Mock Auth ===

  function handleLogin(payload: AuthPayload): AuthResponse | null {
    const usersRaw = localStorage.getItem(`${STORAGE_PREFIX}users`)
    const users: Record<string, { id: string; email: string; name: string; password: string }> =
      usersRaw ? JSON.parse(usersRaw) : {}

    const user = Object.values(users).find((u) => u.email === payload.email)
    if (!user || user.password !== payload.password) {
      throw new Error('Invalid email or password')
    }

    return {
      token: 'mock_jwt_' + user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date().toISOString()
      }
    }
  }

  function handleRegister(payload: AuthPayload): AuthResponse | null {
    const usersRaw = localStorage.getItem(`${STORAGE_PREFIX}users`)
    const users: Record<string, { id: string; email: string; name: string; password: string }> =
      usersRaw ? JSON.parse(usersRaw) : {}

    if (Object.values(users).some((u) => u.email === payload.email)) {
      throw new Error('Email already exists')
    }

    const id = generateId()
    users[id] = {
      id,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      password: payload.password
    }
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users))

    return {
      token: 'mock_jwt_' + id,
      user: {
        id,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        createdAt: new Date().toISOString()
      }
    }
  }

  // === Mock Notes CRUD ===

  function handleCreateNote(data: Partial<Note>): Note {
    const id = generateId()
    const now = new Date().toISOString()
    const note: Note = {
      id,
      title: data.title || 'Untitled',
      content: data.content || '',
      tags: data.tags || [],
      pinned: data.pinned || false,
      createdAt: now,
      updatedAt: now
    }

    setToStorage(`note_${id}`, note)

    // Update index
    const index = getFromStorage<NoteListItem[]>('notes_index') || []
    index.push({
      id: note.id,
      title: note.title,
      excerpt: note.content.substring(0, 120),
      tags: note.tags,
      pinned: note.pinned,
      updatedAt: note.updatedAt
    })
    setToStorage('notes_index', index)

    return note
  }

  function handleUpdateNote(id: string, updates: Partial<Note>): Note | null {
    const note = getFromStorage<Note>(`note_${id}`)
    if (!note) return null

    const updated: Note = {
      ...note,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    }
    setToStorage(`note_${id}`, updated)

    // Update index
    const index = getFromStorage<NoteListItem[]>('notes_index') || []
    const idx = index.findIndex((n) => n.id === id)
    if (idx !== -1) {
      index[idx] = {
        id: updated.id,
        title: updated.title,
        excerpt: updated.content.substring(0, 120),
        tags: updated.tags,
        pinned: updated.pinned,
        updatedAt: updated.updatedAt
      }
      setToStorage('notes_index', index)
    }

    return updated
  }

  function handleDeleteNote(id: string): void {
    removeFromStorage(`note_${id}`)
    const index = getFromStorage<NoteListItem[]>('notes_index') || []
    setToStorage(
      'notes_index',
      index.filter((n) => n.id !== id)
    )
  }

  return { get, post, put, del }
}
