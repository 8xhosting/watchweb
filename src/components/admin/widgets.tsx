'use client'

import type { ReactNode } from 'react'
import { CountUp } from '@/components/ui/count-up'

/* ================================================================== */
/*  Admin Master Control — shared widgets (charts, KPIs, chips)        */
/*  Zero dependencies: all charts are hand-rolled SVG/CSS.             */
/* ================================================================== */

export { CountUp }

/* ------------------------------ KpiCard ----------------------------- */

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = 'emerald',
  prefix,
  suffix,
  decimals = 0,
}: {
  label: string
  value: number
  sub?: string
  icon?: ReactNode
  tone?: 'emerald' | 'amber' | 'red' | 'sky'
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const tones: Record<string, string> = {
    emerald: 'text-[var(--wp-accent-text)]',
    amber: 'text-amber-400',
    red: 'text-red-400',
    sky: 'text-sky-400',
  }
  const glow: Record<string, string> = {
    emerald: 'from-emerald-400/12',
    amber: 'from-amber-400/12',
    red: 'from-red-400/12',
    sky: 'from-sky-400/12',
  }
  return (
    <div className="wp-rise relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5">
      <span
        aria-hidden="true"
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-b ${glow[tone]} to-transparent blur-2xl`}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">
          {label}
        </p>
        {icon ? <span className={tones[tone]}>{icon}</span> : null}
      </div>
      <p className={`mt-1.5 text-[24px] font-black leading-none ${tones[tone]}`}>
        <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      {sub ? <p className="mt-1 text-[10.5px] text-[var(--wp-muted)]">{sub}</p> : null}
    </div>
  )
}

/* ------------------------------ Bars -------------------------------- */

export function BarChart({
  data,
  height = 120,
  prefix = '',
}: {
  data: Array<{ label: string; value: number }>
  height?: number
  prefix?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="group flex h-full flex-1 flex-col justify-end">
          <span className="mb-1 text-center text-[9px] font-bold tabular-nums text-[var(--wp-muted-2)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {prefix}
            {Math.round(d.value).toLocaleString('en-IN')}
          </span>
          <div
            className="wp-bar-grow w-full rounded-t-md bg-gradient-to-t from-[#00B978]/70 via-[#00D084]/85 to-[#2BF5A6] shadow-[0_0_14px_-4px_rgba(0,208,132,0.6)] transition-all duration-500"
            style={{ height: `${Math.max(4, (d.value / max) * 82)}%`, animationDelay: `${i * 60}ms` }}
            title={`${d.label}: ${prefix}${Math.round(d.value).toLocaleString('en-IN')}`}
          />
          <span className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-[var(--wp-muted-2)]">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ---------------------------- Sparkline ----------------------------- */

export function Sparkline({
  values,
  className = 'h-12 w-full',
  stroke = '#00D084',
}: {
  values: number[]
  className?: string
  stroke?: string
}) {
  if (values.length < 2) values = [0, ...values, 0]
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const W = 100
  const H = 32
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - 3 - ((v - min) / range) * (H - 8)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const id = `spark-${Math.round(values[0] * 1000)}-${values.length}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill={`url(#${id})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* ------------------------------ Donut ------------------------------- */

const DONUT_COLORS = ['#00D084', '#2BF5A6', '#00B978', '#FACC15', '#38BDF8', '#F87171']

export function Donut({
  data,
  size = 132,
}: {
  data: Array<{ name: string; count: number }>
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1
  const R = 52
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 132 132" aria-hidden="true">
        <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        {data.map((d, i) => {
          const frac = d.count / total
          const dash = frac * C
          const el = (
            <circle
              key={d.name}
              cx="66"
              cy="66"
              r={R}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="14"
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 66 66)"
              style={{ transition: 'stroke-dasharray 600ms ease, stroke-dashoffset 600ms ease' }}
            />
          )
          offset += dash
          return el
        })}
        <text
          x="66"
          y="63"
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: 20, fontWeight: 900 }}
        >
          {total.toLocaleString('en-IN')}
        </text>
        <text
          x="66"
          y="80"
          textAnchor="middle"
          className="fill-[#8A94A6]"
          style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          ORDERS
        </text>
      </svg>
      <ul className="flex min-w-0 flex-col gap-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate font-bold text-[var(--wp-text)]">{d.name}</span>
            <span className="tabular-nums font-bold text-[var(--wp-muted)]">{d.count}</span>
            <span className="w-9 text-right tabular-nums text-[var(--wp-muted-2)]">
              {Math.round((d.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------------------- StatusChip ---------------------------- */

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    // orders
    processing: 'border-amber-400/45 bg-amber-400/10 text-amber-300',
    completed: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    expired: 'border-white/10 bg-white/[0.04] text-[var(--wp-muted)]',
    // withdrawals
    pending: 'border-amber-400/45 bg-amber-400/10 text-amber-300',
    paid: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    rejected: 'border-red-400/40 bg-red-400/10 text-red-300',
    // users
    active: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    banned: 'border-red-400/45 bg-red-400/10 text-red-300',
  }
  const label =
    status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-lg border px-2 text-[9.5px] font-black uppercase tracking-wide ${
        map[status] ?? 'border-white/10 bg-white/[0.04] text-[var(--wp-muted)]'
      }`}
    >
      {status === 'processing' || status === 'pending' ? (
        <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {label}
    </span>
  )
}

/* ---------------------------- AreaChart ----------------------------- */

/** Smooth gradient area chart for 30-day growth series (hand-rolled SVG). */
export function AreaChart({
  values,
  labels,
  height = 130,
  stroke = '#00D084',
}: {
  values: number[]
  labels?: string[]
  height?: number
  stroke?: string
}) {
  if (values.length < 2) values = [0, ...values, 0]
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const W = 300
  const H = 90
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - 4 - ((v - min) / range) * (H - 10)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const id = `area-${stroke.replace('#', '')}-${values.length}`
  const last = pts[pts.length - 1]
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last[0]} cy={last[1]} r="3" fill={stroke} className="wp-live-dot" />
      </svg>
      {labels && labels.length ? (
        <div className="mt-1 flex justify-between text-[8.5px] font-bold uppercase tracking-wide text-[var(--wp-faint)]">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------ TxChip ------------------------------ */

const TX_META: Record<string, { label: string; cls: string; sign: '+' | '-' | '' }> = {
  credit: { label: 'CREDIT', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', sign: '+' },
  order_bonus: { label: 'BONUS', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', sign: '+' },
  withdrawal_refund: { label: 'REFUND', cls: 'border-sky-400/40 bg-sky-400/10 text-sky-300', sign: '+' },
  debit: { label: 'DEBIT', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300', sign: '-' },
  withdrawal_hold: { label: 'HOLD', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300', sign: '-' },
  withdrawal_paid: { label: 'PAID', cls: 'border-red-400/40 bg-red-400/10 text-red-300', sign: '-' },
}

export function TxChip({ type }: { type: string }) {
  const meta = TX_META[type] ?? {
    label: type.toUpperCase(),
    cls: 'border-white/10 bg-white/[0.04] text-[var(--wp-muted)]',
    sign: '' as const,
  }
  return (
    <span className={`inline-flex h-6 shrink-0 items-center rounded-md border px-2 text-[8.5px] font-black tracking-wide ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

export function txSign(type: string): '+' | '-' {
  return (TX_META[type]?.sign === '+') ? '+' : '-'
}

/* ------------------------------ Misc -------------------------------- */

export function EmptyState({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--wp-border-strong)] py-12 text-center">
      {icon ? <span className="text-[var(--wp-faint)]">{icon}</span> : null}
      <p className="text-[13px] font-bold text-[var(--wp-muted)]">{title}</p>
      {sub ? <p className="max-w-xs text-[11px] text-[var(--wp-muted-2)]">{sub}</p> : null}
    </div>
  )
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.max(1, Math.floor(diff / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
