import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Admin Master Control session — SEPARATE from the user session.
 *
 * The cookie is "wp_admin" carrying "<username>.<hmac(username)>" signed with
 * the same server secret. Admin credentials come from the environment:
 *
 *   ADMIN_USERNAME  (default "admin")
 *   ADMIN_PASSWORD  (default "WatchPay@2025")  ← change before deploying!
 *
 * Passwords are compared with a constant-time scrypt/sha256 comparison —
 * never plain string equality.
 */
export const ADMIN_COOKIE = 'wp_admin'

const SECRET = process.env.SESSION_SECRET ?? 'watchpay-local-dev-secret'

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'WatchPay@2025'

const MAX_AGE_SECONDS = 60 * 60 * 12 // admin sessions expire after 12h

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

/** constant-time string comparison */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export function checkAdminCredentials(username: string, password: string): boolean {
  return safeEqual(username.trim(), ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD)
}

export function createAdminToken(username: string): string {
  return `${username}.${sign(username)}`
}

/** Returns the admin username when the signature is valid, otherwise null. */
export function verifyAdminToken(token: string | null | undefined): string | null {
  if (!token) return null
  const sep = token.lastIndexOf('.')
  if (sep <= 0) return null
  const username = token.slice(0, sep)
  const sig = Buffer.from(token.slice(sep + 1))
  const expected = Buffer.from(sign(username))
  if (sig.length !== expected.length) return null
  return timingSafeEqual(sig, expected) ? username : null
}

/** Parse the admin cookie straight from the request headers. */
export function getAdminFromRequest(req: Request): string | null {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === ADMIN_COOKIE) {
      try {
        return verifyAdminToken(decodeURIComponent(rest.join('=')))
      } catch {
        return null
      }
    }
  }
  return null
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}

/** Standard 401 response for admin APIs. */
export function adminUnauthorized() {
  return Response.json({ ok: false, error: 'Admin authentication required' }, { status: 401 })
}
