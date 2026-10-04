'use client'

import { useState, type ReactNode } from 'react'
import {
  IconBank,
  IconChartBar,
  IconCheckCircle,
  IconChevronRight,
  IconFileText,
  IconShieldCheck,
  IconSmartphone,
  IconTimer,
} from './icons'

/* ---------------- content (functional info from the old page) --------------- */

const PLACE_ORDER_STEPS = [
  'Go to the Home page.',
  'Check the available orders.',
  'Click Claim on your preferred order.',
  'Complete the payout to the customer.',
  'Once successful, the order amount + your commission will be credited.',
]

const EARN_STEPS = [
  { title: 'Guide Your Customers', text: 'Help customers use WatchPay for secure payouts.' },
  { title: 'Complete the Payout', text: "Once the customer's payout is completed." },
  { title: 'Earn Commission', text: 'You earn a commission on every successful transaction.' },
]

const WITHDRAWAL_FEATURES = [
  { icon: IconTimer, label: '24x7 Withdrawal' },
  { icon: IconBank, label: 'Bank Transfer' },
  { icon: IconSmartphone, label: 'Instant UPI' },
  { icon: IconChartBar, label: '2–4 Min Processing' },
  { icon: IconShieldCheck, label: 'Safe & Reliable' },
]

/* ------------------------------- collapsible ------------------------------- */

function InfoCard({
  icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--wp-border)] bg-[var(--wp-card)] backdrop-blur-xl">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3.5 text-left transition-colors duration-200 hover:bg-[var(--wp-hover)]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-emerald-400/25 bg-gradient-to-b from-emerald-400/[0.14] to-emerald-400/[0.04] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-[15.5px] font-bold text-[var(--wp-heading)]">{title}</span>
        <IconChevronRight
          className={`h-4 w-4 shrink-0 text-[var(--wp-muted-2)] transition-transform duration-300 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      {/* smooth grid-rows collapse */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 pl-[68px]">{children}</div>
        </div>
      </div>
    </section>
  )
}

function StepBullet({ n }: { n: number }) {
  return (
    <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[10px] font-black text-[#04120C]">
      {n}
    </span>
  )
}

/* --------------------------------- sections -------------------------------- */

export function InfoSections() {
  return (
    <div className="flex flex-col gap-3">
      <InfoCard icon={<IconFileText className="h-5 w-5" />} title="How to Place an Order">
        <ol className="flex flex-col gap-2">
          {PLACE_ORDER_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--wp-text)]">
              <StepBullet n={i + 1} />
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </InfoCard>

      <InfoCard icon={<IconChartBar className="h-5 w-5" />} title="How to Earn with WatchPay">
        <ol className="flex flex-col gap-2.5">
          {EARN_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--wp-text)]">
              <StepBullet n={i + 1} />
              <span>
                <span className="font-semibold text-[var(--wp-text)]">{step.title}</span> — {step.text}
              </span>
            </li>
          ))}
        </ol>
      </InfoCard>

      <InfoCard
        icon={<IconShieldCheck className="h-5 w-5" />}
        title="Fast & Secure Withdrawals"
      >
        <ul className="grid grid-cols-2 gap-2">
          {WITHDRAWAL_FEATURES.map(({ icon: FeatureIcon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-2.5 py-2 text-[11px] font-semibold text-[var(--wp-text)]"
            >
              <FeatureIcon className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="leading-tight">{label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-2 text-[11px] font-semibold text-emerald-300">
            <IconCheckCircle className="h-4 w-4 shrink-0" />
            <span className="leading-tight">Zero hidden fees</span>
          </li>
        </ul>
      </InfoCard>
    </div>
  )
}
