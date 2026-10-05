import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { getAppConfig, adminLog } from '@/lib/app-config'
import { recordTx } from '@/lib/ledger'
import { PLATFORMS } from '@/lib/order-rules'

/**
 * GET   /api/admin/orders?status=&q=  — persisted payment orders (newest first)
 * POST  /api/admin/orders             — create a manual order for a user
 *                                       { username, amount, platform, duration? }
 * PATCH /api/admin/orders             — { id, action: "complete" | "expire" | "delete" }
 */
export async function GET(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const params = new URL(req.url).searchParams
    const status = params.get('status')?.trim()
    const q = params.get('q')?.trim() ?? ''

    const orders = await db.order.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(q
          ? {
              OR: [
                { platform: { contains: q } },
                { user: { is: { username: { contains: q } } } },
              ],
            }
          : {}),
      },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      orders: orders.map((o) => ({
        id: o.id,
        username: o.user.username,
        amount: Number(o.amount),
        bonus: Number(o.bonus),
        platform: o.platform,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load orders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body?.username ?? '').trim()
    const amount = Number(body?.amount)
    const platform = String(body?.platform ?? '').trim()
    const bonusPercent = Number(body?.bonusPercent ?? 0)

    if (!username) {
      return NextResponse.json({ ok: false, error: 'Username is required' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Enter a valid amount' }, { status: 400 })
    }
    if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
      return NextResponse.json(
        { ok: false, error: `Platform must be one of: ${PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }
    // platform master-switch — admin can turn any platform OFF
    const cfg = await getAppConfig()
    if (cfg.disabledPlatforms.includes(platform)) {
      return NextResponse.json(
        { ok: false, error: `${platform} is currently disabled in Master Control` },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { username }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ ok: false, error: `User "${username}" not found` }, { status: 404 })
    }

    const pct = Number.isFinite(bonusPercent) && bonusPercent > 0 ? bonusPercent : 12.5
    // pct is a PERCENT (12.5 = 12.5%) — divide by 100!
    const finalBonus = Math.round(amount * (pct / 100) * 100) / 100

    const order = await db.order.create({
      data: {
        userId: user.id,
        amount,
        bonus: finalBonus,
        platform,
        status: 'processing',
      },
    })

    void adminLog('order.create', `manual order ₹${amount} on ${platform} for ${username}`)
    return NextResponse.json({ ok: true, id: order.id })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create order' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id ?? '')
    const action = String(body?.action ?? '')

    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        amount: true,
        bonus: true,
        platform: true,
        userId: true,
        user: { select: { username: true, walletBalance: true, status: true } },
      },
    })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    }

    if (action === 'complete' || action === 'expire') {
      const status = action === 'complete' ? 'completed' : 'expired'

      // Guard: if the gateway callback already settled this order (auto-
      // completed + bonus credited), re-completing must NOT pay the bonus twice.
      const wasProcessing = order.status === 'processing'
      await db.order.update({ where: { id }, data: { status } })

      // ADVANCED: completing an order AUTO-CREDITS the bonus to the user's
      // wallet (only on a genuine processing → completed transition).
      let bonusPaid = 0
      if (
        action === 'complete' &&
        wasProcessing &&
        Number(order.bonus) > 0 &&
        order.user.status !== 'banned'
      ) {
        bonusPaid = Number(order.bonus)
        const newBalance = Number(order.user.walletBalance) + bonusPaid
        await db.user.update({
          where: { id: order.userId },
          data: { walletBalance: newBalance },
        })
        recordTx({
          userId: order.userId,
          type: 'order_bonus',
          amount: bonusPaid,
          balanceAfter: newBalance,
          note: `${order.platform} order ₹${order.amount} completed`,
        })
      }

      void adminLog(`order.${action}`, `₹${order.amount} on ${order.platform} (${order.user.username})`)
      return NextResponse.json({ ok: true, status, bonusPaid })
    }

    if (action === 'delete') {
      await db.order.delete({ where: { id } })
      void adminLog('order.delete', `₹${order.amount} on ${order.platform}`)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Action failed' }, { status: 500 })
  }
}
