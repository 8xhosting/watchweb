import { db } from '@/lib/db'

/**
 * Money ledger — single entry point for recording EVERY wallet movement.
 *
 * Transaction types:
 *   credit            — admin topped up a wallet
 *   debit             — admin deducted from a wallet
 *   order_bonus       — order completed, bonus credited automatically
 *   withdrawal_hold   — payout requested, amount held from the wallet
 *   withdrawal_paid   — payout finalised by the admin
 *   withdrawal_refund — payout rejected, hold released back to the wallet
 *   deposit           — money added via a payment gateway (QwackPay)
 *
 * Fire-and-forget safe: a ledger failure must NEVER break the money
 * movement it records (same philosophy as adminLog).
 */
export type TxType =
  | 'credit'
  | 'debit'
  | 'order_bonus'
  | 'withdrawal_hold'
  | 'withdrawal_paid'
  | 'withdrawal_refund'
  | 'deposit'

export function recordTx(data: {
  userId?: string | null
  type: TxType
  amount: number
  balanceAfter?: number
  note?: string
}): void {
  void db.transaction
    .create({
      data: {
        userId: data.userId ?? null,
        type: data.type,
        amount: Math.round(Number(data.amount) * 100) / 100,
        balanceAfter: Math.round(Number(data.balanceAfter ?? 0) * 100) / 100,
        note: (data.note ?? '').slice(0, 200),
      },
    })
    .catch(() => {
      // ledger must never break the action it records
    })
}

/** Human-readable label for a transaction type (shared by API + UI). */
export const TX_LABELS: Record<TxType, string> = {
  credit: 'Admin Credit',
  debit: 'Admin Debit',
  order_bonus: 'Order Bonus',
  withdrawal_hold: 'Payout Hold',
  withdrawal_paid: 'Payout Paid',
  withdrawal_refund: 'Payout Refund',
  deposit: 'Gateway Deposit',
}
