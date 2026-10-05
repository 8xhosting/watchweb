'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'
import { AdminUsers } from './AdminUsers'
import { AdminOrders } from './AdminOrders'
import { AdminWithdrawals } from './AdminWithdrawals'
import { AdminControl } from './AdminControl'
import { AdminAnalytics } from './AdminAnalytics'
import { AdminLedger } from './AdminLedger'
import { AdminSecurity } from './AdminSecurity'
import { AdminGateways } from './AdminGateways'

type Section = 'dashboard' | 'analytics' | 'users' | 'orders' | 'withdrawals' | 'gateways' | 'ledger' | 'security' | 'control'

const NAV: Array<{ key: Section; label: string; sub: string; icon: string }> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    sub: 'Live KPIs & health',
    icon: 'M3 3v16a2 2 0 0 0 2 2h16 M7 14l4-4 4 3 5-6',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    sub: 'Growth · leaderboard · platforms',
    icon: 'M3 3v18h18 M7 16v-5 m5 5V8 m5 8v-3',
  },
  {
    key: 'users',
    label: 'Users',
    sub: 'Accounts & balances',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M22 21v-2a4 4 0 0 0-3-3.87',
  },
  {
    key: 'orders',
    label: 'Orders',
    sub: 'Payment flow & manual orders',
    icon: 'M8 2h8l2 4H6l2-4z M4 6h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z M9 11h6',
  },
  {
    key: 'withdrawals',
    label: 'Payouts',
    sub: 'Withdrawal queue',
    icon: 'M12 3v12 m-5-5 5 5 5-5 M5 21h14',
  },
  {
    key: 'gateways',
    label: 'Gateways',
    sub: 'QwackPay · keys · deposits',
    icon: 'M2 5h20v14H2z M2 10h20 M6 15h4',
  },
  {
    key: 'ledger',
    label: 'Ledger',
    sub: 'Every rupee movement',
    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  },
  {
    key: 'security',
    label: 'Security',
    sub: 'Guard rails · auth · risks',
    icon: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z',
  },
  {
    key: 'control',
    label: 'Master Control',
    sub: 'Settings · broadcast · audit',
    icon: 'M12 2v4 m0 12v4 M4.9 4.9l2.8 2.8 m8.6 8.6 2.8 2.8 M2 12h4 m12 0h4 M4.9 19.1l2.8-2.8 m8.6-8.6 2.8-2.8',
  },
]

function NavIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

/**
 * WATCHPAY ADMIN — Master Control Panel.
 *
 * Full-viewport ops console (renders OUTSIDE the 390px phone frame):
 *   • gate → AdminLogin (wp_admin cookie, 12h)
 *   • sidebar (desktop) / tab rail (mobile) navigation
 *   • sections pull REAL MongoDB data through /api/admin/*
 *
 * Dark control-room theme, same emerald design system as the app.
 */
export function AdminPanel() {
  /** null = checking session, false = logged out, string = admin username */
  const [authed, setAuthed] = useState<null | string | false>(null)
  const [section, setSection] = useState<Section>('dashboard')
  const [maintenance, setMaintenance] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/login', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      setAuthed(res.ok && data?.ok ? String(data.username ?? 'admin') : false)
    } catch {
      setAuthed(false)
    }
  }, [])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  // global maintenance state lives here so the badge updates instantly
  useEffect(() => {
    if (!authed) return
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (alive && res.ok && data?.ok) setMaintenance(Boolean(data.config.maintenance))
      } catch {
        // keep last state
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [authed, section])

  if (authed === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="wp-pop">
          <span className="wp-live-dot block h-3 w-3 rounded-full bg-[#00D084] shadow-[0_0_16px_rgba(0,208,132,0.9)]" />
        </div>
      </div>
    )
  }

  if (!authed) {
    return <AdminLogin onAuthed={(u) => setAuthed(u)} />
  }

  async function logout() {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' })
    } catch {
      // ignore — clear the UI anyway
    }
    setAuthed(false)
  }

  return (
    <div className="flex min-h-svh">
      {/* ============================ SIDEBAR (desktop) ============================ */}
      <aside className="sticky top-0 hidden h-svh w-[248px] shrink-0 flex-col border-r border-[var(--wp-border)] bg-[var(--wp-card-solid)]/80 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_8px_20px_-6px_rgba(0,208,132,0.7)]">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-black leading-tight tracking-tight text-[var(--wp-heading)]">
              WATCHPAY <span className="text-[var(--wp-accent-text)]">ADMIN</span>
            </p>
            <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[var(--wp-muted-2)]">
              Master Control
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin sections">
          {NAV.map((n) => {
            const active = section === n.key
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setSection(n.key)}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                  active
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-[var(--wp-accent-text)] shadow-[inset_0_0_0_1px_rgba(0,208,132,0.15),0_0_20px_-8px_rgba(0,208,132,0.4)]'
                    : 'border-transparent text-[var(--wp-muted)] hover:bg-[var(--wp-hover)] hover:text-[var(--wp-text)]'
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors duration-200 ${
                    active
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-[var(--wp-accent-text)]'
                      : 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted-2)] group-hover:text-[var(--wp-text)]'
                  }`}
                >
                  <NavIcon d={n.icon} className="h-[15px] w-[15px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-extrabold leading-tight">{n.label}</span>
                  <span className="block truncate text-[9.5px] text-[var(--wp-muted-2)]">{n.sub}</span>
                </span>
                {n.key === 'withdrawals' && maintenance === false ? null : null}
              </button>
            )
          })}
        </nav>

        {/* session footer */}
        <div className="border-t border-[var(--wp-border)] p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--wp-chip)] px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[13px] font-black text-[#04120C]">
              {authed.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-extrabold text-[var(--wp-text)]">{authed}</p>
              <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--wp-muted-2)]">
                <span className="wp-live-dot h-1 w-1 rounded-full bg-[#00D084]" />
                Session active
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Log out of admin"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--wp-border)] text-[var(--wp-muted)] transition-colors duration-200 hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================ MAIN ============================ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--wp-border)] bg-[var(--wp-bg)]/85 px-4 py-3 backdrop-blur-xl lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {/* mobile brand */}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] lg:hidden">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-black leading-tight tracking-tight text-[var(--wp-heading)]">
                {NAV.find((n) => n.key === section)?.label}
              </h1>
              <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">
                {NAV.find((n) => n.key === section)?.sub}
              </p>
            </div>
          </div>

          {maintenance ? (
            <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 text-[9.5px] font-black uppercase tracking-wide text-amber-300">
              <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-current" />
              Maintenance ON
            </span>
          ) : null}
          <span className="hidden h-7 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 text-[9.5px] font-black uppercase tracking-wide text-[var(--wp-accent-text)] sm:flex">
            <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-current" />
            All systems live
          </span>
        </header>

        {/* mobile tab rail */}
        <nav
          className="wp-ticker-mask sticky top-[57px] z-20 flex gap-1.5 overflow-x-auto border-b border-[var(--wp-border)] bg-[var(--wp-bg)]/85 px-4 py-2.5 backdrop-blur-xl lg:hidden"
          aria-label="Admin sections"
        >
          {NAV.map((n) => {
            const active = section === n.key
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setSection(n.key)}
                aria-pressed={active}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold transition-all duration-200 ${
                  active
                    ? 'border-emerald-400/40 bg-emerald-400/15 text-[var(--wp-accent-text)]'
                    : 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)]'
                }`}
              >
                <NavIcon d={n.icon} className="h-3.5 w-3.5" />
                {n.label}
              </button>
            )
          })}
        </nav>

        {/* sections */}
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 lg:px-6">
          {section === 'dashboard' && <AdminDashboard onGoSection={(s) => setSection(s as Section)} />}
          {section === 'analytics' && <AdminAnalytics />}
          {section === 'users' && <AdminUsers />}
          {section === 'orders' && <AdminOrders />}
          {section === 'withdrawals' && <AdminWithdrawals />}
          {section === 'gateways' && <AdminGateways />}
          {section === 'ledger' && <AdminLedger />}
          {section === 'security' && <AdminSecurity />}
          {section === 'control' && <AdminControl onMaintenanceChange={setMaintenance} />}
        </main>
      </div>
    </div>
  )
}
