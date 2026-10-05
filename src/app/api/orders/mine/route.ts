import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'

/**
 * GET /api/orders/mine — REAL records for the Orders page (and Profile stats).
 *
 *   orders[]   — every live-order payment the user tapped (Order table)
 *   addMoney[] — wallet top-ups NOT tied to a live order (Deposit table;
 *                order-linked deposits are already represented as orders)
 *
 * Display status is RESOLVED server-side so the UI never shows a paid order
 * as "processing": a pending Order whose linked deposit settled becomes
 * "completed" even if the Order row predates the auto-complete upgrade.
 */

type OrderStatus = 'completed' | 'processing' | 'failed'

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    return Response.json({ ok: false, error: 'Login required' }, { status: 401 })
  }

  const [orders, deposits] = await Promise.all([
    db.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 60 }),
    db.deposit.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 60 }),
  ])

  const depByMerchant = new Map(deposits.map((d) => [d.merchantOrderId, d.status]))
  const linkedIds = new Set(orders.map((o) => o.merchantOrderId).filter(Boolean))

  const resolveStatus = (o: { status: string; merchantOrderId: string }): OrderStatus => {
    if (o.status === 'completed') return 'completed'
    if (o.status === 'expired') return 'failed'
    const ds = o.merchantOrderId ? depByMerchant.get(o.merchantOrderId) : undefined
    if (ds === 'success') return 'completed'
    if (ds === 'failed') return 'failed'
    return 'processing'
  }

  return Response.json({
    ok: true,
    orders: orders.map((o) => ({
      id: o.merchantOrderId || o.id,
      platform: o.platform,
      amount: o.amount,
      bonus: o.bonus,
      status: resolveStatus(o),
      createdAt: o.createdAt,
    })),
    addMoney: deposits
      .filter((d) => !linkedIds.has(d.merchantOrderId))
      .map((d) => ({
        id: d.merchantOrderId,
        amount: d.amount,
        status: d.status, // pending | success | failed
        createdAt: d.createdAt,
      })),
  })
}
