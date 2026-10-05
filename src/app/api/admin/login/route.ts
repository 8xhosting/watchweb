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
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body?.username ?? '')
    const password = String(body?.password ?? '')

    if (!checkAdminCredentials(username, password)) {
      // small delay blunts brute-force attempts
      await new Promise((r) => setTimeout(r, 600))
      return NextResponse.json(
        { ok: false, error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

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
