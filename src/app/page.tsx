'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'
import { AppShell, type AppView } from '@/components/app/AppShell'

/* ------------------------------------------------------------------ */
/*  Inline SVG icon set (Lucide-style strokes, zero dependencies)      */
/* ------------------------------------------------------------------ */

function Icon({
  className,
  children,
  filled = false,
}: {
  className?: string
  children: ReactNode
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

const IconUser = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
)

const IconSmartphone = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </Icon>
)

const IconLock = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
)

const IconEye = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

const IconEyeOff = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </Icon>
)

const IconMail = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Icon>
)

const IconMoon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Icon>
)

const IconSun = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
)

const IconArrowRight = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
)

const IconArrowLeft = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Icon>
)

const IconCheck = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
)

const IconPlayFill = ({ className }: { className?: string }) => (
  <Icon className={className} filled>
    <path d="M7 4.8v14.4a.6.6 0 0 0 .92.5l11.4-7.2a.6.6 0 0 0 0-1L7.92 4.3a.6.6 0 0 0-.92.5Z" />
  </Icon>
)

const IconLoader = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
)

/* ------------------------------------------------------------------ */
/*  Ambient background — aurora glows, light lines, particles          */
/* ------------------------------------------------------------------ */

const PARTICLES = [
  { l: '6%', t: '13%', s: 3, o: 0.38, du: '11s', delay: '0s', c: '#00D084' },
  { l: '14%', t: '64%', s: 2, o: 0.24, du: '13s', delay: '1.2s', c: '#7DF0C8' },
  { l: '9%', t: '85%', s: 2, o: 0.32, du: '10s', delay: '2.1s', c: '#00D084' },
  { l: '21%', t: '34%', s: 2, o: 0.2, du: '14s', delay: '0.6s', c: '#E8FFF5' },
  { l: '88%', t: '17%', s: 3, o: 0.34, du: '12s', delay: '0.9s', c: '#00D084' },
  { l: '93%', t: '48%', s: 2, o: 0.26, du: '9s', delay: '1.8s', c: '#7DF0C8' },
  { l: '82%', t: '77%', s: 2, o: 0.3, du: '12s', delay: '2.6s', c: '#00D084' },
  { l: '70%', t: '7%', s: 2, o: 0.22, du: '15s', delay: '3.1s', c: '#E8FFF5' },
  { l: '33%', t: '5%', s: 2, o: 0.27, du: '11s', delay: '1.5s', c: '#00D084' },
  { l: '56%', t: '91%', s: 2, o: 0.24, du: '13s', delay: '0.4s', c: '#7DF0C8' },
  { l: '44%', t: '15%', s: 2, o: 0.18, du: '16s', delay: '2.9s', c: '#E8FFF5' },
  { l: '63%', t: '58%', s: 2, o: 0.17, du: '14s', delay: '1.1s', c: '#00D084' },
]

function AmbientBackground({ light }: { light: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* deep base wash */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: light
            ? 'radial-gradient(130% 100% at 50% 0%, #EDF3EE 0%, #E3EAE5 52%, #D6E1D9 100%)'
            : 'radial-gradient(130% 100% at 50% 0%, #0B1626 0%, #05080E 52%, #030508 100%)',
        }}
      />
      {/* aurora — emerald top */}
      <div
        className="absolute -top-40 left-1/2 h-[480px] w-[560px] -translate-x-1/2 rounded-full"
        style={{
          background: light
            ? 'radial-gradient(closest-side, rgba(0,208,132,0.14), rgba(0,208,132,0.04) 55%, transparent 75%)'
            : 'radial-gradient(closest-side, rgba(0,224,145,0.20), rgba(0,224,145,0.06) 55%, transparent 75%)',
        }}
      />
      {/* aurora — teal mid-left */}
      <div
        className="absolute left-[-160px] top-[30%] h-[420px] w-[420px] rounded-full"
        style={{
          background: light
            ? 'radial-gradient(closest-side, rgba(13,211,166,0.10), transparent 70%)'
            : 'radial-gradient(closest-side, rgba(13,211,166,0.10), transparent 70%)',
        }}
      />
      {/* aurora — emerald mid-right */}
      <div
        className="absolute right-[-180px] top-[52%] h-[460px] w-[460px] rounded-full"
        style={{
          background: light
            ? 'radial-gradient(closest-side, rgba(0,183,120,0.10), transparent 70%)'
            : 'radial-gradient(closest-side, rgba(0,183,120,0.11), transparent 70%)',
        }}
      />
      {/* halo behind card */}
      <div
        className="absolute left-1/2 top-[44%] h-[600px] w-[560px] -translate-x-1/2 rounded-full"
        style={{
          background: light
            ? 'radial-gradient(circle, rgba(0,208,132,0.10) 0%, transparent 62%)'
            : 'radial-gradient(circle, rgba(0,208,132,0.12) 0%, transparent 62%)',
        }}
      />
      {/* bottom deep glow */}
      <div
        className="absolute -bottom-40 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full"
        style={{
          background: light
            ? 'radial-gradient(closest-side, rgba(0,209,132,0.09), transparent 72%)'
            : 'radial-gradient(closest-side, rgba(0,209,132,0.10), transparent 72%)',
        }}
      />
      {/* minimal geometric light lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M-20 150 C 90 90, 150 210, 300 130 S 420 60, 430 90"
          stroke={light ? 'rgba(0,168,107,0.20)' : 'rgba(0,208,132,0.16)'}
          strokeWidth="1.2"
        />
        <path
          d="M-30 690 C 80 740, 210 640, 320 700 S 420 780, 440 740"
          stroke={light ? 'rgba(0,168,107,0.15)' : 'rgba(0,208,132,0.12)'}
          strokeWidth="1.2"
        />
        <path
          d="M330 -20 C 300 80, 380 140, 350 240"
          stroke={light ? 'rgba(0,150,95,0.12)' : 'rgba(125,240,200,0.08)'}
          strokeWidth="1"
        />
      </svg>
      {/* floating light particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="wp-particle"
          style={{
            left: p.l,
            top: p.t,
            width: p.s,
            height: p.s,
            opacity: light ? p.o * 0.75 : p.o,
            background: light && p.c === '#E8FFF5' ? '#00A86B' : p.c,
            boxShadow: `0 0 ${p.s * 3}px ${light ? 'rgba(0,168,107,0.55)' : p.c}`,
            ['--du' as string]: p.du,
            ['--delay' as string]: p.delay,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared building blocks                                             */
/* ------------------------------------------------------------------ */

function Logo() {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-b from-[#2BF5A6] to-[#00B978] shadow-[0_6px_20px_-4px_rgba(0,208,132,0.65),inset_0_1px_0_rgba(255,255,255,0.4)]">
          <IconPlayFill className="h-4 w-4 translate-x-[1px] text-[#04120C]" />
        </div>
        <h1 className="text-[30px] font-extrabold italic leading-none tracking-tight">
          <span className="text-[var(--wp-text)]">
            WATCH
          </span>
          <span className="bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-600 bg-clip-text text-transparent dark:from-[#4DF7B8] dark:via-[#00D084] dark:to-[#00B978] [filter:drop-shadow(0_0_16px_rgba(0,208,132,0.35))]">
            PAY
          </span>
        </h1>
      </div>
      <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.42em] text-[var(--wp-muted-2)]">
        Watch<span className="mx-1.5 text-emerald-400">•</span>Earn
        <span className="mx-1.5 text-emerald-400">•</span>Grow
      </p>
    </>
  )
}

function StepIndicator({ active }: { active: 1 | 2 }) {
  const circle = (step: 1 | 2) => {
    const isActive = step === active
    const done = active === 2 && step === 1
    if (isActive || done) {
      return (
        <div className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[14px] font-extrabold text-[#03130C] shadow-[0_0_0_4px_rgba(0,208,132,0.15),0_0_22px_rgba(0,208,132,0.6)]">
          {done ? <IconCheck className="h-4 w-4" /> : step}
          {isActive && (
            <span className="wp-step-pulse absolute inset-0 rounded-full shadow-[0_0_0_7px_rgba(0,208,132,0.16)]" />
          )}
        </div>
      )
    }
    return (
      <div className="grid h-9 w-9 place-items-center rounded-full border border-[var(--wp-border)] bg-[var(--wp-input)] text-[14px] font-bold text-[var(--wp-muted-2)]">
        {step}
      </div>
    )
  }
  const label = (step: 1 | 2, text: string) => (
    <span
      className={`text-[11.5px] ${
        step === active ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-medium text-[var(--wp-muted-2)]'
      }`}
    >
      {text}
    </span>
  )
  return (
    <div className="mb-5 mt-4 flex items-start justify-center">
      <div className="flex flex-col items-center gap-1.5">
        {circle(1)}
        {label(1, 'Account Details')}
      </div>
      <div
        className={`mx-3 mt-[17px] h-[2px] w-14 rounded-full ${
          active === 2
            ? 'bg-gradient-to-r from-[var(--wp-border)] via-[var(--wp-border-strong)] to-emerald-400/80'
            : 'bg-gradient-to-r from-emerald-400/80 via-[var(--wp-border-strong)] to-[var(--wp-border)]'
        }`}
      />
      <div className="flex flex-col items-center gap-1.5">
        {circle(2)}
        {label(2, 'Verification')}
      </div>
    </div>
  )
}

function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-7 -z-10 rounded-[44px] opacity-80 blur-2xl"
        style={{
          background:
            'radial-gradient(55% 45% at 50% 42%, rgba(0,208,132,0.16) 0%, rgba(0,208,132,0.05) 55%, transparent 75%)',
        }}
      />
      {/* gradient border wrapper */}
      <div className="rounded-[26px] bg-gradient-to-b from-emerald-500/[0.45] via-emerald-500/[0.10] to-emerald-500/[0.20] p-px shadow-[0_30px_80px_-30px_rgba(6,50,38,0.45)]">
        <section className="relative overflow-hidden rounded-[25px] bg-[var(--wp-card)] px-5 py-6 backdrop-blur-2xl sm:px-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full"
            style={{
              background: 'radial-gradient(closest-side, rgba(0,208,132,0.13), transparent)',
            }}
          />
          {children}
        </section>
      </div>
    </div>
  )
}

function SuccessCheck() {
  return (
    <div className="wp-pop relative mx-auto grid h-20 w-20 place-items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(0,208,132,0.30), rgba(0,208,132,0.08) 60%, transparent)',
        }}
      />
      <svg viewBox="0 0 52 52" className="relative h-16 w-16" aria-hidden="true">
        <circle
          className="wp-check-circle"
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="url(#wpCheckGrad)"
          strokeWidth="2.5"
        />
        <path
          className="wp-check-mark"
          fill="none"
          stroke="#00E091"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 27l8 8 15-16"
        />
        <defs>
          <linearGradient id="wpCheckGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2BF5A6" />
            <stop offset="100%" stopColor="#00B978" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  OTP input — 6 boxes, auto-advance, paste support                   */
/* ------------------------------------------------------------------ */

function OtpInput({
  value,
  onChange,
  error,
  disabled,
  onSubmit,
}: {
  value: string[]
  onChange: (v: string[]) => void
  error?: boolean
  disabled?: boolean
  onSubmit?: (code: string) => void
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  function handleInput(index: number, raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (!digits) {
      const next = [...value]
      next[index] = ''
      onChange(next)
      return
    }
    const next = [...value]
    for (let k = 0; k < digits.length && index + k < 6; k++) {
      next[index + k] = digits[k]
    }
    onChange(next)
    refs.current[Math.min(index + digits.length, 5)]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const next = [...value]
      next[index - 1] = ''
      onChange(next)
      refs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') onSubmit?.(value.join(''))
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const filled = !!value[i]
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`OTP digit ${i + 1}`}
            disabled={disabled}
            value={value[i] ?? ''}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={`h-[52px] w-[44px] rounded-[12px] border bg-[var(--wp-input)] text-center text-[20px] font-bold text-[var(--wp-text)] outline-none transition-all duration-200 disabled:opacity-60 ${
              error
                ? 'border-red-400/70'
                : filled
                  ? 'border-emerald-400/50 bg-[var(--wp-accent-soft)] shadow-[0_0_14px_rgba(0,208,132,0.18)]'
                  : 'border-[var(--wp-border)]'
            } focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(0,208,132,0.16)]`}
          />
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared field styling                                               */
/* ------------------------------------------------------------------ */

const INPUT_BASE =
  'h-[54px] w-full rounded-[13px] bg-[var(--wp-input)] text-[16px] text-[var(--wp-text)] outline-none transition-all duration-200 placeholder:text-[var(--wp-muted-2)] focus:bg-[var(--wp-input-focus)]'

const inputTone = (err?: string) =>
  err
    ? 'border-red-400/60 focus:border-red-400/70 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
    : 'border-[var(--wp-border)] hover:border-[var(--wp-border-strong)] focus:border-emerald-400/60 focus:shadow-[0_0_0_3px_rgba(0,208,132,0.14)]'

const helpTone = (err?: string) => (err ? 'text-red-400' : 'text-[var(--wp-muted-2)]')

const MOBILE_RE = /^\d{10}$/

type FieldKey = 'username' | 'mobile' | 'password' | 'confirm'
type FormValues = Record<FieldKey, string>
type FormErrors = Partial<Record<FieldKey, string>>
type View = 'register' | 'otp' | 'success' | 'login' | AppView

/* ------------------------------------------------------------------ */
/*  Hash routing — example.com/#/login, /#/home, /#/team, /#/orders …   */
/* ------------------------------------------------------------------ */

const VIEW_HASH: Record<View, string> = {
  register: '#/register',
  otp: '#/otp',
  success: '#/success',
  login: '#/login',
  home: '#/home',
  team: '#/team',
  orders: '#/orders',
  profile: '#/profile',
  task: '#/task',
  withdraw: '#/withdraw',
}

/** views that require a valid session */
const AUTHED_VIEWS: ReadonlySet<View> = new Set([
  'home', 'team', 'orders', 'profile', 'task', 'withdraw',
])

/** type guard — narrows View to the authenticated AppView subset */
function isAppView(v: View): v is AppView {
  return v === 'home' || v === 'team' || v === 'orders' || v === 'profile' || v === 'task' || v === 'withdraw'
}

function viewFromHash(hash: string): View | null {
  switch (hash) {
    case '#/register':
      return 'register'
    case '#/otp':
      return 'otp'
    case '#/success':
      return 'success'
    case '#/login':
      return 'login'
    case '#/home':
      return 'home'
    case '#/team':
      return 'team'
    case '#/orders':
      return 'orders'
    case '#/profile':
      return 'profile'
    case '#/task':
      return 'task'
    case '#/withdraw':
      return 'withdraw'
    default:
      return null
  }
}

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {}
  if (!/^[A-Za-z0-9_]{4,20}$/.test(v.username.trim())) {
    e.username = 'Use 4–20 characters: letters, numbers, underscore'
  }
  if (!MOBILE_RE.test(v.mobile.trim())) {
    e.mobile = 'Enter a valid 10-digit mobile number'
  }
  if (v.password.length < 6) {
    e.password = 'Password must be at least 6 characters'
  }
  if (!v.confirm || v.confirm !== v.password) {
    e.confirm = 'Passwords do not match'
  }
  return e
}

export default function WatchPayAuth() {
  const { toast } = useToast()

  const [view, setView] = useState<View>('register')
  /** true until the session-restore check finishes — shows a splash so a
   *  refresh never flashes the register form before Home appears */
  const [booting, setBooting] = useState(true)
  const [light, setLight] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  /* refs used by the hash router for access guards */
  const authedRef = useRef(false)
  const viewRef = useRef<View>('register')

  /* registration step 1 */
  const [values, setValues] = useState<FormValues>({
    username: '',
    mobile: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  /* registration step 2 — OTP */
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  /* success */
  const [createdUser, setCreatedUser] = useState<string | null>(null)

  /* login */
  const [loginValues, setLoginValues] = useState({ mobile: '', password: '' })
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)

  /* Restore session on refresh — a valid session cookie goes straight Home.
     Also restores the saved theme and honours deep links like /#/login. */
  useEffect(() => {
    let cancelled = false

    // saved theme
    try {
      if (localStorage.getItem('wp-theme') === 'light') setLight(true)
    } catch {
      /* private mode */
    }

    const initial = viewFromHash(window.location.hash)

    ;(async () => {
      let username: string | null = null
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && res.ok && data?.authenticated && data?.username) {
          username = data.username as string
        }
      } catch {
        // transient network hiccup — one retry before falling back to guest
        try {
          await new Promise((r) => setTimeout(r, 800))
          const res = await fetch('/api/auth/me', { cache: 'no-store' })
          const data = await res.json()
          if (!cancelled && res.ok && data?.authenticated && data?.username) {
            username = data.username as string
          }
        } catch {
          // offline / first visit — treat as guest
        }
      }
      if (cancelled) return
      setBooting(false)

      authedRef.current = !!username
      if (username) {
        setLoggedInUser(username)
        // honour deep links straight into any authed tab (team, orders…)
        const target: View =
          initial && AUTHED_VIEWS.has(initial) ? initial : 'home'
        setView(target)
        if (window.location.hash !== VIEW_HASH[target]) {
          window.location.hash = VIEW_HASH[target]
        }
        return
      }
      // guest: honour register/login deep links, everything else → register
      if (initial === 'login') {
        setView('login')
      } else if (window.location.hash !== VIEW_HASH.register) {
        window.location.hash = VIEW_HASH.register
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  /* theme → <html> class (shadcn tokens) + persistence */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', !light)
    document.documentElement.style.colorScheme = light ? 'light' : 'dark'
    try {
      localStorage.setItem('wp-theme', light ? 'light' : 'dark')
    } catch {
      /* private mode */
    }
  }, [light])

  /* keep the URL hash in sync with the active view (SPA-style) */
  useEffect(() => {
    viewRef.current = view
    const target = VIEW_HASH[view]
    if (window.location.hash !== target) {
      window.location.hash = target
    }
  }, [view])

  /* back/forward buttons + manual hash edits stay in sync (with guards) */
  useEffect(() => {
    const applyHash = () => {
      const v = viewFromHash(window.location.hash)
      if (!v) {
        // no/unknown hash → default per auth state
        const fallback = authedRef.current ? VIEW_HASH.home : VIEW_HASH.register
        if (window.location.hash !== fallback) window.location.hash = fallback
        return
      }
      if (AUTHED_VIEWS.has(v) && !authedRef.current) {
        window.location.hash = VIEW_HASH.login
        setView('login')
        return
      }
      if (v === 'success' && viewRef.current !== 'otp' && viewRef.current !== 'success') {
        window.location.hash = VIEW_HASH.register
        setView('register')
        return
      }
      setView(v)
    }
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const strength = values.password
    ? (() => {
        let s = 1
        if (values.password.length >= 6) s = 2
        if (
          values.password.length >= 6 &&
          /[A-Za-z]/.test(values.password) &&
          /\d/.test(values.password) &&
          (values.password.length >= 10 || /[^A-Za-z0-9]/.test(values.password))
        )
          s = 3
        return s
      })()
    : 0
  const filledBars = values.password ? strength : 1

  function update(key: FieldKey, val: string) {
    setValues((prev) => {
      const next = { ...prev, [key]: val }
      if (submitted) setErrors(validate(next))
      return next
    })
  }

  async function handleRegister(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    setSubmitted(true)
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    setServerError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username.trim(),
          mobile: values.mobile.trim(),
          password: values.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.field) {
          setErrors((prev) => ({ ...prev, [data.field as FieldKey]: data.error }))
        } else {
          setServerError(data.error ?? 'Something went wrong. Please try again.')
        }
        return
      }
      setOtp(Array(6).fill(''))
      setOtpError(null)
      setView('otp')
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleVerify(code?: string) {
    const joined = (code ?? otp.join('')).replace(/\D/g, '')
    if (joined.length < 6) {
      setOtpError('Enter the complete 6-digit OTP')
      return
    }
    setVerifying(true)
    setOtpError(null)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: joined,
          username: values.username.trim(),
          mobile: values.mobile.trim(),
          password: values.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError(data.error ?? 'Verification failed. Please try again.')
        setOtp(Array(6).fill(''))
        return
      }
      const name = data.user?.username ?? values.username
      setCreatedUser(name)
      // verify-otp signed the user in (session cookie) — mirror that here
      setLoggedInUser(name)
      authedRef.current = true
      setView('success')
      toast({
        title: 'Account created',
        description: `Welcome to WatchPay, ${name}!`,
      })
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleLogin(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    setLoginError(null)
    if (!MOBILE_RE.test(loginValues.mobile.trim())) {
      setLoginError('Enter a valid 10-digit mobile number')
      return
    }
    if (!loginValues.password) {
      setLoginError('Password is required')
      return
    }
    setLoggingIn(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: loginValues.mobile.trim(),
          password: loginValues.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error ?? 'Login failed. Please try again.')
        return
      }
      setLoggedInUser(data.user?.username ?? '')
      authedRef.current = true
      setView('home')
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user?.username ?? ''}!`,
      })
    } catch {
      setLoginError('Network error. Please try again.')
    } finally {
      setLoggingIn(false)
    }
  }

  function goHomeFromSuccess() {
    // the session cookie was already set by /api/auth/verify-otp —
    // straight to Home, no forced detour through the login form
    setView('home')
  }

  function goRegisterFromLogin() {
    setLoginError(null)
    setLoggedInUser(null)
    setSubmitted(false)
    setErrors({})
    setView('register')
  }

  const primaryBtn =
    'group relative mt-1 flex h-[56px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-[14px] bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[16px] font-bold text-white shadow-[0_16px_38px_-8px_rgba(0,208,132,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-8px_rgba(0,208,132,0.75),inset_0_1px_0_rgba(255,255,255,0.4)] hover:brightness-[1.05] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,208,132,0.3)] active:translate-y-0 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-80'

  const formattedMobile = `${values.mobile.slice(0, 5)} ${values.mobile.slice(5)}`.trim()

  return (
    <main
      className={`wp-app relative min-h-svh overflow-x-hidden bg-[var(--wp-bg)] transition-colors duration-500 ${
        light ? 'wp-light' : ''
      }`}
    >
      <AmbientBackground light={light} />

      <div
        className={`relative z-10 mx-auto flex min-h-svh w-full max-w-[430px] flex-col pb-[max(18px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] ${
          isAppView(view) ? 'px-0' : 'px-5'
        }`}
      >
        <div className="my-auto">
          {/* ========================= BOOT SPLASH ========================= */}
          {/* shown while /api/auth/me decides register vs Home — a refresh
              on Home therefore never flashes the register form */}
          {booting && (
            <div aria-busy="true" className="flex min-h-[72svh] items-center justify-center">
              <div className="wp-pop">
                <Logo />
              </div>
            </div>
          )}

          {/* ============================ HEADER ============================ */}
          {!booting && view !== 'home' && (
            <header className="relative mb-4 flex flex-col items-center">
              <button
                type="button"
                aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
                onClick={() => setLight((v) => !v)}
                className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-[var(--wp-border)] bg-[var(--wp-hover)] text-[var(--wp-text)] transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-600 active:scale-95"
              >
                {light ? (
                  <IconMoon className="h-[18px] w-[18px]" />
                ) : (
                  <IconSun className="h-[18px] w-[18px]" />
                )}
              </button>
              <Logo />
            </header>
          )}

          {/* ======================== REGISTER VIEW ======================== */}
          {!booting && view === 'register' && (
            <AuthCard>
              <h2 className="text-center text-[25px] font-extrabold leading-tight tracking-tight text-[var(--wp-heading)]">
                Create Your{' '}
                <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
                  Account
                </span>
              </h2>
              <p className="mt-1.5 text-center text-[13.5px] text-[var(--wp-muted)]">
                Create your account &amp; start earning
              </p>

              <StepIndicator active={1} />

              <form noValidate onSubmit={handleRegister} className="flex flex-col gap-3.5">
                {/* Username */}
                <div>
                  <label
                    htmlFor="wp-username"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--wp-text)]"
                  >
                    <IconUser className="h-3.5 w-3.5 text-emerald-400" />
                    Username
                  </label>
                  <div className="group relative">
                    <IconUser className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--wp-faint)] transition-colors duration-200 group-focus-within:text-emerald-400" />
                    <input
                      id="wp-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Choose a username"
                      value={values.username}
                      onChange={(e) => update('username', e.target.value)}
                      aria-invalid={!!errors.username}
                      aria-describedby="wp-username-help"
                      className={`${INPUT_BASE} ${inputTone(errors.username)} border pl-11 pr-4`}
                    />
                  </div>
                  <p
                    id="wp-username-help"
                    className={`mt-1.5 text-[11.5px] leading-snug ${helpTone(errors.username)}`}
                  >
                    {errors.username ?? 'Use 4–20 characters (letters, numbers, underscore)'}
                  </p>
                </div>

                {/* Mobile Number */}
                <div>
                  <label
                    htmlFor="wp-mobile"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--wp-text)]"
                  >
                    <IconSmartphone className="h-3.5 w-3.5 text-emerald-400" />
                    Mobile Number
                  </label>
                  <div
                    className={`flex h-[54px] w-full items-center rounded-[13px] border bg-[var(--wp-input)] transition-all duration-200 focus-within:bg-[var(--wp-input-focus)] ${
                      errors.mobile
                        ? 'border-red-400/60 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
                        : 'border-[var(--wp-border)] focus-within:border-emerald-400/60 focus-within:shadow-[0_0_0_3px_rgba(0,208,132,0.14)]'
                    }`}
                  >
                    <div className="flex h-full items-center gap-1.5 border-r border-[var(--wp-border)] pl-4 pr-3">
                      <span className="text-[14px] font-bold text-[var(--wp-text)]">IN</span>
                      <span className="text-[14px] font-semibold text-emerald-400">+91</span>
                    </div>
                    <input
                      id="wp-mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={values.mobile}
                      onChange={(e) =>
                        update('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      aria-invalid={!!errors.mobile}
                      className="h-full w-full flex-1 bg-transparent pl-3.5 pr-4 text-[16px] text-[var(--wp-text)] outline-none placeholder:text-[var(--wp-muted-2)]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="wp-password"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--wp-text)]"
                  >
                    <IconLock className="h-3.5 w-3.5 text-emerald-400" />
                    Password
                  </label>
                  <div className="group relative">
                    <IconLock className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--wp-faint)] transition-colors duration-200 group-focus-within:text-emerald-400" />
                    <input
                      id="wp-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={values.password}
                      onChange={(e) => update('password', e.target.value)}
                      aria-invalid={!!errors.password}
                      aria-describedby="wp-password-help"
                      className={`${INPUT_BASE} ${inputTone(errors.password)} border pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--wp-muted-2)] transition-colors duration-200 hover:bg-emerald-400/10 hover:text-emerald-300"
                    >
                      {showPassword ? (
                        <IconEyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <IconEye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                  <p
                    id="wp-password-help"
                    className={`mt-1.5 text-[11.5px] leading-snug ${helpTone(errors.password)}`}
                  >
                    {errors.password ?? 'Use 6+ characters with letters and numbers'}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`h-[5px] w-14 rounded-full transition-colors duration-300 ${
                          n <= filledBars
                            ? 'bg-gradient-to-r from-[#2BF5A6] to-[#00B978]'
                            : 'bg-[var(--wp-border)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="wp-confirm"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--wp-text)]"
                  >
                    <IconLock className="h-3.5 w-3.5 text-emerald-400" />
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <IconLock className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--wp-faint)] transition-colors duration-200 group-focus-within:text-emerald-400" />
                    <input
                      id="wp-confirm"
                      name="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={values.confirm}
                      onChange={(e) => update('confirm', e.target.value)}
                      aria-invalid={!!errors.confirm}
                      className={`${INPUT_BASE} ${inputTone(errors.confirm)} border pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--wp-muted-2)] transition-colors duration-200 hover:bg-emerald-400/10 hover:text-emerald-300"
                    >
                      {showConfirm ? (
                        <IconEyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <IconEye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                  {errors.confirm ? (
                    <p className="mt-1.5 text-[11.5px] leading-snug text-red-400">
                      {errors.confirm}
                    </p>
                  ) : null}
                </div>

                {serverError ? (
                  <p className="text-center text-[12px] font-medium text-red-400">{serverError}</p>
                ) : null}

                {/* CTA */}
                <button type="submit" disabled={sending} className={primaryBtn}>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  {sending ? (
                    <>
                      <IconLoader className="h-5 w-5 animate-spin" />
                      <span>Checking details…</span>
                    </>
                  ) : (
                    <>
                      <IconMail className="h-[19px] w-[19px]" />
                      <span>Send OTP</span>
                      <IconArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="my-4 flex items-center gap-3" role="separator" aria-hidden="true">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--wp-border-strong)]" />
                <span className="text-[10px] font-bold tracking-[0.24em] text-[var(--wp-muted-2)]">
                  HAVE AN ACCOUNT?
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--wp-border-strong)]" />
              </div>

              <p className="text-center text-[13.5px] text-[var(--wp-muted)]">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLoginValues({ mobile: values.mobile, password: '' })
                    setLoginError(null)
                    setLoggedInUser(null)
                    setView('login')
                  }}
                  className="group inline-flex items-center gap-1 font-semibold text-emerald-600 transition-colors duration-200 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Login
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </p>
            </AuthCard>
          )}

          {/* ========================== OTP VIEW ========================== */}
          {!booting && view === 'otp' && (
            <AuthCard>
              <h2 className="text-center text-[25px] font-extrabold leading-tight tracking-tight text-[var(--wp-heading)]">
                Verify{' '}
                <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
                  OTP
                </span>
              </h2>
              <p className="mt-1.5 text-center text-[13.5px] text-[var(--wp-muted)]">
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold text-[var(--wp-text)]">+91 {formattedMobile}</span>
              </p>

              <StepIndicator active={2} />

              <div className="flex justify-center">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
                  Demo OTP: 123456
                </span>
              </div>

              <div className={`mt-5 ${otpError ? 'wp-shake' : ''}`}>
                <OtpInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v)
                    if (otpError) setOtpError(null)
                  }}
                  error={!!otpError}
                  disabled={verifying}
                  onSubmit={(code) => handleVerify(code)}
                />
              </div>

              {otpError ? (
                <p className="mt-3 text-center text-[12px] font-medium text-red-400">{otpError}</p>
              ) : null}

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={verifying}
                className={`${primaryBtn} mt-5`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                {verifying ? (
                  <>
                    <IconLoader className="h-5 w-5 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <IconCheck className="h-[19px] w-[19px]" />
                    <span>Verify &amp; Create Account</span>
                    <IconArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setView('register')}
                className="mx-auto mt-4 flex items-center gap-1.5 text-[12px] font-medium text-[var(--wp-muted-2)] transition-colors duration-200 hover:text-emerald-300"
              >
                <IconArrowLeft className="h-3.5 w-3.5" />
                Change details
              </button>
            </AuthCard>
          )}

          {/* ========================= SUCCESS VIEW ========================= */}
          {!booting && view === 'success' && (
            <AuthCard>
              <div className="flex flex-col items-center py-3">
                <SuccessCheck />
                <h2 className="mt-5 text-center text-[25px] font-extrabold leading-tight tracking-tight text-[var(--wp-heading)]">
                  Account{' '}
                  <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
                    Created!
                  </span>
                </h2>
                <p className="mt-2 max-w-[260px] text-center text-[13.5px] leading-relaxed text-[var(--wp-muted)]">
                  Welcome to WatchPay,{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{createdUser}</span>! Your
                  account is ready — start watching &amp; earning.
                </p>
                <button type="button" onClick={goHomeFromSuccess} className={`${primaryBtn} mt-6`}>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <span>Continue to Home</span>
                  <IconArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </AuthCard>
          )}

          {/* ========================== LOGIN VIEW ========================== */}
          {!booting && view === 'login' && (
            <AuthCard>
              {loggedInUser ? (
                <div className="flex flex-col items-center py-3">
                  <SuccessCheck />
                  <h2 className="mt-5 text-center text-[25px] font-extrabold leading-tight tracking-tight text-[var(--wp-heading)]">
                    Welcome{' '}
                    <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
                      Back!
                    </span>
                  </h2>
                  <p className="mt-2 text-center text-[13.5px] text-[var(--wp-muted)]">
                    You are logged in as{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{loggedInUser}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoggedInUser(null)
                      setLoginValues((v) => ({ ...v, password: '' }))
                    }}
                    className="mt-6 flex h-[46px] w-full items-center justify-center rounded-[14px] border border-[var(--wp-border)] bg-[var(--wp-chip)] text-[14px] font-semibold text-[var(--wp-text)] transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300 active:scale-[0.985]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-center text-[25px] font-extrabold leading-tight tracking-tight text-[var(--wp-heading)]">
                    Welcome{' '}
                    <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
                      Back
                    </span>
                  </h2>
                  <p className="mt-1.5 text-center text-[13.5px] text-[var(--wp-muted)]">
                    Login to your WatchPay account
                  </p>

                  <form noValidate onSubmit={handleLogin} className="mt-6 flex flex-col gap-3.5">
                    {/* Mobile Number */}
                    <div>
                      <label
                        htmlFor="wp-login-mobile"
                        className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--wp-text)]"
                      >
                        <IconSmartphone className="h-3.5 w-3.5 text-emerald-400" />
                        Mobile Number
                      </label>
                      <div
                        className={`flex h-[54px] w-full items-center rounded-[13px] border bg-[var(--wp-input)] transition-all duration-200 focus-within:bg-[var(--wp-input-focus)] ${
                          loginError && loginError.includes('mobile')
                            ? 'border-red-400/60 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
                            : 'border-[var(--wp-border)] focus-within:border-emerald-400/60 focus-within:shadow-[0_0_0_3px_rgba(0,208,132,0.14)]'
                        }`}
                      >
                        <div className="flex h-full items-center gap-1.5 border-r border-[var(--wp-border)] pl-4 pr-3">
                          <span className="text-[14px] font-bold text-[var(--wp-text)]">IN</span>
                          <span className="text-[14px] font-semibold text-emerald-400">+91</span>
                        </div>
                        <input
                          id="wp-login-mobile"
                          name="mobile"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          placeholder="10-digit number"
                          value={loginValues.mobile}
                          onChange={(e) =>
                            setLoginValues((v) => ({
                              ...v,
                              mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                            }))
                          }
                          className="h-full w-full flex-1 bg-transparent pl-3.5 pr-4 text-[16px] text-[var(--wp-text)] outline-none placeholder:text-[var(--wp-muted-2)]"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="wp-login-password"
                        className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--wp-text)]"
                      >
                        <IconLock className="h-3.5 w-3.5 text-emerald-400" />
                        Password
                      </label>
                      <div className="group relative">
                        <IconLock className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--wp-faint)] transition-colors duration-200 group-focus-within:text-emerald-400" />
                        <input
                          id="wp-login-password"
                          name="password"
                          type={showLoginPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={loginValues.password}
                          onChange={(e) =>
                            setLoginValues((v) => ({ ...v, password: e.target.value }))
                          }
                          className={`${INPUT_BASE} ${inputTone(loginError ? 'err' : undefined)} border pl-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--wp-muted-2)] transition-colors duration-200 hover:bg-emerald-400/10 hover:text-emerald-300"
                        >
                          {showLoginPassword ? (
                            <IconEyeOff className="h-[18px] w-[18px]" />
                          ) : (
                            <IconEye className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {loginError ? (
                      <p className="text-center text-[12px] font-medium text-red-400">
                        {loginError}
                      </p>
                    ) : null}

                    <button type="submit" disabled={loggingIn} className={primaryBtn}>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                      />
                      {loggingIn ? (
                        <>
                          <IconLoader className="h-5 w-5 animate-spin" />
                          <span>Logging in…</span>
                        </>
                      ) : (
                        <>
                          <span>Login</span>
                          <IconArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="my-4 flex items-center gap-3" role="separator" aria-hidden="true">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--wp-border-strong)]" />
                    <span className="text-[10px] font-bold tracking-[0.24em] text-[var(--wp-muted-2)]">
                      NEW TO WATCHPAY?
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--wp-border-strong)]" />
                  </div>

                  <p className="text-center text-[13.5px] text-[var(--wp-muted)]">
                    Create a new account?{' '}
                    <button
                      type="button"
                      onClick={goRegisterFromLogin}
                      className="group inline-flex items-center gap-1 font-semibold text-emerald-600 transition-colors duration-200 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Register
                      <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </p>
                </>
              )}
            </AuthCard>
          )}

          {/* ===================== AUTHENTICATED APP ====================== */}
          {!booting && isAppView(view) && (
            <AppShell
              view={view}
              onNavigate={setView}
              username={loggedInUser ?? 'Player'}
              light={light}
              onToggleLight={() => setLight((v) => !v)}
              onLogout={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' })
                } catch {
                  // cookie clear is best-effort — continue with local logout
                }
                authedRef.current = false
                setLoggedInUser(null)
                setLoginValues((v) => ({ ...v, password: '' }))
                setView('login')
              }}
            />
          )}
        </div>
      </div>
    </main>
  )
}
