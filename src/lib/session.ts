import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Lightweight signed-cookie session for WatchPay.
 *
 * The token is "<userId>.<hmac(userId)>" — the user id is NOT a secret and the
 * signature cannot be forged without the server secret. No database write is
 * needed to validate a session, keeping /api/auth/me and /api/wallet fast.
 *
 * TODO: before production, set SESSION_SECRET in the environment (.env) and
 * rotate it; the dev fallback below only exists so local development works.
 */
export const SESSION_COOKIE = 'wp_session'

const SECRET = process.env.SESSION_SECRET ?? 'watchpay-local-dev-secret'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`
}

/** Returns the userId when the signature is valid, otherwise null. */
export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token) return null
  const separator = token.lastIndexOf('.')
  if (separator <= 0) return null
  const userId = token.slice(0, separator)
  const signature = Buffer.from(token.slice(separator + 1))
  const expected = Buffer.from(sign(userId))
  if (signature.length !== expected.length) return null
  return timingSafeEqual(signature, expected) ? userId : null
}

/** Parse the session cookie straight from the request headers. */
export function getUserIdFromRequest(req: Request): string | null {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === SESSION_COOKIE) {
      try {
        return verifySessionToken(decodeURIComponent(rest.join('=')))
      } catch {
        return null
      }
    }
  }
  return null
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
