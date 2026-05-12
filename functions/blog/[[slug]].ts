// Cloudflare Pages Function: Server-side meta injection for blog pages
// This runs on the edge BEFORE the SPA loads, ensuring Google crawlers
// see proper <title>, <meta>, Open Graph, and JSON-LD for each blog post
import { injectMeta, escHtml } from '../_shared/seoUtils'

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

interface Env {
  API_URL: string
  SITE_URL: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const pathParts = url.pathname.split('/').filter(Boolean) // ['blog', 'slug']

  // Only intercept blog detail pages (not /blog itself)
  const slug = pathParts.length >= 2 ? pathParts[1] : null

  const apiUrl = context.env.API_URL as string
  const siteUrl = (context.env.SITE_URL as string) || 'https://finnote-f4n.pages.dev'

  if (!apiUrl) {
    return context.next()
  }

  if (!slug) {
    // Blog list page — just inject list-level meta and pass through
    const response = await context.next()
    const html = await response.text()

    const listMeta = buildListMeta(siteUrl)
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
    const apiRes = await fetch(`${apiUrl}/api/blogs/${slug}`)
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
  const meta = buildBlogMeta(blog, siteUrl)
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

function buildListMeta(siteUrl: string): string {
  return `
    <title>Blog Tài Chính | FinNote — Mẹo Quản Lý Chi Tiêu & Đầu Tư</title>
    <meta name="description" content="Blog tài chính cá nhân từ FinNote. Chia sẻ kiến thức quản lý chi tiêu, tiết kiệm, đầu tư thông minh và mẹo tài chính hữu ích cho người Việt." />
    <meta name="keywords" content="blog tài chính, quản lý chi tiêu, tiết kiệm, đầu tư, finnote, tài chính cá nhân" />
    <link rel="canonical" href="${siteUrl}/blog" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${siteUrl}/blog" />
    <meta property="og:title" content="Blog Tài Chính | FinNote" />
    <meta property="og:description" content="Blog tài chính cá nhân từ FinNote. Chia sẻ kiến thức quản lý chi tiêu, tiết kiệm, đầu tư thông minh." />
    <meta property="og:image" content="${siteUrl}/images/og-cover.jpg" />
    <meta property="og:site_name" content="FinNote" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Blog Tài Chính | FinNote" />
    <meta name="twitter:description" content="Blog tài chính cá nhân từ FinNote." />
    <meta name="twitter:image" content="${siteUrl}/images/og-cover.jpg" />
  `
}

function buildBlogMeta(blog: BlogData, siteUrl: string): string {
  const title = blog.seoMeta?.title || blog.title
  const desc = blog.seoMeta?.description || blog.excerpt
  const seoKeywords = (blog.seoMeta?.keywords || '').trim()
  const tagKeywords = (blog.tags || []).join(',')
  // Fix: avoid leading comma when seoKeywords is empty
  const keywords = [seoKeywords, tagKeywords].filter(Boolean).join(',')
  const blogUrl = `${siteUrl}/blog/${blog.slug}`
  const image = blog.imageUrl || `${siteUrl}/images/og-cover.jpg`
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
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo-512.png` },
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


