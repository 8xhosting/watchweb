/**
 * Deterministic sample data for the WatchPay app pages
 * (Team / Orders / Task / Withdraw).
 *
 * Every value is derived from stable inputs (fixed seeds + the username's
 * char codes) — never Math.random at render time — so server and client
 * renders always match (hydration-safe) and the same user always sees the
 * same screen. This is UI-sample data only; real records will come from
 * the database once those features go live.
 */

import { LAST_NAMES, FIRST_NAMES } from '@/lib/withdrawal-names'

/** small stable string hash (djb2) */
export function hashCode(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

/* ------------------------------- TEAM ------------------------------- */

export interface TeamMember {
  id: number
  name: string
  level: 1 | 2 | 3
  status: 'active' | 'idle'
  joined: string
  earned: number
}

/** deterministic team for the given username (8 members) */
export function buildTeam(username: string): TeamMember[] {
  const seed = hashCode(username || 'watchpay')
  const out: TeamMember[] = []
  for (let i = 0; i < 8; i++) {
    const f = FIRST_NAMES[(seed + i * 7) % FIRST_NAMES.length]
    const l = LAST_NAMES[(seed + i * 13) % LAST_NAMES.length]
    const level = ((seed + i) % 3 === 0 ? 2 : (seed + i) % 3 === 1 ? 1 : 3) as 1 | 2 | 3
    const active = (seed + i * 5) % 4 !== 0
    const day = ((seed + i * 3) % 27) + 1
    out.push({
      id: i + 1,
      name: `${f} ${l}`,
      level,
      status: active ? 'active' : 'idle',
      joined: `${day < 10 ? '0' : ''}${day} Sep 2025`,
      earned: 120 + ((seed + i * 37) % 46) * 10 + (level === 1 ? 40 : 0),
    })
  }
  return out
}

/** invite code derived from the username — stable per user */
export function inviteCode(username: string): string {
  const base = (username || 'player').toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(5, 'X')
  return `WP${base.slice(0, 5)}${(hashCode(username || 'x') % 90) + 10}`
}

export const COMMISSION_TIERS = [
  { level: 1, label: 'Level 1 — Direct', rate: '10%', note: 'Friends you invite personally' },
  { level: 2, label: 'Level 2 — Network', rate: '5%', note: "Your friends' invites" },
  { level: 3, label: 'Level 3 — Community', rate: '2%', note: 'Their wider network' },
] as const

/* ------------------------------ ORDERS ------------------------------ */

export type OrderRecordStatus = 'completed' | 'soldout' | 'processing'

export interface OrderRecord {
  id: string
  platform: string
  amount: number
  bonus: number
  status: OrderRecordStatus
  when: string
}

const HISTORY_PLATFORMS = [
  '1Win', 'Stake', 'Parimatch', '4Rabet', '1xBet',
  'MelBet', 'Betway', 'Dafabet', 'BC.Game', 'Mostbet',
] as const

const HISTORY_BASE: Array<[number, number, OrderRecordStatus, string]> = [
  [7845, 981, 'completed', 'Today, 14:32'],
  [2439, 305, 'completed', 'Today, 13:58'],
  [5217, 652, 'processing', 'Today, 12:11'],
  [1985, 248, 'completed', 'Yesterday, 21:44'],
  [8763, 1095, 'soldout', 'Yesterday, 20:02'],
  [3124, 391, 'completed', 'Yesterday, 18:37'],
  [1176, 147, 'soldout', 'Yesterday, 17:20'],
  [6458, 807, 'completed', '12 Oct, 22:15'],
  [2789, 349, 'completed', '12 Oct, 19:03'],
  [9213, 1152, 'processing', '12 Oct, 16:48'],
  [4310, 539, 'soldout', '11 Oct, 23:29'],
  [1542, 193, 'completed', '11 Oct, 21:07'],
]

export function buildOrderHistory(username: string): OrderRecord[] {
  const seed = hashCode(username || 'watchpay')
  return HISTORY_BASE.map(([amount, bonus, status, when], i) => ({
    id: `ord_${(seed % 9999) + i * 137}_x${(seed + i).toString(36).slice(-4)}`,
    platform: HISTORY_PLATFORMS[(seed + i * 3) % HISTORY_PLATFORMS.length],
    amount,
    bonus,
    status,
    when,
  }))
}

/* ------------------------------- TASKS ------------------------------ */

export interface TaskDef {
  id: string
  title: string
  detail: string
  reward: number
  icon: 'order' | 'streak' | 'invite' | 'watch'
  /** how many of `target` steps are already done (deterministic demo state) */
  done: number
  target: number
}

export const DAILY_TASKS: TaskDef[] = [
  {
    id: 'order-3',
    title: 'Complete 3 order tasks',
    detail: 'Pay any 3 live orders from the Home screen',
    reward: 35,
    icon: 'order',
    done: 2,
    target: 3,
  },
  {
    id: 'streak',
    title: 'Daily check-in',
    detail: 'Sign in and claim your streak reward',
    reward: 12,
    icon: 'streak',
    done: 1,
    target: 1,
  },
  {
    id: 'invite',
    title: 'Invite 1 friend',
    detail: 'Share your invite link — friend must register',
    reward: 50,
    icon: 'invite',
    done: 0,
    target: 1,
  },
  {
    id: 'watch',
    title: 'Watch & earn',
    detail: 'Watch a short partner clip for instant reward',
    reward: 8,
    icon: 'watch',
    done: 0,
    target: 1,
  },
]

export const STREAK_DAYS = [
  { day: 'Mon', reward: 5, claimed: true },
  { day: 'Tue', reward: 6, claimed: true },
  { day: 'Wed', reward: 8, claimed: true },
  { day: 'Thu', reward: 10, claimed: true },
  { day: 'Fri', reward: 12, claimed: false },
  { day: 'Sat', reward: 15, claimed: false },
  { day: 'Sun', reward: 20, claimed: false },
] as const

/* ----------------------------- WITHDRAW ----------------------------- */

export interface WithdrawRecord {
  id: string
  method: 'UPI' | 'Bank'
  amount: number
  status: 'paid' | 'processing'
  when: string
}

export const WITHDRAW_MIN = 200

export function buildWithdrawHistory(username: string): WithdrawRecord[] {
  const seed = hashCode(username || 'watchpay')
  const rows: Array<[number, 'UPI' | 'Bank', 'paid' | 'processing', string]> = [
    [2500, 'UPI', 'paid', 'Today, 11:26'],
    [1800, 'Bank', 'paid', '10 Oct, 18:02'],
    [3200, 'UPI', 'paid', '08 Oct, 20:41'],
    [950, 'UPI', 'processing', '05 Oct, 15:17'],
  ]
  return rows.map(([amount, method, status, when], i) => ({
    id: `wd_${(seed % 7777) + i * 91}`,
    method,
    amount,
    status,
    when,
  }))
}
