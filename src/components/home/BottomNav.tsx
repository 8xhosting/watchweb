'use client'

import { IconClipboardList, IconHome, IconUser } from './icons'

type Tab = 'orders' | 'home' | 'profile'

/**
 * Fixed bottom navigation — Orders • Home (active) • Profile.
 * Orders/Profile are placeholders for upcoming screens.
 */
export function BottomNav({
  onPlaceholder,
}: {
  onPlaceholder: (tab: Exclude<Tab, 'home'>) => void
}) {
  const itemClass =
    'flex flex-1 flex-col items-center gap-1 py-1 text-[10.5px] font-semibold transition-colors duration-200'

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-white/[0.07] bg-[#070C15]/92 px-7 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onPlaceholder('orders')} className={`${itemClass} text-[#5A6478] hover:text-[#8A94A6]`}>
          <IconClipboardList className="h-[19px] w-[19px]" />
          Orders
        </button>

        <button
          type="button"
          aria-current="page"
          className="group relative -mt-6 flex flex-col items-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[#04120C] shadow-[0_12px_30px_-6px_rgba(0,208,132,0.75),0_0_0_5px_rgba(0,208,132,0.10)] transition-transform duration-200 group-active:scale-95">
            <IconHome className="h-[22px] w-[22px]" />
          </span>
          <span className="mt-1 text-[10.5px] font-bold text-emerald-300">Home</span>
        </button>

        <button type="button" onClick={() => onPlaceholder('profile')} className={`${itemClass} text-[#5A6478] hover:text-[#8A94A6]`}>
          <IconUser className="h-[19px] w-[19px]" />
          Profile
        </button>
      </div>
    </nav>
  )
}
