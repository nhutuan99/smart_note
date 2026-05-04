/**
 * Auto Blog Generation Service
 * ────────────────────────────────────────────────────
 * Triggered daily by Cloudflare Cron Trigger (9 AM Vietnam time)
 *
 * Flow:
 *  1. Fetch trending topics from VnExpress RSS feeds (finance + tech + GenZ)
 *  2. Use AI to pick the best topic and generate a blog post
 *  3. Auto-publish to KV (same structure as manual admin flow)
 *
 * Dedup: Stores last 30 generated topics in KV to avoid repeats
 */

import { Env, BlogData } from '../types'
import { generateId } from '../utils/crypto'
import { getJSON, putJSON } from '../services/kv.service'

const ADMIN_AUTHOR = { name: 'FinNote AI', email: 'tintphcm@gmail.com' }

// ── VnExpress RSS category URLs ──
const VNEXPRESS_FEEDS = [
  'https://vnexpress.net/rss/kinh-doanh.rss',        // Finance / Business
  'https://vnexpress.net/rss/so-hoa.rss',             // Technology / Digital
  'https://vnexpress.net/rss/khoa-hoc.rss',           // Science
  'https://vnexpress.net/rss/doi-song.rss',           // Lifestyle (GenZ)
]

// ── Helpers ──

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function stripCDATA(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

/**
 * Parse VnExpress RSS XML and extract article titles + descriptions
 */
function parseRssItems(xml: string): { title: string; description: string; link: string }[] {
  const items: { title: string; description: string; link: string }[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/)
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/)
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/)

    if (titleMatch) {
      // Clean HTML tags from description
      const rawDesc = descMatch ? stripCDATA(descMatch[1]) : ''
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, '').trim()

      items.push({
        title: stripCDATA(titleMatch[1]),
        description: cleanDesc.substring(0, 300),
        link: linkMatch ? stripCDATA(linkMatch[1]) : ''
      })
    }
  }

  return items
}

// ── YouTube Video Search (no API key needed) ──

interface YouTubeVideo {
  videoId: string
  title: string
  channelName: string
}

/**
 * Search YouTube for relevant videos using HTML scraping
 * Falls back gracefully on any error
 */
async function searchYouTubeVideos(query: string, maxResults = 2): Promise<YouTubeVideo[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
      }
    })
    if (!res.ok) return []
    const html = await res.text()

    // Extract ytInitialData JSON from HTML
    const dataMatch = html.match(/var ytInitialData = (\{.+?\});\s*<\/script>/)
    if (!dataMatch) {
      // Fallback: try regex to extract video IDs directly from HTML
      const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g
      const ids = new Set<string>()
      let m: RegExpExecArray | null
      while ((m = videoIdRegex.exec(html)) !== null && ids.size < maxResults) {
        ids.add(m[1])
      }
      return Array.from(ids).map(id => ({ videoId: id, title: '', channelName: '' }))
    }

    const ytData = JSON.parse(dataMatch[1])
    const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || []

    const videos: YouTubeVideo[] = []
    for (const item of contents) {
      if (videos.length >= maxResults) break
      const renderer = item?.videoRenderer
      if (!renderer?.videoId) continue

      videos.push({
        videoId: renderer.videoId,
        title: renderer.title?.runs?.[0]?.text || '',
        channelName: renderer.ownerText?.runs?.[0]?.text || ''
      })
    }

    return videos
  } catch (err) {
    console.warn('[AutoBlog] YouTube search failed:', err)
    return []
  }
}

/**
 * Build markdown embed section for YouTube videos
 */
function buildVideoSection(videos: YouTubeVideo[], sourceQuery: string): string {
  if (videos.length === 0) return ''

  let section = `\n\n---\n\n## 🎬 Video liên quan\n\n`

  for (const video of videos) {
    // Use a special markdown pattern that frontend will render as iframe
    // Format: [![title](thumbnail)](youtube-url) + raw HTML embed
    section += `<div class="yt-embed">\n`
    section += `<iframe src="https://www.youtube.com/embed/${video.videoId}" title="${video.title.replace(/"/g, '&quot;')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>\n`
    if (video.title) {
      section += `<p class="yt-embed__title">${video.title}</p>\n`
    }
    if (video.channelName) {
      section += `<p class="yt-embed__channel">📺 ${video.channelName}</p>\n`
    }
    section += `</div>\n\n`
  }

  // Source attribution
  section += `<div class="blog-sources">\n`
  section += `<p class="blog-sources__title">📌 Nguồn tham khảo</p>\n`
  section += `<ul>\n`
  section += `<li><a href="https://vnexpress.net" target="_blank" rel="noopener noreferrer">VnExpress.net</a> — Tin tức tài chính & công nghệ</li>\n`
  section += `<li><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(sourceQuery)}" target="_blank" rel="noopener noreferrer">YouTube</a> — Video liên quan</li>\n`
  section += `</ul>\n`
  section += `</div>\n`

  return section
}

/**
 * Step 1: Fetch trending topics from VnExpress RSS
 */
async function fetchTrendingTopics(): Promise<{ title: string; description: string; link: string }[]> {
  const allItems: { title: string; description: string; link: string }[] = []

  for (const feedUrl of VNEXPRESS_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'FinNote-AutoBlog/1.0' }
      })
      if (!res.ok) continue
      const xml = await res.text()
      const items = parseRssItems(xml)
      allItems.push(...items.slice(0, 8)) // top 8 per feed
    } catch {
      // Skip failed feeds silently
    }
  }

  return allItems
}

/**
 * Step 2: Use AI to pick the best topic and angle for a financial blog
 */
async function pickTopicWithAI(
  items: { title: string; description: string }[],
  previousTopics: string[],
  env: Env
): Promise<{ chosenTopic: string; blogAngle: string; category: string }> {
  const topicList = items.map((item, i) => `${i + 1}. ${item.title}: ${item.description}`).join('\n')
  const prevList = previousTopics.length > 0
    ? `\nĐã viết gần đây (TRÁNH trùng): ${previousTopics.join(', ')}`
    : ''

  const prompt = `Bạn là biên tập viên blog tài chính cá nhân cho GenZ Việt Nam.
Dưới đây là danh sách tin tức hot hôm nay từ VnExpress:

${topicList}
${prevList}

Hãy chọn 1 chủ đề PHÙ HỢP NHẤT để viết blog tài chính cá nhân (quản lý tiền, đầu tư, tiết kiệm, công nghệ tài chính, xu hướng GenZ).
Trả về ĐÚNG JSON (không text khác):
{"chosenTopic":"Tên chủ đề đã chọn","blogAngle":"Góc nhìn/tiêu đề bài blog dành cho GenZ, liên quan đến tài chính cá nhân","category":"finance|tech|genz"}`

  // Try Gemini first
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, response_mime_type: 'application/json' }
          })
        }
      )
      if (res.ok) {
        const data: any = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.chosenTopic && parsed.blogAngle) return parsed
        }
      }
    } catch { /* fallback to CF AI */ }
  }

  // Fallback: CF AI
  const cfRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Chọn chủ đề và trả về JSON.' }
    ],
    max_tokens: 300,
    temperature: 0.8
  }) as any

  const cfText = cfRes?.response || ''
  const cfMatch = cfText.match(/\{[\s\S]*\}/)
  if (cfMatch) {
    try {
      return JSON.parse(cfMatch[0])
    } catch { /* use default */ }
  }

  // Ultimate fallback
  return {
    chosenTopic: items[0]?.title || 'Quản lý tài chính cá nhân',
    blogAngle: 'Bí quyết quản lý tài chính thông minh cho GenZ',
    category: 'finance'
  }
}

/**
 * Step 3: Generate full blog content using AI
 */
async function generateBlogContent(
  topic: string,
  angle: string,
  env: Env
): Promise<{ title: string; excerpt: string; tags: string[]; seoKeywords: string; content: string; modelUsed: string }> {
  const systemPrompt = `Bạn là chuyên gia viết blog tài chính cá nhân cho GenZ Việt Nam. Phong cách: dễ đọc, gần gũi, sử dụng ví dụ thực tế, có tính ứng dụng cao.

Trả về ĐÚNG JSON format:
{
  "title": "Tiêu đề hấp dẫn (dưới 60 ký tự)",
  "excerpt": "Mô tả SEO hấp dẫn (dưới 160 ký tự)",
  "tags": ["tag1", "tag2", "tag3"],
  "seoKeywords": "keyword1, keyword2, keyword3",
  "youtubeQuery": "từ khóa tìm video YouTube liên quan (tiếng Việt, 3-5 từ)",
  "content": "Bài viết markdown đầy đủ (tối thiểu 1200 từ). KHÔNG bao gồm tiêu đề H1. Bắt đầu bằng đoạn mở bài, chia H2/H3, bullet points, bold text, kết bài CTA về FinNote."
}`

  const userPrompt = `Chủ đề hot từ VnExpress: "${topic}"
Góc nhìn blog: "${angle}"

Hãy viết 1 bài blog tài chính cá nhân chuyên sâu, sáng tạo, dễ hiểu cho GenZ Việt Nam. Bài viết cần:
- Liên hệ chủ đề hot với tài chính cá nhân (tiết kiệm, đầu tư, quản lý chi tiêu)
- Có ví dụ thực tế và con số cụ thể
- Có checklist hoặc hướng dẫn hành động (actionable advice)
- Kết bài giới thiệu FinNote app
- Đề xuất youtubeQuery để tìm video YouTube liên quan (bằng tiếng Việt)`

  // Try Gemini first
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.7, response_mime_type: 'application/json' }
          })
        }
      )
      if (res.ok) {
        const data: any = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.content && parsed.title) {
              return { ...parsed, modelUsed: 'gemini' }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AutoBlog] Gemini gen failed:', err)
    }
  }

  // Fallback: Cloudflare AI (2-step: meta + content)
  console.log('[AutoBlog] Using Cloudflare AI fallback')

  // Step A: Generate meta
  let meta = { title: angle, excerpt: '', tags: ['tài chính', 'genz'], seoKeywords: '' }
  try {
    const metaRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
      messages: [
        { role: 'system', content: `Trả về ĐÚNG JSON: {"title":"...","excerpt":"...","tags":["..."],"seoKeywords":"..."}` },
        { role: 'user', content: `Tạo tiêu đề + meta cho bài blog về: ${angle}` }
      ],
      max_tokens: 400,
      temperature: 0.7
    }) as any
    const metaMatch = (metaRes?.response || '').match(/\{[\s\S]*\}/)
    if (metaMatch) {
      try { meta = { ...meta, ...JSON.parse(metaMatch[0]) } } catch { /* keep default */ }
    }
  } catch { /* keep default meta */ }

  // Step B: Generate content (plain markdown, no JSON)
  let content = ''
  try {
    const contentPrompt = `Viết bài blog tài chính cá nhân bằng Markdown cho GenZ Việt Nam.
Chủ đề: ${angle}
Yêu cầu:
- KHÔNG có tiêu đề H1
- Bắt đầu bằng đoạn mở bài hấp dẫn
- Chia thành H2/H3 rõ ràng
- Tối thiểu 1000 từ
- Có ví dụ thực tế, con số cụ thể
- Kết bài CTA giới thiệu FinNote
- Chỉ trả về Markdown, không bọc JSON hay code block`

    const contentRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
      messages: [
        { role: 'system', content: contentPrompt },
        { role: 'user', content: `Viết bài blog chuyên sâu về: ${angle}` }
      ],
      max_tokens: 4096,
      temperature: 0.7
    }) as any
    content = contentRes?.response || ''
  } catch { /* empty content */ }

  if (!content || content.length < 200) {
    content = `## ${angle}\n\nĐây là chủ đề nóng hổi hôm nay. Bài viết đang được cập nhật, vui lòng quay lại sau.\n\n> 💡 Tải FinNote để quản lý tài chính thông minh!`
  }

  return {
    title: meta.title || angle,
    excerpt: meta.excerpt || `Blog tài chính: ${angle}`,
    tags: Array.isArray(meta.tags) ? meta.tags : ['tài chính', 'genz'],
    seoKeywords: meta.seoKeywords || '',
    content: content.replace(/^\s*#\s+[^\n]+\n*/m, '').trim(), // strip H1
    modelUsed: 'cloudflare'
  }
}

/**
 * Step 4: Publish blog to KV (same structure as handleCreateBlog)
 */
async function publishBlog(
  blogData: { title: string; excerpt: string; tags: string[]; seoKeywords: string; content: string; modelUsed: string },
  env: Env
): Promise<BlogData> {
  const id = generateId()
  const now = new Date().toISOString()
  const baseSlug = createSlug(blogData.title || 'auto-blog')
  // Add date suffix to ensure unique slug
  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const slug = `${baseSlug}-${dateSuffix}`

  const blog: BlogData = {
    id,
    slug,
    title: blogData.title,
    content: blogData.content,
    excerpt: blogData.excerpt,
    tags: blogData.tags,
    imageUrl: '', // no auto image gen (save AI credits)
    author: ADMIN_AUTHOR,
    seoMeta: {
      title: blogData.title,
      description: blogData.excerpt,
      keywords: blogData.seoKeywords
    },
    published: true,
    createdAt: now,
    updatedAt: now
  }

  // Check slug uniqueness
  const existing = await getJSON<BlogData>(env.SMART_NOTE_KV, `public/blogs/${slug}`)
  if (existing) {
    // Very unlikely with date suffix, but handle gracefully
    blog.slug = `${slug}-${id.substring(0, 6)}`
  }

  // Save blog
  await putJSON(env.SMART_NOTE_KV, `public/blogs/${blog.slug}`, blog)

  // Update index
  const index = (await getJSON<{ blogs: any[] }>(env.SMART_NOTE_KV, 'public/blogs/_index')) || { blogs: [] }
  index.blogs.push({
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    tags: blog.tags,
    imageUrl: blog.imageUrl,
    published: blog.published,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  })
  await putJSON(env.SMART_NOTE_KV, 'public/blogs/_index', index)

  return blog
}

// ── Dedup: Track recent topics ──
const RECENT_TOPICS_KEY = 'auto-blog/recent-topics'
const MAX_RECENT = 30

async function getRecentTopics(env: Env): Promise<string[]> {
  const data = await getJSON<string[]>(env.SMART_NOTE_KV, RECENT_TOPICS_KEY)
  return data || []
}

async function addRecentTopic(env: Env, topic: string): Promise<void> {
  const recent = await getRecentTopics(env)
  recent.unshift(topic)
  // Keep only last N
  await putJSON(env.SMART_NOTE_KV, RECENT_TOPICS_KEY, recent.slice(0, MAX_RECENT))
}

// ══════════════════════════════════════════════════════
// Main Entry: Called by Cron Trigger
// ══════════════════════════════════════════════════════

export async function runAutoBlog(env: Env): Promise<string> {
  console.log('[AutoBlog] 🚀 Starting daily auto-blog generation...')

  // 1. Fetch trending topics
  const items = await fetchTrendingTopics()
  if (items.length === 0) {
    console.log('[AutoBlog] ❌ No topics found from VnExpress RSS')
    return 'No topics found'
  }
  console.log(`[AutoBlog] 📰 Found ${items.length} trending topics`)

  // 2. Pick best topic (with dedup)
  const recentTopics = await getRecentTopics(env)
  const picked = await pickTopicWithAI(items, recentTopics, env)
  console.log(`[AutoBlog] 🎯 Picked: "${picked.blogAngle}" (${picked.category})`)

  // 3. Generate full blog
  const blogContent = await generateBlogContent(picked.chosenTopic, picked.blogAngle, env)
  console.log(`[AutoBlog] ✍️ Generated: "${blogContent.title}" (${blogContent.content.length} chars, model: ${blogContent.modelUsed})`)

  // 3.5 Search YouTube for related videos + append embed section
  const ytQuery = (blogContent as any).youtubeQuery || picked.blogAngle
  console.log(`[AutoBlog] 🎬 Searching YouTube: "${ytQuery}"`)
  const videos = await searchYouTubeVideos(ytQuery, 2)
  if (videos.length > 0) {
    const videoSection = buildVideoSection(videos, ytQuery)
    blogContent.content += videoSection
    console.log(`[AutoBlog] 📹 Embedded ${videos.length} YouTube videos`)
  } else {
    console.log('[AutoBlog] ⚠️ No YouTube videos found, skipping embed')
    // Still add source attribution without videos
    blogContent.content += `\n\n---\n\n<div class="blog-sources">\n<p class="blog-sources__title">📌 Nguồn tham khảo</p>\n<ul>\n<li><a href="https://vnexpress.net" target="_blank" rel="noopener noreferrer">VnExpress.net</a> — Tin tức tài chính & công nghệ</li>\n</ul>\n</div>\n`
  }

  // 4. Publish
  const published = await publishBlog(blogContent, env)
  console.log(`[AutoBlog] ✅ Published: /blog/${published.slug}`)

  // 5. Track topic for dedup
  await addRecentTopic(env, picked.blogAngle)

  // 6. Log run history
  const historyKey = 'auto-blog/history'
  const history = (await getJSON<any[]>(env.SMART_NOTE_KV, historyKey)) || []
  history.unshift({
    date: new Date().toISOString(),
    topic: picked.blogAngle,
    slug: published.slug,
    model: blogContent.modelUsed,
    contentLength: blogContent.content.length
  })
  await putJSON(env.SMART_NOTE_KV, historyKey, history.slice(0, 60)) // keep 60 days

  return `Published: "${published.title}" → /blog/${published.slug}`
}
