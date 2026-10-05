'use client'

import { useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp } from '@/components/ui/count-up'
import {
  IconCopy,
  IconCrown,
  IconShare,
  IconTrendUp,
  IconUsers,
  IconWallet,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'
import { buildTeam, hashCode, COMMISSION_TIERS, inviteCode } from './data'

const inr = (v: number) => v.toLocaleString('en-IN')

/**
 * My Team — ADVANCED: invite card, animated KPI stats, a 7-day commission
 * earnings chart, commission tiers with level progress and the live roster.
 * The chart is deterministic per username (same user always sees the same
 * history) until the referral API starts returning real ledger data.
 */
export function TeamPage({ username, onBack }: { username: string; onBack: () => void }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const code = inviteCode(username)
  const team = buildTeam(username)
  const active = team.filter((m) => m.status === 'active').length
  const totalEarned = team.reduce((s, m) => s + m.earned, 0)

  /* deterministic 7-day commission series from the username seed */
  const weekSeries = useMemo(() => {
    const seed = hashCode(username || 'watchpay')
    return Array.from({ length: 7 }, (_, i) => ({
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      value: 40 + ((seed + i * 53) % 22) * 9 + (i >= 5 ? 60 : 0),
    }))
  }, [username])
  const weekTotal = weekSeries.reduce((s, d) => s + d.value, 0)
  const maxDay = Math.max(...weekSeries.map((d) => d.value), 1)

  const link = `https://watchpay.app/r/${code}`

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast({ title: `${what} copied`, description: text })
    } catch {
      toast({ title: 'Copy failed', description: 'Long-press to copy manually.' })
    }
  }

  async function share() {
    const text = `Join me on WatchPay! Use my invite code ${code} and start earning: ${link}`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'WatchPay Invite', text, url: link })
        return
      } catch {
        // user dismissed the share sheet — nothing to do
      }
    }
    void copy(text, 'Invite message')
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="My Team"
        subtitle="Invite friends. Earn commission on every task."
        onBack={onBack}
        right={
          <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
            <IconUsers className="h-[18px] w-[18px]" />
          </span>
        }
      />

      {/* invite code card */}
      <section className="wp-rise relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl"
        />
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">
          Your invite code
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[26px] font-black italic tracking-wide text-[var(--wp-heading)]">
            <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_10px_rgba(0,208,132,0.4))]">
              {code}
            </span>
          </p>
          <button
            type="button"
            onClick={() => void copy(code, 'Invite code')}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 text-[12px] font-bold text-emerald-600 transition-all duration-200 hover:bg-emerald-400/20 active:scale-95 dark:text-emerald-300"
          >
            <IconCopy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 truncate rounded-lg border border-[var(--wp-border)] bg-[var(--wp-chip)] px-2.5 py-1.5 text-[11px] text-[var(--wp-muted)]">
          {link}
        </p>
        <button
          type="button"
          onClick={() => void share()}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[13.5px] font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(0,208,132,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-[1.05] active:translate-y-0 active:scale-[0.98]"
        >
          <IconShare className="h-4 w-4" />
          Share Invite Link
        </button>
      </section>

      {/* animated stats */}
      <section className="wp-rise grid grid-cols-3 gap-2" style={{ animationDelay: '60ms' }}>
        {[
          { label: 'Members', value: team.length, prefix: '', decimals: 0 },
          { label: 'Active', value: active, prefix: '', decimals: 0 },
          { label: 'Earned ₹', value: totalEarned, prefix: '', decimals: 0 },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-2.5 text-center shadow-[var(--wp-shadow-card)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
          >
            <p className="text-[15px] font-extrabold text-[var(--wp-heading)]">
              <CountUp value={s.value} prefix={s.prefix} decimals={s.decimals} />
            </p>
            <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* earnings chart — 7 days */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconTrendUp className="h-4 w-4 text-[var(--wp-accent-text)]" />
            <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Commission — 7 days</h2>
          </div>
          <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10.5px] font-extrabold text-[var(--wp-accent-text)]">
            ₹{inr(weekTotal)}
          </span>
        </div>
        <div className="mt-3 flex h-[92px] items-end gap-1.5">
          {weekSeries.map((d, i) => (
            <div key={d.label} className="group flex h-full flex-1 flex-col justify-end">
              <span className="mb-1 text-center text-[8.5px] font-bold tabular-nums text-[var(--wp-muted-2)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                ₹{d.value}
              </span>
              <div
                className="wp-bar-grow w-full rounded-t-md bg-gradient-to-t from-[#00B978]/70 via-[#00D084]/85 to-[#2BF5A6] shadow-[0_0_12px_-4px_rgba(0,208,132,0.6)]"
                style={{ height: `${Math.max(6, (d.value / maxDay) * 100)}%`, animationDelay: `${i * 55}ms` }}
                title={`${d.label}: ₹${d.value}`}
              />
              <span className="mt-1 text-center text-[8px] font-bold uppercase text-[var(--wp-muted-2)]">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* commission tiers */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '140ms' }}>
        <div className="flex items-center gap-2">
          <IconCrown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Commission Levels</h2>
        </div>
        <div className="mt-2.5 flex flex-col gap-2">
          {COMMISSION_TIERS.map((t) => {
            // level progress — deterministic share of active members per level
            const lvlMembers = team.filter((m) => m.level === t.level).length
            const pct = Math.round((lvlMembers / Math.max(1, team.length)) * 100)
            return (
              <div
                key={t.level}
                className="rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-[var(--wp-text)]">{t.label}</p>
                    <p className="truncate text-[10.5px] text-[var(--wp-muted)]">{t.note}</p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[12.5px] font-extrabold text-emerald-600 dark:text-emerald-300">
                    {t.rate}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978] transition-all duration-700"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold tabular-nums text-[var(--wp-muted-2)]">
                    {lvlMembers} member{lvlMembers === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* roster */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '180ms' }}>
        <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Team Members</h2>
        <ul className="mt-2 flex flex-col divide-y divide-[var(--wp-border)]">
          {team.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-[13px] font-extrabold text-emerald-600 dark:text-emerald-300">
                {m.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-[var(--wp-text)]">{m.name}</p>
                <p className="text-[10.5px] text-[var(--wp-muted-2)]">Joined {m.joined}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide ${
                    m.status === 'active'
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300'
                      : 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted-2)]'
                  }`}
                >
                  {m.status}
                </span>
                <span className="flex items-center gap-1 text-[12px] font-extrabold tabular-nums text-[var(--wp-accent-text)]">
                  <IconWallet className="h-3 w-3" />₹{inr(m.earned)}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2 text-[10.5px] leading-relaxed text-[var(--wp-muted)]">
          Commission is credited to your wallet automatically after every completed task by a
          team member.
        </p>
      </section>
    </div>
  )
}
