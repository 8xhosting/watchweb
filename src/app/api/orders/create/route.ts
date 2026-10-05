import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'
import { AMOUNT_MAX, AMOUNT_MIN, calcBonus } from '@/lib/order-rules'

/**
 * POST /api/orders/create
 * "PAY ORDER" endpoint — contract-compatible with the old api/create-order.php:
 *   request : { amount, order_type: 'task', ajax: 1, branch_name }
 *   response: { success, payment_url }  (on success the client redirects)
 *
 * PAYMENT GATEWAY HOOK:
 *   Set PAYMENT_API_URL in the environment to the real gateway endpoint and
 *   this route forwards the same payload server-side (secrets stay on the
 *   server) and relays its response, including the real payment_url.
 *   Until it is configured this route NEVER fabricates a payment_url — it
 *   returns success:false and the UI restores the button / keeps the order.
 */
export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Your session has expired. Please log in again.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const orderType = String(body.order_type ?? '')
    const branchName = String(body.branch_name ?? '').trim()

    if (!Number.isFinite(amount) || amount < AMOUNT_MIN || amount > AMOUNT_MAX) {
      return NextResponse.json(
        { success: false, message: `Amount must be between ₹${AMOUNT_MIN} and ₹${AMOUNT_MAX}` },
        { status: 400 }
      )
    }
    if (orderType !== 'task') {
      return NextResponse.json(
        { success: false, message: "order_type must be 'task'" },
        { status: 400 }
      )
    }
    if (!branchName) {
      return NextResponse.json(
        { success: false, message: 'branch_name (platform source) is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account not found. Please log in again.' },
        { status: 401 }
      )
    }

    // Persist the payment intent so the Admin Master Control panel sees the
    // REAL order flow (users with banned accounts cannot create orders).
    const account = await db.user.findUnique({
      where: { id: userId },
      select: { status: true },
    })
    if (account?.status === 'banned') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Contact support.' },
        { status: 403 }
      )
    }
    await db.order.create({
      data: {
        userId,
        amount,
        bonus: calcBonus(amount),
        platform: branchName,
        status: 'processing',
      },
    })

    const gatewayUrl = process.env.PAYMENT_API_URL
    if (gatewayUrl) {
      // Forward the exact legacy payload to the real gateway, server-side.
      try {
        const upstream = await fetch(gatewayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, order_type: orderType, ajax: 1, branch_name: branchName }),
          signal: AbortSignal.timeout(10_000),
        })
        const data = await upstream.json().catch(() => null)
        if (data && typeof data === 'object') {
          return NextResponse.json(data, { status: upstream.status })
        }
        return NextResponse.json({
          success: false,
          message: 'Payment gateway returned an unreadable response. Please try again.',
        })
      } catch {
        return NextResponse.json({
          success: false,
          message: 'Payment gateway is unreachable right now. Please try again.',
        })
      }
    }

    // No gateway configured yet — do NOT fake a payment URL.
    return NextResponse.json({
      success: false,
      message: 'Payment gateway is not connected yet. Your order was received, but no payment can be processed in this demo.',
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
