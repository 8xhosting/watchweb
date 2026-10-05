'use client'

import { useState } from 'react'
import {
  IconArrowDownToLine,
  IconArrowUpDown,
  IconCheckSquare,
  IconChevronRight,
  IconClipboardList,
  IconHeadset,
  IconLogout,
  IconMenu,
  IconMoon,
  IconSun,
  IconUserStroke,
  IconUsers,
  IconWallet,
} from './icons'

const inr = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export type HeaderNavTarget = 'profile' | 'orders' | 'team' | 'task' | 'deposit' | 'withdraw'

const MENU_LINKS: Array<{
  key: HeaderNavTarget
  label: string
  icon: (cls: string) => React.ReactNode
}> = [
  { key: 'deposit', label: 'Add Money', icon: (c) => <IconArrowUpDown className={c} /> },
  { key: 'withdraw', label: 'Withdraw Funds', icon: (c) => <IconArrowDownToLine className={c} /> },
  { key: 'orders', label: 'My Orders', icon: (c) => <IconClipboardList className={c} /> },
  { key: 'task', label: 'My Tasks', icon: (c) => <IconCheckSquare className={c} /> },
  { key: 'team', label: 'My Team', icon: (c) => <IconUsers className={c} /> },
  { key: 'profile', label: 'Profile', icon: (c) => <IconUserStroke className={c} /> },
]

/**
 * Top bar — hamburger (FULL navigation menu: every page is reachable from
 * any screen) • WATCHPAY logo • live wallet chip (tap → Add Money) • theme
 * toggle (dark ⇄ light). Wallet balance comes from the DB via /api/wallet.
 */
export function HomeHeader({
  balance,
  light,
  username,
  onToggleLight,
  onLogout,
  onNavigate,
}: {
  balance: number
  light: boolean
  username: string
  onToggleLight: () => void
  onLogout: () => void
  /** opens the app screens — every page connects from here */
  onNavigate?: (target: HeaderNavTarget) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const go = (target: HeaderNavTarget) => {
    setMenuOpen(false)
    onNavigate?.(target)
  }

  return (
    <header className="flex items-center gap-2 pt-3">
      {/* hamburger + logo (left group) */}
      <div className="flex min-w-0 items-center gap-2.5">
      <div className="relative">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-[var(--wp-border)] bg-[var(--wp-hover)] text-[var(--wp-text)] transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300 active:scale-95"
        >
          <IconMenu className="h-[18px] w-[18px]" />
        </button>

        {menuOpen && (
          <>
            {/* click-away layer */}
            <div
              aria-hidden="true"
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label="Navigation"
              className="wp-pop absolute left-0 top-12 z-50 w-[230px] overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-menu-bg)] p-2.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
            >
              <div className="mb-1.5 flex items-center gap-2.5 px-1.5 pb-1.5">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  <IconUserStroke className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--wp-muted-2)]">
                    Signed in
                  </p>
                  <p className="truncate text-[13.5px] font-bold text-[var(--wp-heading)]">{username}</p>
                </div>
              </div>

              {MENU_LINKS.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  role="menuitem"
                  onClick={() => go(link.key)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-emerald-400/10 active:bg-emerald-400/15"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
                    {link.icon('h-[14px] w-[14px]')}
                  </span>
                  <span className="flex-1 text-[12.5px] font-bold text-[var(--wp-text)]">
                    {link.label}
                  </span>
                  <IconChevronRight className="h-3.5 w-3.5 text-[var(--wp-faint)]" aria-hidden="true" />
                </button>
              ))}

              <button
                type="button"
                role="menuitem"
                onClick={() => go('deposit')}
                className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-2.5 py-2 text-left transition-colors duration-150 hover:bg-emerald-400/[0.16]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C]">
                  <IconWallet className="h-[14px] w-[14px]" />
                </span>
                <span className="flex-1 text-[12.5px] font-extrabold text-[var(--wp-accent-text)]">
                  Wallet · ₹{inr(balance)}
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
                className="mt-1.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/[0.08] text-[13px] font-semibold text-red-300 transition-colors duration-200 hover:bg-red-500/[0.16] active:scale-[0.98]"
              >
                <IconLogout className="h-4 w-4" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>

      <span className="wp-live-dot h-2 w-2 shrink-0 rounded-full bg-[#00E091] shadow-[0_0_10px_rgba(0,224,145,0.9)]" />
      <h1 className="whitespace-nowrap text-[21px] font-extrabold italic leading-none tracking-tight">
        <span className="text-[var(--wp-heading)]">WATCH</span>
        <span className="bg-gradient-to-b from-[#4DF7B8] via-[#00D084] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_10px_rgba(0,208,132,0.45))]">
          PAY
        </span>
      </h1>
      </div>

      {/* wallet + theme (right group) */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-live="polite"
          aria-label={`Wallet balance ₹${inr(balance)} — tap to add money`}
          onClick={() => go('deposit')}
          className="flex h-10 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-[var(--wp-card-solid)] pl-3 pr-3.5 shadow-[0_0_18px_-6px_rgba(0,208,132,0.5)] transition-all duration-200 hover:border-emerald-400/60 hover:bg-emerald-400/10 active:scale-95"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C]">
            <IconWallet className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-bold tabular-nums text-[var(--wp-text)]">
            ₹ {inr(balance)}
          </span>
        </button>
        <button
          type="button"
          aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
          onClick={onToggleLight}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--wp-border)] bg-[var(--wp-hover)] text-[var(--wp-text)] transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-600 active:scale-95"
        >
          {light ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </header>
  )
}
