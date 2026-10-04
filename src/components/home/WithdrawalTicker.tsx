import { IconChevronRight, IconMegaphone, IconUserStroke } from './icons'

/** Decorative recent-withdrawals feed — smooth continuous marquee. */
const WITHDRAWALS = [
  { name: 'Rajesh Kumar', amount: '28,450.00' },
  { name: 'Priya Sharma', amount: '15,630.00' },
  { name: 'Amit Verma', amount: '9,240.00' },
  { name: 'Sneha Patel', amount: '31,780.00' },
  { name: 'Vikram Singh', amount: '12,960.00' },
  { name: 'Anjali Gupta', amount: '7,425.00' },
  { name: 'Rohan Mehta', amount: '19,340.00' },
  { name: 'Kavya Reddy', amount: '22,115.00' },
]

export function WithdrawalTicker() {
  // content duplicated once so the -50% translate loop is seamless
  const loop = [...WITHDRAWALS, ...WITHDRAWALS]
  return (
    <section
      aria-label="Recent withdrawals"
      className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#0A101C]/75 p-1.5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_6px_16px_-4px_rgba(0,208,132,0.6)]">
        <IconMegaphone className="h-4 w-4" />
      </span>

      <div className="wp-ticker-mask relative min-w-0 flex-1 overflow-hidden py-1">
        <div className="wp-ticker flex w-max items-center gap-7 whitespace-nowrap">
          {loop.map((w, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11.5px]" aria-hidden={i >= WITHDRAWALS.length}>
              <IconUserStroke className="h-3 w-3 text-emerald-400/80" />
              <span className="font-semibold text-slate-200">{w.name}</span>
              <span className="text-emerald-400">•</span>
              <span className="font-bold tabular-nums text-emerald-300">₹{w.amount}</span>
              <span className="text-[#8A94A6]">withdrawn</span>
              <span className="ml-5 h-1 w-1 rounded-full bg-white/15" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>

      <span className="grid h-9 w-7 shrink-0 place-items-center text-[#5A6478]">
        <IconChevronRight className="h-4 w-4" />
      </span>
    </section>
  )
}
