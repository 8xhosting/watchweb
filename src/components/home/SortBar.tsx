'use client'

import { IconArrowUpDown, IconSliders } from './icons'

/**
 * Sort toggle — "Low to High" sorts the existing order cards by amount
 * ascending. Pure re-ordering: countdowns, timers and card identity are
 * untouched (React keys keep every card mounted).
 */
export function SortBar({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
          <IconSliders className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[14.5px] font-bold leading-tight text-[var(--wp-heading)]">Sort by Price</p>
          <p className="text-[11px] text-[var(--wp-muted)]">Arrange orders by amount</p>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-bold transition-all duration-200 active:scale-[0.97] ${
          active
            ? 'border-emerald-400/60 bg-emerald-400/[0.12] text-emerald-700 dark:text-emerald-300 shadow-[0_0_18px_-4px_rgba(0,208,132,0.55)]'
            : 'border-[var(--wp-border-strong)] bg-[var(--wp-hover)] text-[var(--wp-muted)] hover:border-emerald-400/40 hover:text-[var(--wp-text)]'
        }`}
      >
        <IconArrowUpDown className="h-3.5 w-3.5" />
        Low to High
      </button>
    </section>
  )
}
