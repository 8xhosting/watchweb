import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { maskKey } from '@/lib/qwackpay'

/**
 * Admin payment-gateway management — MULTI-KEY / MULTI-MERCHANT.
 * The same merchantId can be registered several times with different API
 * keys (rotation, load split, per-amount ranges). Keys are never returned
 * un-masked.
 *
 * GET     /api/admin/gateways      → gateways (masked) + recent deposits + KPIs
 * POST    /api/admin/gateways      → add gateway { label, merchantId, apiKey, … }
 * PATCH   /api/admin/gateways      → update { id, …fields, apiKey? }
 * DELETE  /api/admin/gateways?id=  → remove gateway
 */

const num = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100))
}

async function logAdmin(action: string, detail: string) {
  await db.adminLog.create({ data: { action, detail: detail.slice(0, 200) } }).catch(() => {})
}

export async function GET(req: Request) {
  if (!getAdminFromRequest(req)) return adminUnauthorized()

  const [gateways, deposits, todayStart] = await Promise.all([
    db.paymentGateway.findMany({ orderBy: { createdAt: 'desc' } }),
    db.deposit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { user: { select: { username: true } }, gateway: { select: { label: true } } },
    }),
    (function () {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    })(),
  ])

  const [todayAgg, allAgg, successAgg] = await Promise.all([
    db.deposit.aggregate({
      where: { status: 'success', createdAt: { gte: todayStart } },
      _count: true,
      _sum: { amount: true },
    }),
    db.deposit.aggregate({
      where: { status: { in: ['success', 'failed'] } },
      _count: true,
    }),
    db.deposit.aggregate({
      where: { status: 'success' },
      _count: true,
    }),
  ])
  const attempted = allAgg._count ?? 0
  const succeeded = successAgg._count ?? 0

  return Response.json({
    ok: true,
    gateways: gateways.map((g) => ({
      id: g.id,
      label: g.label,
      provider: g.provider,
      merchantId: g.merchantId,
      apiUrl: g.apiUrl,
      keyMasked: maskKey(g.apiKey),
      payinRate: g.payinRate,
      payoutRate: g.payoutRate,
      payoutFlat: g.payoutFlat,
      minAmount: g.minAmount,
      maxAmount: g.maxAmount,
      weight: g.weight,
      active: g.active,
      createdAt: g.createdAt,
    })),
    deposits: deposits.map((d) => ({
      id: d.id,
      orderId: d.merchantOrderId,
      username: d.user?.username ?? '—',
      amount: d.amount,
      status: d.status,
      utr: d.utr,
      gateway: d.gateway?.label ?? '—',
      createdAt: d.createdAt,
    })),
    kpis: {
      totalGateways: gateways.length,
      activeGateways: gateways.filter((g) => g.active).length,
      depositsToday: todayAgg._count ?? 0,
      amountToday: todayAgg._sum?.amount ?? 0,
      successRate: attempted > 0 ? Math.round((succeeded / attempted) * 100) : 100,
    },
  })
}

export async function POST(req: Request) {
  if (!getAdminFromRequest(req)) return adminUnauthorized()
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null

  const label = String(b?.label ?? '').trim()
  const merchantId = String(b?.merchantId ?? '').trim()
  const apiKey = String(b?.apiKey ?? '').trim()
  if (!label || !merchantId || !apiKey) {
    return Response.json(
      { ok: false, error: 'Label, Merchant ID and API Key are required' },
      { status: 400 },
    )
  }

  const gw = await db.paymentGateway.create({
    data: {
      label,
      merchantId,
      apiKey,
      provider: String(b?.provider ?? 'qwackpay'),
      apiUrl: String(b?.apiUrl ?? 'https://qwackpay.com/api/v1').trim() || 'https://qwackpay.com/api/v1',
      payinRate: num(b?.payinRate, 7, 0, 100),
      payoutRate: num(b?.payoutRate, 3, 0, 100),
      payoutFlat: num(b?.payoutFlat, 6, 0, 1000),
      minAmount: num(b?.minAmount, 100, 1, 1000000),
      maxAmount: num(b?.maxAmount, 100000, 1, 10000000),
      weight: Math.round(num(b?.weight, 1, 1, 10)),
      active: b?.active === undefined ? true : Boolean(b?.active),
    },
  })
  await logAdmin('gateway.create', `${label} · merchant ${merchantId} · ${maskKey(apiKey)}`)
  return Response.json({ ok: true, id: gw.id })
}

export async function PATCH(req: Request) {
  if (!getAdminFromRequest(req)) return adminUnauthorized()
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const id = String(b?.id ?? '')
  if (!id) return Response.json({ ok: false, error: 'Gateway id required' }, { status: 400 })

  const existing = await db.paymentGateway.findUnique({ where: { id } })
  if (!existing) return Response.json({ ok: false, error: 'Gateway not found' }, { status: 404 })

  const newKey = String(b?.apiKey ?? '').trim()
  const data: Record<string, unknown> = {
    ...(b?.label !== undefined ? { label: String(b.label).trim() || existing.label } : {}),
    ...(b?.merchantId !== undefined
      ? { merchantId: String(b.merchantId).trim() || existing.merchantId }
      : {}),
    ...(b?.apiUrl !== undefined ? { apiUrl: String(b.apiUrl).trim() || existing.apiUrl } : {}),
    ...(b?.payinRate !== undefined ? { payinRate: num(b.payinRate, existing.payinRate, 0, 100) } : {}),
    ...(b?.payoutRate !== undefined ? { payoutRate: num(b.payoutRate, existing.payoutRate, 0, 100) } : {}),
    ...(b?.payoutFlat !== undefined ? { payoutFlat: num(b.payoutFlat, existing.payoutFlat, 0, 1000) } : {}),
    ...(b?.minAmount !== undefined ? { minAmount: num(b.minAmount, existing.minAmount, 1, 1000000) } : {}),
    ...(b?.maxAmount !== undefined ? { maxAmount: num(b.maxAmount, existing.maxAmount, 1, 10000000) } : {}),
    ...(b?.weight !== undefined ? { weight: Math.round(num(b.weight, existing.weight, 1, 10)) } : {}),
    ...(b?.active !== undefined ? { active: Boolean(b.active) } : {}),
    ...(newKey ? { apiKey: newKey } : {}), // empty key = keep existing
  }

  await db.paymentGateway.update({ where: { id }, data })
  await logAdmin(
    'gateway.update',
    `${String(b?.label ?? existing.label)} · active=${String(b?.active ?? existing.active)}${newKey ? ' · key rotated' : ''}`,
  )
  return Response.json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!getAdminFromRequest(req)) return adminUnauthorized()
  const id = new URL(req.url).searchParams.get('id') ?? ''
  const existing = await db.paymentGateway.findUnique({ where: { id } })
  if (!existing) return Response.json({ ok: false, error: 'Gateway not found' }, { status: 404 })

  const used = await db.deposit.count({ where: { gatewayId: id } })
  if (used > 0) {
    return Response.json(
      { ok: false, error: `Gateway has ${used} deposit(s) — deactivate it instead of deleting.` },
      { status: 409 },
    )
  }
  await db.paymentGateway.delete({ where: { id } })
  await logAdmin('gateway.delete', `${existing.label} · merchant ${existing.merchantId}`)
  return Response.json({ ok: true })
}
