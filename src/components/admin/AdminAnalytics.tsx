'use client'

import { useCallback, useEffect, useState } from 'react'
import { AreaChart, BarChart, CountUp, Donut, EmptyState, KpiCard, StatusChip } from './widgets'

interface Analytics {
  kpis: {
    arpu: number
    aov: number
    completionRate: number
    bonusTotal: number
    activeUsers: number
    dormantUsers: number
    new30: number
    engagedLogins: number
  }
  regSeries: Array<{ label: string; count: number; cumulative: number }>
  volSeries: Array<{ label: string; value: number }>
  leaderboard: Array<{
    rank: number
    username: string
    balance: number
    orders: number
    volume: number
    paidOut: number
    status: string
  }>
  platforms: Array<{ name: string; count: number; volume: number; rate: number }>
  methodSplit: Array<{ name: string; count: number; amount: number }>
}

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`

const RANK_STYLE: Record<number, string> = {
  1: 'border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-[0_0_14px_-2px_rgba(250,204,21,0.5)]',
  2: 'border-slate-300/40 bg-slate-300/10 text-slate-200',
  3: 'border-orange-400/40 bg-orange-400/10 text-orange-300',
}

/**
 * Analytics — deep business intelligence: 30-day growth, leaderboard,
 * platform performance and payout-method mix, all computed from the DB.
 */
export function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) {
        setData(json as Analytics)
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
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  if (error && !data) {
    return <EmptyState title="Analytics unavailable" sub="The database did not respond. Refresh to retry." />
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="wp-shimmer h-[120px] rounded-2xl border border-white/[0.05]" />
        ))}
      </div>
    )
  }

  const methodTotal = data.methodSplit.reduce((s, m) => s + m.count, 0) || 1

  return (
    <div className="flex flex-col gap-4">
      {/* ============ DERIVED KPI ROW ============ */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="ARPU — avg wallet"
          value={data.kpis.arpu}
          prefix="₹"
          decimals={0}
          sub="Average balance per user"
          tone="sky"
        />
        <KpiCard
          label="Avg Order Value"
          value={data.kpis.aov}
          prefix="₹"
          sub={`${data.kpis.completionRate}% completion rate`}
          tone="amber"
        />
        <KpiCard
          label="Bonus Paid"
          value={data.kpis.bonusTotal}
          prefix="₹"
          sub="All-time programme cost"
        />
        <KpiCard
          label="Active vs Dormant"
          value={data.kpis.activeUsers}
          sub={`${data.kpis.dormantUsers} users never ordered · ${data.kpis.engagedLogins} logged in (7d)`}
          tone={data.kpis.dormantUsers > data.kpis.activeUsers ? 'amber' : 'emerald'}
        />
      </div>

      {/* ============ 30-DAY GROWTH ============ */}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">User Growth — 30 days</h2>
            <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-extrabold text-[var(--wp-accent-text)]">
              +{data.kpis.new30} new
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">Cumulative registered accounts</p>
          <div className="mt-3">
            <AreaChart
              values={data.regSeries.map((r) => r.cumulative)}
              labels={data.regSeries.map((r) => r.label)}
              height={150}
            />
          </div>
          <div className="mt-2">
            <BarChart data={data.regSeries.slice(-7).map((r) => ({ label: r.label.split(' ')[0], value: r.count }))} height={70} />
          </div>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Order Volume — 30 days</h2>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">Daily rupee volume through the PAY flow</p>
          <div className="mt-3">
            <AreaChart
              values={data.volSeries.map((r) => r.value)}
              labels={data.volSeries.map((r) => r.label)}
              height={150}
              stroke="#38BDF8"
            />
          </div>
          <div className="mt-2">
            <BarChart data={data.volSeries.slice(-7).map((r) => ({ label: r.label.split(' ')[0], value: r.value }))} height={70} prefix="₹" />
          </div>
        </section>
      </div>

      {/* ============ LEADERBOARD + PLATFORM TABLE ============ */}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '90ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Top Wallets Leaderboard</h2>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">Highest balances with order activity</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {data.leaderboard.length === 0 ? (
              <li className="py-4 text-center text-[11.5px] text-[var(--wp-muted)]">No users yet.</li>
            ) : (
              data.leaderboard.map((u) => (
                <li
                  key={u.username}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2"
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[10.5px] font-black ${
                      RANK_STYLE[u.rank] ?? 'border-[var(--wp-border)] bg-[var(--wp-input)] text-[var(--wp-muted)]'
                    }`}
                  >
                    {u.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12px] font-extrabold text-[var(--wp-text)]">{u.username}</p>
                      <StatusChip status={u.status} />
                    </div>
                    <p className="text-[9.5px] tabular-nums text-[var(--wp-muted-2)]">
                      {u.orders} orders · {inr(u.volume)} volume · {inr(u.paidOut)} paid out
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-black tabular-nums text-[var(--wp-accent-text)]">
                    <CountUp value={u.balance} prefix="₹" />
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '120ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Platform Performance</h2>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">Volume, orders and completion rate per platform</p>
          {data.platforms.length === 0 ? (
            <p className="py-8 text-center text-[11.5px] text-[var(--wp-muted)]">
              No orders yet — platform stats appear as users pay.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-[8.5px] font-black uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">
                    <th className="pb-2 pr-2">Platform</th>
                    <th className="pb-2 pr-2 text-right">Orders</th>
                    <th className="pb-2 pr-2 text-right">Volume</th>
                    <th className="pb-2 text-right">Complete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--wp-border)]">
                  {data.platforms.map((p) => (
                    <tr key={p.name}>
                      <td className="py-2 pr-2 font-extrabold text-[var(--wp-text)]">{p.name}</td>
                      <td className="py-2 pr-2 text-right tabular-nums text-[var(--wp-muted)]">{p.count}</td>
                      <td className="py-2 pr-2 text-right font-bold tabular-nums text-[var(--wp-text)]">{inr(p.volume)}</td>
                      <td className="py-2 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1 w-10 overflow-hidden rounded-full bg-white/[0.08]">
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978]"
                              style={{ width: `${Math.max(4, p.rate)}%` }}
                            />
                          </span>
                          <span className="tabular-nums font-bold text-[var(--wp-accent-text)]">{p.rate}%</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ============ PAYOUT METHOD MIX ============ */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '150ms' }}>
        <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Payout Method Mix</h2>
        <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">Where users send their withdrawals</p>
        <div className="mt-3">
          {methodTotal === 0 ? (
            <p className="py-6 text-center text-[11.5px] text-[var(--wp-muted)]">No withdrawal requests yet.</p>
          ) : (
            <Donut data={data.methodSplit.map((m) => ({ name: `${m.name} · ${inr(m.amount)}`, count: m.count }))} size={120} />
          )}
        </div>
      </section>
    </div>
  )
}
