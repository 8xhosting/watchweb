import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { getAppConfig } from '@/lib/app-config'

/**
 * GET /api/admin/overview — Master Control dashboard KPIs.
 *
 * Everything is computed from the REAL database (users, orders,
 * withdrawals, settings) plus a measured DB latency so the admin sees
 * honest system health. The 7-day series and platform split are grouped
 * in JS after a bounded fetch (fine for the current data volume).
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  const started = Date.now()
  try {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(dayStart)
    weekStart.setDate(weekStart.getDate() - 6)

    const [users, orders, withdrawals, config] = await Promise.all([
      db.user.findMany({
        select: {
          username: true,
          mobile: true,
          walletBalance: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.order.findMany({
        select: { amount: true, bonus: true, platform: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.withdrawal.findMany({
        select: { amount: true, status: true, method: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      getAppConfig(),
    ])

    const dbLatency = Date.now() - started

    /* ------------------------------ users ------------------------------ */
    const totalUsers = users.length
    const newToday = users.filter((u) => u.createdAt >= dayStart).length
    const banned = users.filter((u) => u.status === 'banned').length
    const walletLiability = users.reduce((s, u) => s + Number(u.walletBalance), 0)

    // 7-day registration series (oldest → newest)
    const regSeries: Array<{ label: string; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dayStart)
      d.setDate(d.getDate() - i)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      regSeries.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        count: users.filter((u) => u.createdAt >= d && u.createdAt < next).length,
      })
    }

    /* ------------------------------ orders ----------------------------- */
    const ordersToday = orders.filter((o) => o.createdAt >= dayStart)
    const volumeToday = ordersToday.reduce((s, o) => s + Number(o.amount), 0)
    const bonusTotal = orders.reduce((s, o) => s + Number(o.bonus), 0)
    const statusCounts = {
      processing: orders.filter((o) => o.status === 'processing').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      expired: orders.filter((o) => o.status === 'expired').length,
    }

    // 7-day order volume series
    const orderSeries: Array<{ label: string; value: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dayStart)
      d.setDate(d.getDate() - i)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      orderSeries.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        value: orders
          .filter((o) => o.createdAt >= d && o.createdAt < next)
          .reduce((s, o) => s + Number(o.amount), 0),
      })
    }

    // platform distribution (top 6)
    const platformMap = new Map<string, number>()
    for (const o of orders) {
      platformMap.set(o.platform, (platformMap.get(o.platform) ?? 0) + 1)
    }
    const platforms = [...platformMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }))

    /* --------------------------- withdrawals --------------------------- */
    const pendingW = withdrawals.filter((w) => w.status === 'pending')
    const paidW = withdrawals.filter((w) => w.status === 'paid')
    const rejectedW = withdrawals.filter((w) => w.status === 'rejected')

    /* ---------------------------- activity ----------------------------- */
    const recentUsers = users.slice(0, 5).map((u) => ({
      username: u.username,
      mobile: String(u.mobile).replace(/^(\d{5})(\d{5})$/, '$1•••••'),
      balance: Number(u.walletBalance),
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    }))
    const recentOrders = orders.slice(0, 6).map((o) => ({
      amount: Number(o.amount),
      platform: o.platform,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }))
    const recentLogs = await db.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { action: true, detail: true, createdAt: true },
    })

    return NextResponse.json({
      ok: true,
      config,
      dbLatency,
      users: {
        total: totalUsers,
        newToday,
        banned,
        walletLiability,
        series: regSeries,
        recent: recentUsers,
      },
      orders: {
        total: orders.length,
        today: ordersToday.length,
        volumeToday,
        bonusTotal,
        statusCounts,
        series: orderSeries,
        platforms,
        recent: recentOrders,
      },
      withdrawals: {
        pending: pendingW.length,
        pendingAmount: pendingW.reduce((s, w) => s + Number(w.amount), 0),
        paid: paidW.length,
        paidAmount: paidW.reduce((s, w) => s + Number(w.amount), 0),
        rejected: rejectedW.length,
        total: withdrawals.length,
      },
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}
