'use client'

/**
 * Animated SVG progress ring — emerald sweep driven by CSS (--ring-c trick).
 * Used on Profile (account strength) and Tasks (daily progress).
 *
 * Draw technique: dasharray = C C (one full dash, one full gap) and
 * dashoffset = C − arc. Visible arc length = C − offset, so the CSS keyframe
 * (dashoffset: var(--ring-c) → computed value) sweeps from EMPTY to the
 * exact percentage and RESTS at the right arc length. (The old version set
 * dasharray to the arc itself and animated offset by a full period C —
 * the rendered arc never changed, so the ring looked stuck/full.)
 */
export function ProgressRing({
  percent,
  size = 92,
  stroke = 8,
  label,
  sub,
}: {
  percent: number
  size?: number
  stroke?: number
  label?: string
  sub?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const arc = (clamped / 100) * c

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="wp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2BF5A6" />
            <stop offset="100%" stopColor="#00B978" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#wp-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - arc}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="wp-ring-anim"
          style={{ ['--ring-c' as string]: `${c}`, filter: 'drop-shadow(0 0 6px rgba(0,208,132,0.55))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-black leading-none tabular-nums text-[var(--wp-heading)]">
          {label ?? `${clamped}%`}
        </span>
        {sub ? <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">{sub}</span> : null}
      </div>
    </div>
  )
}
