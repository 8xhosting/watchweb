import { db } from '@/lib/db'
import { qwackSign, gatewayById, settleDepositSuccess, settleDepositFailed } from '@/lib/qwackpay'

/**
 * QwackPay async callback — POSTed BY the gateway TO us.
 * notify_url embeds the gateway id: /api/deposit/notify?gw=<gatewayId>
 * (the callback body has no merchant id, so the ?gw= tells us whose API key
 *  the signature must be verified against).
 *
 * Contract: verify the sign, then answer PLAIN TEXT "success" — any other
 * response makes the gateway retry forever.
 *
 * Idempotent: wallet is credited exactly once (guarded pending→success update).
 */

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        merchant_order_id?: string
        qwack_order_id?: string
        amount?: number | string
        status?: string
        utr?: string
        sign?: string
      }
    | null

  const url = new URL(req.url)
  const gwId = url.searchParams.get('gw') ?? ''
  const gw = await gatewayById(gwId)

  const plain = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/plain' } })

  if (!gw || !body?.merchant_order_id || !body.sign) {
    // can't verify → don't confirm; gateway will retry (defensive no-crash)
    return plain('fail')
  }

  /* ---------------- signature verification (MD5, ASCII sort) -------------- */
  const expected = qwackSign(
    {
      merchant_order_id: body.merchant_order_id,
      qwack_order_id: body.qwack_order_id ?? '',
      amount: body.amount ?? '',
      status: body.status ?? '',
      utr: body.utr ?? '',
    },
    gw.apiKey,
  )
  if (expected !== String(body.sign).toUpperCase()) {
    await db.adminLog
      .create({
        data: {
          action: 'deposit.bad_signature',
          detail: `${body.merchant_order_id} @ ${gw.label}`,
        },
      })
      .catch(() => {})
    return plain('fail')
  }

  const deposit = await db.deposit.findUnique({
    where: { merchantOrderId: body.merchant_order_id },
  })
  if (!deposit) return plain('success') // unknown order — stop the retries
  if (deposit.gatewayId && deposit.gatewayId !== gw.id) {
    await db.adminLog
      .create({ data: { action: 'deposit.wrong_gateway', detail: body.merchant_order_id } })
      .catch(() => {})
    return plain('success')
  }

  const amount = Number(body.amount)
  const status = String(body.status ?? '').toLowerCase()
  const common = {
    merchantOrderId: body.merchant_order_id,
    qwackOrderId: body.qwack_order_id,
  }

  if (status === 'success' || status === 'paid' || status === 'completed') {
    if (Number.isFinite(amount) && Math.abs(amount - deposit.amount) > 0.01) {
      // amount tampering / mismatch — never credit, alert the audit trail
      await db.adminLog
        .create({
          data: {
            action: 'deposit.amount_mismatch',
            detail: `${body.merchant_order_id} expected ${deposit.amount} got ${amount}`,
          },
        })
        .catch(() => {})
      await settleDepositFailed(common)
      return plain('success')
    }
    await settleDepositSuccess({ ...common, utr: body.utr })
    return plain('success')
  }

  if (status === 'failed' || status === 'expired' || status === 'closed') {
    await settleDepositFailed(common)
    return plain('success')
  }

  // unknown status — acknowledge so the gateway doesn't spam retries
  return plain('success')
}
