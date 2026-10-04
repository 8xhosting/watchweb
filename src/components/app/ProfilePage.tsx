'use client'

import { useToast } from '@/hooks/use-toast'
import {
  IconArrowDownToLine,
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

/**
 * Profile — identity card, wallet shortcut, quick stats and the full
 * settings menu (tasks / withdraw / team / history / appearance / support /
 * logout). Balance is the real DB value polled by AppShell.
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
  onNavigate: (view: 'team' | 'orders' | 'task' | 'withdraw') => void
  onLogout: () => void
}) {
  const { toast } = useToast()
  const teamSize = buildTeam(username).length

  const maskedMobile = mobile
    ? `+91 ••••• ${(mobile.slice(-5)).replace(/\d(?=\d{2})/g, '•')}`
    : '+91 ••••• •••'

  const menu = [
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
      <section className="relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
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
              <span className="flex shrink-0 items-center gap-0.5 rounded-md border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
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
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-[var(--wp-card)] p-3.5 shadow-[0_0_24px_-10px_rgba(0,208,132,0.55),var(--wp-shadow-card)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_6px_16px_-4px_rgba(0,208,132,0.6)]">
            <IconWallet className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
              Wallet balance
            </p>
            <p aria-live="polite" className="text-[19px] font-extrabold tabular-nums leading-tight text-[var(--wp-heading)]">
              ₹ {inr(balance)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('withdraw')}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] px-4 text-[12.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:scale-[0.97]"
        >
          <IconArrowDownToLine className="h-4 w-4" />
          Withdraw
        </button>
      </section>

      {/* quick stats */}
      <section className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tasks Done', value: '24' },
          { label: 'Team Size', value: String(teamSize) },
          { label: 'VIP Level', value: '1' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-2.5 text-center shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
          >
            <p className="text-[15px] font-extrabold tabular-nums text-[var(--wp-heading)]">{s.value}</p>
            <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* menu */}
      <section className="overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
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
