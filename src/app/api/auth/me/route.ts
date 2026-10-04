import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'

/**
 * GET /api/auth/me
 * Returns whether the current request carries a valid session cookie,
 * plus the logged-in user's username. Lets the client restore the
 * logged-in state (home view) on refresh without re-entering credentials.
 */
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ ok: true, authenticated: false })
    }
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })
    if (!user) {
      return NextResponse.json({ ok: true, authenticated: false })
    }
    return NextResponse.json({ ok: true, authenticated: true, username: user.username })
  } catch {
    return NextResponse.json({ ok: true, authenticated: false })
  }
}
