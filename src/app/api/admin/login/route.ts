import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  checkAdminCredentials,
  createAdminToken,
  getAdminFromRequest,
} from '@/lib/admin-session'
import { adminLog } from '@/lib/app-config'

/**
 * POST /api/admin/login   { username, password } → sets the wp_admin cookie
 * GET  /api/admin/login                     → { ok, username } session check
 * DELETE /api/admin/login                   → clears the admin session
 *
 * BRUTE-FORCE LOCKOUT: 5 failed attempts per IP → 90 second lockout
 * (in-memory ring, resets on success). Failed attempts are audit-logged.
 */
const MAX_ATTEMPTS = 5
const LOCK_MS = 90_000
const attempts = new Map<string, { count: number; lockedUntil: number }>()

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'local'
}

function isLocked(ip: string): { locked: boolean; retryIn: number } {
  const rec = attempts.get(ip)
  if (!rec) return { locked: false, retryIn: 0 }
  const remain = rec.lockedUntil - Date.now()
  if (remain > 0) return { locked: true, retryIn: Math.ceil(remain / 1000) }
  return { locked: false, retryIn: 0 }
}

function recordFailure(ip: string): void {
  const rec = attempts.get(ip) ?? { count: 0, lockedUntil: 0 }
  rec.count += 1
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS
    rec.count = 0
    void adminLog('admin.lockout', `IP ${ip} locked for 90s after ${MAX_ATTEMPTS} failed logins`)
  }
  attempts.set(ip, rec)
}

function clearFailures(ip: string): void {
  attempts.delete(ip)
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req)
    const lock = isLocked(ip)
    if (lock.locked) {
      void adminLog('admin.login_blocked', `IP ${ip} retry in ${lock.retryIn}s`)
      return NextResponse.json(
        {
          ok: false,
          error: `Too many failed attempts — locked for ${lock.retryIn}s`,
          locked: true,
          retryIn: lock.retryIn,
        },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const username = String(body?.username ?? '')
    const password = String(body?.password ?? '')

    if (!checkAdminCredentials(username, password)) {
      // small delay blunts brute-force attempts
      await new Promise((r) => setTimeout(r, 600))
      recordFailure(ip)
      void adminLog('admin.login_failed', `IP ${ip} — wrong credentials`)
      const nowLocked = isLocked(ip)
      return NextResponse.json(
        {
          ok: false,
          error: nowLocked.locked
            ? `Too many failed attempts — locked for ${nowLocked.retryIn}s`
            : 'Invalid admin credentials',
          locked: nowLocked.locked,
          retryIn: nowLocked.retryIn,
        },
        { status: 401 }
      )
    }

    clearFailures(ip)
    const res = NextResponse.json({ ok: true, username: username.trim() })
    res.cookies.set(ADMIN_COOKIE, createAdminToken(username.trim()), ADMIN_COOKIE_OPTIONS)
    void adminLog('admin.login', `admin "${username.trim()}" signed in`)
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ ok: false, authenticated: false }, { status: 401 })
  return NextResponse.json({ ok: true, authenticated: true, username: admin })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 })
  return res
}
