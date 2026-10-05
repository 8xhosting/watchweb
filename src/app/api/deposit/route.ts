import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'
import {
  createCollectionOrder,
  newMerchantOrderId,
  pickGateway,
  reconcileDeposit,
} from '@/lib/qwackpay'

/**
 * User deposit (money-in) through a QwackPay gateway.
 *
 * POST /api/deposit          { amount } → { ok, paymentUrl, orderId, gateway }
 * GET  /api/deposit?order=X  → deposit status (reconciles with gateway when pending)
 * GET  /api/deposit?latest=1 → latest deposit of the session user
 */

function siteOrigin(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    return Response.json({ ok: false, error: 'Login required' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { amount?: unknown } | null
  const amount = Number(body?.amount)
  if (!Number.isFinite(amount) || amount < 100 || amount > 100000) {
    return Response.json(
      { ok: false, error: 'Amount must be between ₹100 and ₹100,000' },
      { status: 400 },
    )
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, mobile: true, status: true },
  })
  if (!user) return Response.json({ ok: false, error: 'User not found' }, { status: 404 })
  if (user.status === 'banned') {
    return Response.json({ ok: false, error: 'Account restricted' }, { status: 403 })
  }

  const gw = await pickGateway(amount)
  if (!gw) {
    return Response.json(
      { ok: false, error: 'No payment gateway available for this amount. Please try later.' },
      { status: 503 },
    )
  }

  const merchantOrderId = newMerchantOrderId()
  const origin = siteOrigin(req)
  const emailUser = user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || 'wpuser'

  // persist FIRST — even if the gateway call fails we keep the intent for audit
  const deposit = await db.deposit.create({
    data: {
      userId: user.id,
      gatewayId: gw.id,
      merchantOrderId,
      amount: Math.round(amount * 100) / 100,
      status: 'pending',
    },
  })

  const res = await createCollectionOrder({
    gw,
    merchantOrderId,
    amount,
    customerName: user.username,
    customerPhone: user.mobile,
    customerEmail: `${emailUser}@watchpay.app`,
    returnUrl: origin,
    notifyUrl: `${origin}/api/deposit/notify?gw=${gw.id}`,
  })

  if (!res.ok || !res.paymentUrl) {
    await db.deposit.update({
      where: { id: deposit.id },
      data: { status: 'failed', qwackOrderId: res.qwackOrderId ?? '' },
    })
    return Response.json(
      { ok: false, error: res.message || 'Payment gateway rejected the order. Try again.' },
      { status: 502 },
    )
  }

  await db.deposit.update({
    where: { id: deposit.id },
    data: { qwackOrderId: res.qwackOrderId ?? '' },
  })

  return Response.json({
    ok: true,
    paymentUrl: res.paymentUrl,
    orderId: merchantOrderId,
    gateway: gw.label,
  })
}

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    return Response.json({ ok: false, error: 'Login required' }, { status: 401 })
  }
  const url = new URL(req.url)

  if (url.searchParams.get('history')) {
    const rows = await db.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return Response.json({
      ok: true,
      deposits: rows.map((d) => ({
        orderId: d.merchantOrderId,
        amount: d.amount,
        status: d.status,
        utr: d.utr,
        createdAt: d.createdAt,
      })),
    })
  }

  let deposit: Awaited<ReturnType<typeof db.deposit.findFirst>> = null
  if (url.searchParams.get('latest')) {
    deposit = await db.deposit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    const order = url.searchParams.get('order') ?? ''
    deposit = order
      ? await db.deposit.findFirst({ where: { merchantOrderId: order, userId } })
      : null
  }
  if (!deposit) return Response.json({ ok: false, error: 'Deposit not found' }, { status: 404 })

  // pending → ask the gateway once (covers missed callbacks / localhost dev)
  if (deposit.status === 'pending') {
    try {
      await reconcileDeposit(deposit.merchantOrderId)
      const fresh = await db.deposit.findUnique({ where: { id: deposit.id } })
      if (fresh) deposit = fresh
    } catch {
      // keep pending — the async callback can still settle it later
    }
  }

  return Response.json({
    ok: true,
    deposit: {
      orderId: deposit.merchantOrderId,
      amount: deposit.amount,
      status: deposit.status,
      utr: deposit.utr,
      createdAt: deposit.createdAt,
    },
  })
}
