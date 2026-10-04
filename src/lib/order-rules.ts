/**
 * WatchPay live-order rules — SINGLE SOURCE OF TRUTH.
 *
 * Used by the server API routes (initial batch + replacements) and by the
 * client-side fallback generator when the backend is unreachable, so every
 * order follows exactly the same business rules everywhere.
 *
 * Mirrors the behaviour of the old PHP system:
 *   - amounts between ₹700 and ₹9,000 that never end in zero
 *   - independent order lifetime of 3–17 seconds
 *   - bonus calculated from the configured percentage
 *   - the ten supported payout platforms
 */

export const PLATFORMS = [
  '1Win',
  'Stake',
  'Parimatch',
  '4Rabet',
  '1xBet',
  'MelBet',
  'Betway',
  'Dafabet',
  'BC.Game',
  'Mostbet',
] as const

export type Platform = (typeof PLATFORMS)[number]

export const AMOUNT_MIN = 700
export const AMOUNT_MAX = 9000

/**
 * Bonus percentage. Matches the reference data (₹7,845 → +₹981, ₹2,439 → +₹305 …).
 * TODO: when the real PHP backend is connected, read this from its config
 * instead so the two never drift apart.
 */
export const BONUS_PERCENT = 12.5

export const DURATION_MIN = 3 // seconds
export const DURATION_MAX = 17 // seconds

export const ORDER_LIVE_TARGET = 20 // number of simultaneously active orders

/** The shape returned by the APIs and consumed by the UI. */
export interface RawOrder {
  id: string
  amount: number
  bonus: number
  remaining: number
  source: string
}

/** Amount between AMOUNT_MIN and AMOUNT_MAX whose last digit is never 0. */
export function generateAmount(): number {
  let amount: number
  do {
    amount = AMOUNT_MIN + Math.floor(Math.random() * (AMOUNT_MAX - AMOUNT_MIN + 1))
  } while (amount % 10 === 0)
  return amount
}

/** bonus = amount × BONUS_PERCENT / 100, rounded to whole rupees. */
export function calcBonus(amount: number): number {
  return Math.round((amount * BONUS_PERCENT) / 100)
}

/** Independent lifetime between DURATION_MIN and DURATION_MAX seconds. */
export function generateDuration(): number {
  return DURATION_MIN + Math.floor(Math.random() * (DURATION_MAX - DURATION_MIN + 1))
}

export function randomSource(): Platform {
  return PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)]
}

let sequence = 0

/** Collision-proof order id (per-process sequence + time + randomness). */
export function generateOrderId(): string {
  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER
  return `ord_${Date.now().toString(36)}_${sequence.toString(36)}_${Math.floor(
    Math.random() * 46656
  ).toString(36)}`
}

export function generateOrder(): RawOrder {
  const amount = generateAmount()
  return {
    id: generateOrderId(),
    amount,
    bonus: calcBonus(amount),
    remaining: generateDuration(),
    source: randomSource(),
  }
}

export function generateOrders(count: number = ORDER_LIVE_TARGET): RawOrder[] {
  return Array.from({ length: count }, () => generateOrder())
}
