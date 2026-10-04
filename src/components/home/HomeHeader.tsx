'use client'

import { useState } from 'react'
import {
  IconLogout,
  IconMenu,
  IconMoon,
  IconSun,
  IconUserStroke,
  IconWallet,
} from './icons'

const inr = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Top bar — hamburger (account menu) • WATCHPAY logo • live wallet chip •
 * theme toggle (dark ⇄ light). Wallet balance comes from the DB via
 * /api/wallet polling.
 */
export function HomeHeader({
  balance,
  light,
  username,
  onToggleLight,
  onLogout,
}: {
  balance: number
  light: boolean
  username: string
  onToggleLight: () => void
  onLogout: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="flex items-center justify-between gap-2 pt-3">
      {/* hamburger + logo */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative">
          <button
            type="button"
            aria-label="Open account menu"
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
                aria-label="Account"
                className="wp-pop absolute left-0 top-12 z-50 w-[210px] overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-menu-bg)] p-3 shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-2.5">
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
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onLogout()
                  }}
                  className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/[0.08] text-[13px] font-semibold text-red-300 transition-colors duration-200 hover:bg-red-500/[0.16] active:scale-[0.98]"
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

      {/* wallet + theme */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          aria-live="polite"
          aria-label={`Wallet balance ₹${inr(balance)}`}
          className="flex h-10 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-[var(--wp-card-solid)] pl-3 pr-3.5 shadow-[0_0_18px_-6px_rgba(0,208,132,0.5)]"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C]">
            <IconWallet className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-bold tabular-nums text-[var(--wp-text)]">
            ₹ {inr(balance)}
          </span>
        </div>
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
