'use client'

/**
 * Full-screen maintenance block — shown on EVERY user app screen the moment
 * the admin flips Maintenance Mode in Master Control (15s config poll).
 * Deliberately calm and honest: no fake ETA, no fake progress.
 */
export function MaintenanceScreen({ light }: { light: boolean }) {
  return (
    <div className="flex min-h-[72svh] flex-col items-center justify-center px-8 text-center">
      <div className="wp-pop relative">
        <span
          aria-hidden="true"
          className="absolute -inset-6 rounded-full bg-amber-400/15 blur-2xl"
        />
        <span className="relative grid h-20 w-20 place-items-center rounded-[26px] border border-amber-400/35 bg-amber-400/10 text-amber-500 dark:text-amber-300">
          <svg
            viewBox="0 0 24 24"
            className="wp-bolt h-9 w-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </span>
      </div>

      <h1 className="mt-6 text-[24px] font-black tracking-tight text-[var(--wp-heading)]">
        Under{' '}
        <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
          Maintenance
        </span>
      </h1>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[var(--wp-muted)]">
        WatchPay is being upgraded by our team. Your wallet and data are safe —
        the app will be back shortly.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-full border border-[var(--wp-border)] bg-[var(--wp-card)] px-4 py-2 backdrop-blur-xl">
        <span className="wp-live-dot h-2 w-2 rounded-full bg-amber-400" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--wp-muted)]">
          Servers paused
        </span>
      </div>

      <p className="mt-8 text-[9.5px] font-semibold tracking-[0.2em] text-[var(--wp-faint)]">
        WATCHPAY · {light ? 'SAGE' : 'MIDNIGHT'} · MASTER CONTROL
      </p>
    </div>
  )
}
