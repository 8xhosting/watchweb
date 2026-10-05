'use client'

import { useCallback, useEffect, useState } from 'react'
import { CountUp, EmptyState, TxChip, timeAgo, txSign } from './widgets'

interface Tx {
  id: string
  type: string
  amount: number
  balanceAfter: number
  note: string
  username: string
  createdAt: string
}

interface Ledger {
  summary: {
    total: number
    moneyIn: number
    moneyOut: number
    net: number
    liability: number
    typeCounts: Record<string, number>
  }
  transactions: Tx[]
}

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Credits' },
  { key: 'debit', label: 'Debits' },
  { key: 'order_bonus', label: 'Bonuses' },
  { key: 'withdrawal_hold', label: 'Holds' },
  { key: 'withdrawal_paid', label: 'Paid out' },
  { key: 'withdrawal_refund', label: 'Refunds' },
]

/**
 * Ledger — the platform's unified money movement feed. Every credit,
 * debit, bonus, hold, payout and refund recorded with balance-after.
 */
export function AdminLedger() {
  const [data, setData] = useState<Ledger | null>(null)
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ take: '80' })
      if (type !== 'all') params.set('type', type)
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/admin/ledger?${params}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) setData(json as Ledger)
    } catch {
      // keep previous data
    }
  }, [type, q])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250) // debounce filters
    return () => clearTimeout(t)
  }, [load])

  const s = data?.summary

  return (
    <div className="flex flex-col gap-4">
      {/* ============ SUMMARY STRIP ============ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Wallet Inflow', value: s?.moneyIn ?? 0, cls: 'text-[var(--wp-accent-text)]', sub: 'credits + bonuses + refunds' },
          { label: 'Wallet Outflow', value: s?.moneyOut ?? 0, cls: 'text-amber-400', sub: 'debits + holds + payouts' },
          { label: 'Net Movement', value: s?.net ?? 0, cls: 'text-sky-400', sub: 'inflow − outflow' },
          { label: 'Entries', value: s?.total ?? 0, cls: 'text-[var(--wp-heading)]', sub: 'recorded movements' },
        ].map((c, i) => (
          <div
            key={c.label}
            className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 backdrop-blur-xl"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">{c.label}</p>
            <p className={`mt-1 text-[19px] font-black leading-none tabular-nums ${c.cls}`}>
              <CountUp value={c.value} prefix="₹" />
            </p>
            <p className="mt-1 text-[9.5px] text-[var(--wp-muted-2)]">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ============ FILTERS ============ */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 transition-colors duration-200 focus-within:border-emerald-400/60">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--wp-muted-2)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search note or username…"
            aria-label="Search ledger"
            className="h-full w-full bg-transparent text-[12.5px] font-semibold text-[var(--wp-text)] outline-none placeholder:font-normal placeholder:text-[var(--wp-faint)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setType(f.key)}
              aria-pressed={type === f.key}
              className={`h-8 rounded-lg border px-2.5 text-[10.5px] font-extrabold transition-all duration-200 active:scale-95 ${
                type === f.key
                  ? 'border-emerald-400/40 bg-emerald-400/15 text-[var(--wp-accent-text)]'
                  : 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)] hover:text-[var(--wp-text)]'
              }`}
            >
              {f.label}
              {f.key !== 'all' && s?.typeCounts?.[f.key] ? (
                <span className="ml-1 tabular-nums opacity-70">{s.typeCounts[f.key]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ============ MOVEMENTS ============ */}
      {!data ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="wp-shimmer h-[58px] rounded-2xl border border-white/[0.05]" />
          ))}
        </div>
      ) : data.transactions.length === 0 ? (
        <EmptyState
          title="No movements recorded"
          sub="Every credit, debit, bonus, hold, payout and refund lands here automatically."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {data.transactions.map((t, i) => {
            const plus = txSign(t.type) === '+'
            return (
              <li
                key={t.id}
                className="wp-rise flex items-center gap-3 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] px-3.5 py-2.5 backdrop-blur-xl"
                style={{ animationDelay: `${Math.min(i * 25, 250)}ms` }}
              >
                <TxChip type={t.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-extrabold text-[var(--wp-text)]">
                    {t.username}
                    <span className="ml-1.5 font-semibold text-[var(--wp-muted-2)]">bal {`₹${Math.round(t.balanceAfter).toLocaleString('en-IN')}`}</span>
                  </p>
                  <p className="truncate text-[10px] text-[var(--wp-muted-2)]">{t.note || '—'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[13.5px] font-black tabular-nums ${plus ? 'text-[var(--wp-accent-text)]' : 'text-amber-300'}`}>
                    {plus ? '+' : '−'}
                    <CountUp value={t.amount} prefix="₹" decimals={2} />
                  </p>
                  <p className="text-[9px] font-bold tabular-nums text-[var(--wp-faint)]">{timeAgo(t.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
