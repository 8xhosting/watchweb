import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Demo OTP — fixed for now, will be replaced by a real SMS gateway
 * integration (e.g. MSG91 / Twilio) later.
 */
export const DEMO_OTP = '123456'

export const USERNAME_RE = /^[A-Za-z0-9_]{4,20}$/
export const MOBILE_RE = /^\d{10}$/

/** Hash a password with scrypt: returns "salt:hash" (hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** Constant-time password check against a stored "salt:hash" string. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const original = Buffer.from(hash, 'hex')
  return candidate.length === original.length && timingSafeEqual(candidate, original)
}
