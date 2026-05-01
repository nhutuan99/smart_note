// ── Base64url helpers (JWT-spec compliant) ──────────────────────────────────
function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

// ── Access Token (short-lived: 15 minutes) ───────────────────────────────────
const ACCESS_TOKEN_TTL = 15 * 60 * 1000 // 15 min

export async function createJWT(payload: object, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(
    JSON.stringify({ ...payload, exp: Date.now() + ACCESS_TOKEN_TTL })
  )
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${body}`)
  )
  const sig = base64url(String.fromCharCode(...new Uint8Array(signature)))
  return `${header}.${body}.${sig}`
}

// ── Refresh Token (long-lived: 30 days) ──────────────────────────────────────
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function createRefreshToken(payload: object, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(
    JSON.stringify({ ...payload, type: 'refresh', exp: Date.now() + REFRESH_TOKEN_TTL })
  )
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${body}`)
  )
  const sig = base64url(String.fromCharCode(...new Uint8Array(signature)))
  return `${header}.${body}.${sig}`
}

// ── Verify any JWT ───────────────────────────────────────────────────────────
export async function verifyJWT(
  token: string,
  secret: string
): Promise<{ userId: string; type?: string } | null> {
  try {
    const [header, body, sig] = token.split('.')
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      Uint8Array.from(base64urlDecode(sig), (c) => c.charCodeAt(0)),
      encoder.encode(`${header}.${body}`)
    )
    if (!valid) return null

    const payload = JSON.parse(base64urlDecode(body))
    if (payload.exp < Date.now()) return null
    return payload as { userId: string; type?: string }
  } catch {
    return null
  }
}
