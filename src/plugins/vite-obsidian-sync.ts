import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

/**
 * Vite Plugin: Obsidian Sync
 *
 * Adds dev server API routes to read/write .md files to the Obsidian vault.
 * Notes are stored as Markdown with YAML frontmatter for Obsidian compatibility.
 */

const VAULT_PATH = path.resolve(__dirname, '../smart_note_obsidian')
const NOTES_DIR = path.join(VAULT_PATH, 'notes')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
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

interface NoteMeta {
  id: string
  title: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

function noteToMarkdown(meta: NoteMeta, content: string): string {
  const frontmatter = [
    '---',
    `id: "${meta.id}"`,
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `tags: [${meta.tags.map((t) => `"${t}"`).join(', ')}]`,
    `pinned: ${meta.pinned}`,
    `created: ${meta.createdAt}`,
    `updated: ${meta.updatedAt}`,
    '---',
    ''
  ].join('\n')

  return frontmatter + content
}

function parseMarkdown(raw: string): { meta: NoteMeta; content: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null

  const yaml = match[1]
  const content = match[2].trim()

  const get = (key: string) => {
    const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : ''
  }

  const tagsMatch = yaml.match(/tags:\s*\[(.*?)\]/)
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(',')
        .map((t) => t.trim().replace(/"/g, ''))
        .filter(Boolean)
    : []

  return {
    meta: {
      id: get('id').replace(/"/g, ''),
      title: get('title').replace(/"/g, ''),
      tags,
      pinned: get('pinned') === 'true',
      createdAt: get('created'),
      updatedAt: get('updated')
    },
    content
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => resolve(body))
  })
}

export default function obsidianSync(): Plugin {
  return {
    name: 'obsidian-sync',
    configureServer(server: ViteDevServer) {
      // Ensure notes directory
      ensureDir(NOTES_DIR)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

        // === LIST all notes from Obsidian vault ===
        if (url === '/obsidian/notes' && req.method === 'GET') {
          try {
            ensureDir(NOTES_DIR)
            const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'))
            const notes = files
              .map((f) => {
                const raw = fs.readFileSync(path.join(NOTES_DIR, f), 'utf-8')
                const parsed = parseMarkdown(raw)
                if (!parsed) return null
                return {
                  ...parsed.meta,
                  excerpt: parsed.content.substring(0, 120),
                  filename: f
                }
              })
              .filter(Boolean)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, data: notes }))
          } catch (err: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
          return
        }

        // === SYNC a note TO Obsidian vault ===
        if (url === '/obsidian/sync' && req.method === 'POST') {
          try {
            const body = JSON.parse(await readBody(req))
            const { id, title, content, tags, pinned, createdAt, updatedAt } = body

            ensureDir(NOTES_DIR)

            // Remove old file with same id (title might have changed)
            const existingFiles = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'))
            for (const f of existingFiles) {
              const raw = fs.readFileSync(path.join(NOTES_DIR, f), 'utf-8')
              const parsed = parseMarkdown(raw)
              if (parsed?.meta.id === id) {
                fs.unlinkSync(path.join(NOTES_DIR, f))
                break
              }
            }

            // Write new file
            const filename = `${sanitizeFilename(title)}.md`
            const md = noteToMarkdown(
              { id, title, tags: tags || [], pinned: pinned || false, createdAt, updatedAt },
              content || ''
            )
            fs.writeFileSync(path.join(NOTES_DIR, filename), md, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, filename }))
          } catch (err: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
          return
        }

        // === DELETE a note from Obsidian vault ===
        if (url.startsWith('/obsidian/delete/') && req.method === 'DELETE') {
          try {
            const noteId = url.split('/obsidian/delete/')[1]
            ensureDir(NOTES_DIR)
            const files = fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'))
            for (const f of files) {
              const raw = fs.readFileSync(path.join(NOTES_DIR, f), 'utf-8')
              const parsed = parseMarkdown(raw)
              if (parsed?.meta.id === noteId) {
                fs.unlinkSync(path.join(NOTES_DIR, f))
                break
              }
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (err: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
          return
        }

        next()
      })
    }
  }
}
