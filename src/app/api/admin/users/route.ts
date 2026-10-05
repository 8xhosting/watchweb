import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { adminLog } from '@/lib/app-config'

/**
 * GET   /api/admin/users?q=<search>  — user list (newest first, optional search)
 * PATCH /api/admin/users             — master-control actions:
 *        { id, action: "ban" | "unban" | "credit" | "debit", amount?, note? }
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
    // mobile search only when the query actually looks like a number
    // (avoids "admtest1" → digits "1" matching every mobile containing 1)
    const digits = q.replace(/\D/g, '')
    const users = await db.user.findMany({
      where: q
        ? {
            OR: [
              { username: { contains: q } },
              ...(digits.length >= 4 ? [{ mobile: { contains: digits } }] : []),
            ],
          }
        : undefined,
      select: {
        id: true,
        username: true,
        mobile: true,
        walletBalance: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        mobile: String(u.mobile).replace(/^(\d{5})(\d{5})$/, '$1•••••'),
        balance: Number(u.walletBalance),
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        orders: 0, // filled lazily by the client via orders filter when needed
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load users' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id ?? '')
    const action = String(body?.action ?? '')
    const amount = Number(body?.amount ?? 0)
    const note = String(body?.note ?? '')

    const user = await db.user.findUnique({ where: { id }, select: { id: true, username: true, walletBalance: true, status: true } })
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    if (action === 'ban' || action === 'unban') {
      const status = action === 'ban' ? 'banned' : 'active'
      await db.user.update({ where: { id }, data: { status } })
      void adminLog(action === 'ban' ? 'user.ban' : 'user.unban', `${user.username}${note ? ' — ' + note : ''}`)
      return NextResponse.json({ ok: true, status })
    }

    if (action === 'credit' || action === 'debit') {
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ ok: false, error: 'Amount must be a positive number' }, { status: 400 })
      }
      const next =
        action === 'credit'
          ? Number(user.walletBalance) + amount
          : Number(user.walletBalance) - amount
      if (next < 0) {
        return NextResponse.json(
          { ok: false, error: `Balance would go negative (current ₹${user.walletBalance})` },
          { status: 400 }
        )
      }
      const updated = await db.user.update({
        where: { id },
        data: { walletBalance: next },
        select: { walletBalance: true },
      })
      void adminLog(
        action === 'credit' ? 'user.credit' : 'user.debit',
        `${user.username} ${action === 'credit' ? '+' : '-'}₹${amount}${note ? ' — ' + note : ''}`
      )
      return NextResponse.json({ ok: true, balance: Number(updated.walletBalance) })
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Action failed' }, { status: 500 })
  }
}
