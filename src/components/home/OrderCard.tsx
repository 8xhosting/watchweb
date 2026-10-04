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
 * active → (countdown 0) → soldout (red pulse ~750ms) → exit (fade/slide
 * ~420ms) → removed & replaced. Pure presentation — all timers are
 * centralised in LiveOrdersHome, so re-ordering never resets anything.
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
      className={`wp-order-in relative overflow-hidden rounded-2xl border p-3 pl-4 backdrop-blur-xl transition-colors duration-300 ${
        soldOut
          ? 'wp-soldout-card border-red-500/35 bg-[#160A10]/85'
          : 'border-white/[0.08] bg-[#0A101C]/80 hover:border-emerald-400/25'
      } ${order.status === 'exit' ? 'wp-order-out' : ''}`}
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
            className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-6px_rgba(0,0,0,0.8)] ${style.markClass}`}
            style={{
              background: style.circleBg,
              color: style.markColor,
              fontSize: style.mark.length > 3 ? 9 : style.mark.length > 2 ? 12 : 14,
            }}
          >
            {style.mark}
          </span>

          <div className="min-w-0">
            <p
              className={`text-[22px] font-extrabold leading-none tracking-tight tabular-nums transition-all duration-300 ${
                soldOut ? 'text-[#5A6478] line-through decoration-red-400/60' : 'text-white'
              }`}
            >
              ₹ {inr.format(order.amount)}
            </p>

            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold transition-all duration-300 ${
                soldOut
                  ? 'border-white/[0.06] bg-white/[0.03] text-[#5A6478]'
                  : 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300'
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
            className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[12.5px] font-bold tabular-nums transition-colors duration-300 ${
              urgent
                ? 'border-amber-400/50 bg-amber-400/[0.08] text-amber-300'
                : 'border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-300'
            }`}
          >
            <IconClock className="h-3 w-3" />
            {clockText(order.remaining)}
          </span>
        )}
      </div>

      {/* row 2 — payout source | CTA */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <p
          className={`flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap text-[10.5px] transition-colors duration-300 ${
            soldOut ? 'text-[#4A5464]' : 'text-[#8A94A6]'
          }`}
        >
          Payout Requests From
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide transition-colors duration-300 ${
              soldOut ? 'border-white/[0.08] bg-white/[0.03] text-[#5A6478]' : style.badgeClass
            }`}
          >
            {order.source.toUpperCase()}
          </span>
        </p>

        {soldOut ? (
          <span className="flex h-9 shrink-0 select-none items-center gap-1.5 rounded-xl border border-dashed border-red-400/60 px-3.5 text-[12px] font-extrabold tracking-wide text-red-400">
            <IconBan className="h-3.5 w-3.5" />
            SOLD OUT
          </span>
        ) : (
          <button
            type="button"
            disabled={paying}
            onClick={() => onPay(order)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[12px] font-extrabold tracking-wide transition-all duration-200 ${
              paying
                ? 'cursor-wait bg-white/[0.06] text-[#8A94A6]'
                : 'bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-white shadow-[0_10px_24px_-8px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:scale-[0.97]'
            }`}
          >
            {paying ? (
              <>
                <IconLoader className="h-3.5 w-3.5 animate-spin" />
                PROCESSING…
              </>
            ) : (
              <>
                <IconWallet className="h-3.5 w-3.5" />
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
