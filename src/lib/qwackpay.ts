import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { recordTx } from '@/lib/ledger'

/**
 * QwackPay payment-gateway helper — signature, API calls and settlement.
 *
 * API contract (docs: https://6ue86z5lbf.apifox.cn — access 4RoZQsGi):
 *   POST {apiUrl}/order/create   → collection (deposit) order → payment_url
 *   POST {apiUrl}/order/query    → merchant order status
 *   POST {apiUrl}/payout/create  → payout (withdrawal) order  [IP whitelist]
 *   POST notify_url              → async callback, must answer plain "success"
 *
 * Signature: params sorted ASCII asc (exclude `sign` + empty values),
 * joined k=v&…, appended &key=API_KEY, MD5 uppercased.
 */

export type GatewayRecord = {
  id: string
  label: string
  provider: string
  merchantId: string
  apiKey: string
  apiUrl: string
  payinRate: number
  payoutRate: number
  payoutFlat: number
  minAmount: number
  maxAmount: number
  weight: number
  active: boolean
}

/* ------------------------------ signature ------------------------------ */

export function qwackSign(
  params: Record<string, string | number | undefined | null>,
  apiKey: string,
): string {
  const parts = Object.entries(params)
    .filter(([k, v]) => k !== 'sign' && v !== undefined && v !== null && String(v) !== '')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${String(v)}`)
  return createHash('md5')
    .update(`${parts.join('&')}&key=${apiKey}`)
    .digest('hex')
    .toUpperCase()
}

/** Never leak the full key to a client — mask it. */
export function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
}

/** Unique merchant order id, e.g. WP3F9K2X8QD2A */
export function newMerchantOrderId(prefix = 'WP'): string {
  const t = Date.now().toString(36).toUpperCase()
  const r = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}${t}${r}`
}

/**
 * Public origin of THIS deployment — used for the gateway return_url and the
 * signed async notify_url. Env override first, request headers as fallback.
 */
export function siteOrigin(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

/* --------------------------- gateway routing --------------------------- */

/** Weighted random pick among ACTIVE gateways (weight 1..10). */
export async function pickGateway(amount: number): Promise<GatewayRecord | null> {
  const candidates = (await db.paymentGateway.findMany({ where: { active: true } })).filter(
    (g) => amount >= g.minAmount && amount <= g.maxAmount,
  )
  if (candidates.length === 0) return null
  const pool: GatewayRecord[] = []
  for (const g of candidates) {
    const w = Math.max(1, Math.min(10, g.weight))
    for (let i = 0; i < w; i++) pool.push(g as GatewayRecord)
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

export async function gatewayById(id: string | null | undefined): Promise<GatewayRecord | null> {
  if (!id) return null
  const g = await db.paymentGateway.findUnique({ where: { id } })
  return (g as GatewayRecord) ?? null
}

/* ------------------------------ API calls ------------------------------ */

export type QwackResponse = {
  ok: boolean
  code?: number
  message?: string
  data?: Record<string, unknown>
}

/** POST JSON to a QwackPay endpoint with X-API-Key auth. */
export async function qwackCall(
  gw: GatewayRecord,
  path: string,
  body: Record<string, string | number>,
): Promise<QwackResponse> {
  try {
    const res = await fetch(`${gw.apiUrl.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': gw.apiKey },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => null)) as QwackResponse | null
    if (!json) return { ok: false, message: `HTTP ${res.status}` }
    return { ...json, ok: json.code === 200 || json.code === 0 }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'network error' }
  }
}

/**
 * Create a collection (deposit) order at QwackPay.
 * notifyUrl embeds the gateway id (?gw=) so the callback can find the right key.
 */
export async function createCollectionOrder(opts: {
  gw: GatewayRecord
  merchantOrderId: string
  amount: number
  customerName?: string
  customerPhone: string
  customerEmail: string
  returnUrl?: string
  notifyUrl?: string
}): Promise<QwackResponse & { paymentUrl?: string; qwackOrderId?: string }> {
  const { gw } = opts
  const body: Record<string, string | number> = {
    merchant_id: gw.merchantId,
    amount: Math.round(opts.amount * 100) / 100,
    order_id: opts.merchantOrderId,
    customer_phone: opts.customerPhone,
    customer_email: opts.customerEmail,
  }
  if (opts.customerName) body.customer_name = opts.customerName
  if (opts.returnUrl) body.return_url = opts.returnUrl
  if (opts.notifyUrl) body.notify_url = opts.notifyUrl
  body.sign = qwackSign(body, gw.apiKey)

  const res = await qwackCall(gw, '/order/create', body)
  const data = (res.data ?? {}) as Record<string, unknown>
  return {
    ...res,
    paymentUrl: typeof data.payment_url === 'string' ? data.payment_url : undefined,
    qwackOrderId: typeof data.qwack_order_id === 'string' ? data.qwack_order_id : undefined,
  }
}

/** Ask QwackPay for the current status of a merchant order. */
export async function queryOrder(
  gw: GatewayRecord,
  merchantOrderId: string,
): Promise<QwackResponse> {
  const body: Record<string, string | number> = {
    merchant_id: gw.merchantId,
    order_id: merchantOrderId,
  }
  body.sign = qwackSign(body, gw.apiKey)
  return qwackCall(gw, '/order/query', body)
}

/* ------------------------------ settlement ----------------------------- */

export type SettleResult = 'credited' | 'already' | 'failed' | 'not_found'

/**
 * Idempotently settle a deposit as SUCCESS:
 *   1. guarded updateMany (pending → success) — wins only once
 *   2. atomic wallet increment
 *   3. ledger entry (fire-and-forget)
 * Returns 'already' when someone else (callback/query race) settled first.
 */
export async function settleDepositSuccess(opts: {
  merchantOrderId: string
  qwackOrderId?: string
  utr?: string
}): Promise<SettleResult> {
  const dep = await db.deposit.findUnique({ where: { merchantOrderId: opts.merchantOrderId } })
  if (!dep) return 'not_found'
  if (dep.status === 'success') return 'already'

  const won = await db.deposit.updateMany({
    where: { id: dep.id, status: 'pending' },
    data: {
      status: 'success',
      ...(opts.qwackOrderId ? { qwackOrderId: opts.qwackOrderId } : {}),
      ...(opts.utr ? { utr: opts.utr } : {}),
    },
  })
  if (won.count === 0) return 'already'

  const user = await db.user.update({
    where: { id: dep.userId },
    data: { walletBalance: { increment: dep.amount } },
    select: { walletBalance: true },
  })
  recordTx({
    userId: dep.userId,
    type: 'deposit',
    amount: dep.amount,
    balanceAfter: user.walletBalance,
    note: `${dep.merchantOrderId} · gateway deposit`,
  })
  return 'credited'
}

/** Mark a pending deposit as failed (callback status=failed). */
export async function settleDepositFailed(opts: {
  merchantOrderId: string
  qwackOrderId?: string
}): Promise<SettleResult> {
  const dep = await db.deposit.findUnique({ where: { merchantOrderId: opts.merchantOrderId } })
  if (!dep) return 'not_found'
  if (dep.status !== 'pending') return 'already'
  const won = await db.deposit.updateMany({
    where: { id: dep.id, status: 'pending' },
    data: {
      status: 'failed',
      ...(opts.qwackOrderId ? { qwackOrderId: opts.qwackOrderId } : {}),
    },
  })
  return won.count > 0 ? 'failed' : 'already'
}

/**
 * Reconcile a pending deposit against the gateway query API.
 * Used when the callback can't reach us (localhost dev) or was missed.
 * The query response shape is undocumented — parsed defensively.
 */
export async function reconcileDeposit(merchantOrderId: string): Promise<SettleResult> {
  const dep = await db.deposit.findUnique({ where: { merchantOrderId } })
  if (!dep || dep.status !== 'pending' || !dep.gatewayId) return dep ? 'already' : 'not_found'
  const gw = await gatewayById(dep.gatewayId)
  if (!gw) return 'not_found'

  const res = await queryOrder(gw, merchantOrderId)
  const d = (res.data ?? {}) as Record<string, unknown>
  const rawStatus = String(d.status ?? d.trade_status ?? d.order_status ?? '').toLowerCase()
  if (rawStatus === 'success' || rawStatus === 'paid' || rawStatus === 'completed') {
    return settleDepositSuccess({
      merchantOrderId,
      qwackOrderId: typeof d.qwack_order_id === 'string' ? d.qwack_order_id : undefined,
      utr: typeof d.utr === 'string' ? d.utr : undefined,
    })
  }
  if (rawStatus === 'failed' || rawStatus === 'expired' || rawStatus === 'closed') {
    return settleDepositFailed({ merchantOrderId })
  }
  return 'already' // still pending at the gateway
}
