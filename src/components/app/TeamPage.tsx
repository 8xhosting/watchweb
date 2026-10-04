'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  IconCopy,
  IconCrown,
  IconShare,
  IconUsers,
  IconWallet,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'
import { buildTeam, COMMISSION_TIERS, inviteCode } from './data'

const inr = (v: number) => v.toLocaleString('en-IN')

/**
 * My Team — invite code, commission tiers, live team roster.
 * Invite code is derived from the username (stable per user); roster is
 * deterministic sample data (real referrals arrive with the referral API).
 */
export function TeamPage({ username, onBack }: { username: string; onBack: () => void }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const code = inviteCode(username)
  const team = buildTeam(username)
  const active = team.filter((m) => m.status === 'active').length
  const totalEarned = team.reduce((s, m) => s + m.earned, 0)

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
      <section className="relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
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

      {/* stats */}
      <section className="grid grid-cols-3 gap-2">
        {[
          { label: 'Members', value: String(team.length) },
          { label: 'Active', value: String(active) },
          { label: 'Earned', value: `₹${inr(totalEarned)}` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-2.5 text-center shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
          >
            <p className="text-[15px] font-extrabold tabular-nums text-[var(--wp-heading)]">{s.value}</p>
            <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--wp-muted-2)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* commission tiers */}
      <section className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <IconCrown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Commission Levels</h2>
        </div>
        <div className="mt-2.5 flex flex-col gap-2">
          {COMMISSION_TIERS.map((t) => (
            <div
              key={t.level}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-[var(--wp-text)]">{t.label}</p>
                <p className="truncate text-[10.5px] text-[var(--wp-muted)]">{t.note}</p>
              </div>
              <span className="shrink-0 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[12.5px] font-extrabold text-emerald-600 dark:text-emerald-300">
                {t.rate}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* roster */}
      <section className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
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
