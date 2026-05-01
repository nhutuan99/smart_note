const ALLOWED_ORIGINS = [
  'https://finnote-f4n.pages.dev',
  'https://smart-note.pages.dev',
  'http://localhost:5173', // dev
  'http://localhost:3000' // vite proxy dev
]

export function corsHeaders(requestOrigin?: string | null): HeadersInit {
  let origin = ALLOWED_ORIGINS[0]
  if (requestOrigin) {
    if (ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.startsWith('app://') || requestOrigin.startsWith('capacitor://') || requestOrigin.startsWith('http://127.0.0.1:')) {
      origin = requestOrigin
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Secret',
    'Content-Type': 'application/json'
  }
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() })
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status)
}
