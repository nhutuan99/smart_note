import { Env, UserData, NoteData, TransactionData, WalletData, NotificationData, PendingNotification, BudgetData } from '../types'
import { errorResponse, jsonResponse, corsHeaders } from '../utils/response'
import { generateId, hashPassword } from '../utils/crypto'
import { createJWT } from '../utils/jwt'
import { getJSON, putJSON } from '../services/kv.service'

// ====== Cloudflare Workers AI ======

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct'

const AI_SYSTEM_PROMPTS: Record<string, string> = {
  summarize: 'You are a concise summarizer. Summarize the user content into bullet points (max 5). Reply in the same language as the content. Return ONLY the bullet list, no intro or explanation.',
  continue: 'You are a writing assistant. Continue the user text naturally in 2-3 sentences. Match the tone and language. Return ONLY the continuation, no explanation.',
  improve: 'You are an editor. Improve the grammar and style of the user text. Keep the original meaning and language. Return ONLY the improved text.',
  tags: 'You are a tagging assistant. Suggest 3-5 relevant tags for the content. Return ONLY a comma-separated list of lowercase tags, nothing else.',
  ask: 'You are a helpful assistant. Answer the user question based on the provided note content. Be concise and clear.',
  finance: `Bạn là chuyên gia tư vấn tài chính cá nhân thông minh cho ứng dụng FinNote.
Nhiệm vụ: Phân tích dữ liệu tài chính thực tế của người dùng và trả lời câu hỏi của họ một cách chính xác, ngắn gọn, thực tế.
Quy tắc quan trọng:
- Chỉ tư vấn dựa trên số liệu thực tế đã được cung cấp (số dư tài khoản, thu chi tháng)
- KHÔNG bịa đặt số liệu hay đưa ra con số không có trong dữ liệu
- Trả lời bằng tiếng Việt, dùng Markdown và emoji
- Ngắn gọn, tối đa 200 từ
- Nếu câu hỏi không liên quan đến tài chính, lịch sự từ chối và nhắc lại vai trò`
}

export async function handleAi(request: Request, env: Env): Promise<Response> {
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const body = (await request.json()) as any
  const { action, content, question } = body

  if (!action) return errorResponse('Missing action')
  if (!content && action !== 'ask') return errorResponse('Note content is required')
  if (action === 'ask' && !question) return errorResponse('Missing question')

  const systemPrompt = AI_SYSTEM_PROMPTS[action]
  if (!systemPrompt) return errorResponse(`Unknown action: ${action}`)

  let userMessage: string
  if (action === 'finance') {
    // Finance advisor: content already contains the full context + embedded question
    // Do NOT wrap with "Note content:" — that confuses the model
    userMessage = content
  } else if (action === 'ask') {
    userMessage = content
      ? `Note content:\n${content}\n\nQuestion: ${question}`
      : `Question: ${question}`
  } else if (action === 'tags') {
    userMessage = `Title: ${body.title || ''}\nContent: ${content.substring(0, 600)}`
  } else {
    userMessage = content
  }

  try {
    const response = await env.AI.run(AI_MODEL as any, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7
    }) as any

    const text = response?.response || ''
    return jsonResponse({ success: true, data: text })
  } catch (err: any) {
    return errorResponse(err.message || 'AI request failed', 500)
  }
}

export async function handleAiStream(request: Request, env: Env): Promise<Response> {
  if (!env.AI) return errorResponse('AI binding not configured', 503)

  const body = (await request.json()) as any
  const { action, content, question } = body

  if (!action) return errorResponse('Missing action')
  if (!content && action !== 'ask') return errorResponse('Note content is required')
  if (action === 'ask' && !question) return errorResponse('Missing question')

  const systemPrompt = AI_SYSTEM_PROMPTS[action]
  if (!systemPrompt) return errorResponse(`Unknown action: ${action}`)

  let userMessage: string
  if (action === 'finance') {
    // Finance advisor: content already contains the full context + embedded question
    // Do NOT wrap with "Note content:" — that confuses the model about its role
    userMessage = content
  } else if (action === 'ask') {
    userMessage = content
      ? `Note content:\n${content}\n\nQuestion: ${question}`
      : `Question: ${question}`
  } else if (action === 'tags') {
    userMessage = `Title: ${body.title || ''}\nContent: ${content.substring(0, 600)}`
  } else {
    userMessage = content
  }

  try {
    const stream = await (env.AI as any).run(AI_MODEL, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: true
    }) as ReadableStream

    const cors = corsHeaders()
    return new Response(stream, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (err: any) {
    return errorResponse(err.message || 'AI stream failed', 500)
  }
}

