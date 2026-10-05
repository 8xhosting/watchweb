'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CountUp } from '@/components/ui/count-up'
import { Sparkline } from '@/components/admin/widgets'
import { platformStyle } from '@/components/home/platforms'
import {
  IconArrowDownToLine,
  IconCheckCircle,
  IconClock,
  IconHistory,
  IconLoader,
  IconXCircle,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'

const inr = new Intl.NumberFormat('en-IN')

type RowStatus = 'completed' | 'processing' | 'failed'
type RowKind = 'order' | 'addmoney'

interface Row {
  id: string
  kind: RowKind
  platform: string // platform name for orders, 'Wallet' for add-money
  amount: number
  bonus: number
  status: RowStatus
  when: number // epoch ms
}

const FILTERS: Array<{ key: RowStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
]

const STATUS_CHIP: Record<RowStatus, { label: string; cls: string }> = {
  completed: {
    label: 'Completed',
    cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300',
  },
  processing: {
    label: 'Processing',
    cls: 'border-amber-400/45 bg-amber-400/10 text-amber-600 dark:text-amber-300',
  },
  failed: {
    label: 'Failed',
    cls: 'border-red-400/45 bg-red-400/10 text-red-500 dark:text-red-300',
  },
}

function whenLabel(ms: number): string {
  const d = new Date(ms)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`
}

/**
 * My Orders — REAL database records (no demo data):
 *   • live-order payments from the Home feed (amount + bonus, auto-completed
 *     by the gateway callback the moment the bank confirms)
 *   • Add-Money wallet top-ups from the Profile/Deposit page
 * Statuses: Completed (credited) / Processing (awaiting gateway) / Failed.
 * ADVANCED: animated summary, status distribution bar, volume sparkline,
 * live polling (10s) and CSV export.
 */
export function OrdersPage({ username, onBack }: { username: string; onBack: () => void }) {
  const [filter, setFilter] = useState<RowStatus | 'all'>('all')
  const [rows, setRows] = useState<Row[] | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/mine', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) return
      const orderRows: Row[] = (Array.isArray(data.orders) ? data.orders : []).map(
        (o: {
          id: string
          platform: string
          amount: number
          bonus: number
          status: string
          createdAt: string
        }) => ({
          id: o.id,
          kind: 'order' as const,
          platform: o.platform || 'Order',
          amount: Number(o.amount) || 0,
          bonus: Number(o.bonus) || 0,
          status: (o.status === 'completed' || o.status === 'failed' ? o.status : 'processing') as RowStatus,
          when: new Date(o.createdAt).getTime(),
        })
      )
      const moneyRows: Row[] = (Array.isArray(data.addMoney) ? data.addMoney : []).map(
        (d: { id: string; amount: number; status: string; createdAt: string }) => ({
          id: d.id,
          kind: 'addmoney' as const,
          platform: 'Add Money',
          amount: Number(d.amount) || 0,
          bonus: 0,
          status: (d.status === 'success' ? 'completed' : d.status === 'failed' ? 'failed' : 'processing') as RowStatus,
          when: new Date(d.createdAt).getTime(),
        })
      )
      setRows(
        [...orderRows, ...moneyRows].sort((a, b) => b.when - a.when)
      )
    } catch {
      // keep previous rows — next poll retries
    }
  }, [])

  useEffect(() => {
    void load()
    const t = setInterval(load, 10000)
    const resume = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', resume)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [load])

  const history = rows ?? []

  const completed = history.filter((r) => r.status === 'completed')
  const processing = history.filter((r) => r.status === 'processing')
  const failed = history.filter((r) => r.status === 'failed')
  const totalBonus = completed.filter((r) => r.kind === 'order').reduce((s, r) => s + r.bonus, 0)
  const totalVolume = history.reduce((s, r) => s + r.amount, 0)

  const visible = useMemo(
    () => (filter === 'all' ? history : history.filter((r) => r.status === filter)),
    [history, filter]
  )

  /** status distribution — single stacked bar (completed / processing / failed) */
  const denom = Math.max(1, history.length)
  const dist = {
    completed: (completed.length / denom) * 100,
    processing: (processing.length / denom) * 100,
    failed: (failed.length / denom) * 100,
  }

  function exportCsv() {
    const header = 'order_id,type,platform,amount,bonus,status,when\n'
    const rowsCsv = history
      .map(
        (r) =>
          `${r.id},${r.kind === 'order' ? 'live_order' : 'add_money'},"${r.platform}",${r.amount},${r.bonus},${r.status},"${whenLabel(r.when)}"`
      )
      .join('\n')
    const blob = new Blob([header + rowsCsv], { type: 'text/csv;charset=utf-8' })
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
        subtitle="Live-order payments & add-money history"
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
      <section
        className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Insights</h2>
          <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-extrabold text-[var(--wp-accent-text)]">
            ₹{inr.format(totalVolume)} volume
          </span>
        </div>
        <Sparkline values={history.length > 1 ? history.map((r) => r.amount).reverse() : [0, 0]} className="mt-2 h-10 w-full" />
        <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <span
            className="h-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978] transition-all duration-700"
            style={{ width: `${dist.completed}%` }}
          />
          <span
            className="h-full bg-gradient-to-r from-amber-400/80 to-amber-500/80 transition-all duration-700"
            style={{ width: `${dist.processing}%` }}
          />
          <span className="h-full bg-red-400/60 transition-all duration-700" style={{ width: `${dist.failed}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-[var(--wp-muted-2)]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B978]" /> Completed {Math.round(dist.completed)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Processing {Math.round(dist.processing)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Failed {Math.round(dist.failed)}%
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
      <section className="flex flex-col gap-2" aria-busy={rows === null}>
        {rows === null ? (
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="wp-shimmer h-[86px] rounded-2xl border border-white/[0.05]"
            />
          ))
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] py-8 text-center text-[12.5px] text-[var(--wp-muted)] shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
            {history.length === 0
              ? 'No activity yet — pay a live order or add money to get started.'
              : 'Nothing in this category.'}
          </p>
        ) : (
          visible.map((r, i) => {
            const style = platformStyle(r.platform)
            const chip = STATUS_CHIP[r.status]
            const isMoney = r.kind === 'addmoney'
            return (
              <article
                key={`${r.kind}-${r.id}`}
                className="wp-rise relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3 pl-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
                style={{ animationDelay: `${Math.min(i * 45, 360)}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                  style={{
                    background:
                      r.status === 'failed'
                        ? '#EF4444'
                        : r.status === 'processing'
                          ? '#FBBF24'
                          : style.accent,
                    boxShadow: `0 0 12px ${r.status === 'failed' ? 'rgba(239,68,68,0.75)' : style.accent + '66'}`,
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
                      {isMoney ? <IconArrowDownToLine className="h-5 w-5" /> : style.mark}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[17px] font-extrabold leading-none tracking-tight tabular-nums text-[var(--wp-heading)]">
                        ₹ {inr.format(r.amount)}
                      </p>
                      {r.kind === 'order' && r.bonus > 0 ? (
                        <p className="mt-1 text-[10.5px] font-bold text-[var(--wp-accent-text)]">
                          +₹{inr.format(r.bonus)} bonus
                        </p>
                      ) : null}
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
                      <IconXCircle className="h-3 w-3" />
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
                  <span className="text-[10.5px] text-[var(--wp-muted)]">{whenLabel(r.when)}</span>
                </div>
              </article>
            )
          })
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-[9.5px] text-[var(--wp-faint)]">
        <IconClock className="h-3 w-3" />
        Live — updates automatically every 10 seconds
      </p>
    </div>
  )
}
