import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/session'
import { AMOUNT_MAX, AMOUNT_MIN, calcBonus } from '@/lib/order-rules'
import {
  createCollectionOrder,
  newMerchantOrderId,
  pickGateway,
  siteOrigin,
} from '@/lib/qwackpay'

/**
 * POST /api/orders/create
 * "PAY ORDER" endpoint — contract-compatible with the old api/create-order.php:
 *   request : { amount, order_type: 'task', ajax: 1, branch_name }
 *   response: { success, payment_url }  (on success the client redirects)
 *
 * FLOW (same money-rail as the Add-Money page):
 *   1. persist the Order (admin panel visibility, bonus auto-credit on completion)
 *   2. pick an ACTIVE gateway by weight for this EXACT amount
 *   3. create a pending Deposit (settlement vehicle — the signed callback
 *      /api/deposit/notify credits the wallet the moment the bank confirms)
 *   4. create the QwackPay collection order for the SAME ₹ amount and
 *      return its hosted payment_url
 *
 * The payment link is ALWAYS for the same amount as the tapped live order —
 * the UI sends order.amount and this route never alters it.
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, mobile: true, status: true },
    })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Account not found. Please log in again.' },
        { status: 401 }
      )
    }
    if (user.status === 'banned') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Contact support.' },
        { status: 403 }
      )
    }

    // Persist the payment intent so the Admin Master Control panel sees the
    // REAL order flow. merchantOrderId is linked after the gateway pick.
    const order = await db.order.create({
      data: {
        userId,
        amount,
        bonus: calcBonus(amount),
        platform: branchName,
        status: 'processing',
      },
    })

    // Gateway routing — an active gateway must cover this exact amount.
    const gw = await pickGateway(amount)
    if (!gw) {
      return NextResponse.json({
        success: false,
        message: 'No payment gateway available for this amount right now. Please try again shortly.',
      })
    }

    const merchantOrderId = newMerchantOrderId()
    const origin = siteOrigin(req)
    const emailUser = user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || 'wpuser'

    // Deposit record = settlement vehicle. Even if the gateway call fails the
    // intent stays for audit; the signed callback credits the wallet on success.
    const deposit = await db.deposit.create({
      data: {
        userId,
        gatewayId: gw.id,
        merchantOrderId,
        amount: Math.round(amount * 100) / 100,
        status: 'pending',
      },
    })

    await db.order.update({
      where: { id: order.id },
      data: { merchantOrderId },
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
      return NextResponse.json({
        success: false,
        message: res.message || 'Payment gateway rejected the order. Please try again.',
      })
    }

    await db.deposit.update({
      where: { id: deposit.id },
      data: { qwackOrderId: res.qwackOrderId ?? '' },
    })

    return NextResponse.json({
      success: true,
      payment_url: res.paymentUrl,
      order_id: merchantOrderId,
      gateway: gw.label,
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
