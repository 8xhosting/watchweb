import { NextResponse } from 'next/server'
import { generateOrder } from '@/lib/order-rules'

/**
 * POST /api/orders/replace
 * Returns a fresh order to replace one that expired (sold out).
 * Equivalent of the old api/replace-order.php contract:
 *   request : { order_id }
 *   response: { success, id, amount, bonus, remaining, source }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const orderId = String(body.order_id ?? '').trim()
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      )
    }
    // The expired order itself is not persisted in this demo — the id is
    // validated for shape and a brand-new order is generated for the slot.
    return NextResponse.json({ success: true, ...generateOrder() })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
