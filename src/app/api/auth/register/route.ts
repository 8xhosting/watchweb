import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOBILE_RE, USERNAME_RE } from '@/lib/auth'

/**
 * POST /api/auth/register
 * Step 1 of registration — validates details and checks availability.
 * User row is created only after OTP verification (verify-otp route).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body.username ?? '').trim()
    const mobile = String(body.mobile ?? '').trim()
    const password = String(body.password ?? '')

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: 'Use 4–20 characters: letters, numbers, underscore', field: 'username' },
        { status: 400 }
      )
    }
    if (!MOBILE_RE.test(mobile)) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit mobile number', field: 'mobile' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters', field: 'password' },
        { status: 400 }
      )
    }

    const [usernameTaken, mobileTaken] = await Promise.all([
      db.user.findUnique({ where: { username } }),
      db.user.findUnique({ where: { mobile } }),
    ])

    if (usernameTaken) {
      return NextResponse.json(
        { error: 'This username is already taken', field: 'username' },
        { status: 409 }
      )
    }
    if (mobileTaken) {
      return NextResponse.json(
        { error: 'This mobile number is already registered', field: 'mobile' },
        { status: 409 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
