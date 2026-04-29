export async function createJWT(payload: object, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(
    JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
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
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${header}.${body}.${sig}`
}

export async function verifyJWT(
  token: string,
  secret: string
): Promise<{ userId: string } | null> {
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
      Uint8Array.from(atob(sig), (c) => c.charCodeAt(0)),
      encoder.encode(`${header}.${body}`)
    )
    if (!valid) return null

    const payload = JSON.parse(atob(body))
    if (payload.exp < Date.now()) return null
    return payload as { userId: string }
  } catch {
    return null
  }
}
