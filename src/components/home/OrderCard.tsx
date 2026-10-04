'use client'

import { memo } from 'react'
import { platformStyle } from './platforms'
import { IconBan, IconClock, IconGift, IconLoader, IconWallet } from './icons'

export type OrderStatus = 'active' | 'soldout' | 'exit'

export interface UiOrder {
  id: string
  amount: number
  bonus: number
  source: string
  /** seconds left; frozen while the user is paying this order */
  remaining: number
  status: OrderStatus
  /** swipe-away direction for the exit animation (alternates per expiry) */
  exitDir?: 1 | -1
  /** swipe-in direction for the entrance animation (alternates per arrival) */
  enterDir?: 1 | -1
  /** entrance animation delay (initial stagger) */
  enterDelay?: number
}

const inr = new Intl.NumberFormat('en-IN')

const clockText = (seconds: number) => {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.max(0, seconds) % 60
  return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
}

/**
 * One live order. Lifecycle handled by the parent engine:
 * active → (countdown 0) → soldout (red pulse ~750ms) → exit (swipe out
 * ~480ms) → removed & replaced. New cards SWIPE IN horizontally
 * (alternating direction) — same motion language as the exit.
 * Pure presentation — all timers are centralised in LiveOrdersHome,
 * so re-ordering never resets anything.
 *
 * Layout (per the visual reference):
 *   row 1: [logo | amount + bonus chip]            [countdown]
 *   row 2: [Payout Requests From <PLATFORM>]       [PAY ORDER]
 */
function OrderCardImpl({
  order,
  paying,
  onPay,
}: {
  order: UiOrder
  paying: boolean
  onPay: (order: UiOrder) => void
}) {
  const style = platformStyle(order.source)
  const soldOut = order.status !== 'active'
  const urgent = !soldOut && order.remaining <= 3

  return (
    <article
      style={{
        // entrance stagger (initial batch only) — never applied to the exit
        // animation, so removal is never delayed
        animationDelay:
          order.status === 'exit' || !order.enterDelay ? undefined : `${order.enterDelay}ms`,
      }}
      className={`${
        order.status === 'exit'
          ? order.exitDir === -1
            ? 'wp-order-out-left'
            : 'wp-order-out-right'
          : order.enterDir === -1
            ? 'wp-order-in-left'
            : 'wp-order-in-right'
      } relative overflow-hidden rounded-2xl border p-3.5 pl-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl transition-colors duration-300 ${
        soldOut
          ? 'wp-soldout-card border-red-500/35 bg-[#160A10]/85'
          : 'border-[var(--wp-border)] bg-[var(--wp-card)] hover:border-emerald-400/30'
      }`}
    >
      {/* left accent bar — platform colour, red when sold out */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-colors duration-300"
        style={{
          background: soldOut ? '#EF4444' : style.accent,
          boxShadow: soldOut ? '0 0 12px rgba(239,68,68,0.75)' : `0 0 12px ${style.accent}66`,
        }}
      />

      {/* row 1 — identity, amount, bonus | countdown */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-0.5 grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_-6px_rgba(0,0,0,0.7)] ring-1 ring-white/15 ${style.markClass}`}
            style={{
              background: style.circleBg,
              color: style.markColor,
              fontSize: style.mark.length > 3 ? 10 : style.mark.length > 2 ? 13 : 15,
            }}
          >
            {style.mark}
          </span>

          <div className="min-w-0">
            <p
              className={`text-[23px] font-extrabold leading-none tracking-tight tabular-nums transition-all duration-300 ${
                soldOut ? 'text-[var(--wp-muted-2)] line-through decoration-red-400/60' : 'text-[var(--wp-heading)]'
              }`}
            >
              ₹ {inr.format(order.amount)}
            </p>

            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold transition-all duration-300 ${
                soldOut
                  ? 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted-2)]'
                  : 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <IconGift className="h-3 w-3" />
              +₹{inr.format(order.bonus)} bonus
            </span>
          </div>
        </div>

        {!soldOut && (
          <span
            aria-label={`${order.remaining} seconds left`}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-bold tabular-nums transition-colors duration-300 ${
              urgent
                ? 'border-amber-400/50 bg-amber-400/[0.08] text-amber-600 dark:text-amber-300'
                : 'border-emerald-400/40 bg-emerald-400/[0.07] text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <IconClock className="h-3.5 w-3.5" />
            {clockText(order.remaining)}
          </span>
        )}
      </div>

      {/* row 2 — payout source | CTA */}
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p
          className={`flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[11px] transition-colors duration-300 ${
            soldOut ? 'text-[var(--wp-faint)]' : 'text-[var(--wp-muted)]'
          }`}
        >
          Payout Requests From
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide wp-badge transition-colors duration-300 ${
              soldOut ? 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted-2)]' : style.badgeClass
            }`}
          >
            {order.source.toUpperCase()}
          </span>
        </p>

        {soldOut ? (
          <span className="flex h-10 shrink-0 select-none items-center gap-1.5 rounded-xl border border-dashed border-red-400/60 px-4 text-[12.5px] font-extrabold tracking-wide text-red-400">
            <IconBan className="h-4 w-4" />
            SOLD OUT
          </span>
        ) : (
          <button
            type="button"
            disabled={paying}
            onClick={() => onPay(order)}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-5 text-[12.5px] font-extrabold tracking-wide transition-all duration-200 ${
              paying
                ? 'cursor-wait bg-[var(--wp-hover)] text-[var(--wp-muted)]'
                : 'bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-white shadow-[0_10px_24px_-8px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:scale-[0.97]'
            }`}
          >
            {paying ? (
              <>
                <IconLoader className="h-4 w-4 animate-spin" />
                PROCESSING…
              </>
            ) : (
              <>
                <IconWallet className="h-4 w-4" />
                PAY ORDER
              </>
            )}
          </button>
        )}
      </div>
    </article>
  )
}

export const OrderCard = memo(OrderCardImpl)
