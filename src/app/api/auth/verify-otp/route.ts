import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEMO_OTP, MOBILE_RE, USERNAME_RE, hashPassword, verifyPassword } from '@/lib/auth'

/**
 * POST /api/auth/verify-otp
 * Step 2 of registration — checks the OTP and saves the user in the DB.
 *
 * TODO: replace DEMO_OTP with a real SMS OTP integration later.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const otp = String(body.otp ?? '').trim()
    const username = String(body.username ?? '').trim()
    const mobile = String(body.mobile ?? '').trim()
    const password = String(body.password ?? '')

    if (otp !== DEMO_OTP) {
      return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 })
    }

    // Re-validate details server-side before creating the account.
    if (!USERNAME_RE.test(username) || !MOBILE_RE.test(mobile) || password.length < 6) {
      return NextResponse.json({ error: 'Invalid registration details' }, { status: 400 })
    }

    const existingMobile = await db.user.findUnique({ where: { mobile } })
    if (existingMobile) {
      // Same user re-verifying a retried flow — treat as success.
      if (
        existingMobile.username === username &&
        verifyPassword(password, existingMobile.password)
      ) {
        return NextResponse.json({ ok: true, user: { username: existingMobile.username } })
      }
      return NextResponse.json(
        { error: 'This mobile number is already registered', field: 'mobile' },
        { status: 409 }
      )
    }

    const existingUsername = await db.user.findUnique({ where: { username } })
    if (existingUsername) {
      return NextResponse.json(
        { error: 'This username is already taken', field: 'username' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: { username, mobile, password: hashPassword(password) },
      select: { username: true },
    })

    return NextResponse.json({ ok: true, user })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
