export function extractExcerpt(html: string, fallback = 'FinNote'): string {
  if (!html) return fallback
  let text = html.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text.length > 160 ? text.substring(0, 160) + '...' : text || fallback
}

export function extractFirstImage(html: string, fallbackUrl: string): string {
  if (!html) return fallbackUrl
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i)
  if (imgMatch && imgMatch[1]) return imgMatch[1]
  const mdMatch = html.match(/!\[[^\]]*\]\(([^)]+)\)/)
  if (mdMatch && mdMatch[1]) return mdMatch[1]
  return fallbackUrl
}

export function injectMeta(html: string, meta: string, articleHtml: string | null): string {
  html = html.replace(/<title>[^<]*<\/title>/, '')
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '')
  html = html.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, '')
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '')
  html = html.replace(/<meta\s+name="author"\s+content="[^"]*"\s*\/?>/gi, '')
  html = html.replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '')
  html = html.replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '')
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, '')

  html = html.replace(
    /<meta\s+charset="UTF-8"\s*\/?>/i,
    `<meta charset="UTF-8" />\n    ${meta.trim()}`
  )

  if (articleHtml) {
    html = html.replace(
      '<div id="app"></div>',
      `<div id="app">${articleHtml}</div>`
    )
  }

  return html
}

export function escHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
