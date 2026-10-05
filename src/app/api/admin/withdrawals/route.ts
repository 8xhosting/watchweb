import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { adminLog } from '@/lib/app-config'

/**
 * GET   /api/admin/withdrawals?status=  — payout queue (newest first)
 * PATCH /api/admin/withdrawals          — { id, action: "paid" | "reject" }
 *
 * BALANCE MODEL: the user's balance was already deducted when the request
 * was created (hold). "paid" finalises the payout; "reject" REFUNDS the
 * amount back to the user's wallet — no money is ever lost silently.
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const status = new URL(req.url).searchParams.get('status')?.trim()
    const rows = await db.withdrawal.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      include: { user: { select: { username: true, walletBalance: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      withdrawals: rows.map((w) => ({
        id: w.id,
        username: w.user.username,
        amount: Number(w.amount),
        method: w.method,
        destination: w.destination,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load withdrawals' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id ?? '')
    const action = String(body?.action ?? '')

    const w = await db.withdrawal.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true } } },
    })
    if (!w) {
      return NextResponse.json({ ok: false, error: 'Withdrawal not found' }, { status: 404 })
    }
    if (w.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `Already ${w.status} — nothing to do` },
        { status: 400 }
      )
    }

    if (action === 'paid') {
      await db.withdrawal.update({ where: { id }, data: { status: 'paid' } })
      void adminLog('withdrawal.paid', `₹${w.amount} → ${w.user.username} (${w.method})`)
      return NextResponse.json({ ok: true, status: 'paid' })
    }

    if (action === 'reject') {
      // refund the held amount back to the user's wallet
      const user = await db.user.findUnique({
        where: { id: w.userId },
        select: { walletBalance: true },
      })
      if (user) {
        await db.user.update({
          where: { id: w.userId },
          data: { walletBalance: Number(user.walletBalance) + Number(w.amount) },
        })
      }
      await db.withdrawal.update({ where: { id }, data: { status: 'rejected' } })
      void adminLog('withdrawal.reject', `₹${w.amount} refunded to ${w.user.username}`)
      return NextResponse.json({ ok: true, status: 'rejected', refunded: Number(w.amount) })
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Action failed' }, { status: 500 })
  }
}
