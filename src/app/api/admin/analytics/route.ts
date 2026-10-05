import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'

/**
 * GET /api/admin/analytics — deep business analytics for the Analytics tab.
 *
 *  • 30-day registration + order-volume series (daily buckets)
 *  • Top-user leaderboard (by balance, with order + payout counts)
 *  • Platform performance table (orders / volume / completion rate)
 *  • Withdrawal method split (UPI vs bank)
 *  • Derived KPIs: ARPU, AOV, completion rate, bonus payout total
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const start30 = new Date(dayStart)
    start30.setDate(start30.getDate() - 29)

    const [users, orders, withdrawals] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          username: true,
          walletBalance: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      db.order.findMany({
        select: { userId: true, amount: true, bonus: true, platform: true, status: true, createdAt: true },
      }),
      db.withdrawal.findMany({
        select: { userId: true, amount: true, method: true, status: true },
      }),
    ])

    /* ---------------- 30-day series (daily buckets) ---------------- */
    const regSeries: Array<{ label: string; count: number; cumulative: number }> = []
    const volSeries: Array<{ label: string; value: number }> = []
    let cumulative = 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date(dayStart)
      d.setDate(d.getDate() - i)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const regs = users.filter((u) => u.createdAt >= d && u.createdAt < next).length
      cumulative += regs
      regSeries.push({
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        count: regs,
        cumulative,
      })
      volSeries.push({
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: orders
          .filter((o) => o.createdAt >= d && o.createdAt < next)
          .reduce((s, o) => s + Number(o.amount), 0),
      })
    }

    /* ---------------- leaderboard (top 8 by balance) ---------------- */
    const ordersByUser = new Map<string, { count: number; volume: number; completed: number }>()
    for (const o of orders) {
      const e = ordersByUser.get(o.userId) ?? { count: 0, volume: 0, completed: 0 }
      e.count += 1
      e.volume += Number(o.amount)
      if (o.status === 'completed') e.completed += 1
      ordersByUser.set(o.userId, e)
    }
    const wdsByUser = new Map<string, { count: number; paid: number }>()
    for (const w of withdrawals) {
      const e = wdsByUser.get(w.userId) ?? { count: 0, paid: 0 }
      e.count += 1
      if (w.status === 'paid') e.paid += Number(w.amount)
      wdsByUser.set(w.userId, e)
    }
    const leaderboard = [...users]
      .sort((a, b) => Number(b.walletBalance) - Number(a.walletBalance))
      .slice(0, 8)
      .map((u, i) => ({
        rank: i + 1,
        username: u.username,
        balance: Number(u.walletBalance),
        orders: ordersByUser.get(u.id)?.count ?? 0,
        volume: ordersByUser.get(u.id)?.volume ?? 0,
        paidOut: wdsByUser.get(u.id)?.paid ?? 0,
        status: u.status,
      }))

    /* ---------------- platform performance ---------------- */
    const platMap = new Map<string, { count: number; volume: number; completed: number }>()
    for (const o of orders) {
      const e = platMap.get(o.platform) ?? { count: 0, volume: 0, completed: 0 }
      e.count += 1
      e.volume += Number(o.amount)
      if (o.status === 'completed') e.completed += 1
      platMap.set(o.platform, e)
    }
    const platforms = [...platMap.entries()]
      .sort((a, b) => b[1].volume - a[1].volume)
      .map(([name, e]) => ({
        name,
        count: e.count,
        volume: e.volume,
        rate: e.count ? Math.round((e.completed / e.count) * 100) : 0,
      }))

    /* ---------------- payout method split ---------------- */
    const methodSplit = ['upi', 'bank'].map((m) => ({
      name: m.toUpperCase(),
      count: withdrawals.filter((w) => w.method === m).length,
      amount: withdrawals.filter((w) => w.method === m).reduce((s, w) => s + Number(w.amount), 0),
    }))

    /* ---------------- derived KPIs ---------------- */
    const completedOrders = orders.filter((o) => o.status === 'completed').length
    const totalVolume = orders.reduce((s, o) => s + Number(o.amount), 0)
    const kpis = {
      arpu: users.length ? users.reduce((s, u) => s + Number(u.walletBalance), 0) / users.length : 0,
      aov: orders.length ? totalVolume / orders.length : 0,
      completionRate: orders.length ? Math.round((completedOrders / orders.length) * 100) : 0,
      bonusTotal: orders.reduce((s, o) => s + Number(o.bonus), 0),
      activeUsers: ordersByUser.size,
      dormantUsers: users.length - ordersByUser.size,
      new30: users.filter((u) => u.createdAt >= start30).length,
      engagedLogins: users.filter(
        (u) => u.lastLoginAt && Date.now() - u.lastLoginAt.getTime() < 7 * 24 * 3600 * 1000
      ).length,
    }

    return NextResponse.json({
      ok: true,
      kpis,
      regSeries,
      volSeries,
      leaderboard,
      platforms,
      methodSplit,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load analytics' }, { status: 500 })
  }
}
