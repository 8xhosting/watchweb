'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { KpiCard, EmptyState } from './widgets'

/**
 * ADMIN → GATEWAYS — QwackPay payment-gateway master control.
 *
 *  • MULTI-KEY / MULTI-MERCHANT: the same merchant can be registered many
 *    times with different docking keys (rotation, load split, amount ranges)
 *  • weighted routing: higher weight = more deposit traffic
 *  • live deposit feed (30 latest) with signed settlement status
 *  • keys are always masked; a blank key field on edit = keep existing key
 */

interface Gateway {
  id: string
  label: string
  provider: string
  merchantId: string
  apiUrl: string
  keyMasked: string
  payinRate: number
  payoutRate: number
  payoutFlat: number
  minAmount: number
  maxAmount: number
  weight: number
  active: boolean
  createdAt: string
}

interface DepositRow {
  id: string
  orderId: string
  username: string
  amount: number
  status: string
  utr: string
  gateway: string
  createdAt: string
}

interface Kpis {
  totalGateways: number
  activeGateways: number
  depositsToday: number
  amountToday: number
  successRate: number
}

interface GatewayForm {
  label: string
  merchantId: string
  apiKey: string
  apiUrl: string
  payinRate: string
  payoutRate: string
  payoutFlat: string
  minAmount: string
  maxAmount: string
  weight: string
}

const EMPTY_FORM: GatewayForm = {
  label: '',
  merchantId: '',
  apiKey: '',
  apiUrl: 'https://qwackpay.com/api/v1',
  payinRate: '7',
  payoutRate: '3',
  payoutFlat: '6',
  minAmount: '100',
  maxAmount: '100000',
  weight: '1',
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

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    pending: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    failed: 'border-red-400/40 bg-red-400/10 text-red-300',
  }
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-md border px-1.5 text-[9px] font-black uppercase tracking-wide ${
        map[status] ?? 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)]'
      }`}
    >
      {status}
    </span>
  )
}

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`

/* -------------------------------- form ---------------------------------- */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 rounded-lg border border-[var(--wp-border)] bg-[var(--wp-chip)] px-2.5 text-[12px] font-semibold text-[var(--wp-text)] outline-none transition-colors placeholder:text-[var(--wp-faint)] focus:border-emerald-400/50 ${mono ? 'font-mono tracking-tight' : ''}`}
      />
      {hint ? <span className="text-[9px] text-[var(--wp-faint)]">{hint}</span> : null}
    </label>
  )
}

/* ------------------------------- section -------------------------------- */

export function AdminGateways() {
  const { toast } = useToast()
  const [gateways, setGateways] = useState<Gateway[] | null>(null)
  const [deposits, setDeposits] = useState<DepositRow[]>([])
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<GatewayForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GatewayForm>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gateways', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setGateways(data.gateways as Gateway[])
        setDeposits(data.deposits as DepositRow[])
        setKpis(data.kpis as Kpis)
      }
    } catch {
      // keep last data
    }
  }, [])

  useEffect(() => {
    void load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  const setF = (patch: Partial<GatewayForm>) => setForm((f) => ({ ...f, ...patch }))
  const setE = (patch: Partial<GatewayForm>) => setEditForm((f) => ({ ...f, ...patch }))

  async function addGateway() {
    if (busy) return
    if (!form.label.trim() || !form.merchantId.trim() || !form.apiKey.trim()) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Label, Merchant ID and API Key are required.' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        toast({ title: 'Gateway added', description: `${form.label} is live for deposits.` })
        setForm(EMPTY_FORM)
        setShowAdd(false)
        void load()
      } else {
        toast({ variant: 'destructive', title: 'Add failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setBusy(false)
    }
  }

  function startEdit(g: Gateway) {
    setEditingId(g.id)
    setEditForm({
      label: g.label,
      merchantId: g.merchantId,
      apiKey: '', // blank = keep existing key
      apiUrl: g.apiUrl,
      payinRate: String(g.payinRate),
      payoutRate: String(g.payoutRate),
      payoutFlat: String(g.payoutFlat),
      minAmount: String(g.minAmount),
      maxAmount: String(g.maxAmount),
      weight: String(g.weight),
    })
  }

  async function saveEdit() {
    if (busy || !editingId) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        toast({ title: 'Gateway updated' })
        setEditingId(null)
        void load()
      } else {
        toast({ variant: 'destructive', title: 'Update failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(g: Gateway) {
    try {
      const res = await fetch('/api/admin/gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: g.id, active: !g.active }),
      })
      if (res.ok) {
        toast({ title: !g.active ? `${g.label} enabled` : `${g.label} disabled` })
        void load()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    }
  }

  async function removeGateway(g: Gateway) {
    if (!window.confirm(`Delete gateway "${g.label}"? (only possible when it has no deposits)`)) return
    try {
      const res = await fetch(`/api/admin/gateways?id=${g.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        toast({ title: 'Gateway deleted' })
        void load()
      } else {
        toast({ variant: 'destructive', title: 'Delete failed', description: data?.error ?? 'Try again.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    }
  }

  if (!gateways || !kpis) {
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
      {/* ============================ KPI ROW ============================ */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Active Gateways"
          value={kpis.activeGateways}
          sub={`${kpis.totalGateways} registered`}
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="7" rx="2" />
              <rect x="2" y="13" width="20" height="7" rx="2" />
              <line x1="6" x2="6.01" y1="7.5" y2="7.5" />
              <line x1="6" x2="6.01" y1="16.5" y2="16.5" />
            </svg>
          }
        />
        <KpiCard
          label="Deposits Today"
          value={kpis.depositsToday}
          sub="settled money-in orders"
          tone="sky"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5 m-7 7 7-7 7 7" />
            </svg>
          }
        />
        <KpiCard
          label="Amount Today"
          value={kpis.amountToday}
          prefix="₹"
          sub="credited to wallets"
          tone="amber"
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <KpiCard
          label="Success Rate"
          value={kpis.successRate}
          suffix="%"
          sub="settled vs attempted"
          tone={kpis.successRate >= 80 ? 'emerald' : 'red'}
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </section>

      {/* ====================== GATEWAY REGISTRY ====================== */}
      <section className="wp-rise overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] backdrop-blur-xl">
        <header className="flex items-center gap-2.5 border-b border-[var(--wp-border)] px-4 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-[var(--wp-accent-text)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="16" r="1.5" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-black tracking-tight text-[var(--wp-heading)]">
              Gateway Registry
            </h2>
            <p className="text-[10px] text-[var(--wp-muted-2)]">
              Same merchant · multiple keys allowed — traffic is weight-routed
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-extrabold transition-colors duration-200 ${
              showAdd
                ? 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)]'
                : 'border-emerald-400/40 bg-emerald-400/15 text-[var(--wp-accent-text)]'
            }`}
          >
            {showAdd ? 'Close' : '+ Add Gateway'}
          </button>
        </header>

        {/* -------- add form -------- */}
        {showAdd ? (
          <div className="border-b border-[var(--wp-border)] bg-[var(--wp-chip)]/40 px-4 py-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <FormField label="Label *" value={form.label} onChange={(v) => setF({ label: v })} placeholder="QwackPay #1" />
              <FormField label="Merchant ID *" value={form.merchantId} onChange={(v) => setF({ merchantId: v })} placeholder="681551699" mono />
              <FormField label="API / Docking Key *" value={form.apiKey} onChange={(v) => setF({ apiKey: v })} placeholder="from merchant backend" mono />
              <FormField label="API URL" value={form.apiUrl} onChange={(v) => setF({ apiUrl: v })} placeholder="https://qwackpay.com/api/v1" mono />
              <FormField label="Payin Rate %" value={form.payinRate} onChange={(v) => setF({ payinRate: v })} type="number" />
              <FormField label="Payout Rate %" value={form.payoutRate} onChange={(v) => setF({ payoutRate: v })} type="number" />
              <FormField label="Payout Flat ₹" value={form.payoutFlat} onChange={(v) => setF({ payoutFlat: v })} type="number" />
              <FormField label="Routing Weight 1-10" value={form.weight} onChange={(v) => setF({ weight: v })} type="number" hint="higher = more traffic" />
              <FormField label="Min Amount ₹" value={form.minAmount} onChange={(v) => setF({ minAmount: v })} type="number" />
              <FormField label="Max Amount ₹" value={form.maxAmount} onChange={(v) => setF({ maxAmount: v })} type="number" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void addGateway()}
                className="flex h-9 items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] px-5 text-[12px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(0,208,132,0.7)] transition-all duration-200 hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50"
              >
                Save Gateway
              </button>
              <span className="text-[10px] text-[var(--wp-muted-2)]">
                Docking key = merchant backend → Google verification. Never shared with users.
              </span>
            </div>
          </div>
        ) : null}

        {/* -------- gateway cards -------- */}
        {gateways.length === 0 ? (
          <EmptyState
            title="No gateways yet"
            sub="Add your first QwackPay merchant to accept deposits."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
            {gateways.map((g) => {
              const editing = editingId === g.id
              return (
                <article
                  key={g.id}
                  className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-200 ${
                    g.active
                      ? 'border-emerald-400/25 bg-emerald-400/[0.04]'
                      : 'border-[var(--wp-border)] bg-[var(--wp-chip)]/40 opacity-75'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${g.active ? 'bg-emerald-400/15' : 'bg-white/[0.03]'}`}
                  />
                  <div className="flex items-start gap-2.5">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${g.active ? 'border-emerald-400/30 bg-emerald-400/10 text-[var(--wp-accent-text)]' : 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)]'}`}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13px] font-extrabold text-[var(--wp-heading)]">{g.label}</p>
                        <span className={`inline-flex h-4 shrink-0 items-center rounded border px-1 text-[8px] font-black uppercase ${g.active ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-red-400/40 bg-red-400/10 text-red-300'}`}>
                          {g.active ? 'live' : 'off'}
                        </span>
                        <span className="inline-flex h-4 shrink-0 items-center rounded border border-[var(--wp-border)] bg-[var(--wp-chip)] px-1 text-[8px] font-black uppercase text-[var(--wp-muted)]">
                          w{g.weight}
                        </span>
                      </div>
                      <p className="truncate font-mono text-[10px] text-[var(--wp-muted)]">
                        MID {g.merchantId} · {g.keyMasked}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--wp-muted-2)]">
                        Payin {g.payinRate}% · Payout {g.payoutRate}%+₹{g.payoutFlat} · {inr(g.minAmount)}–{inr(g.maxAmount)}
                      </p>
                    </div>
                    {/* active toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={g.active}
                      aria-label={`Toggle ${g.label}`}
                      onClick={() => void toggleActive(g)}
                      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 ${g.active ? 'border-emerald-400/50 bg-emerald-400/25' : 'border-[var(--wp-border)] bg-[var(--wp-chip)]'}`}
                    >
                      <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300 ${g.active ? 'left-[24px] bg-gradient-to-b from-[#2BF5A6] to-[#00B978]' : 'left-[3px] bg-[var(--wp-faint)]'}`} />
                    </button>
                  </div>

                  {/* actions */}
                  {editing ? (
                    <div className="mt-3 border-t border-[var(--wp-border)] pt-3">
                      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                        <FormField label="Label" value={editForm.label} onChange={(v) => setE({ label: v })} />
                        <FormField label="Merchant ID" value={editForm.merchantId} onChange={(v) => setE({ merchantId: v })} mono />
                        <FormField label="New API Key" value={editForm.apiKey} onChange={(v) => setE({ apiKey: v })} placeholder="blank = keep" mono />
                        <FormField label="API URL" value={editForm.apiUrl} onChange={(v) => setE({ apiUrl: v })} mono />
                        <FormField label="Payin %" value={editForm.payinRate} onChange={(v) => setE({ payinRate: v })} type="number" />
                        <FormField label="Payout %" value={editForm.payoutRate} onChange={(v) => setE({ payoutRate: v })} type="number" />
                        <FormField label="Flat ₹" value={editForm.payoutFlat} onChange={(v) => setE({ payoutFlat: v })} type="number" />
                        <FormField label="Weight" value={editForm.weight} onChange={(v) => setE({ weight: v })} type="number" />
                        <FormField label="Min ₹" value={editForm.minAmount} onChange={(v) => setE({ minAmount: v })} type="number" />
                        <FormField label="Max ₹" value={editForm.maxAmount} onChange={(v) => setE({ maxAmount: v })} type="number" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button type="button" disabled={busy} onClick={() => void saveEdit()} className="h-8 rounded-lg bg-gradient-to-b from-[#2BF5A6] to-[#00B978] px-4 text-[11px] font-extrabold text-white disabled:opacity-50">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="h-8 rounded-lg border border-[var(--wp-border)] px-4 text-[11px] font-bold text-[var(--wp-muted)]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--wp-border)] pt-2.5">
                      <button type="button" onClick={() => startEdit(g)} className="h-7 rounded-lg border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 text-[10.5px] font-bold text-[var(--wp-muted)] transition-colors hover:text-[var(--wp-text)]">
                        Edit
                      </button>
                      <button type="button" onClick={() => void removeGateway(g)} className="h-7 rounded-lg border border-red-400/25 px-3 text-[10.5px] font-bold text-red-300 transition-colors hover:bg-red-400/10">
                        Delete
                      </button>
                      <span className="ml-auto truncate font-mono text-[9px] text-[var(--wp-faint)]">{g.apiUrl}</span>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ====================== LIVE DEPOSIT FEED ====================== */}
      <section className="wp-rise overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] backdrop-blur-xl">
        <header className="flex items-center gap-2.5 border-b border-[var(--wp-border)] px-4 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M7 14l4-4 4 3 5-6" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-black tracking-tight text-[var(--wp-heading)]">Deposit Feed</h2>
            <p className="text-[10px] text-[var(--wp-muted-2)]">Latest 30 money-in orders · auto-refresh 20s</p>
          </div>
        </header>
        {deposits.length === 0 ? (
          <EmptyState title="No deposits yet" sub="User money-in orders will appear here in real time." />
        ) : (
          <div className="divide-y divide-[var(--wp-border)]">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-black uppercase ${d.status === 'success' ? 'bg-emerald-400/12 text-emerald-300' : d.status === 'pending' ? 'bg-amber-400/12 text-amber-300' : 'bg-red-400/12 text-red-300'}`}>
                  {d.status === 'success' ? '✓' : d.status === 'pending' ? '…' : '✕'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-[var(--wp-text)]">
                    {d.username} · <span className="font-mono text-[10.5px] text-[var(--wp-muted)]">{d.orderId}</span>
                  </p>
                  <p className="truncate text-[9.5px] text-[var(--wp-muted-2)]">
                    {d.gateway} · {timeAgo(d.createdAt)}
                    {d.utr ? ` · UTR ${d.utr}` : ''}
                  </p>
                </div>
                <p className={`shrink-0 text-[13px] font-extrabold tabular-nums ${d.status === 'success' ? 'text-[var(--wp-accent-text)]' : 'text-[var(--wp-muted)]'}`}>
                  +{inr(d.amount)}
                </p>
                <StatusChip status={d.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
