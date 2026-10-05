'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  IconArrowDownToLine,
  IconCheckCircle,
  IconClock,
  IconShieldCheck,
  IconWallet,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'

const inrWhole = (v: number) => v.toLocaleString('en-IN')

const QUICK = [500, 1000, 2000, 5000]

interface DepRecord {
  orderId: string
  amount: number
  status: string
  utr: string
  createdAt: string
}

function whenLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`
}

/**
 * Add Money — REAL gateway deposit flow:
 *   amount → /api/deposit (picks an active gateway by weight) →
 *   redirect to the gateway's hosted payment page → the signed callback
 *   (or a status reconciliation poll) credits the wallet automatically.
 *
 * Balance updates live through AppShell's shared 5s wallet poll.
 */
export function DepositPage({
  username,
  balance,
  onBack,
}: {
  username: string
  balance: number
  onBack: () => void
}) {
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<DepRecord[] | null>(null)
  const watchedRef = useRef<Set<string>>(new Set())
  /** only toast deposits created after this screen opened (no stale alerts) */
  const mountCutoffRef = useRef<number>(Date.now())

  const numAmount = Number(amount)
  const valid = Number.isFinite(numAmount) && numAmount >= 100 && numAmount <= 100000

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/deposit?history=1', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setHistory(data.deposits as DepRecord[])
      else setHistory((h) => h ?? [])
    } catch {
      setHistory((h) => h ?? [])
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  /* pending watch — poll latest deposit; settle notifications land here too */
  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch('/api/deposit?latest=1', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        const dep = data?.deposit
        if (!res.ok || !data?.ok || !dep) return
        if (dep.status === 'pending') return
        if (watchedRef.current.has(dep.orderId)) return
        watchedRef.current.add(dep.orderId)
        if (new Date(dep.createdAt).getTime() < mountCutoffRef.current - 30000) return
        if (dep.status === 'success') {
          toast({
            title: 'Money added 🎉',
            description: `₹${inrWhole(dep.amount)} credited to your wallet.`,
          })
        } else if (dep.status === 'failed') {
          toast({
            variant: 'destructive',
            title: 'Payment failed',
            description: 'The gateway could not process the payment. Try again.',
          })
        }
        void loadHistory()
      } catch {
        // offline — next tick retries
      }
    }
    void tick()
    const t = setInterval(tick, 5000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [toast, loadHistory])

  async function pay() {
    if (submitting) return
    if (!Number.isFinite(numAmount) || numAmount < 100) {
      toast({
        variant: 'destructive',
        title: 'Minimum ₹100',
        description: 'Gateway deposits start from ₹100.',
      })
      return
    }
    if (numAmount > 100000) {
      toast({
        variant: 'destructive',
        title: 'Maximum ₹1,00,000',
        description: 'For larger amounts, split into multiple deposits.',
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok && data.paymentUrl) {
        watchedRef.current.add(data.orderId)
        toast({
          title: 'Redirecting to secure payment',
          description: `Routed via ${data.gateway ?? 'payment gateway'}.`,
        })
        window.location.href = data.paymentUrl as string
        return
      }
      toast({
        variant: 'destructive',
        title: 'Payment could not start',
        description: data?.error ?? 'Please try again in a moment.',
      })
    } catch {
      toast({ variant: 'destructive', title: 'Network error', description: 'Check your connection.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Add Money" subtitle="Instant UPI · Card · NetBanking" onBack={onBack} />

      {/* amount card */}
      <section className="wp-rise relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-[var(--wp-card)] p-4 shadow-[0_0_24px_-10px_rgba(0,208,132,0.55),var(--wp-shadow-card)] backdrop-blur-xl">
        <span aria-hidden="true" className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_6px_16px_-4px_rgba(0,208,132,0.6)]">
            <IconWallet className="h-[17px] w-[17px]" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
              Current balance
            </p>
            <p className="text-[15px] font-extrabold leading-tight text-[var(--wp-heading)]">
              ₹ {inrWhole(balance)}
            </p>
          </div>
        </div>

        <label className="mt-3.5 block">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
            Enter amount (₹100 – ₹1,00,000)
          </span>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3.5 py-2.5 transition-colors focus-within:border-emerald-400/50">
            <span className="text-[19px] font-black text-[var(--wp-accent-text)]">₹</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
              aria-label="Deposit amount in rupees"
              className="w-full bg-transparent text-[22px] font-black tabular-nums tracking-tight text-[var(--wp-heading)] outline-none placeholder:text-[var(--wp-faint)]"
            />
          </div>
        </label>

        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {QUICK.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className={`h-9 rounded-xl border text-[12px] font-extrabold transition-all duration-200 active:scale-[0.95] ${
                numAmount === v
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-[var(--wp-accent-text)]'
                  : 'border-[var(--wp-border)] bg-[var(--wp-chip)] text-[var(--wp-muted)]'
              }`}
            >
              ₹{inrWhole(v)}
            </button>
          ))}
        </div>
      </section>

      {/* gateway trust card */}
      <section className="wp-rise flex items-center gap-3 rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
          <IconShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-extrabold text-[var(--wp-text)]">Secure gateway payment</p>
          <p className="text-[10.5px] leading-relaxed text-[var(--wp-muted-2)]">
            Routed automatically through our PCI-DSS partner (UPI · Cards · NetBanking). Money lands in your wallet the moment the bank confirms.
          </p>
        </div>
      </section>

      {/* pay button */}
      <button
        type="button"
        disabled={!valid || submitting}
        onClick={() => void pay()}
        className="wp-rise flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[15px] font-black text-white shadow-[0_14px_30px_-10px_rgba(0,208,132,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-200 hover:-translate-y-px hover:brightness-[1.06] active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100"
        style={{ animationDelay: '90ms' }}
      >
        {submitting ? (
          <>
            <span className="wp-live-dot h-2 w-2 rounded-full bg-white" />
            Starting payment…
          </>
        ) : (
          <>
            <IconArrowDownToLine className="h-[18px] w-[18px]" />
            Pay Now · ₹{numAmount > 0 ? inrWhole(numAmount) : 0}
          </>
        )}
      </button>

      {/* history */}
      <section className="wp-rise overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center gap-2 border-b border-[var(--wp-border)] px-3.5 py-2.5">
          <IconClock className="h-4 w-4 text-[var(--wp-muted-2)]" />
          <h2 className="text-[12.5px] font-extrabold text-[var(--wp-heading)]">Recent Add-Money</h2>
        </div>
        {history === null ? (
          <div className="flex flex-col gap-2 p-3.5" aria-busy="true">
            <div className="wp-shimmer h-10 rounded-xl border border-white/[0.05]" />
            <div className="wp-shimmer h-10 rounded-xl border border-white/[0.05]" />
          </div>
        ) : history.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-[11px] text-[var(--wp-muted-2)]">
            No deposits yet — your first add-money will appear here.
          </p>
        ) : (
          <div className="divide-y divide-[var(--wp-border)]">
            {history.map((d) => (
              <div key={d.orderId} className="flex items-center gap-3 px-3.5 py-2.5">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    d.status === 'success'
                      ? 'bg-emerald-400/12 text-emerald-500 dark:text-emerald-300'
                      : d.status === 'pending'
                        ? 'bg-amber-400/12 text-amber-500 dark:text-amber-300'
                        : 'bg-red-400/12 text-red-400'
                  }`}
                >
                  {d.status === 'success' ? (
                    <IconCheckCircle className="h-4 w-4" />
                  ) : (
                    <IconClock className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[10.5px] text-[var(--wp-muted)]">{d.orderId}</p>
                  <p className="text-[9.5px] text-[var(--wp-muted-2)]">
                    {whenLabel(d.createdAt)}
                    {d.status === 'pending' ? ' · waiting for confirmation' : d.status === 'failed' ? ' · failed' : ''}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-[13px] font-extrabold tabular-nums ${
                    d.status === 'success' ? 'text-[var(--wp-accent-text)]' : 'text-[var(--wp-muted)]'
                  }`}
                >
                  + ₹{inrWhole(d.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="pb-1 text-center text-[9.5px] text-[var(--wp-faint)]">
        Payments are processed by a licensed partner gateway. WatchPay never stores your bank details.
      </p>
    </div>
  )
}
