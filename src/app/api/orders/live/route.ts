import { NextResponse } from 'next/server'
import { generateOrders } from '@/lib/order-rules'

/**
 * GET /api/orders/live
 * Returns the initial batch of live orders (target: 20).
 * Equivalent of the initial server render in the old PHP page.
 *
 * Response: { success, orders: [{ id, amount, bonus, remaining, source }] }
 */
export async function GET() {
  return NextResponse.json(
    { success: true, orders: generateOrders() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
