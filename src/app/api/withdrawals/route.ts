import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'

/**
 * GET  /api/withdrawals — the logged-in user's own payout history (latest 20).
 * POST /api/withdrawals — create a payout request.
 *        { amount, method: "upi" | "bank", upiId?, account?, ifsc? }
 *
 * BALANCE MODEL: the amount is DEDUCTED immediately (hold) so the same
 * balance cannot be spent twice while the request is pending. If the admin
 * rejects the request, /api/admin/withdrawals refunds it automatically.
 */
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }
    const rows = await db.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, amount: true, method: true, status: true, createdAt: true },
    })
    return NextResponse.json({
      ok: true,
      withdrawals: rows.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        method: w.method,
        status: w.status,
        when: w.createdAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const amount = Number(body?.amount)
    const method = String(body?.method ?? '')
    const upiId = String(body?.upiId ?? '').trim()
    const account = String(body?.account ?? '').trim()
    const ifsc = String(body?.ifsc ?? '').trim().toUpperCase()

    if (!Number.isFinite(amount) || amount < 200) {
      return NextResponse.json(
        { ok: false, error: 'Minimum withdrawal is ₹200' },
        { status: 400 }
      )
    }
    if (method !== 'upi' && method !== 'bank') {
      return NextResponse.json({ ok: false, error: 'Choose a payout method' }, { status: 400 })
    }
    if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid UPI ID' }, { status: 400 })
    }
    if (method === 'bank' && (account.length < 9 || ifsc.length < 5)) {
      return NextResponse.json(
        { ok: false, error: 'Enter valid bank details' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, status: true },
    })
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }
    if (user.status === 'banned') {
      return NextResponse.json(
        { ok: false, error: 'Your account has been suspended. Contact support.' },
        { status: 403 }
      )
    }
    if (amount > Number(user.walletBalance)) {
      return NextResponse.json(
        { ok: false, error: 'Insufficient wallet balance' },
        { status: 400 }
      )
    }

    // atomic-ish hold: deduct now, refund on reject (admin side)
    await db.user.update({
      where: { id: userId },
      data: { walletBalance: Number(user.walletBalance) - amount },
    })
    const w = await db.withdrawal.create({
      data: {
        userId,
        amount,
        method,
        destination:
          method === 'upi' ? upiId : `A/C ••${account.slice(-4)} · ${ifsc}`,
        status: 'pending',
      },
    })

    return NextResponse.json({ ok: true, id: w.id, status: 'pending' })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not create the withdrawal request' },
      { status: 500 }
    )
  }
}
