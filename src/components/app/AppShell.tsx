'use client'

import { useEffect, useState } from 'react'
import { LiveOrdersHome } from '@/components/home/LiveOrdersHome'
import { HomeHeader } from '@/components/home/HomeHeader'
import { BottomNav, type BottomNavTab } from '@/components/home/BottomNav'
import { OrdersPage } from './OrdersPage'
import { ProfilePage } from './ProfilePage'
import { TaskPage } from './TaskPage'
import { TeamPage } from './TeamPage'
import { WithdrawPage } from './WithdrawPage'

export type AppView = BottomNavTab | 'task' | 'withdraw'

/**
 * Authenticated app shell — owns the shared wallet polling (one 5s poll for
 * every screen), the logged-in profile details and the page switch.
 * Home keeps its full live-orders engine; all other pages are lightweight.
 */
export function AppShell({
  view,
  onNavigate,
  username,
  light,
  onToggleLight,
  onLogout,
}: {
  view: AppView
  onNavigate: (view: AppView) => void
  username: string
  light: boolean
  onToggleLight: () => void
  onLogout: () => void
}) {
  const [balance, setBalance] = useState(0)
  const [mobile, setMobile] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string | null>(null)

  /* wallet every ~5s — shared by Home header, Profile and Withdraw */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/wallet', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && typeof data?.balance === 'number') setBalance(data.balance)
      } catch {
        // keep the last known balance
      }
    }
    void load()
    const t = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  /* profile details (mobile + member since) — fetched once */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await res.json()
        if (cancelled || !res.ok || !data?.authenticated) return
        if (typeof data.mobile === 'string') setMobile(data.mobile)
        if (typeof data.createdAt === 'string') {
          setMemberSince(new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
        }
      } catch {
        // profile extras are optional
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const goHome = () => onNavigate('home')
  const goProfile = () => onNavigate('profile')

  return (
    <>
      {view === 'home' && (
        <LiveOrdersHome
          username={username}
          balance={balance}
          light={light}
          onToggleLight={onToggleLight}
          onLogout={onLogout}
        />
      )}

      {/* Non-home screens share the exact same compact top bar as Home
          (hamburger • WATCHPAY • wallet chip • theme toggle) so the whole
          app reads as one product. Pages keep their own PageHeader row for
          back + title, and pb-28 clears the fixed BottomNav. */}
      {view !== 'home' && (
        <div className="flex flex-col gap-3 pb-28">
          <HomeHeader
            balance={balance}
            light={light}
            username={username}
            onToggleLight={onToggleLight}
            onLogout={onLogout}
          />

          {view === 'team' && <TeamPage username={username} onBack={goHome} />}

          {view === 'orders' && <OrdersPage username={username} onBack={goHome} />}

          {view === 'profile' && (
            <ProfilePage
              username={username}
              mobile={mobile}
              memberSince={memberSince}
              balance={balance}
              light={light}
              onToggleLight={onToggleLight}
              onBack={goHome}
              onNavigate={(v) => onNavigate(v)}
              onLogout={onLogout}
            />
          )}

          {view === 'task' && <TaskPage onBack={goProfile} onGoHome={goHome} />}

          {view === 'withdraw' && <WithdrawPage username={username} balance={balance} onBack={goProfile} />}
        </div>
      )}

      <BottomNav
        active={view === 'task' || view === 'withdraw' ? 'profile' : view}
        onNavigate={onNavigate}
      />
    </>
  )
}
