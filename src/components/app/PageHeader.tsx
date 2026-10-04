'use client'

import { IconChevronLeft } from '@/components/home/icons'

/**
 * Shared sub-header for all non-home app pages — back button, title,
 * optional subtitle and an optional right-side slot. Themed entirely via
 * var(--wp-*) tokens so it follows dark/light automatically.
 */
export function PageHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string
  subtitle?: string
  onBack: () => void
  right?: React.ReactNode
}) {
  return (
    <header className="flex items-center gap-3 pt-3">
      <button
        type="button"
        aria-label="Go back"
        onClick={onBack}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-[var(--wp-border)] bg-[var(--wp-hover)] text-[var(--wp-text)] transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-600 dark:hover:text-emerald-300 active:scale-95"
      >
        <IconChevronLeft className="h-[18px] w-[18px]" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[19px] font-extrabold leading-tight tracking-tight text-[var(--wp-heading)]">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[11.5px] leading-tight text-[var(--wp-muted)]">{subtitle}</p>
        )}
      </div>

      {right}
    </header>
  )
}
