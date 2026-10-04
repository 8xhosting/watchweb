import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'

/**
 * GET /api/wallet
 * Returns the logged-in user's real wallet balance from the database.
 * The home page polls this roughly every 5 seconds (same cadence as the
 * old get-wallet.php) without ever reloading the page.
 *
 * Uses a parameterized raw query for the balance read — resilient to a dev
 * server process holding a Prisma Client generated before the walletBalance
 * field existed (a plain findUnique({ select: { walletBalance }}) would
 * throw "unknown field" there).
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

    // Confirm the account exists (works on any generated client version).
    const exists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const rows = await db.$queryRaw<{ walletBalance: number }[]>(
      Prisma.sql`SELECT walletBalance FROM User WHERE id = ${userId} LIMIT 1`
    )
    const balance = rows.length > 0 ? Number(rows[0].walletBalance) : 0

    return NextResponse.json({ ok: true, balance })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
