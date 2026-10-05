import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { getAppConfig, adminLog, saveAppConfig } from '@/lib/app-config'

/**
 * GET  /api/admin/security — Security Centre data:
 *   • payout guard-rail status (paid today vs daily limit)
 *   • failed admin logins + lockouts (audit trail, 48h window)
 *   • risk signals (banned users holding balance, high-value wallets,
 *     stuck processing orders, pending payout pressure)
 *
 * PATCH /api/admin/security — { withdrawMin?, withdrawMax?, dailyPayoutLimit? }
 *   saves the payout guard rails (enforced live by /api/withdrawals).
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const last48h = new Date(Date.now() - 48 * 3600 * 1000)

    const [cfg, paidAgg, failedLogins, adminLogins, users, stuckOrders, pendingAgg] =
      await Promise.all([
        getAppConfig(),
        db.withdrawal.aggregate({
          where: { status: 'paid', updatedAt: { gte: dayStart } },
          _sum: { amount: true },
          _count: true,
        }),
        db.adminLog.findMany({
          where: { action: { in: ['admin.login_failed', 'admin.lockout', 'admin.login_blocked'] }, createdAt: { gte: last48h } },
          orderBy: { createdAt: 'desc' },
          take: 12,
        }),
        db.adminLog.findMany({
          where: { action: 'admin.login', createdAt: { gte: last48h } },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        db.user.findMany({
          select: { username: true, walletBalance: true, status: true, lastLoginAt: true, createdAt: true },
        }),
        db.order.findMany({
          where: { status: 'processing', createdAt: { lt: new Date(Date.now() - 3600 * 1000) } },
          select: { id: true, amount: true, platform: true, createdAt: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        db.withdrawal.aggregate({
          where: { status: 'pending' },
          _sum: { amount: true },
          _count: true,
        }),
      ])

    const paidToday = Number(paidAgg._sum.amount ?? 0)
    const usagePct = Math.min(100, Math.round((paidToday / Math.max(1, cfg.dailyPayoutLimit)) * 100))

    const bannedWithBalance = users
      .filter((u) => u.status === 'banned' && Number(u.walletBalance) > 0)
      .map((u) => ({ username: u.username, balance: Number(u.walletBalance) }))
    const topWallets = [...users]
      .sort((a, b) => Number(b.walletBalance) - Number(a.walletBalance))
      .slice(0, 5)
      .map((u) => ({ username: u.username, balance: Number(u.walletBalance), status: u.status }))
    const neverLogged = users.filter((u) => !u.lastLoginAt).length

    return NextResponse.json({
      ok: true,
      payout: {
        withdrawMin: cfg.withdrawMin,
        withdrawMax: cfg.withdrawMax,
        dailyPayoutLimit: cfg.dailyPayoutLimit,
        paidToday,
        paidCountToday: paidAgg._count ?? 0,
        usagePct,
        pendingCount: pendingAgg._count ?? 0,
        pendingAmount: Number(pendingAgg._sum.amount ?? 0),
      },
      adminAuth: {
        failedLogins: failedLogins.map((l) => ({
          detail: l.detail,
          createdAt: l.createdAt.toISOString(),
        })),
        recentLogins: adminLogins.map((l) => ({
          detail: l.detail,
          createdAt: l.createdAt.toISOString(),
        })),
        lockouts48h: failedLogins.filter((l) => l.action === 'admin.lockout').length,
      },
      risks: {
        bannedWithBalance,
        topWallets,
        neverLogged,
        stuckOrders: stuckOrders.map((o) => ({
          id: o.id,
          amount: Number(o.amount),
          platform: o.platform,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load security data' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const patch: Record<string, number> = {}
    if (body?.withdrawMin !== undefined) patch.withdrawMin = Number(body.withdrawMin)
    if (body?.withdrawMax !== undefined) patch.withdrawMax = Number(body.withdrawMax)
    if (body?.dailyPayoutLimit !== undefined) patch.dailyPayoutLimit = Number(body.dailyPayoutLimit)
    if (!Object.keys(patch).length) {
      return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 })
    }

    const cfg = await saveAppConfig(patch)
    void adminLog('security.limits', JSON.stringify(patch).slice(0, 200))
    return NextResponse.json({
      ok: true,
      payout: {
        withdrawMin: cfg.withdrawMin,
        withdrawMax: cfg.withdrawMax,
        dailyPayoutLimit: cfg.dailyPayoutLimit,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save limits' }, { status: 500 })
  }
}
