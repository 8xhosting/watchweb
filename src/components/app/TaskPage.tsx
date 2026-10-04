'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  IconBolt,
  IconCheckCircle,
  IconCheckSquare,
  IconPlayCircle,
  IconUsers,
  IconWatch,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'
import { DAILY_TASKS, STREAK_DAYS } from './data'

const inr = (v: number) => v.toLocaleString('en-IN')

const TASK_ICON = {
  order: <IconCheckCircle className="h-[18px] w-[18px]" />,
  streak: <IconBolt className="h-[18px] w-[18px]" />,
  invite: <IconUsers className="h-[18px] w-[18px]" />,
  watch: <IconWatch className="h-[18px] w-[18px]" />,
}

/**
 * Tasks — daily task list with progress, check-in streak and rewards.
 * Interactive states are local UI only (real task completion will be
 * validated server-side once the tasks API is connected).
 */
export function TaskPage({ onBack, onGoHome }: { onBack: () => void; onGoHome: () => void }) {
  const { toast } = useToast()
  const [claimed, setClaimed] = useState<Record<string, boolean>>({})

  const totalDone = DAILY_TASKS.filter((t) => t.done >= t.target || claimed[t.id]).length
  const rewardEarned =
    DAILY_TASKS.filter((t) => t.done >= t.target || claimed[t.id]).reduce((s, t) => s + t.reward, 0)
  const totalReward = DAILY_TASKS.reduce((s, t) => s + t.reward, 0)
  const progress = Math.round((totalDone / DAILY_TASKS.length) * 100)

  function claim(id: string, reward: number, title: string) {
    if (claimed[id]) return
    setClaimed((prev) => ({ ...prev, [id]: true }))
    toast({
      title: `+₹${reward} reward queued`,
      description: `“${title}” complete — credited to your wallet.`,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Tasks"
        subtitle="Complete tasks & earn daily rewards"
        onBack={onBack}
        right={
          <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
            <IconCheckSquare className="h-[18px] w-[18px]" />
          </span>
        }
      />

      {/* daily progress */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl"
        />
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--wp-muted-2)]">
              Today&apos;s progress
            </p>
            <p className="mt-1 text-[22px] font-extrabold leading-none text-[var(--wp-heading)]">
              {totalDone}/{DAILY_TASKS.length}{' '}
              <span className="text-[13px] font-bold text-[var(--wp-muted)]">tasks done</span>
            </p>
          </div>
          <p className="text-right">
            <span className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
              Earned
            </span>
            <span className="text-[19px] font-extrabold tabular-nums text-[var(--wp-accent-text)]">
              ₹{inr(rewardEarned)}
              <span className="text-[11.5px] font-bold text-[var(--wp-muted)]"> / ₹{inr(totalReward)}</span>
            </span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--wp-chip)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978] shadow-[0_0_10px_rgba(0,208,132,0.6)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {/* check-in streak */}
      <section className="rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Weekly Streak</h2>
          <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-300">
            🔥 4-day streak
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-7 gap-1.5">
          {STREAK_DAYS.map((d) => (
            <div
              key={d.day}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2 ${
                d.claimed
                  ? 'border-emerald-400/40 bg-emerald-400/10'
                  : 'border-[var(--wp-border)] bg-[var(--wp-chip)]'
              }`}
            >
              <span
                className={`text-[9px] font-extrabold uppercase ${
                  d.claimed ? 'text-emerald-600 dark:text-emerald-300' : 'text-[var(--wp-muted-2)]'
                }`}
              >
                {d.day}
              </span>
              {d.claimed ? (
                <IconCheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <span className="text-[9.5px] font-bold tabular-nums text-[var(--wp-muted)]">
                  ₹{d.reward}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* task list */}
      <section className="flex flex-col gap-2">
        {DAILY_TASKS.map((t) => {
          const isClaimed = t.done >= t.target || claimed[t.id]
          const pct = Math.min(100, Math.round((t.done / t.target) * 100))
          return (
            <article
              key={t.id}
              className="relative overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 pl-4 shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                style={{
                  background: isClaimed ? '#00D084' : '#FACC15',
                  boxShadow: isClaimed ? '0 0 12px rgba(0,208,132,0.6)' : '0 0 12px rgba(250,204,21,0.5)',
                }}
              />
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                    isClaimed
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300'
                      : 'border-amber-400/35 bg-amber-400/10 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {TASK_ICON[t.icon]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-extrabold leading-tight text-[var(--wp-heading)]">
                      {t.title}
                    </p>
                    <span className="shrink-0 rounded-md border border-emerald-400/35 bg-emerald-400/10 px-1.5 py-0.5 text-[11px] font-extrabold text-[var(--wp-accent-text)]">
                      +₹{t.reward}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-[var(--wp-muted)]">{t.detail}</p>

                  {t.target > 1 ? (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[9.5px] font-bold text-[var(--wp-muted-2)]">
                        <span>
                          {t.done}/{t.target} completed
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--wp-chip)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-end gap-2">
                {isClaimed ? (
                  <span className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 text-[11.5px] font-extrabold text-emerald-600 dark:text-emerald-300">
                    <IconCheckCircle className="h-3.5 w-3.5" />
                    CLAIMED
                  </span>
                ) : t.id === 'order-3' ? (
                  <button
                    type="button"
                    onClick={onGoHome}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] px-4 text-[11.5px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(0,208,132,0.65)] transition-all duration-200 hover:brightness-[1.06] active:scale-[0.97]"
                  >
                    GO TO ORDERS
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => claim(t.id, t.reward, t.title)}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-400/12 px-4 text-[11.5px] font-extrabold text-emerald-600 transition-all duration-200 hover:bg-emerald-400/20 active:scale-[0.97] dark:text-emerald-300"
                  >
                    <IconPlayCircle className="h-3.5 w-3.5" />
                    START
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </section>

      <p className="pb-1 text-center text-[10.5px] leading-relaxed text-[var(--wp-muted-2)]">
        Rewards are credited after verification. Task list refreshes every day at midnight.
      </p>
    </div>
  )
}
