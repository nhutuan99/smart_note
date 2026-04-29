import { Env, UserData, NoteData, TransactionData, WalletData, NotificationData, PendingNotification, BudgetData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId, hashPassword } from '../utils/crypto'
import { createJWT } from '../utils/jwt'
import { getJSON, putJSON } from '../services/kv.service'

// ====== Note Handlers ======

export async function handleListNotes(userId: string, env: Env): Promise<Response> {
  const index = await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )
  return jsonResponse({ success: true, data: index?.notes || [] })
}

export async function handleGetNote(userId: string, noteId: string, env: Env): Promise<Response> {
  const note = await getJSON<NoteData>(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`)
  if (!note) return errorResponse('Note not found', 404)
  return jsonResponse({ success: true, data: note })
}

export async function handleCreateNote(userId: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any
  const id = generateId()
  const now = new Date().toISOString()
  const note: NoteData = {
    id,
    title: body.title || 'Untitled',
    content: body.content || '',
    tags: body.tags || [],
    pinned: body.pinned || false,
    createdAt: now,
    updatedAt: now
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${id}`, note)

  const index = (await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )) || { notes: [] }
  index.notes.push({
    id: note.id,
    title: note.title,
    excerpt: note.content.substring(0, 120),
    tags: note.tags,
    pinned: note.pinned,
    updatedAt: note.updatedAt
  })
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index)

  return jsonResponse({ success: true, data: note }, 201)
}

export async function handleUpdateNote(
  userId: string,
  noteId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const existing = await getJSON<NoteData>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/${noteId}`
  )
  if (!existing) return errorResponse('Note not found', 404)

  const body = (await request.json()) as any
  const updated: NoteData = {
    ...existing,
    ...body,
    id: noteId,
    updatedAt: new Date().toISOString()
  }

  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`, updated)

  const index = (await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )) || { notes: [] }
  const idx = index.notes.findIndex((n: any) => n.id === noteId)
  if (idx !== -1) {
    index.notes[idx] = {
      id: updated.id,
      title: updated.title,
      excerpt: updated.content.substring(0, 120),
      tags: updated.tags,
      pinned: updated.pinned,
      updatedAt: updated.updatedAt
    }
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index)
  }

  return jsonResponse({ success: true, data: updated })
}

export async function handleDeleteNote(userId: string, noteId: string, env: Env): Promise<Response> {
  await env.SMART_NOTE_KV.delete(`users/${userId}/notes/${noteId}`)

  const index = (await getJSON<{ notes: any[] }>(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  )) || { notes: [] }
  index.notes = index.notes.filter((n: any) => n.id !== noteId)
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index)

  return jsonResponse({ success: true })
}

