import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'

/**
 * GET /api/wallet
 * Returns the logged-in user's real wallet balance from the database.
 * The home page polls this roughly every 5 seconds (same cadence as the
 * old get-wallet.php) without ever reloading the page.
 *
 * Uses the standard Prisma Client API (works on the MongoDB connector —
 * raw SQL queries are not available there).
 *
 * When the real get-wallet.php backend is connected, point the client at it —
 * this route intentionally never invents a balance.
 */
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ ok: true, balance: Number(user.walletBalance) })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
