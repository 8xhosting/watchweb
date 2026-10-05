'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp, EmptyState, StatusChip, TxChip, timeAgo, txSign } from './widgets'

interface AdminUser {
  id: string
  username: string
  mobile: string
  balance: number
  status: string
  createdAt: string
}

interface UserDetail {
  user: AdminUser & { lastLoginAt: string | null }
  orders: Array<{ amount: number; bonus: number; platform: string; status: string; createdAt: string }>
  withdrawals: Array<{ amount: number; method: string; status: string; createdAt: string }>
  transactions: Array<{ type: string; amount: number; balanceAfter: number; note: string; createdAt: string }>
}

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'balance', label: 'Top balance' },
  { key: 'username', label: 'A→Z' },
] as const

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`

/**
 * Users — search, sort, export, bulk-operate and inspect every account.
 *   • 360° detail drawer: orders + payouts + ledger for the selected user
 *   • bulk mode: multi-select → credit / debit / ban / unban in one shot
 *   • CSV export of the full user table
 * Every action hits the real database and lands in the audit log.
 */
export function AdminUsers() {
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('newest')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  /** id of the user whose wallet panel is open + the pending amount */
  const [walletFor, setWalletFor] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  /* bulk mode */
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAmount, setBulkAmount] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  /* 360° drawer */
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = useCallback(
    async (search: string, sortBy: string) => {
      try {
        const res = await fetch(
          `/api/admin/users?q=${encodeURIComponent(search)}&sort=${sortBy}`,
          { cache: 'no-store' }
        )
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok) setUsers(data.users as AdminUser[])
        else setUsers([])
      } catch {
        setUsers([])
      }
    },
    []
  )

  useEffect(() => {
    const t = setTimeout(() => void load(q, sort), 250) // debounce search
    return () => clearTimeout(t)
  }, [q, sort, load])

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id)
    setDetail(null)
    try {
      const res = await fetch(`/api/admin/users?detail=${id}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setDetail(data as UserDetail)
      else setDetailId(null)
    } catch {
      setDetailId(null)
    }
  }, [])

  const totals = useMemo(() => {
    const list = users ?? []
    return {
      count: list.length,
      liability: list.reduce((s, u) => s + u.balance, 0),
      banned: list.filter((u) => u.status === 'banned').length,
    }
  }, [users])

  async function act(id: string, action: 'ban' | 'unban' | 'credit' | 'debit', amt?: number) {
    if (busyId) return
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, amount: amt }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setUsers((prev) =>
          (prev ?? []).map((u) => {
            if (u.id !== id) return u
            if (action === 'ban') return { ...u, status: 'banned' }
            if (action === 'unban') return { ...u, status: 'active' }
            if (action === 'credit' || action === 'debit')
              return { ...u, balance: data.balance ?? u.balance }
            return u
          })
        )
        const labels: Record<string, string> = {
          ban: 'Account banned',
          unban: 'Account restored',
          credit: `₹${amt} credited`,
          debit: `₹${amt} debited`,
        }
        toast({ title: labels[action], description: 'Change is live in the database + ledger.' })
        if (detailId === id) void openDetail(id) // keep the drawer fresh
      } else {
        toast({ variant: 'destructive', title: 'Action failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error', description: 'Could not reach the admin API.' })
    } finally {
      setBusyId(null)
      setAmount('')
    }
  }

  async function runBulk(action: 'credit' | 'debit' | 'ban' | 'unban') {
    if (bulkBusy || selected.size === 0) return
    const amt = Number(bulkAmount)
    if ((action === 'credit' || action === 'debit') && (!Number.isFinite(amt) || amt <= 0)) {
      toast({ variant: 'destructive', title: 'Enter a valid amount for the bulk operation' })
      return
    }
    setBulkBusy(true)
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: [...selected], amount: amt || undefined }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        toast({
          title: `Bulk ${action} done — ${data.applied} user(s)`,
          description: data.skipped?.length ? `Skipped: ${data.skipped.join(', ')}` : 'All movements recorded in the ledger.',
        })
        setSelected(new Set())
        setBulkAmount('')
        void load(q, sort)
      } else {
        toast({ variant: 'destructive', title: 'Bulk action failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setBulkBusy(false)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exportCsv() {
    window.open('/api/admin/users?export=csv', '_blank')
    toast({ title: 'CSV export started', description: 'Full user table download.' })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* search + totals + actions */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 transition-colors duration-200 focus-within:border-emerald-400/60">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--wp-muted-2)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search username or mobile…"
            aria-label="Search users"
            className="h-full w-full bg-transparent text-[13px] font-semibold text-[var(--wp-text)] outline-none placeholder:font-normal placeholder:text-[var(--wp-faint)]"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex h-11 flex-col justify-center rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-1.5">
            <div className="flex gap-0.5">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  aria-pressed={sort === s.key}
                  className={`h-8 rounded-lg px-2 text-[10px] font-extrabold transition-all duration-200 ${
                    sort === s.key
                      ? 'bg-emerald-400/15 text-[var(--wp-accent-text)]'
                      : 'text-[var(--wp-muted-2)] hover:text-[var(--wp-text)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3 text-[10.5px] font-extrabold text-sky-300 transition-all duration-200 hover:bg-sky-400/20 active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setBulkMode((v) => !v)
              setSelected(new Set())
            }}
            aria-pressed={bulkMode}
            className={`flex h-11 items-center gap-1.5 rounded-xl border px-3 text-[10.5px] font-extrabold transition-all duration-200 active:scale-95 ${
              bulkMode
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                : 'border-[var(--wp-border)] bg-[var(--wp-card)] text-[var(--wp-muted)] hover:text-[var(--wp-text)]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Bulk
          </button>
        </div>
      </div>

      {/* totals strip */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Shown', value: totals.count, tone: 'text-[var(--wp-heading)]' },
          { label: 'Banned', value: totals.banned, tone: 'text-red-300' },
        ].map((s) => (
          <div key={s.label} className="flex h-11 min-w-[86px] flex-col justify-center rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] px-3">
            <span className={`text-[14px] font-black leading-none tabular-nums ${s.tone}`}>
              <CountUp value={s.value} />
            </span>
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--wp-muted-2)]">{s.label}</span>
          </div>
        ))}
        <div className="flex h-11 min-w-[110px] flex-col justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3">
          <span className="text-[14px] font-black leading-none tabular-nums text-[var(--wp-accent-text)]">
            <CountUp value={totals.liability} prefix="₹" />
          </span>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--wp-muted-2)]">Liability</span>
        </div>
        {bulkMode && selected.size > 0 ? (
          <div className="flex h-11 min-w-[110px] flex-col justify-center rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-3">
            <span className="text-[14px] font-black leading-none tabular-nums text-amber-300">{selected.size}</span>
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-amber-300/70">Selected</span>
          </div>
        ) : null}
      </div>

      {/* bulk toolbar */}
      {bulkMode ? (
        <div className="wp-rise flex flex-wrap items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-3">
          <span className="text-[10.5px] font-black uppercase tracking-wide text-amber-300">Bulk mode</span>
          <div className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-400/30 bg-[var(--wp-input)] px-2.5">
            <span className="text-[12px] font-extrabold text-amber-300">₹</span>
            <input
              inputMode="decimal"
              value={bulkAmount}
              onChange={(e) => setBulkAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 9))}
              placeholder="amount"
              aria-label="Bulk amount"
              className="w-20 bg-transparent text-[12px] font-extrabold tabular-nums text-[var(--wp-text)] outline-none placeholder:text-[var(--wp-faint)]"
            />
          </div>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0 || !Number(bulkAmount)}
            onClick={() => void runBulk('credit')}
            className="h-9 rounded-lg bg-gradient-to-b from-[#2BF5A6] to-[#00B978] px-3 text-[10.5px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(0,208,132,0.6)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
          >
            + Credit all
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0 || !Number(bulkAmount)}
            onClick={() => void runBulk('debit')}
            className="h-9 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 text-[10.5px] font-extrabold text-amber-300 transition-all hover:bg-amber-400/20 active:scale-95 disabled:opacity-50"
          >
            − Debit all
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void runBulk('ban')}
            className="h-9 rounded-lg border border-red-400/40 bg-red-400/10 px-3 text-[10.5px] font-extrabold text-red-300 transition-all hover:bg-red-400/20 active:scale-95 disabled:opacity-50"
          >
            Ban all
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void runBulk('unban')}
            className="h-9 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 text-[10.5px] font-extrabold text-[var(--wp-accent-text)] transition-all hover:bg-emerald-400/20 active:scale-95 disabled:opacity-50"
          >
            Unban all
          </button>
          <span className="text-[9.5px] text-amber-200/70">Select users below, then fire one shot.</span>
        </div>
      ) : null}

      {/* list */}
      {users === null ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="wp-shimmer h-[72px] rounded-2xl border border-white/[0.05]" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" sub={q ? `Nothing matches “${q}”.` : 'Users appear here after they register.'} />
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u, i) => {
            const open = walletFor === u.id
            const checked = selected.has(u.id)
            return (
              <li
                key={u.id}
                className={`wp-rise overflow-hidden rounded-2xl border bg-[var(--wp-card)] backdrop-blur-xl transition-colors duration-200 ${
                  checked ? 'border-amber-400/45' : 'border-[var(--wp-border)]'
                }`}
                style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
              >
                <div className="flex flex-wrap items-center gap-3 p-3.5">
                  {bulkMode ? (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`Select ${u.username}`}
                      onClick={() => toggleSelect(u.id)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-all duration-150 active:scale-90 ${
                        checked
                          ? 'border-amber-400/60 bg-amber-400/25 text-amber-200'
                          : 'border-[var(--wp-border-strong)] bg-[var(--wp-input)] text-transparent hover:border-amber-400/40'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void openDetail(u.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={`Open 360° profile for ${u.username}`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[14px] font-black ${
                        u.status === 'banned'
                          ? 'border-red-400/30 bg-red-400/10 text-red-300'
                          : 'border-emerald-400/25 bg-emerald-400/10 text-[var(--wp-accent-text)]'
                      }`}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13.5px] font-extrabold text-[var(--wp-heading)]">{u.username}</p>
                        <StatusChip status={u.status} />
                      </div>
                      <p className="text-[10px] tabular-nums text-[var(--wp-muted-2)]">
                        {u.mobile} · joined {timeAgo(u.createdAt)} · tap for 360° view
                      </p>
                    </div>
                  </button>
                  <p className="shrink-0 text-[15px] font-black tabular-nums text-[var(--wp-accent-text)]">
                    <CountUp value={u.balance} prefix="₹" decimals={2} />
                  </p>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWalletFor(open ? null : u.id)
                        setAmount('')
                      }}
                      aria-expanded={open}
                      className="flex h-8 items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-400/10 px-2.5 text-[10.5px] font-extrabold text-sky-300 transition-all duration-200 hover:bg-sky-400/20 active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                      </svg>
                      Wallet
                    </button>
                    {u.status === 'banned' ? (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => void act(u.id, 'unban')}
                        className="flex h-8 items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 text-[10.5px] font-extrabold text-[var(--wp-accent-text)] transition-all duration-200 hover:bg-emerald-400/20 active:scale-95 disabled:opacity-60"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => void act(u.id, 'ban')}
                        className="flex h-8 items-center gap-1 rounded-lg border border-red-400/40 bg-red-400/10 px-2.5 text-[10.5px] font-extrabold text-red-300 transition-all duration-200 hover:bg-red-400/20 active:scale-95 disabled:opacity-60"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                        Ban
                      </button>
                    )}
                  </div>
                </div>

                {/* wallet drawer */}
                {open ? (
                  <div className="wp-rise border-t border-[var(--wp-border)] bg-[var(--wp-chip)] p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
                      Adjust wallet — current {`₹${u.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 focus-within:border-emerald-400/60">
                        <span className="text-[13px] font-extrabold text-[var(--wp-accent-text)]">₹</span>
                        <input
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 9))}
                          placeholder="0.00"
                          aria-label="Adjustment amount"
                          className="h-full w-full bg-transparent text-[13px] font-extrabold tabular-nums text-[var(--wp-heading)] outline-none placeholder:text-[var(--wp-faint)]"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={busyId === u.id || !Number(amount)}
                        onClick={() => void act(u.id, 'credit', Number(amount))}
                        className="h-10 rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] px-4 text-[11.5px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(0,208,132,0.65)] transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-50"
                      >
                        + Credit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id || !Number(amount)}
                        onClick={() => void act(u.id, 'debit', Number(amount))}
                        className="h-10 rounded-xl border border-red-400/40 bg-red-400/10 px-4 text-[11.5px] font-extrabold text-red-300 transition-all duration-200 hover:bg-red-400/20 active:scale-95 disabled:opacity-50"
                      >
                        − Debit
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {/* ============ 360° DETAIL DRAWER ============ */}
      {detailId ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="User 360 profile"
          onClick={() => setDetailId(null)}
        >
          <div
            className="wp-rise flex h-full w-full max-w-[420px] flex-col border-l border-[var(--wp-border)] bg-[var(--wp-bg)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-[var(--wp-border)] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-[16px] font-black text-[var(--wp-accent-text)]">
                {(detail?.user.username ?? '?').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-black text-[var(--wp-heading)]">
                    {detail?.user.username ?? 'Loading…'}
                  </p>
                  {detail ? <StatusChip status={detail.user.status} /> : null}
                </div>
                <p className="text-[10px] tabular-nums text-[var(--wp-muted-2)]">
                  {detail ? `${detail.user.mobile} · joined ${timeAgo(detail.user.createdAt)}` : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                aria-label="Close profile"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--wp-border)] text-[var(--wp-muted)] transition-colors hover:bg-[var(--wp-hover)] hover:text-[var(--wp-text)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!detail ? (
              <div className="flex flex-1 flex-col gap-2 p-4" aria-busy="true">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="wp-shimmer h-16 rounded-2xl border border-white/[0.05]" />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {/* stat grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Balance', value: inr(detail.user.balance), cls: 'text-[var(--wp-accent-text)]' },
                    { label: 'Orders', value: String(detail.orders.length ? detail.orders.reduce((s) => s + 1, 0) : 0), cls: 'text-[var(--wp-heading)]' },
                    { label: 'Last login', value: detail.user.lastLoginAt ? timeAgo(detail.user.lastLoginAt) : 'never', cls: 'text-sky-300' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-2.5">
                      <p className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--wp-muted-2)]">{s.label}</p>
                      <p className={`mt-0.5 truncate text-[13px] font-black tabular-nums ${s.cls}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* orders */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">Recent orders</h3>
                  {detail.orders.length === 0 ? (
                    <p className="mt-1.5 text-[11px] text-[var(--wp-muted)]">No payment orders yet.</p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {detail.orders.map((o, i) => (
                        <li key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] px-3 py-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--wp-border)] bg-[var(--wp-chip)] text-[8px] font-black uppercase text-[var(--wp-muted)]">
                            {o.platform.slice(0, 3)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-extrabold tabular-nums text-[var(--wp-text)]">{inr(o.amount)} <span className="font-semibold text-emerald-400/80">+{inr(o.bonus)} bonus</span></p>
                            <p className="text-[9px] text-[var(--wp-muted-2)]">{o.platform} · {timeAgo(o.createdAt)}</p>
                          </div>
                          <StatusChip status={o.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* withdrawals */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">Payout history</h3>
                  {detail.withdrawals.length === 0 ? (
                    <p className="mt-1.5 text-[11px] text-[var(--wp-muted)]">No withdrawal requests yet.</p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {detail.withdrawals.map((w, i) => (
                        <li key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-extrabold tabular-nums text-[var(--wp-text)]">{inr(w.amount)}</p>
                            <p className="text-[9px] uppercase text-[var(--wp-muted-2)]">{w.method} · {timeAgo(w.createdAt)}</p>
                          </div>
                          <StatusChip status={w.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* ledger */}
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">Money ledger</h3>
                  {detail.transactions.length === 0 ? (
                    <p className="mt-1.5 text-[11px] text-[var(--wp-muted)]">No movements recorded yet.</p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {detail.transactions.map((t, i) => {
                        const plus = txSign(t.type) === '+'
                        return (
                          <li key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] px-3 py-2">
                            <TxChip type={t.type} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10.5px] text-[var(--wp-muted)]">{t.note || '—'}</p>
                              <p className="text-[9px] tabular-nums text-[var(--wp-faint)]">bal {inr(t.balanceAfter)} · {timeAgo(t.createdAt)}</p>
                            </div>
                            <p className={`shrink-0 text-[12.5px] font-black tabular-nums ${plus ? 'text-[var(--wp-accent-text)]' : 'text-amber-300'}`}>
                              {plus ? '+' : '−'}{inr(t.amount)}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
