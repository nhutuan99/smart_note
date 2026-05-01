import { ref } from 'vue'
import { get, set, del } from 'idb-keyval'

/**
 * Obsidian Sync Composable
 *
 * Uses the Web File System Access API to directly read/write Markdown files
 * to the user's local Obsidian vault directory.
 */

const VAULT_HANDLE_KEY = 'obsidian_vault_handle'

export function useObsidianSync() {
  const isConnected = ref(false)
  let directoryHandle: FileSystemDirectoryHandle | null = null

  /**
   * Request permission for an existing handle
   */
  async function verifyPermission(handle: any, withWrite: boolean = true): Promise<boolean> {
    const opts = { mode: withWrite ? 'readwrite' : 'read' }
    if ((await handle.queryPermission(opts)) === 'granted') {
      return true
    }
    if ((await handle.requestPermission(opts)) === 'granted') {
      return true
    }
    return false
  }

  /**
   * Initialize from IndexedDB
   */
  async function init(): Promise<void> {
    try {
      const handle = await get<any>(VAULT_HANDLE_KEY)
      if (handle) {
        if (await verifyPermission(handle)) {
          directoryHandle = handle
          isConnected.value = true
        }
      }
    } catch (err) {
      console.warn('[Obsidian Sync] Init failed:', err)
    }
  }

  /**
   * Connect to a local folder via File System Access API
   */
  async function connectVault(): Promise<boolean> {
    try {
      if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API is not supported in this browser (Safari/iOS).')
      }
      const showPicker = (window as any).showDirectoryPicker.bind(window)
      const handle = await showPicker({ mode: 'readwrite' })
      await set(VAULT_HANDLE_KEY, handle)
      directoryHandle = handle
      isConnected.value = true
      return true
    } catch (err) {
      console.error('[Obsidian Sync] Connect failed:', err)
      return false
    }
  }

  /**
   * Disconnect the vault
   */
  async function disconnectVault(): Promise<void> {
    await del(VAULT_HANDLE_KEY)
    directoryHandle = null
    isConnected.value = false
  }

  function sanitizeFilename(title: string): string {
    return (
      title
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100) || 'Untitled'
    )
  }

  function noteToMarkdown(meta: any, content: string): string {
    const frontmatter = [
      '---',
      `id: "${meta.id}"`,
      `title: "${meta.title.replace(/"/g, '\\"')}"`,
      `tags: [${(meta.tags || []).map((t: string) => `"${t}"`).join(', ')}]`,
      `pinned: ${!!meta.pinned}`,
      `created: ${meta.createdAt}`,
      `updated: ${meta.updatedAt}`,
      '---',
      ''
    ].join('\n')
    return frontmatter + content
  }

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
    if (!directoryHandle || !isConnected.value) return

    try {
      await verifyPermission(directoryHandle)
      
      // Attempt to delete old file if title changed (naive approach, typically we'd search by ID)
      // For performance, we'll just write the new file and ignore renaming old ones for now
      // since the File System Access API doesn't easily allow full-text search without reading all files.
      
      const filename = `${sanitizeFilename(note.title)}.md`
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true })
      
      const writable = await fileHandle.createWritable()
      const md = noteToMarkdown(note, note.content || '')
      await writable.write(md)
      await writable.close()
    } catch (err) {
      console.warn('[Obsidian Sync] Failed to sync note:', err)
    }
  }

  /**
   * Delete a note from Obsidian vault
   */
  async function deleteFromVault(noteId: string): Promise<void> {
    if (!directoryHandle || !isConnected.value) return

    try {
      await verifyPermission(directoryHandle)
      // Since we don't know the exact filename without reading all files, 
      // full delete by ID requires iterating. This can be slow, but necessary.
      // @ts-ignore
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile()
          const text = await file.text()
          if (text.includes(`id: "${noteId}"`)) {
            await directoryHandle.removeEntry(entry.name)
            break
          }
        }
      }
    } catch (err) {
      console.warn('[Obsidian Sync] Failed to delete note:', err)
    }
  }

  /**
   * List all notes from Obsidian vault
   */
  async function listFromVault(): Promise<any[]> {
    if (!directoryHandle || !isConnected.value) return []

    try {
      await verifyPermission(directoryHandle, false)
      const notes = []
      // @ts-ignore
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          // You could parse the file here if needed
          notes.push({ filename: entry.name })
        }
      }
      return notes
    } catch (err) {
      console.warn('[Obsidian Sync] Failed to list notes:', err)
      return []
    }
  }

  return { init, connectVault, disconnectVault, isConnected, syncToVault, deleteFromVault, listFromVault }
}
