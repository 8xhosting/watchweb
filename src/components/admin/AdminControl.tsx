'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Config {
  bonusPercent: number
  orderMin: number
  orderMax: number
  maintenance: boolean
  announcement: string
}

interface LogRow {
  id: string
  action: string
  detail: string
  createdAt: string
}

const ACTION_STYLE: Record<string, { label: string; cls: string }> = {
  'admin.login': { label: 'LOGIN', cls: 'border-sky-400/40 bg-sky-400/10 text-sky-300' },
  'user.ban': { label: 'BAN', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  'user.unban': { label: 'UNBAN', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  'user.credit': { label: 'CREDIT', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  'user.debit': { label: 'DEBIT', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  'order.create': { label: 'ORDER+', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  'order.complete': { label: 'ORDER✓', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  'order.expire': { label: 'EXPIRE', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  'order.delete': { label: 'DELETE', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  'withdrawal.paid': { label: 'PAID', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  'withdrawal.reject': { label: 'REJECT', cls: 'border-red-400/40 bg-red-400/10 text-red-300' },
  'settings.update': { label: 'CONFIG', cls: 'border-violet-400/40 bg-violet-400/10 text-violet-300' },
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/**
 * Master Control — the switches that run the whole platform:
 *   • MAINTENANCE MODE  → every user device blocks instantly (15s poll)
 *   • bonus % + order limits → drives the live-order engine
 *   • announcement      → broadcast banner on every user's Home
 *   • audit trail       → every admin action, straight from the DB
 */
export function AdminControl({ onMaintenanceChange }: { onMaintenanceChange: (v: boolean) => void }) {
  const { toast } = useToast()
  const [config, setConfig] = useState<Config | null>(null)
  const [saving, setSaving] = useState(false)
  const [logs, setLogs] = useState<LogRow[] | null>(null)
  const [maintenanceBusy, setMaintenanceBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        fetch('/api/admin/settings', { cache: 'no-store' }),
        fetch('/api/admin/logs', { cache: 'no-store' }),
      ])
      const s = await sRes.json().catch(() => null)
      if (sRes.ok && s?.ok) setConfig(s.config as Config)
      const l = await lRes.json().catch(() => null)
      if (lRes.ok && l?.ok) setLogs(l.logs as LogRow[])
    } catch {
      // keep whatever we have
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function patchSettings(patch: Partial<Config>, okTitle: string) {
    if (saving) return
    setSaving(true)
    // optimistic
    const prev = config
    setConfig((c) => (c ? { ...c, ...patch } : c))
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setConfig(data.config as Config)
        onMaintenanceChange(Boolean(data.config.maintenance))
        toast({ title: okTitle, description: 'Live for every user within 15 seconds.' })
        void load() // refresh the log trail
      } else {
        setConfig(prev)
        toast({ variant: 'destructive', title: 'Save failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      setConfig(prev)
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleMaintenance() {
    if (!config || maintenanceBusy) return
    const next = !config.maintenance
    setMaintenanceBusy(true)
    await patchSettings({ maintenance: next }, next ? 'MAINTENANCE MODE ON' : 'Maintenance cleared')
    setMaintenanceBusy(false)
  }

  if (!config) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="wp-shimmer h-[120px] rounded-2xl border border-white/[0.05]" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ============ MAINTENANCE — the big red switch ============ */}
      <section
        className={`wp-rise relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all duration-300 ${
          config.maintenance
            ? 'border-red-400/40 bg-red-400/[0.07] shadow-[0_0_36px_-12px_rgba(248,113,113,0.55)]'
            : 'border-[var(--wp-border)] bg-[var(--wp-card)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${
            config.maintenance ? 'bg-red-400/20' : 'bg-emerald-400/12'
          }`}
        />
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${
              config.maintenance
                ? 'border-red-400/40 bg-red-400/15 text-red-300'
                : 'border-emerald-400/30 bg-emerald-400/10 text-[var(--wp-accent-text)]'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-black tracking-tight text-[var(--wp-heading)]">
              Maintenance Mode
            </h2>
            <p className="text-[11px] leading-relaxed text-[var(--wp-muted)]">
              {config.maintenance
                ? 'Every user device is blocked with a maintenance screen right now.'
                : 'Flip to instantly lock every user device (app views) for upgrades or incident response.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.maintenance}
            aria-label="Toggle maintenance mode"
            disabled={maintenanceBusy || saving}
            onClick={() => void toggleMaintenance()}
            className={`relative h-9 w-[68px] shrink-0 rounded-full border transition-colors duration-300 ${
              config.maintenance
                ? 'border-red-400/60 bg-red-400/25'
                : 'border-[var(--wp-border-strong)] bg-[var(--wp-chip)]'
            } disabled:opacity-60`}
          >
            <span
              className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full shadow transition-all duration-300 ${
                config.maintenance
                  ? 'left-[34px] bg-gradient-to-b from-[#F87171] to-[#DC2626] shadow-[0_0_14px_rgba(248,113,113,0.8)]'
                  : 'left-[4px] bg-gradient-to-b from-[#2BF5A6] to-[#00B978] shadow-[0_0_14px_rgba(0,208,132,0.7)]'
              }`}
            />
          </button>
        </div>
        {config.maintenance ? (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] font-bold text-red-200">
            <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-current" />
            LIVE — users see “Under maintenance” on every app screen.
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* ============ ECONOMY ============ */}
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Order Economy</h2>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">
            Drives the live-order engine, PAY validation and manual orders.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { key: 'bonusPercent' as const, label: 'Bonus %', step: 0.5, suffix: '%' },
              { key: 'orderMin' as const, label: 'Min ₹', step: 50, suffix: '' },
              { key: 'orderMax' as const, label: 'Max ₹', step: 100, suffix: '' },
            ].map((f) => (
              <label key={f.key} className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] p-2.5">
                <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">
                  {f.label}
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Decrease ${f.label}`}
                    onClick={() =>
                      void patchSettings({ [f.key]: Math.max(0, Number(config[f.key]) - f.step) } as Partial<Config>, 'Economy updated')
                    }
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--wp-border)] text-[13px] font-black text-[var(--wp-muted)] transition-colors hover:bg-[var(--wp-hover)] active:scale-90"
                  >
                    −
                  </button>
                  <input
                    inputMode="decimal"
                    value={config[f.key]}
                    onChange={(e) =>
                      setConfig((c) => (c ? { ...c, [f.key]: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 } : c))
                    }
                    onBlur={() => void patchSettings({ [f.key]: Number(config[f.key]) } as Partial<Config>, 'Economy updated')}
                    className={`w-full min-w-0 bg-transparent text-center text-[15px] font-black tabular-nums text-[var(--wp-accent-text)] outline-none`}
                  />
                  <button
                    type="button"
                    aria-label={`Increase ${f.label}`}
                    onClick={() =>
                      void patchSettings({ [f.key]: Number(config[f.key]) + f.step } as Partial<Config>, 'Economy updated')
                    }
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--wp-border)] text-[13px] font-black text-[var(--wp-muted)] transition-colors hover:bg-[var(--wp-hover)] active:scale-90"
                  >
                    +
                  </button>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2 text-[10px] leading-relaxed text-[var(--wp-muted)]">
            Example: a ₹1,000 order pays <span className="font-bold text-[var(--wp-accent-text)]">+₹{Math.round((1000 * config.bonusPercent) / 100)}</span> bonus.
            Amounts outside {`₹${Math.round(config.orderMin)}–₹${Math.round(config.orderMax)}`} are rejected by PAY.
          </p>
        </section>

        {/* ============ BROADCAST ============ */}
        <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '90ms' }}>
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Broadcast Announcement</h2>
          <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">
            Shows as a glowing banner on every user&apos;s Home screen.
          </p>
          <textarea
            value={config.announcement}
            onChange={(e) => setConfig((c) => (c ? { ...c, announcement: e.target.value.slice(0, 200) } : c))}
            rows={3}
            placeholder="e.g. Diwali special — bonus boosted to 15% for the next 24 hours!"
            aria-label="Announcement text"
            className="mt-2.5 w-full resize-none rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] p-3 text-[12px] font-semibold leading-relaxed text-[var(--wp-text)] outline-none transition-colors duration-200 placeholder:font-normal placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60 focus:bg-[var(--wp-input-focus)]"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[9.5px] font-bold tabular-nums text-[var(--wp-muted-2)]">
              {config.announcement.length}/200
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => void patchSettings({ announcement: '' }, 'Announcement cleared')}
                className="h-9 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-hover)] px-3 text-[10.5px] font-extrabold text-[var(--wp-muted)] transition-colors hover:text-[var(--wp-text)] active:scale-95 disabled:opacity-60"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void patchSettings({ announcement: config.announcement }, 'Announcement broadcast')}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] px-4 text-[10.5px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(0,208,132,0.65)] transition-all duration-200 hover:brightness-105 active:scale-95 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m3 11 18-5v12L3 14v-3z" />
                  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                </svg>
                Broadcast
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ============ AUDIT TRAIL ============ */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Audit Trail</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-[10.5px] font-extrabold text-[var(--wp-accent-text)] hover:underline"
          >
            Refresh
          </button>
        </div>
        {logs === null ? (
          <div className="mt-2 flex flex-col gap-2" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="wp-shimmer h-10 rounded-xl border border-white/[0.05]" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="mt-3 py-5 text-center text-[11.5px] text-[var(--wp-muted)]">
            No admin actions recorded yet — everything you do lands here.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-[var(--wp-border)]">
            {logs.map((l) => {
              const st = ACTION_STYLE[l.action] ?? { label: l.action.toUpperCase(), cls: 'border-white/10 bg-white/[0.04] text-[var(--wp-muted)]' }
              return (
                <li key={l.id} className="flex items-center gap-3 py-2">
                  <span className={`h-6 w-[62px] shrink-0 rounded-md border text-center text-[8.5px] font-black leading-6 tracking-wide ${st.cls}`}>
                    {st.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--wp-muted)]">{l.detail || l.action}</span>
                  <span className="shrink-0 text-[9.5px] font-bold tabular-nums text-[var(--wp-faint)]">
                    {timeAgo(l.createdAt)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
