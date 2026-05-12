// Cloudflare Pages Function: Server-side meta injection for shared notes
import { extractExcerpt, extractFirstImage, injectMeta, escHtml } from '../../_shared/seoUtils'

type PagesFunction<Env = unknown> = (context: {
  request: Request
  next: () => Promise<Response>
  params: Record<string, string>
  env: Env
}) => Promise<Response> | Response

interface NoteData {
  id: string
  title: string
  content: string
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
interface Env {
  API_URL: string
  SITE_URL: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const noteId = pathParts.length >= 3 ? pathParts[2] : null

  if (!noteId) {
    return context.next()
  }

  const apiUrl = context.env.API_URL as string
  const siteUrl = (context.env.SITE_URL as string) || 'https://finnote-f4n.pages.dev'

  if (!apiUrl) {
    // Missing API_URL environment variable, fallback to SPA
    return context.next()
  }

  let note: NoteData | null = null
  try {
    const apiRes = await fetch(`${apiUrl}/api/notes/shared/${noteId}`)
    if (apiRes.ok) {
      note = (await apiRes.json()) as NoteData
    }
  } catch {
    // API fetch failed, fall through to SPA
  }

  const response = await context.next()
  const html = await response.text()

  if (!note) {
    return new Response(html, {
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-type': 'text/html;charset=UTF-8',
      },
    })
  }

  const meta = buildNoteMeta(note, noteId, siteUrl)
  const articleHtml = buildArticleHtml(note)
  const injectedHtml = injectMeta(html, meta, articleHtml)

  return new Response(injectedHtml, {
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html;charset=UTF-8',
    },
  })
}

function buildNoteMeta(note: NoteData, noteId: string, siteUrl: string): string {
  const title = note.title || 'Untitled Note'
  const desc = extractExcerpt(note.content, 'Shared Note on FinNote')
  const keywords = (note.tags || []).concat(['smart note', 'finnote', 'ghi chú']).join(',')
  const noteUrl = `${siteUrl}/notes/shared/${noteId}`
  const image = extractFirstImage(note.content, `${siteUrl}/images/og-cover.jpg`)

  const articleTags = (note.tags || [])
    .map((tag) => `<meta property="article:tag" content="${escHtml(tag)}" />`)
    .join('\n    ')

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    image: image,
    author: { '@type': 'Person', name: 'FinNote User' },
    publisher: {
      '@type': 'Organization',
      name: 'FinNote',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo-512.png` },
    },
    datePublished: note.createdAt,
    dateModified: note.updatedAt || note.createdAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': noteUrl },
    keywords: (note.tags || []).join(', '),
  })

  const safeJsonLd = jsonLd.replace(/<\//g, '<\\/')

  return `
    <title>${escHtml(title)} | FinNote</title>
    <meta name="description" content="${escHtml(desc)}" />
    <meta name="keywords" content="${escHtml(keywords)}" />
    <meta name="author" content="FinNote User" />
    <link rel="canonical" href="${escHtml(noteUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escHtml(noteUrl)}" />
    <meta property="og:title" content="${escHtml(title)}" />
    <meta property="og:description" content="${escHtml(desc)}" />
    <meta property="og:image" content="${escHtml(image)}" />
    <meta property="og:site_name" content="FinNote" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="article:published_time" content="${escHtml(note.createdAt)}" />
    ${articleTags}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escHtml(title)}" />
    <meta name="twitter:description" content="${escHtml(desc)}" />
    <meta name="twitter:image" content="${escHtml(image)}" />
    <script type="application/ld+json">${safeJsonLd}</script>
  `
}

function buildArticleHtml(note: NoteData): string {
  const title = note.title || 'Untitled Note'
  const desc = extractExcerpt(note.content, 'Shared Note on FinNote')
  const contentHtml = `<div>${note.content}</div>`

  return `
    <article itemscope itemtype="https://schema.org/Article">
      <header>
        <h1 itemprop="headline">${escHtml(title)}</h1>
        <p itemprop="description">${escHtml(desc)}</p>
        <div>
          <span itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span itemprop="name">FinNote User</span>
          </span>
          <time itemprop="datePublished" datetime="${escHtml(note.createdAt)}">${escHtml(note.createdAt.split('T')[0])}</time>
        </div>
        ${note.tags?.length ? `<div>${note.tags.map(t => `<span>${escHtml(t)}</span>`).join(' ')}</div>` : ''}
      </header>
      <div itemprop="articleBody">${contentHtml}</div>
    </article>
  `
}
