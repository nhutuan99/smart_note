// Cloudflare Pages Function: Server-side meta injection for blog pages
// This runs on the edge BEFORE the SPA loads, ensuring Google crawlers
// see proper <title>, <meta>, Open Graph, and JSON-LD for each blog post

// Type declaration for Cloudflare Pages Functions (globally available at runtime)
type PagesFunction<Env = unknown> = (context: {
  request: Request
  next: () => Promise<Response>
  params: Record<string, string>
  env: Env
}) => Promise<Response> | Response

interface BlogData {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  imageUrl?: string
  author: { name: string; email: string }
  seoMeta: { title: string; description: string; keywords: string }
  published: boolean
  createdAt: string
  updatedAt: string
}

const SITE_URL = 'https://finnote-f4n.pages.dev'
const API_URL = 'https://smart-note-api.smart-note.workers.dev'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const pathParts = url.pathname.split('/').filter(Boolean) // ['blog', 'slug']

  // Only intercept blog detail pages (not /blog itself)
  const slug = pathParts.length >= 2 ? pathParts[1] : null

  if (!slug) {
    // Blog list page — just inject list-level meta and pass through
    const response = await context.next()
    const html = await response.text()

    const listMeta = buildListMeta()
    const injectedHtml = injectMeta(html, listMeta, null)

    return new Response(injectedHtml, {
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-type': 'text/html;charset=UTF-8',
      },
    })
  }

  // Fetch blog data from API
  let blog: BlogData | null = null
  try {
    const apiRes = await fetch(`${API_URL}/api/blogs/${slug}`)
    if (apiRes.ok) {
      const json = (await apiRes.json()) as { success: boolean; data: BlogData }
      if (json.success && json.data) {
        blog = json.data
      }
    }
  } catch {
    // API fetch failed, fall through to SPA
  }

  // Get the original SPA response
  const response = await context.next()
  const html = await response.text()

  if (!blog) {
    // Blog not found — let SPA handle it
    return new Response(html, {
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'content-type': 'text/html;charset=UTF-8',
      },
    })
  }

  // Build SEO meta for this blog post
  const meta = buildBlogMeta(blog)
  // Convert markdown to simple HTML for crawlers
  const articleHtml = buildArticleHtml(blog)
  const injectedHtml = injectMeta(html, meta, articleHtml)

  return new Response(injectedHtml, {
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html;charset=UTF-8',
    },
  })
}

function buildListMeta(): string {
  return `
    <title>Blog Tài Chính | FinNote — Mẹo Quản Lý Chi Tiêu & Đầu Tư</title>
    <meta name="description" content="Blog tài chính cá nhân từ FinNote. Chia sẻ kiến thức quản lý chi tiêu, tiết kiệm, đầu tư thông minh và mẹo tài chính hữu ích cho người Việt." />
    <meta name="keywords" content="blog tài chính, quản lý chi tiêu, tiết kiệm, đầu tư, finnote, tài chính cá nhân" />
    <link rel="canonical" href="${SITE_URL}/blog" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/blog" />
    <meta property="og:title" content="Blog Tài Chính | FinNote" />
    <meta property="og:description" content="Blog tài chính cá nhân từ FinNote. Chia sẻ kiến thức quản lý chi tiêu, tiết kiệm, đầu tư thông minh." />
    <meta property="og:image" content="${SITE_URL}/images/og-cover.jpg" />
    <meta property="og:site_name" content="FinNote" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Blog Tài Chính | FinNote" />
    <meta name="twitter:description" content="Blog tài chính cá nhân từ FinNote." />
    <meta name="twitter:image" content="${SITE_URL}/images/og-cover.jpg" />
  `
}

function buildBlogMeta(blog: BlogData): string {
  const title = blog.seoMeta?.title || blog.title
  const desc = blog.seoMeta?.description || blog.excerpt
  const seoKeywords = (blog.seoMeta?.keywords || '').trim()
  const tagKeywords = (blog.tags || []).join(',')
  // Fix: avoid leading comma when seoKeywords is empty
  const keywords = [seoKeywords, tagKeywords].filter(Boolean).join(',')
  const blogUrl = `${SITE_URL}/blog/${blog.slug}`
  const image = blog.imageUrl || `${SITE_URL}/images/og-cover.jpg`
  const authorName = blog.author?.name || 'FinNote'

  const articleTags = (blog.tags || [])
    .map((tag) => `<meta property="article:tag" content="${escHtml(tag)}" />`)
    .join('\n    ')

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    image: image,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: 'FinNote',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo-512.png` },
    },
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt || blog.createdAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': blogUrl },
    keywords: (blog.tags || []).join(', '),
  })

  // Sanitize jsonLd: prevent </script> injection inside the LD+JSON block
  const safeJsonLd = jsonLd.replace(/<\//g, '<\\/')

  return `
    <title>${escHtml(title)} | FinNote Blog</title>
    <meta name="description" content="${escHtml(desc)}" />
    <meta name="keywords" content="${escHtml(keywords)}" />
    <meta name="author" content="${escHtml(authorName)}" />
    <link rel="canonical" href="${escHtml(blogUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escHtml(blogUrl)}" />
    <meta property="og:title" content="${escHtml(title)}" />
    <meta property="og:description" content="${escHtml(desc)}" />
    <meta property="og:image" content="${escHtml(image)}" />
    <meta property="og:site_name" content="FinNote Blog" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="article:published_time" content="${escHtml(blog.createdAt)}" />
    <meta property="article:author" content="${escHtml(authorName)}" />
    ${articleTags}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escHtml(title)}" />
    <meta name="twitter:description" content="${escHtml(desc)}" />
    <meta name="twitter:image" content="${escHtml(image)}" />
    <script type="application/ld+json">${safeJsonLd}</script>
  `
}

// ──────────────────────────────────────────────────────
// Lightweight Markdown → HTML converter for edge
// Only needs to handle the basics for crawler readability
// ──────────────────────────────────────────────────────
function markdownToHtml(md: string): string {
  let html = md

  // Escape HTML entities in content first (but preserve markdown syntax)
  // We'll handle this carefully per-element

  // Headings: ## H2, ### H3, #### H4
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Blockquotes: > text
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Horizontal rules: --- or ***
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr />')

  // Unordered lists: - item or * item
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')

  // Ordered lists: 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')

  // Code blocks: ```...```
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Paragraphs: wrap remaining text blocks
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      // Don't wrap blocks that are already HTML elements
      if (/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|img|div|article|section|figure)/.test(trimmed)) {
        return trimmed
      }
      return `<p>${trimmed}</p>`
    })
    .join('\n')

  // Clean up: remove empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}

function buildArticleHtml(blog: BlogData): string {
  const title = blog.seoMeta?.title || blog.title
  const authorName = blog.author?.name || 'FinNote'
  const contentHtml = markdownToHtml(blog.content || '')

  // Build a complete semantic article for crawlers
  // This will be placed inside <div id="app"> and replaced when Vue mounts
  return `
    <article itemscope itemtype="https://schema.org/Article">
      <header>
        <h1 itemprop="headline">${escHtml(title)}</h1>
        <p itemprop="description">${escHtml(blog.excerpt || '')}</p>
        <div>
          <span itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span itemprop="name">${escHtml(authorName)}</span>
          </span>
          <time itemprop="datePublished" datetime="${escHtml(blog.createdAt)}">${escHtml(blog.createdAt.split('T')[0])}</time>
        </div>
        ${blog.tags?.length ? `<div>${blog.tags.map(t => `<span>${escHtml(t)}</span>`).join(' ')}</div>` : ''}
      </header>
      ${blog.imageUrl ? `<img itemprop="image" src="${escHtml(blog.imageUrl)}" alt="${escHtml(title)}" />` : ''}
      <div itemprop="articleBody">${contentHtml}</div>
    </article>
  `
}

function injectMeta(html: string, meta: string, articleHtml: string | null): string {
  // Strategy: Replace the existing <title> and primary SEO block with blog-specific meta
  // The original index.html has:
  //   <!-- Primary SEO -->
  //   <title>FinNote - Quản Lý Tài Chính...</title>
  //   <meta name="description" .../>
  // We replace from <title> to the closing </title> and inject after

  // Replace <title>...</title>
  html = html.replace(/<title>[^<]*<\/title>/, '')

  // Replace existing description
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '')

  // Replace existing keywords
  html = html.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, '')

  // Replace existing canonical
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '')

  // Replace existing author (fix duplicate)
  html = html.replace(/<meta\s+name="author"\s+content="[^"]*"\s*\/?>/gi, '')

  // Replace existing OG tags
  html = html.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '')

  // Replace existing Twitter tags
  html = html.replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '')

  // Replace existing JSON-LD (WebApplication schema)
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, '')

  // Inject new meta right after <head> opening tags (after charset)
  html = html.replace(
    /<meta\s+charset="UTF-8"\s*\/?>/i,
    `<meta charset="UTF-8" />\n    ${meta.trim()}`
  )

  // Inject article content into <div id="app"> for crawlers
  // Vue will replace this when it mounts, so visual users won't see it
  if (articleHtml) {
    html = html.replace(
      '<div id="app"></div>',
      `<div id="app">${articleHtml}</div>`
    )
  }

  return html
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
