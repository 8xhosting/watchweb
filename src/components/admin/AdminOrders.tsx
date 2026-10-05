'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { PLATFORMS } from '@/lib/order-rules'
import { CountUp, EmptyState, StatusChip, timeAgo } from './widgets'

interface AdminOrder {
  id: string
  username: string
  amount: number
  bonus: number
  platform: string
  status: string
  createdAt: string
}

const FILTERS = ['all', 'processing', 'completed', 'expired'] as const

/**
 * Orders — the REAL payment ledger (persisted on every user PAY tap),
 * plus a manual order creator for support/credits. Admin can complete,
 * expire or delete any record.
 */
export function AdminOrders() {
  const { toast } = useToast()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [q, setQ] = useState('')
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // create form
  const [showCreate, setShowCreate] = useState(false)
  const [cUser, setCUser] = useState('')
  const [cAmount, setCAmount] = useState('')
  const [cPlatform, setCPlatform] = useState<string>(PLATFORMS[0])
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?status=${filter}&q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      setOrders(res.ok && data?.ok ? (data.orders as AdminOrder[]) : [])
    } catch {
      setOrders([])
    }
  }, [filter, q])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
  }, [load])

  async function act(id: string, action: 'complete' | 'expire' | 'delete') {
    if (busyId) return
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        if (action === 'delete') setOrders((prev) => (prev ?? []).filter((o) => o.id !== id))
        else
          setOrders((prev) =>
            (prev ?? []).map((o) => (o.id === id ? { ...o, status: data.status ?? o.status } : o))
          )
        toast({ title: `Order ${action === 'delete' ? 'deleted' : `marked ${data.status}`}` })
      } else {
        toast({ variant: 'destructive', title: 'Action failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setBusyId(null)
    }
  }

  async function create() {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cUser.trim(), amount: Number(cAmount), platform: cPlatform }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        toast({ title: 'Manual order created', description: `₹${cAmount} on ${cPlatform} for ${cUser}` })
        setShowCreate(false)
        setCUser('')
        setCAmount('')
        void load()
      } else {
        toast({ variant: 'destructive', title: 'Could not create', description: data?.error ?? 'Check the details.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setCreating(false)
    }
  }

  const totalVolume = (orders ?? []).reduce((s, o) => s + o.amount, 0)

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
        <div className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 focus-within:border-emerald-400/60">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--wp-muted-2)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search platform or username…"
            aria-label="Search orders"
            className="h-full w-full bg-transparent text-[12px] font-semibold text-[var(--wp-text)] outline-none placeholder:text-[var(--wp-faint)]"
          />
        </div>
        <span className="hidden h-9 items-center rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3 text-[11px] font-black tabular-nums text-[var(--wp-accent-text)] sm:flex">
          <CountUp value={totalVolume} prefix="₹" />
          <span className="ml-1 text-[8.5px] font-bold uppercase tracking-wider text-[var(--wp-muted-2)]">shown volume</span>
        </span>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          aria-expanded={showCreate}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] px-3.5 text-[11.5px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(0,208,132,0.65)] transition-all duration-200 hover:brightness-105 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Manual order
        </button>
      </div>

      {/* create panel */}
      {showCreate ? (
        <div className="wp-rise rounded-2xl border border-emerald-400/25 bg-[var(--wp-card)] p-4 shadow-[0_0_24px_-12px_rgba(0,208,132,0.5)] backdrop-blur-xl">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">
            Create manual order (support / adjustment)
          </p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-4">
            <input
              value={cUser}
              onChange={(e) => setCUser(e.target.value)}
              placeholder="username"
              aria-label="Username"
              className="h-11 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 text-[12.5px] font-semibold text-[var(--wp-text)] outline-none placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60"
            />
            <div className="flex h-11 items-center gap-1.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 focus-within:border-emerald-400/60">
              <span className="text-[13px] font-extrabold text-[var(--wp-accent-text)]">₹</span>
              <input
                inputMode="numeric"
                value={cAmount}
                onChange={(e) => setCAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                placeholder="Amount"
                aria-label="Amount"
                className="h-full w-full bg-transparent text-[12.5px] font-extrabold tabular-nums text-[var(--wp-heading)] outline-none placeholder:text-[var(--wp-faint)]"
              />
            </div>
            <select
              value={cPlatform}
              onChange={(e) => setCPlatform(e.target.value)}
              aria-label="Platform"
              className="h-11 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 text-[12.5px] font-semibold text-[var(--wp-text)] outline-none focus:border-emerald-400/60"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} className="bg-[#0a101c]">
                  {p}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={creating || !cUser.trim() || !Number(cAmount)}
              onClick={() => void create()}
              className="h-11 rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[12px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(0,208,132,0.65)] transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create order'}
            </button>
          </div>
        </div>
      ) : null}

      {/* list */}
      {orders === null ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="wp-shimmer h-[72px] rounded-2xl border border-white/[0.05]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders here"
          sub="Orders persist when users tap PAY on the Home screen. Manual orders also appear here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o, i) => (
            <li
              key={o.id}
              className="wp-rise flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 backdrop-blur-xl"
              style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] text-[9px] font-black uppercase text-[var(--wp-muted)]">
                {o.platform.slice(0, 4)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-black leading-tight tabular-nums text-[var(--wp-heading)]">
                  ₹{o.amount.toLocaleString('en-IN')}
                  <span className="ml-2 text-[10.5px] font-extrabold text-[var(--wp-accent-text)]">+₹{o.bonus.toLocaleString('en-IN')}</span>
                </p>
                <p className="truncate text-[10px] text-[var(--wp-muted-2)]">
                  <span className="font-bold text-[var(--wp-muted)]">{o.username}</span> · {o.platform} · {timeAgo(o.createdAt)}
                </p>
              </div>
              <StatusChip status={o.status} />
              <div className="flex shrink-0 gap-1.5">
                {o.status !== 'completed' ? (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => void act(o.id, 'complete')}
                    className="flex h-8 items-center rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 text-[10px] font-extrabold text-[var(--wp-accent-text)] transition-all duration-200 hover:bg-emerald-400/20 active:scale-95 disabled:opacity-60"
                  >
                    Complete
                  </button>
                ) : null}
                {o.status !== 'expired' ? (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => void act(o.id, 'expire')}
                    className="flex h-8 items-center rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 text-[10px] font-extrabold text-amber-300 transition-all duration-200 hover:bg-amber-400/20 active:scale-95 disabled:opacity-60"
                  >
                    Expire
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === o.id}
                  onClick={() => void act(o.id, 'delete')}
                  aria-label="Delete order"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-red-400/35 bg-red-400/[0.08] text-red-300 transition-all duration-200 hover:bg-red-400/20 active:scale-95 disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
