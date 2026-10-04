'use client'

import { IconClipboardList, IconHome, IconUser, IconUsers } from './icons'

export type BottomNavTab = 'home' | 'team' | 'orders' | 'profile'

const TABS: Array<{
  key: BottomNavTab
  label: string
  icon: (cls: string) => React.ReactNode
}> = [
  { key: 'home', label: 'Home', icon: (c) => <IconHome className={c} /> },
  { key: 'team', label: 'Team', icon: (c) => <IconUsers className={c} /> },
  { key: 'orders', label: 'Orders', icon: (c) => <IconClipboardList className={c} /> },
  { key: 'profile', label: 'Profile', icon: (c) => <IconUser className={c} /> },
]

/**
 * Fixed bottom navigation — Home • Team • Orders • Profile.
 * The active tab gets a glowing emerald indicator bar + soft pill glow.
 * Fully themed via var(--wp-*) tokens (dark + sage light).
 */
export function BottomNav({
  active,
  onNavigate,
}: {
  active: BottomNavTab
  onNavigate: (tab: BottomNavTab) => void
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-[var(--wp-border)] bg-[var(--wp-nav-bg)] px-2 backdrop-blur-2xl"
      style={{ paddingBottom: 'max(9px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(tab.key)}
              className="relative flex flex-1 flex-col items-center gap-[3px] pb-1 pt-2 transition-colors duration-200"
            >
              {/* top indicator */}
              <span
                aria-hidden="true"
                className={`absolute top-0 h-[2.5px] w-9 rounded-b-full bg-gradient-to-r from-[#2BF5A6] to-[#00B978] transition-all duration-300 ${
                  isActive
                    ? 'opacity-100 shadow-[0_0_12px_rgba(0,208,132,0.9)]'
                    : 'opacity-0'
                }`}
              />

              {/* icon pill */}
              <span
                aria-hidden="true"
                className={`grid h-[30px] w-[46px] place-items-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-400/[0.13] shadow-[inset_0_0_0_1px_rgba(0,208,132,0.22),0_0_18px_-4px_rgba(0,208,132,0.55)]'
                    : ''
                }`}
              >
                {tab.icon(
                  `h-[19px] w-[19px] transition-colors duration-200 ${
                    isActive
                      ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(0,208,132,0.55)] dark:text-emerald-300'
                      : 'text-[var(--wp-muted-2)]'
                  }`
                )}
              </span>

              <span
                className={`text-[10px] font-bold tracking-wide transition-colors duration-200 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-[var(--wp-muted-2)]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
