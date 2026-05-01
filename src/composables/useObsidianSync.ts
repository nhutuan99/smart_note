/**
 * Obsidian Sync Composable
 *
 * Syncs notes to/from the local Obsidian vault via Vite dev server middleware.
 * Each note is stored as a .md file with YAML frontmatter in smart_note_obsidian/notes/.
 */

export function useObsidianSync() {
  const isDev = import.meta.env.DEV

  /**
   * Sync a single note to Obsidian vault
   */
  async function syncToVault(note: {
    id: string
    title: string
    content: string
    tags: string[]
    pinned: boolean
    createdAt: string
    updatedAt: string
  }): Promise<void> {
    if (!isDev) return // Only works in dev mode with Vite server

    try {
      await fetch('/obsidian/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      })
    } catch (err) {
      console.warn('[Obsidian Sync] Failed to sync note:', err)
    }
  }

  /**
   * Delete a note from Obsidian vault
   */
  async function deleteFromVault(noteId: string): Promise<void> {
    if (!isDev) return

    try {
      await fetch(`/obsidian/delete/${noteId}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('[Obsidian Sync] Failed to delete note:', err)
    }
  }

  /**
   * List all notes from Obsidian vault
   */
  async function listFromVault(): Promise<any[]> {
    if (!isDev) return []

    try {
      const res = await fetch('/obsidian/notes')
      const data = await res.json() as any
      return data.success ? data.data : []
    } catch (err) {
      console.warn('[Obsidian Sync] Failed to list notes:', err)
      return []
    }
  }

  return { syncToVault, deleteFromVault, listFromVault }
}
