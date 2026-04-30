import { Env, BlogData, UserData } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { generateId } from '../utils/crypto'
import { getJSON, putJSON } from '../services/kv.service'

const ADMIN_EMAIL = 'tintphcm@gmail.com'

// Helper to check admin
async function isAdmin(userId: string, env: Env): Promise<boolean> {
  const user = await getJSON<UserData>(env.SMART_NOTE_KV, `users/${userId}/profile`)
  return user?.email === ADMIN_EMAIL
}

// Generates a URL-friendly slug
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// ====== Public Blog Endpoints ======

export async function handleListBlogs(request: Request, env: Env): Promise<Response> {
  const index = await getJSON<{ blogs: any[] }>(env.SMART_NOTE_KV, `public/blogs/_index`)
  
  // Return only published ones
  const published = (index?.blogs || []).filter(b => b.published !== false)
  // Sort by date desc
  published.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  return jsonResponse({ success: true, data: published })
}

export async function handleGetBlog(slug: string, env: Env): Promise<Response> {
  const blog = await getJSON<BlogData>(env.SMART_NOTE_KV, `public/blogs/${slug}`)
  if (!blog) return errorResponse('Blog not found', 404)
  return jsonResponse({ success: true, data: blog })
}

export async function handleGetImage(id: string, env: Env): Promise<Response> {
  const { value: file, metadata } = await env.SMART_NOTE_KV.getWithMetadata<{ contentType?: string }>(
    `public/images/${id}`,
    'arrayBuffer'
  )
  if (!file) return new Response('Image not found', {
    status: 404,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  })

  // Validate that we actually have binary data (not "[object Object]" string)
  const byteArray = new Uint8Array(file as ArrayBuffer)
  if (byteArray.length < 8) {
    return new Response('Invalid image data', {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }

  // Use metadata content-type if available, otherwise detect from magic bytes
  let contentType = metadata?.contentType || 'image/jpeg'
  if (!metadata?.contentType) {
    if (byteArray[0] === 0x89 && byteArray[1] === 0x50 && byteArray[2] === 0x4E && byteArray[3] === 0x47) {
      contentType = 'image/png'
    } else if (byteArray[0] === 0x52 && byteArray[1] === 0x49 && byteArray[2] === 0x46 && byteArray[3] === 0x46) {
      contentType = 'image/webp'
    } else if (byteArray[0] === 0x47 && byteArray[1] === 0x49 && byteArray[2] === 0x46) {
      contentType = 'image/gif'
    }
  }

  return new Response(file, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': byteArray.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    }
  })
}

// ====== Admin Blog Endpoints ======


export async function handleCreateBlog(userId: string, request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(userId, env))) return errorResponse('Forbidden', 403)

  const body = (await request.json()) as any
  const id = generateId()
  const slug = body.slug || createSlug(body.title || 'untitled')
  const now = new Date().toISOString()
  
  const blog: BlogData = {
    id,
    slug,
    title: body.title || 'Untitled',
    content: body.content || '',
    excerpt: body.excerpt || '',
    tags: body.tags || [],
    imageUrl: body.imageUrl || '',
    author: {
      name: 'Admin',
      email: ADMIN_EMAIL
    },
    seoMeta: body.seoMeta || { title: body.title, description: body.excerpt, keywords: '' },
    published: body.published ?? false,
    createdAt: now,
    updatedAt: now
  }

  // Ensure slug is unique
  const existing = await getJSON<BlogData>(env.SMART_NOTE_KV, `public/blogs/${slug}`)
  if (existing) {
    return errorResponse('Slug already exists', 400)
  }

  await putJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`, blog)

  // Update index
  const index = (await getJSON<{ blogs: any[] }>(env.SMART_NOTE_KV, `public/blogs/_index`)) || { blogs: [] }
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
  await putJSON(env.SMART_NOTE_KV, `public/blogs/_index`, index)

  return jsonResponse({ success: true, data: blog }, 201)
}

export async function handleUpdateBlog(userId: string, slug: string, request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(userId, env))) return errorResponse('Forbidden', 403)

  const existing = await getJSON<BlogData>(env.SMART_NOTE_KV, `public/blogs/${slug}`)
  if (!existing) return errorResponse('Blog not found', 404)

  const body = (await request.json()) as any
  const updated: BlogData = {
    ...existing,
    ...body,
    slug, // dont allow slug change for simplicity right now
    updatedAt: new Date().toISOString()
  }

  await putJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`, updated)

  // Update index
  const index = (await getJSON<{ blogs: any[] }>(env.SMART_NOTE_KV, `public/blogs/_index`)) || { blogs: [] }
  const idx = index.blogs.findIndex((b: any) => b.slug === slug)
  if (idx !== -1) {
    index.blogs[idx] = {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      excerpt: updated.excerpt,
      tags: updated.tags,
      imageUrl: updated.imageUrl,
      published: updated.published,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
    await putJSON(env.SMART_NOTE_KV, `public/blogs/_index`, index)
  }

  return jsonResponse({ success: true, data: updated })
}

export async function handleDeleteBlog(userId: string, slug: string, env: Env): Promise<Response> {
  if (!(await isAdmin(userId, env))) return errorResponse('Forbidden', 403)

  await env.SMART_NOTE_KV.delete(`public/blogs/${slug}`)

  const index = (await getJSON<{ blogs: any[] }>(env.SMART_NOTE_KV, `public/blogs/_index`)) || { blogs: [] }
  index.blogs = index.blogs.filter((b: any) => b.slug !== slug)
  await putJSON(env.SMART_NOTE_KV, `public/blogs/_index`, index)

  return jsonResponse({ success: true })
}

// ====== AI Generators ======

export async function handleGenerateBlogContent(userId: string, request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(userId, env))) return errorResponse('Forbidden', 403)

  const { topic, imageBase64 } = (await request.json()) as { topic: string; imageBase64?: string }
  if (!topic && !imageBase64) return errorResponse('Missing topic or image', 400)

  // Helper: strip leading H1 from markdown to prevent duplicate title with hero section
  function stripLeadingH1(md: string): string {
    return md.replace(/^\s*#\s+[^\n]+\n*/m, '').trim()
  }

  const systemPrompt = `Bạn là một chuyên gia viết blog về quản lý tài chính cá nhân.
Nhiệm vụ: Viết một bài blog chuẩn SEO về chủ đề được yêu cầu để giúp người dùng biết cách quản lý tiền bạc và giới thiệu khéo léo về ứng dụng "FinNote".
Trả về ĐÚNG định dạng JSON sau, không kèm bất kỳ text giải thích nào khác ngoài JSON:
{
  "title": "Tiêu đề hấp dẫn (dưới 60 ký tự)",
  "excerpt": "Đoạn mô tả ngắn (dưới 160 ký tự) cho SEO meta description",
  "tags": ["tag1", "tag2", "tag3"],
  "seoKeywords": "keyword1, keyword2",
  "content": "Nội dung bài viết chi tiết được format bằng Markdown. QUAN TRỌNG: KHÔNG bao gồm tiêu đề H1 (# Tiêu đề) trong content vì title đã được hiển thị riêng ở hero section. Bắt đầu trực tiếp với đoạn mở bài, sau đó thân bài chia thành nhiều mục (H2, H3) sử dụng bullet points/bold text hợp lý, và kết bài có Call to Action kêu gọi tải/sử dụng app FinNote."
}`

  try {
    let text = ''

    // Try Gemini first, fallback to Cloudflare AI
    let useGemini = !!env.GEMINI_API_KEY
    if (useGemini) {
      try {
        let inlineData = undefined
        if (imageBase64) {
          const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
          if (match) {
            inlineData = { mime_type: match[1], data: match[2] }
          } else {
            inlineData = { mime_type: "image/jpeg", data: imageBase64 }
          }
        }

        const promptParts: any[] = []
        if (topic) promptParts.push({ text: `Yêu cầu / Chủ đề: ${topic}` })
        if (inlineData) promptParts.push({ inline_data: inlineData })
        if (promptParts.length === 0) promptParts.push({ text: "Hãy viết 1 bài blog về quản lý tài chính cá nhân." })

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: [{
                parts: promptParts
              }],
              generationConfig: {
                temperature: 0.7,
                response_mime_type: "application/json"
              }
            })
          }
        )

        if (!response.ok) {
          const errObj: any = await response.json().catch(() => ({}))
          console.warn('Gemini failed, falling back to CF AI:', errObj?.error?.message)
          useGemini = false // trigger fallback
        } else {
          const data: any = await response.json()
          text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
      } catch (geminiErr: any) {
        console.warn('Gemini error, falling back to CF AI:', geminiErr.message)
        useGemini = false // trigger fallback
      }
    }

    // Fallback: Cloudflare Workers AI (2-step to avoid truncation)
    if (!useGemini || !text) {
      if (!env.AI) return errorResponse('AI binding not configured', 503)

      // Step 1: Generate metadata only (small JSON)
      const metaPrompt = `Bạn là chuyên gia SEO blog tài chính. Trả về ĐÚNG JSON (không có text thêm):
{"title":"Tiêu đề hấp dẫn dưới 60 ký tự","excerpt":"Mô tả SEO dưới 160 ký tự","tags":["tag1","tag2","tag3"],"seoKeywords":"keyword1, keyword2"}`
      const metaResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
        messages: [
          { role: 'system', content: metaPrompt },
          { role: 'user', content: `Chủ đề: ${topic}` }
        ],
        max_tokens: 512,
        temperature: 0.7
      }) as any

      let metaText = metaResponse?.response || ''
      const metaMatch = metaText.match(/\{[\s\S]*\}/)
      if (metaMatch) metaText = metaMatch[0]

      let meta: any = {}
      try { meta = JSON.parse(metaText) } catch { meta = { title: topic, excerpt: '', tags: [], seoKeywords: '' } }

      // Step 2: Generate full blog content as Markdown (no JSON wrapper)
      const contentPrompt = `Bạn là chuyên gia viết blog tài chính cá nhân. Viết bài blog bằng Markdown cho chủ đề dưới đây.
Yêu cầu: KHÔNG bao gồm tiêu đề H1 (# Tiêu đề) vì title đã hiển thị riêng. Bắt đầu trực tiếp với đoạn mở bài, thân bài chia H2/H3, bullet points, bold text, kết bài Call to Action giới thiệu FinNote.
Chỉ trả về nội dung Markdown, không bọc trong JSON hay code block.`
      const contentResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct' as any, {
        messages: [
          { role: 'system', content: contentPrompt },
          { role: 'user', content: `Tiêu đề: ${meta.title || topic}\nChủ đề: ${topic}` }
        ],
        max_tokens: 2048,
        temperature: 0.7
      }) as any

      const blogContent = stripLeadingH1(contentResponse?.response || '')

      return jsonResponse({
        success: true,
        data: {
          title: meta.title || topic,
          excerpt: meta.excerpt || '',
          tags: meta.tags || [],
          seoKeywords: meta.seoKeywords || '',
          content: blogContent
        }
      })
    }

    // Parse Gemini response (single JSON)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }
    
    let result
    try {
      result = JSON.parse(text)
    } catch {
      return errorResponse('Failed to parse AI response', 500)
    }

    // Strip H1 from content as safety net
    if (result.content) {
      result.content = stripLeadingH1(result.content)
    }

    return jsonResponse({ success: true, data: result })
  } catch (err: any) {
    return errorResponse(err.message || 'AI request failed', 500)
  }
}

export async function handleGenerateBlogImage(userId: string, request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(userId, env))) return errorResponse('Forbidden', 403)
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const { prompt } = (await request.json()) as { prompt: string }
  if (!prompt) return errorResponse('Missing prompt', 400)

  const optimizedPrompt = `A premium, modern illustration for a finance blog: ${prompt}. Style: clean gradient background, minimal flat design, professional finance theme, vivid accent colors, editorial quality.`

  try {
    const response: any = await env.AI.run('@cf/black-forest-labs/flux-1-schnell' as any, {
      prompt: optimizedPrompt,
      num_steps: 4
    })
    
    let buffer: ArrayBuffer

    // Detection order: ReadableStream (most common from Workers AI) > ArrayBuffer > base64 string
    if (response instanceof ReadableStream) {
      buffer = await new Response(response).arrayBuffer()
    } else if (response instanceof ArrayBuffer) {
      buffer = response
    } else if (response?.image && typeof response.image === 'string') {
      // Decode base64 string to binary
      const binaryString = atob(response.image)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      buffer = bytes.buffer
    } else {
      console.error('Unexpected AI response type:', typeof response, JSON.stringify(response).substring(0, 200))
      return errorResponse('Unexpected AI response format', 500)
    }

    // Validate buffer has actual image data
    if (!buffer || buffer.byteLength < 100) {
      console.error('AI returned empty or too-small buffer:', buffer?.byteLength)
      return errorResponse('AI generated empty image', 500)
    }

    // Detect content type from magic bytes
    const header = new Uint8Array(buffer.slice(0, 4))
    let contentType = 'image/jpeg'
    if (header[0] === 0x89 && header[1] === 0x50) contentType = 'image/png'
    else if (header[0] === 0x52 && header[1] === 0x49) contentType = 'image/webp'

    // Save image to KV with metadata
    const imageId = generateId()
    await env.SMART_NOTE_KV.put(`public/images/${imageId}`, buffer, {
      metadata: { contentType }
    })
    
    const host = new URL(request.url).origin
    const imageUrl = `${host}/api/images/${imageId}`

    return jsonResponse({ success: true, data: { imageUrl } })
  } catch (err: any) {
    return errorResponse(err.message || 'Image generation failed', 500)
  }
}

// Upload image from base64 (manual upload fallback)
export async function handleUploadImage(userId: string, request: Request, env: Env): Promise<Response> {
  if (!(await isAdmin(userId, env))) return errorResponse('Forbidden', 403)

  const { image } = (await request.json()) as { image: string }
  if (!image) return errorResponse('Missing image data', 400)

  try {
    // Strip data URL prefix if present
    let base64Data = image
    let contentType = 'image/jpeg'
    const dataUrlMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1]
      base64Data = dataUrlMatch[2]
    }

    // Decode base64 to binary
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    if (bytes.length < 100) {
      return errorResponse('Image data too small', 400)
    }

    // Save to KV with metadata
    const imageId = generateId()
    await env.SMART_NOTE_KV.put(`public/images/${imageId}`, bytes.buffer, {
      metadata: { contentType }
    })

    const host = new URL(request.url).origin
    const imageUrl = `${host}/api/images/${imageId}`

    return jsonResponse({ success: true, data: { imageUrl } })
  } catch (err: any) {
    return errorResponse(err.message || 'Image upload failed', 500)
  }
}

