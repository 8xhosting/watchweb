'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  ORDER_LIVE_TARGET,
  calcBonus,
  generateAmount,
  generateDuration,
  randomSource,
} from '@/lib/order-rules'
import { HomeHeader } from './HomeHeader'
import { InfoSections } from './InfoSection'
import { LiveOrdersHeader } from './LiveOrdersHeader'
import { OrderCard, type UiOrder } from './OrderCard'
import { SortBar } from './SortBar'
import { WithdrawalTicker } from './WithdrawalTicker'

/* ------------------------------------------------------------------ */
/*  Timing of the expiry pipeline                                      */
/* ------------------------------------------------------------------ */

/** how long the red SOLD OUT state stays before the exit animation */
const SOLDOUT_MS = 750
/** duration of the fade/slide exit — matches the wp-order-out keyframe */
const EXIT_MS = 430

interface ApiOrder {
  id: string
  amount: number
  bonus?: number
  remaining: number
  source: string
}

function toUiOrder(raw: ApiOrder, enterDelay?: number, enterDir: 1 | -1 = 1): UiOrder {
  return {
    id: String(raw.id),
    amount: Number(raw.amount),
    bonus: Number.isFinite(raw.bonus) ? Number(raw.bonus) : calcBonus(Number(raw.amount)),
    remaining: Number(raw.remaining),
    source: String(raw.source),
    status: 'active',
    enterDelay,
    enterDir,
  }
}

/**
 * WatchPay Home — Live Orders.
 *
 * ORDER LIFECYCLE (centralised engine, ONE setInterval for the whole list):
 *   active → countdown reaches 0 → SOLD OUT (red pulse, button disabled)
 *   → exit animation → card removed → replacement requested from
 *   /api/orders/replace (client-side fallback order if the API fails)
 *   → new card enters smoothly. Total live count stays ~20.
 *
 * SAFETY GUARDS
 *   - expiredRef  : every order id is processed exactly once (no duplicate
 *                   replacement requests / expiry events)
 *   - heldRef     : an order with an in-flight payment is skipped by the
 *                   ticker so it can never expire mid-payment
 *   - timersRef   : every scheduled transition is tracked & cleared on unmount
 *   - one interval, one wallet poll — no per-card timers, no leaks
 */
export function LiveOrdersHome({
  username,
  balance,
  light,
  onToggleLight,
  onLogout,
}: {
  username: string
  /** wallet balance (polled centrally by AppShell) */
  balance: number
  light: boolean
  onToggleLight: () => void
  onLogout: () => void
}) {
  const { toast } = useToast()

  const [orders, setOrders] = useState<UiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [sortLow, setSortLow] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)

  const ordersRef = useRef<UiOrder[]>([])
  const expiredRef = useRef<Set<string>>(new Set())
  const heldRef = useRef<Set<string>>(new Set())
  /** replacement orders that arrived while the expired card was still animating out */
  const pendingRef = useRef<Map<string, UiOrder>>(new Map())
  const localSeqRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const aliveRef = useRef(true)
  /** alternates -1 / 1 so consecutive sold-out cards swipe opposite ways */
  const exitFlipRef = useRef<1 | -1>(1)
  /** alternates -1 / 1 so new cards swipe IN from alternating sides */
  const enterFlipRef = useRef<1 | -1>(1)

  /** tracked setTimeout — auto-cleaned on unmount, ignored if already gone */
  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      if (aliveRef.current) fn()
    }, ms)
    timersRef.current.push(t)
  }, [])

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  /* ------------------------- initial 20 orders ------------------------- */

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/orders/live', { cache: 'no-store' })
        if (!res.ok) throw new Error('live orders unavailable')
        const data = await res.json()
        const raw: ApiOrder[] | undefined = Array.isArray(data?.orders) ? data.orders : undefined
        if (!raw || raw.length === 0) throw new Error('empty payload')
        if (!cancelled) {
          setOrders(
            raw.map((r, i) =>
              toUiOrder(r, Math.min(i * 35, 700), i % 2 === 0 ? 1 : -1)
            )
          )
        }
      } catch {
        // Backend unavailable — client-side fallback keeps the UI alive.
        if (!cancelled) {
          setOrders(
            Array.from({ length: ORDER_LIVE_TARGET }, (_, i) => {
              const amount = generateAmount()
              localSeqRef.current += 1
              return {
                id: `loc_${Date.now().toString(36)}_${localSeqRef.current}`,
                amount,
                bonus: calcBonus(amount),
                remaining: generateDuration(),
                source: randomSource(),
                status: 'active' as const,
                enterDelay: Math.min(i * 35, 700),
                enterDir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
              }
            })
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /* ----------------------- replacement after expiry --------------------- */

  const insertFresh = useCallback((freshRaw: UiOrder) => {
    // replacements appear at the TOP of the list, swiping in from an
    // alternating side (same motion language as the sold-out exit)
    const enterDir = enterFlipRef.current
    enterFlipRef.current = enterDir === 1 ? -1 : 1
    const fresh = { ...freshRaw, enterDir }
    setOrders((prev) => (prev.some((o) => o.id === fresh.id) ? prev : [fresh, ...prev]))
  }, [])

  /**
   * Called the moment an order hits zero (fetch overlaps the 1.2s
   * SOLD OUT + exit animation). When the response arrives:
   *   - expired card already removed → insert immediately
   *   - card still animating out     → stash; the removal step inserts it
   * This keeps the live count pinned near 20 even during expiry bursts.
   */
  const requestReplacement = useCallback(
    async (expiredId: string) => {
      let fresh: UiOrder | null = null
      try {
        const res = await fetch('/api/orders/replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: expiredId }),
          signal: AbortSignal.timeout(4000),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.success && data?.id && Number.isFinite(Number(data?.amount)) && data?.source) {
            fresh = toUiOrder(data)
          }
        }
      } catch {
        // fall through to the client-side fallback
      }
      if (!fresh) {
        const amount = generateAmount()
        localSeqRef.current += 1
        fresh = {
          id: `loc_${Date.now().toString(36)}_${localSeqRef.current}`,
          amount,
          bonus: calcBonus(amount),
          remaining: generateDuration(),
          source: randomSource(),
          status: 'active',
        }
      }
      if (!aliveRef.current) return
      const next = fresh
      if (ordersRef.current.some((o) => o.id === expiredId)) {
        pendingRef.current.set(expiredId, next)
      } else {
        insertFresh(next)
      }
    },
    [insertFresh]
  )

  /* ----------------- centralised 1s tick for ALL orders ----------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      if (!aliveRef.current) return
      const current = ordersRef.current
      let anyChange = false

      const next = current.map((o) => {
        if (o.status !== 'active' || heldRef.current.has(o.id)) return o
        anyChange = true
        const remaining = o.remaining - 1
        if (remaining <= 0) return { ...o, remaining: 0, status: 'soldout' as const }
        return { ...o, remaining }
      })
      if (!anyChange) return

      ordersRef.current = next
      setOrders(next)

      // kick off the expiry pipeline for orders that JUST hit zero —
      // exactly once per order id, guarded by expiredRef.
      // The replacement fetch starts NOW so it overlaps the animation.
      for (const o of next) {
        if (o.status === 'soldout' && !expiredRef.current.has(o.id)) {
          expiredRef.current.add(o.id)
          // alternate the swipe-away direction per expiry
          const exitDir = exitFlipRef.current
          exitFlipRef.current = exitDir === 1 ? -1 : 1
          void requestReplacement(o.id)
          later(() => {
            setOrders((prev) =>
              prev.map((x) =>
                x.id === o.id && x.status === 'soldout'
                  ? { ...x, status: 'exit' as const, exitDir }
                  : x
              )
            )
          }, SOLDOUT_MS)
          later(() => {
            setOrders((prev) => prev.filter((x) => x.id !== o.id))
            const pending = pendingRef.current.get(o.id)
            if (pending) {
              pendingRef.current.delete(o.id)
              insertFresh(pending)
            }
          }, SOLDOUT_MS + EXIT_MS)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [later, requestReplacement, insertFresh])

  /* ----------------------------- pay order ------------------------------ */

  const payOrder = useCallback(
    async (order: UiOrder) => {
      if (payingId || order.status !== 'active') return
      setPayingId(order.id)
      heldRef.current.add(order.id) // freeze this order's countdown
      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: order.amount,
            order_type: 'task',
            ajax: 1,
            branch_name: order.source,
          }),
        })
        const data = await res.json().catch(() => null)
        if (res.ok && data?.success && typeof data.payment_url === 'string' && data.payment_url) {
          window.location.href = data.payment_url
          return
        }
        toast({
          variant: 'destructive',
          title: 'Payment unavailable',
          description:
            data?.message ?? 'The payment gateway did not respond. Please try again.',
        })
      } catch {
        toast({
          variant: 'destructive',
          title: 'Network error',
          description: 'Could not reach the payment service. Please try again.',
        })
      } finally {
        heldRef.current.delete(order.id) // resume countdown
        setPayingId((cur) => (cur === order.id ? null : cur))
      }
    },
    [payingId, toast]
  )

  /* ------------------------------ derived ------------------------------- */

  // Sorting is a pure reorder — same keys, same mounted cards, timers untouched.
  const visible = useMemo(
    () => (sortLow ? [...orders].sort((a, b) => a.amount - b.amount) : orders),
    [orders, sortLow]
  )
  const activeCount = useMemo(() => orders.filter((o) => o.status === 'active').length, [orders])

  /* ------------------------------- render ------------------------------- */

  return (
    <div className="flex flex-col gap-3 pb-28">
      <HomeHeader
        balance={balance}
        light={light}
        username={username}
        onToggleLight={onToggleLight}
        onLogout={onLogout}
      />
      <WithdrawalTicker />
      <SortBar active={sortLow} onToggle={() => setSortLow((v) => !v)} />
      <LiveOrdersHeader activeCount={activeCount} />
      <section aria-busy={loading} aria-label="Live orders" className="flex flex-col gap-2.5">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="wp-shimmer h-[84px] rounded-2xl border border-white/[0.05]"
            />
          ))
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[var(--wp-muted)]">
            All orders are sold out — fresh ones are on the way…
          </p>
        ) : (
          visible.map((o) => (
            <OrderCard key={o.id} order={o} paying={payingId === o.id} onPay={payOrder} />
          ))
        )}
      </section>

      <InfoSections />
    </div>
  )
}
