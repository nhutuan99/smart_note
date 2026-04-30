// Cloudflare Pages Function: Server-side meta injection for blog pages
// This runs on the edge BEFORE the SPA loads, ensuring Google crawlers
// see proper <title>, <meta>, Open Graph, and JSON-LD for each blog post

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
    const injectedHtml = injectMeta(html, listMeta)

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
  const injectedHtml = injectMeta(html, meta)

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
  const keywords = (blog.seoMeta?.keywords || '') + ',' + (blog.tags || []).join(',')
  const blogUrl = `${SITE_URL}/blog/${blog.slug}`
  const image = blog.imageUrl || `${SITE_URL}/images/og-cover.jpg`

  const articleTags = (blog.tags || [])
    .map((tag) => `<meta property="article:tag" content="${escHtml(tag)}" />`)
    .join('\n    ')

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    image: image,
    author: { '@type': 'Person', name: blog.author?.name || 'FinNote' },
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

  return `
    <title>${escHtml(title)} | FinNote Blog</title>
    <meta name="description" content="${escHtml(desc)}" />
    <meta name="keywords" content="${escHtml(keywords)}" />
    <meta name="author" content="${escHtml(blog.author?.name || 'FinNote')}" />
    <link rel="canonical" href="${blogUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${blogUrl}" />
    <meta property="og:title" content="${escHtml(title)}" />
    <meta property="og:description" content="${escHtml(desc)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="FinNote Blog" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="article:published_time" content="${blog.createdAt}" />
    <meta property="article:author" content="${escHtml(blog.author?.name || 'FinNote')}" />
    ${articleTags}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escHtml(title)}" />
    <meta name="twitter:description" content="${escHtml(desc)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${jsonLd}</script>
  `
}

function injectMeta(html: string, meta: string): string {
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

  return html
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
