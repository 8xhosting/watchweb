'use client'

import { useMemo, useState } from 'react'
import { CountUp } from '@/components/ui/count-up'
import { Sparkline } from '@/components/admin/widgets'
import { platformStyle } from '@/components/home/platforms'
import { IconCheckCircle, IconClock, IconHistory, IconLoader } from '@/components/home/icons'
import { PageHeader } from './PageHeader'
import { buildOrderHistory, type OrderRecordStatus } from './data'

const inr = new Intl.NumberFormat('en-IN')

const FILTERS: Array<{ key: OrderRecordStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'processing', label: 'Processing' },
  { key: 'soldout', label: 'Sold Out' },
]

const STATUS_CHIP: Record<OrderRecordStatus, { label: string; cls: string }> = {
  completed: {
    label: 'Completed',
    cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  },
  processing: {
    label: 'Processing',
    cls: 'border-amber-400/45 bg-amber-400/10 text-amber-600 dark:text-amber-300',
  },
  soldout: {
    label: 'Sold Out',
    cls: 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted-2)]',
  },
}

/**
 * My Orders — ADVANCED: animated summary, status-distribution bar, volume
 * sparkline, CSV export and the per-order ledger with brand marks.
 */
export function OrdersPage({ username, onBack }: { username: string; onBack: () => void }) {
  const [filter, setFilter] = useState<OrderRecordStatus | 'all'>('all')
  const history = useMemo(() => buildOrderHistory(username), [username])

  const completed = history.filter((r) => r.status === 'completed')
  const processing = history.filter((r) => r.status === 'processing')
  const totalBonus = history.reduce((s, r) => s + r.bonus, 0)
  const totalVolume = history.reduce((s, r) => s + r.amount, 0)

  const visible = filter === 'all' ? history : history.filter((r) => r.status === filter)

  /** status distribution — single stacked bar (completed / processing / soldout) */
  const dist = {
    completed: (completed.length / history.length) * 100,
    processing: (processing.length / history.length) * 100,
    soldout: ((history.length - completed.length - processing.length) / history.length) * 100,
  }

  function exportCsv() {
    const header = 'order_id,platform,amount,bonus,status,when\n'
    const rows = history
      .map((r) => `${r.id},${r.platform},${r.amount},${r.bonus},${r.status},"${r.when}"`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `watchpay-orders-${username}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="My Orders"
        subtitle="Your complete order history"
        onBack={onBack}
        right={
          <button
            type="button"
            onClick={exportCsv}
            aria-label="Export order history as CSV"
            className="grid h-10 w-10 place-items-center rounded-[13px] border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 transition-all duration-200 hover:bg-emerald-400/20 active:scale-95 dark:text-emerald-300"
          >
            <IconHistory className="h-[18px] w-[18px]" />
          </button>
        }
      />

      {/* animated summary */}
      <section className="wp-rise grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: history.length },
          { label: 'Completed', value: completed.length },
          { label: 'Bonus ₹', value: totalBonus },
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

      {/* insights — volume + status distribution */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Insights</h2>
          <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-extrabold text-[var(--wp-accent-text)]">
            ₹{inr.format(totalVolume)} volume
          </span>
        </div>
        <Sparkline values={history.map((r) => r.amount)} className="mt-2 h-10 w-full" />
        <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <span className="h-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978] transition-all duration-700" style={{ width: `${dist.completed}%` }} />
          <span className="h-full bg-gradient-to-r from-amber-400/80 to-amber-500/80 transition-all duration-700" style={{ width: `${dist.processing}%` }} />
          <span className="h-full bg-white/15 transition-all duration-700" style={{ width: `${dist.soldout}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-[var(--wp-muted-2)]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B978]" /> Completed {Math.round(dist.completed)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Processing {Math.round(dist.processing)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white/30" /> Sold out {Math.round(dist.soldout)}%
          </span>
        </div>
      </section>

      {/* filter chips */}
      <section
        role="tablist"
        aria-label="Filter orders"
        className="wp-rise flex items-center gap-1.5 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-1.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
        style={{ animationDelay: '100ms' }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={`h-8 flex-1 rounded-xl text-[11.5px] font-bold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-white shadow-[0_6px_16px_-6px_rgba(0,208,132,0.7)]'
                  : 'border border-[var(--wp-border-strong)] bg-[var(--wp-hover)] text-[var(--wp-muted)] hover:text-[var(--wp-text)]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </section>

      {/* records */}
      <section className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] py-8 text-center text-[12.5px] text-[var(--wp-muted)] shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
            No orders in this category yet.
          </p>
        ) : (
          visible.map((r, i) => {
            const style = platformStyle(r.platform)
            const chip = STATUS_CHIP[r.status]
            return (
              <article
                key={r.id}
                className="wp-rise relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3 pl-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
                style={{ animationDelay: `${Math.min(i * 45, 360)}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                  style={{
                    background: r.status === 'soldout' ? '#EF4444' : style.accent,
                    boxShadow: `0 0 12px ${r.status === 'soldout' ? 'rgba(239,68,68,0.75)' : style.accent + '66'}`,
                  }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_-6px_rgba(0,0,0,0.7)] ring-1 ring-white/15 ${style.markClass}`}
                      style={{
                        background: style.circleBg,
                        color: style.markColor,
                        fontSize: style.mark.length > 3 ? 9 : style.mark.length > 2 ? 12 : 14,
                      }}
                    >
                      {style.mark}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[17px] font-extrabold leading-none tracking-tight tabular-nums text-[var(--wp-heading)]">
                        ₹ {inr.format(r.amount)}
                      </p>
                      <p className="mt-1 text-[10.5px] font-bold text-[var(--wp-accent-text)]">
                        +₹{inr.format(r.bonus)} bonus
                      </p>
                      <p className="mt-1 truncate font-mono text-[9.5px] text-[var(--wp-muted-2)]">
                        {r.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex h-7 shrink-0 items-center gap-1 rounded-lg border px-2 text-[10.5px] font-extrabold ${chip.cls}`}
                  >
                    {r.status === 'completed' ? (
                      <IconCheckCircle className="h-3 w-3" />
                    ) : r.status === 'processing' ? (
                      <IconLoader className="h-3 w-3 animate-spin" />
                    ) : (
                      <IconClock className="h-3 w-3" />
                    )}
                    {chip.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span
                    className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide wp-badge ${style.badgeClass}`}
                  >
                    {r.platform.toUpperCase()}
                  </span>
                  <span className="text-[10.5px] text-[var(--wp-muted)]">{r.when}</span>
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
