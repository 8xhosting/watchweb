import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOBILE_RE, verifyPassword } from '@/lib/auth'

/**
 * POST /api/auth/login
 * Verifies mobile + password against the users saved in the DB.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const mobile = String(body.mobile ?? '').trim()
    const password = String(body.password ?? '')

    if (!MOBILE_RE.test(mobile)) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit mobile number' },
        { status: 400 }
      )
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { mobile } })
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid mobile number or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({ ok: true, user: { username: user.username } })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
