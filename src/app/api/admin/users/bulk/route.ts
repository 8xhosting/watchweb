import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, adminUnauthorized } from '@/lib/admin-session'
import { adminLog } from '@/lib/app-config'
import { recordTx } from '@/lib/ledger'

/**
 * POST /api/admin/users/bulk — BULK master-control operations.
 *   { action: "credit" | "debit" | "ban" | "unban", ids: string[], amount? }
 *
 * credit/debit need `amount`; every movement lands in the ledger.
 * Returns per-user outcomes so the UI can show precise results.
 */
export async function POST(req: Request) {
  const admin = getAdminFromRequest(req)
  if (!admin) return adminUnauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action ?? '')
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.map((v: unknown) => String(v)).filter(Boolean).slice(0, 200)
      : []
    const amount = Number(body?.amount ?? 0)

    if (!['credit', 'debit', 'ban', 'unban'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Unknown bulk action' }, { status: 400 })
    }
    if (!ids.length) {
      return NextResponse.json({ ok: false, error: 'Select at least one user' }, { status: 400 })
    }
    if ((action === 'credit' || action === 'debit') && (!Number.isFinite(amount) || amount <= 0)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid amount' }, { status: 400 })
    }

    const users = await db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, walletBalance: true },
    })

    let applied = 0
    const skipped: string[] = []

    for (const u of users) {
      try {
        if (action === 'ban' || action === 'unban') {
          await db.user.update({
            where: { id: u.id },
            data: { status: action === 'ban' ? 'banned' : 'active' },
          })
          applied += 1
          continue
        }

        const next =
          action === 'credit'
            ? Number(u.walletBalance) + amount
            : Number(u.walletBalance) - amount
        if (next < 0) {
          skipped.push(u.username)
          continue
        }
        const updated = await db.user.update({
          where: { id: u.id },
          data: { walletBalance: next },
          select: { walletBalance: true },
        })
        recordTx({
          userId: u.id,
          type: action === 'credit' ? 'credit' : 'debit',
          amount,
          balanceAfter: Number(updated.walletBalance),
          note: `bulk ${action} by ${admin}: ${u.username}`,
        })
        applied += 1
      } catch {
        skipped.push(u.username)
      }
    }

    void adminLog(
      `user.bulk_${action}`,
      `${applied} user(s)${action === 'credit' || action === 'debit' ? ` ₹${amount}` : ''}${skipped.length ? ` — skipped: ${skipped.join(', ')}` : ''}`
    )

    return NextResponse.json({ ok: true, applied, skipped })
  } catch {
    return NextResponse.json({ ok: false, error: 'Bulk action failed' }, { status: 500 })
  }
}
