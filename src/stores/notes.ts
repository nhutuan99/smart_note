import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Note, NoteListItem, NoteFilter, ViewMode } from '@/types'
import { httpClient } from '@/shared/api/httpClient'
import { useObsidianSync } from '@/composables/useObsidianSync'
import { AUTH_TOKEN_KEY } from '@/constants/auth'

export const useNotesStore = defineStore('notes', () => {
  const obsidian = useObsidianSync()
  obsidian.init()

  const notes = ref<NoteListItem[]>([])
  const currentNote = ref<Note | null>(null)
  const loading = ref(false)
  const filter = ref<NoteFilter>('all')
  const searchQuery = ref('')
  const viewMode = ref<ViewMode>('grid')

  // ── Computed ──

  const filteredNotes = computed(() => {
    let result = [...notes.value]

    if (filter.value === 'pinned') {
      result = result.filter((n) => n.pinned)
    } else if (filter.value === 'recent') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      result = result.filter((n) => new Date(n.updatedAt) >= weekAgo)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return result
  })

  const totalNotes = computed(() => notes.value.length)
  const pinnedCount = computed(() => notes.value.filter((n) => n.pinned).length)
  const allTags = computed(() => {
    const tagSet = new Set<string>()
    notes.value.forEach((n) => n.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  })

  // ── Actions ──

  async function fetchNotes() {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
    loading.value = true
    try {
      const data = await httpClient.get<NoteListItem[]>('/api/notes')
      notes.value = data || []
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchNote(id: string) {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return null
    loading.value = true
    try {
      const data = await httpClient.get<Note>(`/api/notes/${id}`)
      currentNote.value = data || null
      return data
    } catch (err) {
      console.error('Failed to fetch note:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createNote(note: Partial<Note>): Promise<Note | null> {
    try {
      const data = await httpClient.post<Note>('/api/notes', note)
      if (data) {
        await fetchNotes()
        // Sync to Obsidian vault
        await obsidian.syncToVault(data)
      }
      return data || null
    } catch (err) {
      console.error('Failed to create note:', err)
      return null
    }
  }

  async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    try {
      const data = await httpClient.put<Note>(`/api/notes/${id}`, updates)
      if (data) {
        currentNote.value = data
        const idx = notes.value.findIndex((n) => n.id === id)
        if (idx !== -1) {
          notes.value[idx] = {
            ...notes.value[idx],
            title: data.title,
            excerpt: data.content.substring(0, 120),
            tags: data.tags,
            pinned: data.pinned,
            updatedAt: data.updatedAt
          }
        }
        // Sync to Obsidian vault
        await obsidian.syncToVault(data)
      }
      return data || null
    } catch (err) {
      console.error('Failed to update note:', err)
      return null
    }
  }

  async function updateNoteShare(id: string, isPublic: boolean, sharedWith: string[]): Promise<boolean> {
    try {
      const data = await httpClient.post<Note>(`/api/notes/${id}/share`, { isPublic, sharedWith })
      if (data && currentNote.value?.id === id) {
        currentNote.value.isPublic = data.isPublic
        currentNote.value.sharedWith = data.sharedWith
      }
      return true
    } catch (err) {
      console.error('Failed to update share settings:', err)
      return false
    }
  }

  async function deleteNote(id: string): Promise<boolean> {
    try {
      await httpClient.del(`/api/notes/${id}`)
      notes.value = notes.value.filter((n) => n.id !== id)
      if (currentNote.value?.id === id) {
        currentNote.value = null
      }
      // Delete from Obsidian vault
      await obsidian.deleteFromVault(id)
      return true
    } catch (err) {
      console.error('Failed to delete note:', err)
      return false
    }
  }

  async function togglePin(id: string) {
    const note = notes.value.find((n) => n.id === id)
    if (note) {
      await updateNote(id, { pinned: !note.pinned })
    }
  }

  return {
    notes,
    currentNote,
    loading,
    filter,
    searchQuery,
    viewMode,
    filteredNotes,
    totalNotes,
    pinnedCount,
    allTags,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    updateNoteShare,
    deleteNote,
    togglePin,
    obsidian
  }
})
