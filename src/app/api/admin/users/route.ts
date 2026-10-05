import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { adminLog } from '@/lib/app-config'
import { recordTx } from '@/lib/ledger'

/**
 * GET   /api/admin/users?q=<search>&sort=<newest|balance|username>
 *                            — user list (searchable + sortable)
 * GET   /api/admin/users?detail=<id>
 *                            — full 360° profile: orders, payouts, ledger
 * GET   /api/admin/users?export=csv
 *                            — full user table as CSV download
 * PATCH /api/admin/users     — master-control actions:
 *        { id, action: "ban" | "unban" | "credit" | "debit", amount?, note? }
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const params = new URL(req.url).searchParams
    const detailId = params.get('detail')?.trim()
    const exportCsv = params.get('export') === 'csv'

    /* ---------------- 360° user detail ---------------- */
    if (detailId) {
      const user = await db.user.findUnique({
        where: { id: detailId },
        select: {
          id: true,
          username: true,
          mobile: true,
          walletBalance: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })
      if (!user) {
        return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
      }
      const [orders, withdrawals, txs] = await Promise.all([
        db.order.findMany({
          where: { userId: detailId },
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: { amount: true, bonus: true, platform: true, status: true, createdAt: true },
        }),
        db.withdrawal.findMany({
          where: { userId: detailId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { amount: true, method: true, status: true, createdAt: true },
        }),
        db.transaction.findMany({
          where: { userId: detailId },
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: { type: true, amount: true, balanceAfter: true, note: true, createdAt: true },
        }),
      ])
      return NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          mobile: String(user.mobile).replace(/^(\d{5})(\d{5})$/, '$1•••••'),
          balance: Number(user.walletBalance),
          status: user.status,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
        },
        orders: orders.map((o) => ({
          amount: Number(o.amount),
          bonus: Number(o.bonus),
          platform: o.platform,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
        withdrawals: withdrawals.map((w) => ({
          amount: Number(w.amount),
          method: w.method,
          status: w.status,
          createdAt: w.createdAt.toISOString(),
        })),
        transactions: txs.map((t) => ({
          type: t.type,
          amount: Number(t.amount),
          balanceAfter: Number(t.balanceAfter),
          note: t.note,
          createdAt: t.createdAt.toISOString(),
        })),
      })
    }

    /* ---------------- CSV export ---------------- */
    if (exportCsv) {
      const all = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          mobile: true,
          walletBalance: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })
      const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
      const lines = [
        'username,mobile,balance,status,joined,last_login',
        ...all.map((u) =>
          [
            esc(u.username),
            esc(String(u.mobile)),
            esc(Number(u.walletBalance).toFixed(2)),
            esc(u.status),
            esc(u.createdAt.toISOString()),
            esc(u.lastLoginAt?.toISOString() ?? ''),
          ].join(',')
        ),
      ]
      return new NextResponse(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="watchpay-users-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    /* ---------------- searchable / sortable list ---------------- */
    const q = params.get('q')?.trim() ?? ''
    const sort = params.get('sort')?.trim() ?? 'newest'
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
      orderBy: sort === 'balance' ? { walletBalance: 'desc' } : { createdAt: 'desc' },
      take: 100,
    })

    const rows = users.map((u) => ({
      id: u.id,
      username: u.username,
      mobile: String(u.mobile).replace(/^(\d{5})(\d{5})$/, '$1•••••'),
      balance: Number(u.walletBalance),
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      orders: 0, // filled lazily by the client via orders filter when needed
    }))
    if (sort === 'username') rows.sort((a, b) => a.username.localeCompare(b.username))

    return NextResponse.json({ ok: true, users: rows })
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
      recordTx({
        userId: user.id,
        type: action === 'credit' ? 'credit' : 'debit',
        amount,
        balanceAfter: Number(updated.walletBalance),
        note: `admin ${admin}: ${user.username}${note ? ' — ' + note : ''}`,
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
