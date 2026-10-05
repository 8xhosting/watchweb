'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { BarChart, CountUp, Donut, EmptyState, KpiCard, Sparkline, StatusChip, timeAgo } from './widgets'

interface Overview {
  dbLatency: number
  users: {
    total: number
    newToday: number
    banned: number
    walletLiability: number
    series: Array<{ label: string; count: number }>
    recent: Array<{ username: string; mobile: string; balance: number; status: string; createdAt: string }>
  }
  orders: {
    total: number
    today: number
    volumeToday: number
    bonusTotal: number
    statusCounts: { processing: number; completed: number; expired: number }
    series: Array<{ label: string; value: number }>
    platforms: Array<{ name: string; count: number }>
    recent: Array<{ amount: number; platform: string; status: string; createdAt: string }>
  }
  withdrawals: {
    pending: number
    pendingAmount: number
    paid: number
    paidAmount: number
    rejected: number
    total: number
  }
}

interface SecurityLite {
  payout: { usagePct: number; pendingAmount: number }
  adminAuth: { failedLogins: unknown[]; lockouts48h: number }
  risks: { bannedWithBalance: unknown[]; stuckOrders: unknown[]; neverLogged: number }
}

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`

/**
 * Dashboard — the command centre: real KPIs, 7-day charts, platform mix,
 * payout health and system status, all from the live database.
 */
export function AdminDashboard({ onGoSection }: { onGoSection: (s: string) => void }) {
  const [data, setData] = useState<Overview | null>(null)
  const [sec, setSec] = useState<SecurityLite | null>(null)
  const [error, setError] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) {
        setData(json as Overview)
        setRefreshedAt(new Date())
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    }
  }, [])

  const loadSec = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) setSec(json as SecurityLite)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void load()
    void loadSec()
    const t = setInterval(load, 15000) // live refresh every 15s
    const ts = setInterval(loadSec, 30000)
    return () => {
      clearInterval(t)
      clearInterval(ts)
    }
  }, [load, loadSec])

  if (error && !data) {
    return (
      <EmptyState
        title="Dashboard data unavailable"
        sub="The database did not respond. Check the connection and refresh."
      />
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="wp-shimmer h-[104px] rounded-2xl border border-white/[0.05]" />
        ))}
      </div>
    )
  }

  const healthGood = data.dbLatency < 800

  /* risk alerts — live from the Security Centre */
  const alerts: Array<{ label: string; detail: string; tone: 'red' | 'amber'; go: string }> = []
  if (sec) {
    if (sec.payout.usagePct >= 60)
      alerts.push({ label: 'Payout cap', detail: `${sec.payout.usagePct}% of daily limit used`, tone: sec.payout.usagePct >= 90 ? 'red' : 'amber', go: 'security' })
    if (sec.adminAuth.failedLogins.length > 0)
      alerts.push({ label: 'Auth attacks', detail: `${sec.adminAuth.failedLogins.length} failed admin login(s) 48h`, tone: 'red', go: 'security' })
    if (sec.risks.bannedWithBalance.length > 0)
      alerts.push({ label: 'Banned wallets', detail: `${sec.risks.bannedWithBalance.length} banned user(s) hold balance`, tone: 'amber', go: 'users' })
    if (sec.risks.stuckOrders.length > 0)
      alerts.push({ label: 'Stuck orders', detail: `${sec.risks.stuckOrders.length} processing order(s) 1h+`, tone: 'amber', go: 'orders' })
  }

  const quickActions: Array<{ label: string; go: string; icon: ReactNode }> = [
    {
      label: 'Broadcast',
      go: 'control',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 11 18-5v12L3 14v-3z" />
        </svg>
      ),
    },
    {
      label: 'Payout queue',
      go: 'withdrawals',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
        </svg>
      ),
    },
    {
      label: 'Ledger',
      go: 'ledger',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: 'Analytics',
      go: 'analytics',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 3v18h18" />
          <path d="M7 16v-5" />
          <path d="M12 16V8" />
        </svg>
      ),
    },
    {
      label: 'Security',
      go: 'security',
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* refresh strip */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
          <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-[#00D084]" />
          Auto-refresh 15s · {refreshedAt ? refreshedAt.toLocaleTimeString('en-IN') : '—'}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 text-[11px] font-extrabold text-[var(--wp-accent-text)] transition-all duration-200 hover:bg-emerald-400/20 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ============ QUICK ACTIONS + RISK ALERTS ============ */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 backdrop-blur-xl">
          <h2 className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">Quick actions</h2>
          <div className="mt-2.5 grid grid-cols-5 gap-1.5 sm:grid-cols-5">
            {quickActions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => onGoSection(a.go)}
                className="flex h-[58px] flex-col items-center justify-center gap-1 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)] transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-[var(--wp-accent-text)] active:scale-95"
              >
                {a.icon}
                <span className="text-[8.5px] font-extrabold uppercase tracking-wide">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 backdrop-blur-xl" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">Live risk alerts</h2>
            <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${alerts.length ? 'bg-red-400/15 text-red-300' : 'bg-emerald-400/10 text-[var(--wp-accent-text)]'}`}>
              {alerts.length ? `${alerts.length} active` : 'all clear'}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {alerts.length === 0 ? (
              <p className="py-2 text-[11px] text-[var(--wp-muted)]">
                No threats detected — payout cap, admin auth, wallets and order pipeline are all healthy.
              </p>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => onGoSection(a.go)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all duration-200 hover:brightness-110 active:scale-95 ${
                    a.tone === 'red'
                      ? 'border-red-400/40 bg-red-400/10'
                      : 'border-amber-400/40 bg-amber-400/10'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full wp-live-dot ${a.tone === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span>
                    <span className={`block text-[10.5px] font-black ${a.tone === 'red' ? 'text-red-300' : 'text-amber-300'}`}>{a.label}</span>
                    <span className="block text-[9px] text-[var(--wp-muted-2)]">{a.detail}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ===================== KPI ROW ===================== */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Total Users"
          value={data.users.total}
          sub={`+${data.users.newToday} today · ${data.users.banned} banned`}
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <KpiCard
          label="Wallet Liability"
          value={data.users.walletLiability}
          prefix="₹"
          sub="Total balance held for users"
          tone="sky"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
            </svg>
          }
        />
        <KpiCard
          label="Orders Today"
          value={data.orders.today}
          sub={`${inr(data.orders.volumeToday)} volume today`}
          tone="amber"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 2h8l2 4H6l2-4z" />
              <path d="M4 6h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
            </svg>
          }
        />
        <KpiCard
          label="Pending Payouts"
          value={data.withdrawals.pendingAmount}
          prefix="₹"
          sub={`${data.withdrawals.pending} request(s) awaiting action`}
          tone={data.withdrawals.pending > 0 ? 'red' : 'emerald'}
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          }
        />
      </div>

      {/* ===================== CHARTS ROW ===================== */}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Registrations — 7 days</h2>
            <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-extrabold text-[var(--wp-accent-text)]">
              {data.users.newToday} today
            </span>
          </div>
          <div className="mt-3">
            <BarChart data={data.users.series.map((s) => ({ label: s.label, value: s.count }))} />
          </div>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Order Volume — 7 days</h2>
            <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-extrabold text-[var(--wp-accent-text)]">
              {inr(data.orders.volumeToday)} today
            </span>
          </div>
          <div className="mt-3">
            <BarChart data={data.orders.series} prefix="₹" />
          </div>
        </section>
      </div>

      {/* ===================== MID ROW ===================== */}
      <div className="grid gap-3 lg:grid-cols-3">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '90ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Platform Mix</h2>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">All persisted payment orders</p>
          <div className="mt-3">
            {data.orders.platforms.length ? (
              <Donut data={data.orders.platforms} />
            ) : (
              <p className="py-6 text-center text-[11px] text-[var(--wp-muted)]">
                No orders yet — data appears as users pay.
              </p>
            )}
          </div>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '120ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Payout Health</h2>
          <div className="mt-3 flex flex-col gap-2">
            {[
              { label: 'Paid out', value: data.withdrawals.paid, amount: data.withdrawals.paidAmount, cls: 'text-[var(--wp-accent-text)]', bar: 100 },
              { label: 'Pending', value: data.withdrawals.pending, amount: data.withdrawals.pendingAmount, cls: 'text-amber-300', bar: data.withdrawals.total ? (data.withdrawals.pending / data.withdrawals.total) * 100 : 0 },
              { label: 'Rejected', value: data.withdrawals.rejected, amount: 0, cls: 'text-red-300', bar: data.withdrawals.total ? (data.withdrawals.rejected / data.withdrawals.total) * 100 : 0 },
            ].map((r) => (
              <div key={r.label} className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[var(--wp-text)]">{r.label}</span>
                  <span className={`font-extrabold tabular-nums ${r.cls}`}>
                    {r.label === 'Rejected' ? r.value : `${r.value} · ${inr(r.amount)}`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978] transition-all duration-700"
                    style={{ width: `${Math.max(3, r.bar)}%`, opacity: r.label === 'Rejected' ? 0.45 : 1 }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onGoSection('withdrawals')}
              className="mt-1 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 text-[11.5px] font-extrabold text-[var(--wp-accent-text)] transition-all duration-200 hover:bg-emerald-400/20 active:scale-[0.98]"
            >
              Open payout queue
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '150ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">System Status</h2>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5">
              <span className="text-[11.5px] font-bold text-[var(--wp-text)]">MongoDB Atlas</span>
              <span className={`flex items-center gap-1.5 text-[10.5px] font-extrabold ${healthGood ? 'text-[var(--wp-accent-text)]' : 'text-amber-300'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${healthGood ? 'bg-[#00D084] wp-live-dot' : 'bg-amber-400'}`} />
                {data.dbLatency} ms
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5">
              <span className="text-[11.5px] font-bold text-[var(--wp-text)]">Bonus programme</span>
              <span className="text-[10.5px] font-extrabold text-[var(--wp-accent-text)]">
                {data.orders.bonusTotal > 0 ? `${inr(data.orders.bonusTotal)} paid` : 'No payouts yet'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5">
              <span className="text-[11.5px] font-bold text-[var(--wp-text)]">Payment gateway</span>
              <span className="text-[10.5px] font-extrabold text-amber-300">Not connected</span>
            </div>
            <div className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold text-[var(--wp-text)]">Order trend</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--wp-muted-2)]">volume</span>
              </div>
              <Sparkline values={data.orders.series.map((s) => s.value)} className="mt-1 h-10 w-full" />
            </div>
          </div>
        </section>
      </div>

      {/* ===================== ACTIVITY ROW ===================== */}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Newest Users</h2>
            <button
              type="button"
              onClick={() => onGoSection('users')}
              className="text-[10.5px] font-extrabold text-[var(--wp-accent-text)] hover:underline"
            >
              Manage all
            </button>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-[var(--wp-border)]">
            {data.users.recent.length === 0 ? (
              <li className="py-6 text-center text-[11.5px] text-[var(--wp-muted)]">No registrations yet.</li>
            ) : (
              data.users.recent.map((u) => (
                <li key={u.username} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-[12px] font-black text-[var(--wp-accent-text)]">
                    {u.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-extrabold text-[var(--wp-text)]">{u.username}</p>
                    <p className="text-[9.5px] tabular-nums text-[var(--wp-muted-2)]">{u.mobile} · {timeAgo(u.createdAt)}</p>
                  </div>
                  <span className="shrink-0 text-[12px] font-extrabold tabular-nums text-[var(--wp-accent-text)]">
                    <CountUp value={u.balance} prefix="₹" />
                  </span>
                  <StatusChip status={u.status} />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '210ms' }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Latest Payment Orders</h2>
            <button
              type="button"
              onClick={() => onGoSection('orders')}
              className="text-[10.5px] font-extrabold text-[var(--wp-accent-text)] hover:underline"
            >
              Manage all
            </button>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-[var(--wp-border)]">
            {data.orders.recent.length === 0 ? (
              <li className="py-6 text-center text-[11.5px] text-[var(--wp-muted)]">
                No payment orders yet — they appear when users tap PAY.
              </li>
            ) : (
              data.orders.recent.map((o, i) => (
                <li key={`${o.createdAt}-${i}`} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--wp-border)] bg-[var(--wp-chip)] text-[8.5px] font-black uppercase text-[var(--wp-muted)]">
                    {o.platform.slice(0, 3)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-extrabold tabular-nums text-[var(--wp-text)]">{inr(o.amount)}</p>
                    <p className="text-[9.5px] text-[var(--wp-muted-2)]">{o.platform} · {timeAgo(o.createdAt)}</p>
                  </div>
                  <StatusChip status={o.status} />
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
