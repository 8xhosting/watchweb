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
import { DepositPage } from './DepositPage'
import { MaintenanceScreen } from './MaintenanceScreen'

export type AppView = BottomNavTab | 'task' | 'withdraw' | 'deposit'

interface LiveConfig {
  maintenance: boolean
  announcement: string
}

/**
 * Authenticated app shell — owns the shared wallet polling (one 5s poll for
 * every screen), the logged-in profile details, the page switch and the
 * MASTER CONTROL link (app-config poll → maintenance mode + announcement
 * banner pushed live from the admin panel).
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
  const [config, setConfig] = useState<LiveConfig>({ maintenance: false, announcement: '' })

  /* wallet every ~5s — shared by Home header, Profile and Withdraw.
     Background tabs throttle timers, so on return to the app we poll once
     immediately (the fresh balance lands without waiting 5s). */
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
    const resume = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('pageshow', resume)
    return () => {
      cancelled = true
      clearInterval(t)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pageshow', resume)
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

  /* master control link — poll app config every 15s so the admin panel can
     push maintenance mode + announcements to every device live */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/app-config', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data?.ok) return
        setConfig({
          maintenance: Boolean(data.maintenance),
          announcement: typeof data.announcement === 'string' ? data.announcement : '',
        })
      } catch {
        // keep last known config
      }
    }
    void load()
    const t = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const goHome = () => onNavigate('home')
  const goProfile = () => onNavigate('profile')

  /* MAINTENANCE MODE — block every user screen (admin panel is unaffected:
     it renders outside AppShell with its own gate) */
  if (config.maintenance) {
    return (
      <>
        <HomeHeader
          balance={balance}
          light={light}
          username={username}
          onToggleLight={onToggleLight}
          onLogout={onLogout}
        />
        <MaintenanceScreen light={light} />
      </>
    )
  }

  return (
    <>
      {view === 'home' && (
        <LiveOrdersHome
          username={username}
          balance={balance}
          light={light}
          onToggleLight={onToggleLight}
          onLogout={onLogout}
          onNavigate={(v) => onNavigate(v)}
          announcement={config.announcement}
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
            onNavigate={(v) => onNavigate(v)}
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

          {view === 'deposit' && <DepositPage username={username} balance={balance} onBack={goProfile} />}
        </div>
      )}

      <BottomNav
        active={view === 'task' || view === 'withdraw' || view === 'deposit' ? 'profile' : view}
        onNavigate={onNavigate}
      />
    </>
  )
}
