'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp, EmptyState, StatusChip, timeAgo } from './widgets'

interface AdminWithdrawal {
  id: string
  username: string
  amount: number
  method: string
  destination: string
  status: string
  createdAt: string
}

const FILTERS = ['all', 'pending', 'paid', 'rejected'] as const

/**
 * Payouts — approve or reject withdrawal requests. Rejecting REFUNDS the
 * held amount to the user's wallet automatically (money is never lost).
 */
export function AdminWithdrawals() {
  const { toast } = useToast()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('pending')
  const [rows, setRows] = useState<AdminWithdrawal[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${filter}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      setRows(res.ok && data?.ok ? (data.withdrawals as AdminWithdrawal[]) : [])
    } catch {
      setRows([])
    }
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  async function act(id: string, action: 'paid' | 'reject') {
    if (busyId) return
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setRows((prev) => (prev ?? []).map((w) => (w.id === id ? { ...w, status: data.status } : w)))
        toast({
          title: action === 'paid' ? 'Payout marked PAID' : 'Request rejected',
          description:
            action === 'paid'
              ? 'The queue is updated in the database.'
              : `₹${data.refunded ?? 0} refunded to the user's wallet.`,
        })
      } else {
        toast({ variant: 'destructive', title: 'Action failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setBusyId(null)
    }
  }

  const pendingAmount = (rows ?? []).filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 items-center rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`h-7 rounded-lg px-2.5 text-[10.5px] font-extrabold capitalize transition-all duration-200 ${
                filter === f
                  ? 'bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-white'
                  : 'text-[var(--wp-muted)] hover:text-[var(--wp-text)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {filter === 'pending' && pendingAmount > 0 ? (
          <span className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 text-[11px] font-black tabular-nums text-amber-300">
            <CountUp value={pendingAmount} prefix="₹" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider opacity-80">on hold</span>
          </span>
        ) : null}
      </div>

      {/* list */}
      {rows === null ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="wp-shimmer h-[76px] rounded-2xl border border-white/[0.05]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={filter === 'pending' ? 'Payout queue is clear' : 'Nothing here'}
          sub="User withdrawal requests appear here in real time. Rejecting refunds the held amount automatically."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((w, i) => (
            <li
              key={w.id}
              className="wp-rise flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 backdrop-blur-xl"
              style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                  w.method === 'upi'
                    ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                    : 'border-violet-400/30 bg-violet-400/10 text-violet-300'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {w.method === 'upi' ? (
                    <>
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <path d="M12 18h.01" />
                    </>
                  ) : (
                    <>
                      <line x1="3" x2="21" y1="22" y2="22" />
                      <polygon points="12 2 20 7 4 7" />
                      <line x1="6" x2="6" y1="18" y2="11" />
                      <line x1="10" x2="10" y1="18" y2="11" />
                      <line x1="14" x2="14" y1="18" y2="11" />
                      <line x1="18" x2="18" y1="18" y2="11" />
                    </>
                  )}
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-black leading-tight tabular-nums text-[var(--wp-heading)]">
                  ₹{w.amount.toLocaleString('en-IN')}
                </p>
                <p className="truncate text-[10px] text-[var(--wp-muted-2)]">
                  <span className="font-bold text-[var(--wp-muted)]">{w.username}</span> · {w.method.toUpperCase()} · {w.destination} · {timeAgo(w.createdAt)}
                </p>
              </div>
              <StatusChip status={w.status} />
              {w.status === 'pending' ? (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === w.id}
                    onClick={() => void act(w.id, 'paid')}
                    className="flex h-8 items-center gap-1 rounded-lg bg-gradient-to-b from-[#2BF5A6] to-[#00B978] px-3 text-[10px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(0,208,132,0.7)] transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Mark paid
                  </button>
                  <button
                    type="button"
                    disabled={busyId === w.id}
                    onClick={() => void act(w.id, 'reject')}
                    className="flex h-8 items-center gap-1 rounded-lg border border-red-400/40 bg-red-400/10 px-3 text-[10px] font-extrabold text-red-300 transition-all duration-200 hover:bg-red-400/20 active:scale-95 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
