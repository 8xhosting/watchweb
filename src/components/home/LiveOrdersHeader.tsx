import { PLATFORMS } from '@/lib/order-rules'
import { IconBolt } from './icons'

/**
 * "Live Orders" section header — pulsing LIVE badge, platform list and the
 * glowing lightning-podium artwork from the visual reference.
 */
export function LiveOrdersHeader({ activeCount }: { activeCount: number }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A101C]/75 px-4 py-4 backdrop-blur-xl">
      {/* left accent bar */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-gradient-to-b from-[#4DF7B8] via-[#00D084] to-[#00B978] shadow-[0_0_14px_rgba(0,208,132,0.7)]"
      />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[22px] font-extrabold leading-none tracking-tight">
              <span className="text-white">Live</span>{' '}
              <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_10px_rgba(0,208,132,0.45))]">
                Orders
              </span>
            </h2>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1 text-[10.5px] font-bold text-emerald-300">
              <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-[#00E091] shadow-[0_0_8px_rgba(0,224,145,0.9)]" />
              Instant Payouts
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-[#8A94A6]">
            Instant Add Amount + Bonus • Payouts from{' '}
            {PLATFORMS.join(', ')}
          </p>

          <p
            aria-live="polite"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10.5px] font-semibold text-[#8A94A6]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E091] shadow-[0_0_8px_rgba(0,224,145,0.9)]" />
            <span className="tabular-nums text-emerald-300">{activeCount}</span> live order
            {activeCount === 1 ? '' : 's'} available
          </p>
        </div>

        {/* lightning podium artwork */}
        <div aria-hidden="true" className="relative mr-1 mt-1 h-[70px] w-[70px] shrink-0">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, rgba(0,224,145,0.28), rgba(0,224,145,0.06) 62%, transparent 78%)',
            }}
          />
          <span className="absolute bottom-[9px] left-1/2 h-[13px] w-[52px] -translate-x-1/2 rounded-[50%] border-b border-[#00E091]/50" />
          <span className="absolute bottom-[15px] left-1/2 h-[10px] w-[38px] -translate-x-1/2 rounded-[50%] border-b border-[#00E091]/35" />
          <IconBolt className="wp-bolt absolute left-1/2 top-1 h-[52px] w-[52px] -translate-x-1/2 text-[#00E091]" />
        </div>
      </div>
    </section>
  )
}
