'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp, EmptyState, StatusChip, timeAgo } from './widgets'

interface AdminUser {
  id: string
  username: string
  mobile: string
  balance: number
  status: string
  createdAt: string
}

/**
 * Users — search every account, flip banned state, credit/debit wallet
 * balance. Every action hits the real database and lands in the audit log.
 */
export function AdminUsers() {
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  /** id of the user whose wallet panel is open + the pending amount */
  const [walletFor, setWalletFor] = useState<string | null>(null)
  const [amount, setAmount] = useState('')

  const load = useCallback(async (search: string) => {
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setUsers(data.users as AdminUser[])
      else setUsers([])
    } catch {
      setUsers([])
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void load(q), 250) // debounce search
    return () => clearTimeout(t)
  }, [q, load])

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
            if (action === 'credit') return { ...u, balance: data.balance ?? u.balance }
            if (action === 'debit') return { ...u, balance: data.balance ?? u.balance }
            return u
          })
        )
        const labels: Record<string, string> = {
          ban: 'Account banned',
          unban: 'Account restored',
          credit: `₹${amt} credited`,
          debit: `₹${amt} debited`,
        }
        toast({ title: labels[action], description: 'Change is live in the database.' })
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

  return (
    <div className="flex flex-col gap-4">
      {/* search + totals */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          {[
            { label: 'Shown', value: totals.count },
            { label: 'Banned', value: totals.banned },
          ].map((s) => (
            <div key={s.label} className="flex h-11 min-w-[86px] flex-col justify-center rounded-xl border border-[var(--wp-border)] bg-[var(--wp-card)] px-3">
              <span className="text-[14px] font-black leading-none tabular-nums text-[var(--wp-heading)]">
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
        </div>
      </div>

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
            return (
              <li
                key={u.id}
                className="wp-rise overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] backdrop-blur-xl"
                style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
              >
                <div className="flex flex-wrap items-center gap-3 p-3.5">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[14px] font-black ${
                      u.status === 'banned'
                        ? 'border-red-400/30 bg-red-400/10 text-red-300'
                        : 'border-emerald-400/25 bg-emerald-400/10 text-[var(--wp-accent-text)]'
                    }`}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13.5px] font-extrabold text-[var(--wp-heading)]">{u.username}</p>
                      <StatusChip status={u.status} />
                    </div>
                    <p className="text-[10px] tabular-nums text-[var(--wp-muted-2)]">
                      {u.mobile} · joined {timeAgo(u.createdAt)}
                    </p>
                  </div>
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
    </div>
  )
}
