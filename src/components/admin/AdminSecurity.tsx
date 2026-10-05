'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp, EmptyState, timeAgo } from './widgets'

interface Security {
  payout: {
    withdrawMin: number
    withdrawMax: number
    dailyPayoutLimit: number
    paidToday: number
    paidCountToday: number
    usagePct: number
    pendingCount: number
    pendingAmount: number
  }
  adminAuth: {
    failedLogins: Array<{ detail: string; createdAt: string }>
    recentLogins: Array<{ detail: string; createdAt: string }>
    lockouts48h: number
  }
  risks: {
    bannedWithBalance: Array<{ username: string; balance: number }>
    topWallets: Array<{ username: string; balance: number; status: string }>
    neverLogged: number
    stuckOrders: Array<{ id: string; amount: number; platform: string; createdAt: string }>
  }
}

function LimitField({
  label,
  value,
  step,
  suffix,
  onSave,
  disabled,
}: {
  label: string
  value: number
  step: number
  suffix?: string
  onSave: (v: number) => void
  disabled: boolean
}) {
  const [local, setLocal] = useState(String(value))
  useEffect(() => setLocal(String(value)), [value])
  const num = Number(local.replace(/[^\d.]/g, '')) || 0
  return (
    <label className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-2.5">
      <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">{label}</span>
      <span className="mt-1 flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={disabled}
          onClick={() => onSave(Math.max(step, num - step))}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--wp-border)] text-[13px] font-black text-[var(--wp-muted)] transition-colors hover:bg-[var(--wp-hover)] active:scale-90 disabled:opacity-50"
        >
          −
        </button>
        <input
          inputMode="decimal"
          value={local}
          onChange={(e) => setLocal(e.target.value.replace(/[^\d.]/g, '').slice(0, 9))}
          onBlur={() => num !== value && onSave(num)}
          className="w-full min-w-0 bg-transparent text-center text-[15px] font-black tabular-nums text-[var(--wp-accent-text)] outline-none"
        />
        {suffix ? <span className="text-[10px] font-bold text-[var(--wp-muted-2)]">{suffix}</span> : null}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={disabled}
          onClick={() => onSave(num + step)}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--wp-border)] text-[13px] font-black text-[var(--wp-muted)] transition-colors hover:bg-[var(--wp-hover)] active:scale-90 disabled:opacity-50"
        >
          +
        </button>
      </span>
    </label>
  )
}

/**
 * Security Centre — payout guard rails (min/max/daily cap, enforced LIVE on
 * /api/withdrawals), admin auth telemetry (failed logins, lockouts) and
 * platform risk signals (banned wallets, stuck orders, dormant users).
 */
export function AdminSecurity() {
  const { toast } = useToast()
  const [data, setData] = useState<Security | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) setData(json as Security)
    } catch {
      // keep previous
    }
  }, [])

  useEffect(() => {
    void load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  async function saveLimit(patch: Record<string, number>) {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.ok) {
        toast({ title: 'Guard rails updated', description: 'Enforced on every withdrawal request instantly.' })
        void load()
      } else {
        toast({ variant: 'destructive', title: 'Save failed', description: json?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="wp-shimmer h-[130px] rounded-2xl border border-white/[0.05]" />
        ))}
      </div>
    )
  }

  const p = data.payout
  const usageTone =
    p.usagePct >= 90 ? 'from-red-500 to-[#DC2626]' : p.usagePct >= 60 ? 'from-amber-400 to-amber-600' : 'from-[#2BF5A6] to-[#00B978]'
  const risksCount =
    data.risks.bannedWithBalance.length + data.risks.stuckOrders.length + (p.usagePct >= 90 ? 1 : 0)

  return (
    <div className="flex flex-col gap-4">
      {/* ============ PAYOUT GUARD RAILS ============ */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Payout Guard Rails</h2>
            <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">
              Enforced live on every withdrawal request (min, max per request, daily platform cap).
            </p>
          </div>
          <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wide text-[var(--wp-accent-text)]">
            Live enforcement
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <LimitField label="Min ₹" value={p.withdrawMin} step={50} onSave={(v) => void saveLimit({ withdrawMin: v })} disabled={saving} />
          <LimitField label="Max ₹" value={p.withdrawMax} step={500} onSave={(v) => void saveLimit({ withdrawMax: v })} disabled={saving} />
          <LimitField label="Daily cap ₹" value={p.dailyPayoutLimit} step={5000} onSave={(v) => void saveLimit({ dailyPayoutLimit: v })} disabled={saving} />
        </div>

        {/* daily usage meter */}
        <div className="mt-3 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[var(--wp-text)]">Today&apos;s payout usage</span>
            <span className="font-extrabold tabular-nums text-[var(--wp-accent-text)]">
              <CountUp value={p.paidToday} prefix="₹" /> / <CountUp value={p.dailyPayoutLimit} prefix="₹" />
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${usageTone} transition-all duration-700`}
              style={{ width: `${Math.max(3, p.usagePct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[9.5px] text-[var(--wp-muted-2)]">
            {p.paidCountToday} payout(s) finalised today · {p.pendingCount} pending ({`₹${Math.round(p.pendingAmount).toLocaleString('en-IN')}`}) · {p.usagePct}% of cap used
          </p>
        </div>
      </section>

      {/* ============ ADMIN AUTH ============ */}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Admin Auth Telemetry</h2>
            <span
              className={`rounded-lg border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wide ${
                data.adminAuth.lockouts48h > 0
                  ? 'border-red-400/40 bg-red-400/10 text-red-300'
                  : 'border-emerald-400/30 bg-emerald-400/10 text-[var(--wp-accent-text)]'
              }`}
            >
              {data.adminAuth.lockouts48h > 0 ? `${data.adminAuth.lockouts48h} lockout(s) 48h` : 'No lockouts'}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">
            Brute-force shield: 5 wrong passwords → 90s IP lockout.
          </p>
          <div className="mt-3 max-h-[190px] overflow-y-auto pr-1">
            {data.adminAuth.failedLogins.length === 0 && data.adminAuth.recentLogins.length === 0 ? (
              <p className="py-6 text-center text-[11.5px] text-[var(--wp-muted)]">No admin auth events in 48h.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {data.adminAuth.failedLogins.map((l, i) => (
                  <li key={`f-${i}`} className="flex items-center gap-2.5 rounded-xl border border-red-400/25 bg-red-400/[0.06] px-3 py-2">
                    <span className="h-6 w-[58px] shrink-0 rounded-md border border-red-400/40 bg-red-400/10 text-center text-[8.5px] font-black leading-6 text-red-300">
                      FAILED
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10.5px] text-[var(--wp-muted)]">{l.detail}</span>
                    <span className="shrink-0 text-[9px] font-bold tabular-nums text-[var(--wp-faint)]">{timeAgo(l.createdAt)}</span>
                  </li>
                ))}
                {data.adminAuth.recentLogins.map((l, i) => (
                  <li key={`s-${i}`} className="flex items-center gap-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2">
                    <span className="h-6 w-[58px] shrink-0 rounded-md border border-emerald-400/40 bg-emerald-400/10 text-center text-[8.5px] font-black leading-6 text-[var(--wp-accent-text)]">
                      LOGIN
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10.5px] text-[var(--wp-muted)]">{l.detail}</span>
                    <span className="shrink-0 text-[9px] font-bold tabular-nums text-[var(--wp-faint)]">{timeAgo(l.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ============ RISK SIGNALS ============ */}
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '90ms' }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Risk Signals</h2>
            <span
              className={`rounded-lg border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wide ${
                risksCount > 0
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                  : 'border-emerald-400/30 bg-emerald-400/10 text-[var(--wp-accent-text)]'
              }`}
            >
              {risksCount > 0 ? `${risksCount} attention` : 'All clear'}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {/* banned users holding balance */}
            <div className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-3">
              <p className="text-[11px] font-extrabold text-[var(--wp-text)]">
                Banned users holding balance
                <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[9px] font-black ${data.risks.bannedWithBalance.length ? 'bg-red-400/15 text-red-300' : 'bg-emerald-400/10 text-[var(--wp-accent-text)]'}`}>
                  {data.risks.bannedWithBalance.length}
                </span>
              </p>
              {data.risks.bannedWithBalance.length ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {data.risks.bannedWithBalance.map((u) => (
                    <li key={u.username} className="rounded-md border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[10px] font-bold text-red-200">
                      {u.username} · ₹{Math.round(u.balance).toLocaleString('en-IN')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[10px] text-[var(--wp-muted-2)]">Every banned account has a zero balance.</p>
              )}
            </div>

            {/* stuck processing orders */}
            <div className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-3">
              <p className="text-[11px] font-extrabold text-[var(--wp-text)]">
                Stuck processing orders (1h+)
                <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[9px] font-black ${data.risks.stuckOrders.length ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/10 text-[var(--wp-accent-text)]'}`}>
                  {data.risks.stuckOrders.length}
                </span>
              </p>
              {data.risks.stuckOrders.length ? (
                <ul className="mt-1.5 flex flex-col gap-1">
                  {data.risks.stuckOrders.slice(0, 4).map((o) => (
                    <li key={o.id} className="flex items-center justify-between text-[10px] text-[var(--wp-muted)]">
                      <span className="font-bold text-[var(--wp-text)]">{o.platform}</span>
                      <span className="tabular-nums">₹{Math.round(o.amount).toLocaleString('en-IN')} · {timeAgo(o.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[10px] text-[var(--wp-muted-2)]">Order pipeline is flowing normally.</p>
              )}
            </div>

            {/* dormant + top wallets */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">Never logged in</p>
                <p className="mt-1 text-[17px] font-black tabular-nums text-amber-300">
                  <CountUp value={data.risks.neverLogged} />
                </p>
                <p className="text-[9px] text-[var(--wp-muted-2)]">users with no login yet</p>
              </div>
              <div className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">Top wallet</p>
                <p className="mt-1 truncate text-[13px] font-black text-[var(--wp-text)]">
                  {data.risks.topWallets[0]?.username ?? '—'}
                </p>
                <p className="text-[10px] font-bold tabular-nums text-[var(--wp-accent-text)]">
                  {data.risks.topWallets[0] ? `₹${Math.round(data.risks.topWallets[0].balance).toLocaleString('en-IN')}` : ''}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
