'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp } from '@/components/ui/count-up'
import {
  IconArrowDownToLine,
  IconArrowUpDown,
  IconCheckSquare,
  IconChevronRight,
  IconCrown,
  IconHeadset,
  IconHistory,
  IconLogout,
  IconMoon,
  IconSun,
  IconUsers,
  IconWallet,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'
import { buildTeam } from './data'

const inr = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** VIP ladder — every 8 completed orders unlocks the next level (max 5). */
const VIP_STEP = 8
const vipFromOrders = (completed: number) =>
  Math.max(1, Math.min(5, 1 + Math.floor(completed / VIP_STEP)))

/**
 * Profile — identity card, wallet card with animated balance, VIP
 * progress driven by real completed orders, quick stats and the full
 * settings menu. Balance is the REAL DB value polled by AppShell.
 */
export function ProfilePage({
  username,
  mobile,
  memberSince,
  balance,
  light,
  onToggleLight,
  onBack,
  onNavigate,
  onLogout,
}: {
  username: string
  mobile: string | null
  memberSince: string | null
  balance: number
  light: boolean
  onToggleLight: () => void
  onBack: () => void
  onNavigate: (view: 'team' | 'orders' | 'task' | 'withdraw' | 'deposit') => void
  onLogout: () => void
}) {
  const { toast } = useToast()
  const [completedOrders, setCompletedOrders] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [bonusEarned, setBonusEarned] = useState(0)

  /* real activity stats — same source as the Orders page */
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/mine', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) return
      const orders = Array.isArray(data.orders) ? data.orders : []
      setTotalOrders(orders.length)
      setCompletedOrders(orders.filter((o: { status: string }) => o.status === 'completed').length)
      setBonusEarned(
        orders
          .filter((o: { status: string }) => o.status === 'completed')
          .reduce((s: number, o: { bonus: number }) => s + (Number(o.bonus) || 0), 0)
      )
    } catch {
      // stats are cosmetic — next visit retries
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const maskedMobile = mobile
    ? `+91 ••••• ${(mobile.slice(-5)).replace(/\d(?=\d{2})/g, '•')}`
    : '+91 ••••• •••'

  const vipLevel = vipFromOrders(completedOrders)
  const vipBase = (vipLevel - 1) * VIP_STEP
  const vipTarget = vipLevel * VIP_STEP
  const vipPct = Math.min(100, ((completedOrders - vipBase) / VIP_STEP) * 100)

  const menu = [
    {
      key: 'deposit',
      label: 'Add Money',
      sub: 'Instant UPI · Card · NetBanking',
      icon: <IconArrowUpDown className="h-[18px] w-[18px]" />,
      action: () => onNavigate('deposit'),
    },
    {
      key: 'task',
      label: 'My Tasks',
      sub: 'Daily tasks & streak rewards',
      icon: <IconCheckSquare className="h-[18px] w-[18px]" />,
      action: () => onNavigate('task'),
    },
    {
      key: 'withdraw',
      label: 'Withdraw Funds',
      sub: 'UPI & bank transfer payouts',
      icon: <IconArrowDownToLine className="h-[18px] w-[18px]" />,
      action: () => onNavigate('withdraw'),
    },
    {
      key: 'team',
      label: 'My Team',
      sub: 'Invite friends, earn commission',
      icon: <IconUsers className="h-[18px] w-[18px]" />,
      action: () => onNavigate('team'),
    },
    {
      key: 'orders',
      label: 'Order History',
      sub: 'Every order you have placed',
      icon: <IconHistory className="h-[18px] w-[18px]" />,
      action: () => onNavigate('orders'),
    },
  ] as const

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Profile" subtitle="Account & settings" onBack={onBack} />

      {/* identity card */}
      <section className="wp-rise relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
        <span
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl"
        />
        <div className="flex items-center gap-3.5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[24px] font-black text-[#04120C] shadow-[0_14px_30px_-8px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.4)]">
            {(username || 'P').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[18px] font-extrabold leading-tight text-[var(--wp-heading)]">
                {username}
              </p>
              <span className="wp-glow-amber flex shrink-0 items-center gap-0.5 rounded-md border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
                <IconCrown className="h-2.5 w-2.5" />
                VIP
              </span>
            </div>
            <p className="mt-0.5 text-[12px] tabular-nums text-[var(--wp-muted)]">{maskedMobile}</p>
            <p className="text-[10.5px] text-[var(--wp-muted-2)]">
              {memberSince ? `Member since ${memberSince}` : 'WatchPay member'}
            </p>
          </div>
        </div>
      </section>

      {/* wallet card */}
      <section className="wp-rise flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-[var(--wp-card)] p-3.5 shadow-[0_0_24px_-10px_rgba(0,208,132,0.55),var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_6px_16px_-4px_rgba(0,208,132,0.6)]">
            <IconWallet className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
              Wallet balance
            </p>
            <p aria-live="polite" className="text-[19px] font-extrabold leading-tight text-[var(--wp-heading)]">
              <CountUp value={balance} prefix="₹ " decimals={2} />
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate('deposit')}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3.5 text-[12.5px] font-extrabold text-[var(--wp-accent-text)] transition-all duration-200 hover:-translate-y-px hover:bg-emerald-400/20 active:translate-y-0 active:scale-[0.97]"
          >
            <IconArrowUpDown className="h-4 w-4" />
            Add
          </button>
          <button
            type="button"
            onClick={() => onNavigate('withdraw')}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] px-4 text-[12.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:scale-[0.97]"
          >
            <IconArrowDownToLine className="h-4 w-4" />
            Withdraw
          </button>
        </div>
      </section>

      {/* quick stats — REAL numbers */}
      <section className="wp-rise grid grid-cols-3 gap-2" style={{ animationDelay: '100ms' }}>
        {[
          { label: 'Tasks Done', value: completedOrders },
          { label: 'Total Orders', value: totalOrders },
          { label: 'Bonus ₹', value: bonusEarned },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-2.5 text-center shadow-[var(--wp-shadow-card)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
          >
            <p className="text-[15px] font-extrabold text-[var(--wp-heading)]">
              <CountUp value={s.value} />
            </p>
            <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* VIP progress — driven by REAL completed orders */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '130ms' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconCrown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">VIP Level {vipLevel}</h2>
          </div>
          <span className="text-[10px] font-bold text-[var(--wp-muted-2)]">
            {Math.max(0, vipTarget - completedOrders)} more orders to{' '}
            <span className="text-amber-500 dark:text-amber-300">VIP {Math.min(5, vipLevel + 1)}</span>
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-700"
            style={{ width: `${vipPct}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--wp-muted)]">
          Higher VIP levels unlock bigger withdrawal bonuses and priority support queues.
        </p>
      </section>

      {/* menu */}
      <section className="wp-rise overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '160ms' }}>
        {menu.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onClick={item.action}
            className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-[var(--wp-hover)] active:bg-[var(--wp-hover)] ${
              i > 0 ? 'border-t border-[var(--wp-border)]' : ''
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold text-[var(--wp-text)]">{item.label}</span>
              <span className="block truncate text-[10.5px] text-[var(--wp-muted-2)]">{item.sub}</span>
            </span>
            <IconChevronRight className="h-4 w-4 text-[var(--wp-faint)]" aria-hidden="true" />
          </button>
        ))}

        {/* appearance toggle */}
        <div className="flex items-center gap-3 border-t border-[var(--wp-border)] px-3.5 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
            {light ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-[var(--wp-text)]">Appearance</span>
            <span className="block text-[10.5px] text-[var(--wp-muted-2)]">
              {light ? 'Sage light theme' : 'Midnight dark theme'}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={light}
            aria-label="Toggle light theme"
            onClick={onToggleLight}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 ${
              light
                ? 'border-emerald-400/50 bg-emerald-400/25'
                : 'border-[var(--wp-border-strong)] bg-[var(--wp-chip)]'
            }`}
          >
            <span
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow transition-all duration-300 ${
                light
                  ? 'left-[26px] bg-gradient-to-b from-[#2BF5A6] to-[#00B978] shadow-[0_0_10px_rgba(0,208,132,0.7)]'
                  : 'left-[3px] bg-[var(--wp-faint)]'
              }`}
            />
          </button>
        </div>

        {/* support */}
        <button
          type="button"
          onClick={() =>
            toast({
              title: 'Support',
              description: '24×7 live support is coming with the next release.',
            })
          }
          className="flex w-full items-center gap-3 border-t border-[var(--wp-border)] px-3.5 py-3 text-left transition-colors duration-150 hover:bg-[var(--wp-hover)]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
            <IconHeadset className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-[var(--wp-text)]">Support</span>
            <span className="block text-[10.5px] text-[var(--wp-muted-2)]">We reply within minutes</span>
          </span>
          <IconChevronRight className="h-4 w-4 text-[var(--wp-faint)]" aria-hidden="true" />
        </button>

        {/* logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 border-t border-[var(--wp-border)] px-3.5 py-3 text-left transition-colors duration-150 hover:bg-red-500/[0.07]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-400/25 bg-red-500/10 text-red-400">
            <IconLogout className="h-[18px] w-[18px]" />
          </span>
          <span className="flex-1 text-[13.5px] font-bold text-red-400">Log out</span>
        </button>
      </section>

      <p className="pb-1 text-center text-[10px] font-semibold tracking-[0.14em] text-[var(--wp-faint)]">
        WATCHPAY · V1.0.0
      </p>
    </div>
  )
}
