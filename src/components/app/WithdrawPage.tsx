'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CountUp } from '@/components/ui/count-up'
import {
  IconArrowDownToLine,
  IconBank,
  IconCheckCircle,
  IconClock,
  IconSmartphone,
  IconWallet,
} from '@/components/home/icons'
import { PageHeader } from './PageHeader'
import { WITHDRAW_MIN } from './data'
const inrWhole = (v: number) => v.toLocaleString('en-IN')

const QUICK = [500, 1000, 2000, 5000]

type Method = 'upi' | 'bank'

interface WdRecord {
  id: string
  amount: number
  method: string
  status: string
  when: string
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
 * Withdraw — ADVANCED + REAL: the submit button creates a genuine payout
 * request (balance held immediately, refunded if the admin rejects it) and
 * the history list reads the user's actual records from MongoDB.
 */
export function WithdrawPage({
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
  const [method, setMethod] = useState<Method>('upi')
  const [upiId, setUpiId] = useState('')
  const [account, setAccount] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<WdRecord[] | null>(null)
  /** live payout guard rails from Admin Security Centre (poll /api/app-config) */
  const [wdMin, setWdMin] = useState<number>(WITHDRAW_MIN)

  useEffect(() => {
    let alive = true
    const pull = async () => {
      try {
        const res = await fetch('/api/app-config', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (alive && res.ok && data?.ok && Number(data.withdrawMin) > 0) {
          setWdMin(Math.round(Number(data.withdrawMin)))
        }
      } catch {
        // keep current value
      }
    }
    void pull()
    const t = setInterval(pull, 15000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/withdrawals', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setHistory(data.withdrawals as WdRecord[])
      else setHistory((h) => h ?? [])
    } catch {
      setHistory((h) => h ?? [])
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const numAmount = Number(amount)
  const valid =
    Number.isFinite(numAmount) &&
    numAmount >= wdMin &&
    numAmount <= balance &&
    (method === 'upi' ? /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim()) : account.trim().length >= 9 && ifsc.trim().length >= 5)

  async function submit() {
    if (submitting) return
    if (!Number.isFinite(numAmount) || numAmount < wdMin) {
      toast({
        variant: 'destructive',
        title: 'Amount too low',
        description: `Minimum withdrawal is ₹${wdMin}.`,
      })
      return
    }
    if (numAmount > balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient balance',
        description: 'You cannot withdraw more than your wallet balance.',
      })
      return
    }
    if (!valid) {
      toast({
        variant: 'destructive',
        title: method === 'upi' ? 'Enter a valid UPI ID' : 'Enter valid bank details',
        description:
          method === 'upi'
            ? 'Format: name@bank (e.g. rahul@ybl).'
            : 'Account number and IFSC code are both required.',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          method,
          ...(method === 'upi' ? { upiId: upiId.trim() } : { account: account.trim(), ifsc: ifsc.trim() }),
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        toast({
          title: `₹${inrWhole(numAmount)} withdrawal requested`,
          description: 'The amount is on hold — the team processes payouts every day.',
        })
        setAmount('')
        void loadHistory()
      } else {
        toast({
          variant: 'destructive',
          title: 'Request failed',
          description: data?.error ?? 'Please try again in a moment.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Network error',
        description: 'Could not reach the payout service. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Withdraw"
        subtitle="Instant payouts to UPI & bank"
        onBack={onBack}
        right={
          <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300">
            <IconArrowDownToLine className="h-[18px] w-[18px]" />
          </span>
        }
      />

      {/* balance hero — animated */}
      <section className="wp-rise relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-[var(--wp-card)] p-4 text-center shadow-[0_0_30px_-10px_rgba(0,208,132,0.6),var(--wp-shadow-card)] backdrop-blur-xl">
        <span
          aria-hidden="true"
          className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl"
        />
        <span
          aria-hidden="true"
          className="absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl"
        />
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--wp-muted-2)]">
          Available balance
        </p>
        <p aria-live="polite" className="mt-1.5 flex items-center justify-center gap-2 text-[34px] font-black leading-none tracking-tight text-[var(--wp-heading)]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_6px_16px_-4px_rgba(0,208,132,0.7)]">
            <IconWallet className="h-4 w-4" />
          </span>
          <CountUp value={balance} prefix="₹ " decimals={2} />
        </p>
        <p className="mt-1.5 text-[10.5px] text-[var(--wp-muted)]">
          Minimum withdrawal ₹{wdMin} · No processing fee
        </p>
      </section>

      {/* amount + method */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '60ms' }}>
        <label
          htmlFor="wp-withdraw-amount"
          className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]"
        >
          Withdraw amount
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 transition-colors duration-200 focus-within:border-emerald-400/60 focus-within:bg-[var(--wp-input-focus)]">
          <span className="text-[17px] font-extrabold text-[var(--wp-accent-text)]">₹</span>
          <input
            id="wp-withdraw-amount"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            className="h-12 w-full bg-transparent text-[17px] font-extrabold tabular-nums text-[var(--wp-heading)] outline-none placeholder:text-[var(--wp-faint)]"
          />
          {amount !== '' && (
            <button
              type="button"
              onClick={() => setAmount(String(Math.floor(balance)))}
              className="shrink-0 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-300"
            >
              MAX
            </button>
          )}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className={`h-9 rounded-xl text-[12px] font-extrabold tabular-nums transition-all duration-200 ${
                amount === String(q)
                  ? 'bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-white shadow-[0_6px_16px_-6px_rgba(0,208,132,0.7)]'
                  : 'border border-[var(--wp-border-strong)] bg-[var(--wp-hover)] text-[var(--wp-muted)] hover:text-[var(--wp-text)]'
              }`}
            >
              ₹{inrWhole(q)}
            </button>
          ))}
        </div>

        {/* method */}
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]">
          Payout method
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              { key: 'upi', label: 'UPI', sub: 'Instant · recommended', icon: <IconSmartphone className="h-[18px] w-[18px]" /> },
              { key: 'bank', label: 'Bank', sub: 'IMPS · 10min–24h', icon: <IconBank className="h-[18px] w-[18px]" /> },
            ] as const
          ).map((m) => {
            const active = method === m.key
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={active}
                onClick={() => setMethod(m.key)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200 ${
                  active
                    ? 'border-emerald-400/55 bg-emerald-400/10 shadow-[inset_0_0_0_1px_rgba(0,208,132,0.25),0_0_18px_-6px_rgba(0,208,132,0.5)]'
                    : 'border-[var(--wp-border)] bg-[var(--wp-chip)] hover:border-[var(--wp-border-strong)]'
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    active
                      ? 'bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C]'
                      : 'border border-[var(--wp-border)] bg-[var(--wp-hover)] text-[var(--wp-muted)]'
                  }`}
                >
                  {m.icon}
                </span>
                <span className="text-[12.5px] font-extrabold text-[var(--wp-text)]">{m.label}</span>
                <span className="text-[9.5px] text-[var(--wp-muted-2)]">{m.sub}</span>
              </button>
            )
          })}
        </div>

        {/* method fields */}
        {method === 'upi' ? (
          <div className="mt-3">
            <label
              htmlFor="wp-upi"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]"
            >
              UPI ID
            </label>
            <input
              id="wp-upi"
              type="text"
              autoComplete="off"
              placeholder="yourname@ybl"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 text-[13.5px] font-semibold text-[var(--wp-text)] outline-none transition-colors duration-200 placeholder:font-normal placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60 focus:bg-[var(--wp-input-focus)]"
            />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label
                htmlFor="wp-account"
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]"
              >
                Account number
              </label>
              <input
                id="wp-account"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••••••••"
                value={account}
                onChange={(e) => setAccount(e.target.value.replace(/[^\d]/g, '').slice(0, 18))}
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 text-[13.5px] font-semibold tabular-nums text-[var(--wp-text)] outline-none transition-colors duration-200 placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60 focus:bg-[var(--wp-input-focus)]"
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor="wp-ifsc"
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]"
              >
                IFSC code
              </label>
              <input
                id="wp-ifsc"
                type="text"
                autoComplete="off"
                placeholder="SBIN0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))}
                className="mt-1.5 h-11 w-full rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3 text-[13.5px] font-semibold tracking-wide text-[var(--wp-text)] outline-none transition-colors duration-200 placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60 focus:bg-[var(--wp-input-focus)]"
              />
            </div>
          </div>
        )}
      </section>

      {/* CTA */}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={submitting}
        className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[15px] font-extrabold text-white shadow-[0_16px_38px_-8px_rgba(0,208,132,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.05] active:translate-y-0 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-80"
      >
        {submitting ? (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Requesting…
          </>
        ) : (
          <>
            <IconArrowDownToLine className="h-[18px] w-[18px]" />
            Withdraw{numAmount >= wdMin ? ` ₹${inrWhole(numAmount)}` : ''}
          </>
        )}
      </button>

      {/* history — REAL records */}
      <section className="wp-rise rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] p-3.5 shadow-[var(--wp-shadow-card)] backdrop-blur-xl" style={{ animationDelay: '100ms' }}>
        <h2 className="text-[13.5px] font-extrabold text-[var(--wp-heading)]">Recent Withdrawals</h2>
        {history === null ? (
          <div className="mt-2 flex flex-col gap-2" aria-busy="true">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="wp-shimmer h-12 rounded-xl border border-white/[0.05]" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-[var(--wp-border-strong)] py-6 text-center text-[11.5px] text-[var(--wp-muted)]">
            No withdrawals yet — your requests and their status will appear here.
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-col divide-y divide-[var(--wp-border)]">
            {history.map((w) => (
              <li key={w.id} className="wp-rise flex items-center gap-3 py-2.5">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                    w.status === 'paid'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300'
                      : w.status === 'rejected'
                        ? 'border-red-400/30 bg-red-400/10 text-red-400'
                        : 'border-amber-400/35 bg-amber-400/10 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {w.status === 'paid' ? (
                    <IconCheckCircle className="h-4 w-4" />
                  ) : (
                    <IconClock className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold tabular-nums text-[var(--wp-heading)]">
                    ₹ {inrWhole(w.amount)}
                  </p>
                  <p className="text-[10px] text-[var(--wp-muted-2)]">
                    {w.method.toUpperCase()} · {whenLabel(w.when)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide ${
                    w.status === 'paid'
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300'
                      : w.status === 'rejected'
                        ? 'border-red-400/40 bg-red-400/10 text-red-400'
                        : 'border-amber-400/45 bg-amber-400/10 text-amber-600 dark:text-amber-300'
                  }`}
                >
                  {w.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
