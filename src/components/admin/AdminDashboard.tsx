'use client'

import { useCallback, useEffect, useState } from 'react'
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

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`

/**
 * Dashboard — the command centre: real KPIs, 7-day charts, platform mix,
 * payout health and system status, all from the live database.
 */
export function AdminDashboard({ onGoSection }: { onGoSection: (s: string) => void }) {
  const [data, setData] = useState<Overview | null>(null)
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

  useEffect(() => {
    void load()
    const t = setInterval(load, 15000) // live refresh every 15s
    return () => clearInterval(t)
  }, [load])

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
