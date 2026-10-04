'use client'

import { useEffect, useState } from 'react'
import { buildWithdrawals, type WithdrawalEntry } from '@/lib/withdrawal-names'
import { IconChevronRight, IconMegaphone, IconUserStroke } from './icons'

/** Decorative recent-withdrawals feed — 220+ Indian names, self-changing random amounts, seamless continuous marquee. */
export function WithdrawalTicker() {
  // built once on the client (lazy initializer)
  const [entries] = useState(() => buildWithdrawals(220))
  // every name gets a fresh random amount every 8 seconds
  const [amounts, setAmounts] = useState(() =>
    entries.map(() => 1500 + Math.floor(Math.random() * 43500)),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setAmounts((prev) =>
        prev.map(() => 1500 + Math.floor(Math.random() * 43500)),
      )
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const renderItem = (entry: WithdrawalEntry, amount: number, hidden: boolean) => (
    <span
      key={`${hidden ? 'b' : 'a'}-${entry.id}`}
      className="flex items-center gap-1.5 text-[11.5px]"
      aria-hidden={hidden}
    >
      <IconUserStroke className="h-3 w-3 text-emerald-500 dark:text-emerald-400/80" />
      <span className="font-semibold text-[var(--wp-text)]">{entry.name}</span>
      <span className="text-emerald-400">•</span>
      <span className="font-bold tabular-nums text-[var(--wp-accent-text)]">
        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[var(--wp-muted)]">withdrawn</span>
      <span className="ml-5 h-1 w-1 rounded-full bg-[var(--wp-border-strong)]" aria-hidden="true" />
    </span>
  )

  return (
    <section
      aria-label="Recent withdrawals"
      className="flex items-center gap-2 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-1.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_6px_16px_-4px_rgba(0,208,132,0.6)]">
        <IconMegaphone className="h-4 w-4" />
      </span>

      <div className="wp-ticker-mask relative min-w-0 flex-1 overflow-hidden py-1">
        <div
          className="wp-ticker flex w-max items-center gap-7 whitespace-nowrap"
          style={{ animationDuration: `${Math.round(entries.length * 1.4)}s` }}
        >
          {/* duplicated once so the -50% translate loop is seamless */}
          {entries.map((e, i) => renderItem(e, amounts[i], false))}
          {entries.map((e, i) => renderItem(e, amounts[i], true))}
        </div>
      </div>

      <span className="grid h-9 w-7 shrink-0 place-items-center text-[var(--wp-muted-2)]">
        <IconChevronRight className="h-4 w-4" />
      </span>
    </section>
  )
}
