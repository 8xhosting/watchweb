import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEMO_OTP, MOBILE_RE, USERNAME_RE, hashPassword, verifyPassword } from '@/lib/auth'
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, createSessionToken } from '@/lib/session'

/**
 * POST /api/auth/verify-otp
 * Step 2 of registration — checks the OTP, saves the user in the DB and
 * signs them in straight away (httpOnly session cookie) so a page refresh
 * keeps them logged in instead of bouncing back to the register screen.
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
      // Same user re-verifying a retried flow — treat as success + sign in.
      if (
        existingMobile.username === username &&
        verifyPassword(password, existingMobile.password)
      ) {
        const res = NextResponse.json({
          ok: true,
          user: { username: existingMobile.username },
        })
        res.cookies.set(
          SESSION_COOKIE,
          createSessionToken(existingMobile.id),
          SESSION_COOKIE_OPTIONS
        )
        return res
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
      select: { id: true, username: true },
    })

    // Registration IS the first login — set the session cookie so the
    // session survives a refresh (no forced trip through the login form).
    const res = NextResponse.json({ ok: true, user: { username: user.username } })
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), SESSION_COOKIE_OPTIONS)
    return res
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
