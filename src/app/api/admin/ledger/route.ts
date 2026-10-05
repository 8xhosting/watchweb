import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'

/**
 * GET /api/admin/ledger?type=&q=&take=
 *
 * Unified money ledger — every rupee movement in the platform:
 *   credit | debit | order_bonus | withdrawal_hold | withdrawal_paid | withdrawal_refund
 *
 * Returns the newest movements plus summary totals (in / out / net).
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const params = new URL(req.url).searchParams
    const type = params.get('type')?.trim()
    const q = params.get('q')?.trim() ?? ''
    const take = Math.min(200, Math.max(10, Number(params.get('take') ?? 60)))

    const where = {
      ...(type && type !== 'all' ? { type } : {}),
      ...(q
        ? {
            OR: [
              { note: { contains: q } },
              { user: { is: { username: { contains: q } } } },
            ],
          }
        : {}),
    }

    const [rows, all, allUsers] = await Promise.all([
      db.transaction.findMany({
        where,
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      db.transaction.findMany({
        select: { type: true, amount: true },
      }),
      db.user.findMany({ select: { walletBalance: true } }),
    ])

    const sumOf = (types: string[]) =>
      all.filter((t) => types.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0)

    const moneyIn = sumOf(['credit', 'order_bonus', 'withdrawal_refund']) // value returned to wallets
    const moneyOut = sumOf(['debit', 'withdrawal_hold', 'withdrawal_paid']) // value taken from wallets
    const typeCounts: Record<string, number> = {}
    for (const t of all) typeCounts[t.type] = (typeCounts[t.type] ?? 0) + 1

    return NextResponse.json({
      ok: true,
      summary: {
        total: all.length,
        moneyIn,
        moneyOut,
        net: moneyIn - moneyOut,
        liability: allUsers.reduce((s, u) => s + Number(u.walletBalance), 0),
        typeCounts,
      },
      transactions: rows.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        note: t.note,
        username: t.user?.username ?? '—',
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load ledger' }, { status: 500 })
  }
}
