'use client'

import { useState, type FormEvent, type ReactNode } from 'react'

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
/*  Ambient background — deterministic particles (hydration-safe)      */
/* ------------------------------------------------------------------ */

const PARTICLES = [
  { l: '6%', t: '13%', s: 3, o: 0.35, du: '11s', delay: '0s', c: '#00D084' },
  { l: '14%', t: '64%', s: 2, o: 0.22, du: '13s', delay: '1.2s', c: '#9FF5D3' },
  { l: '9%', t: '85%', s: 2, o: 0.3, du: '10s', delay: '2.1s', c: '#00D084' },
  { l: '21%', t: '34%', s: 2, o: 0.18, du: '14s', delay: '0.6s', c: '#E8FFF5' },
  { l: '88%', t: '17%', s: 3, o: 0.32, du: '12s', delay: '0.9s', c: '#00D084' },
  { l: '93%', t: '48%', s: 2, o: 0.24, du: '9s', delay: '1.8s', c: '#9FF5D3' },
  { l: '82%', t: '77%', s: 2, o: 0.28, du: '12s', delay: '2.6s', c: '#00D084' },
  { l: '70%', t: '7%', s: 2, o: 0.2, du: '15s', delay: '3.1s', c: '#E8FFF5' },
  { l: '33%', t: '5%', s: 2, o: 0.25, du: '11s', delay: '1.5s', c: '#00D084' },
  { l: '56%', t: '91%', s: 2, o: 0.22, du: '13s', delay: '0.4s', c: '#9FF5D3' },
  { l: '44%', t: '15%', s: 2, o: 0.16, du: '16s', delay: '2.9s', c: '#E8FFF5' },
  { l: '63%', t: '58%', s: 2, o: 0.15, du: '14s', delay: '1.1s', c: '#00D084' },
]

function AmbientBackground({ dim }: { dim: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* deep space base wash */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: dim
            ? 'radial-gradient(120% 90% at 50% 0%, #101A2C 0%, #0A0F1A 55%, #070A12 100%)'
            : 'radial-gradient(120% 90% at 50% 0%, #0A1220 0%, #05070B 55%, #04060A 100%)',
        }}
      />
      {/* emerald ambient glow — top */}
      <div
        className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,208,132,0.16) 0%, rgba(0,208,132,0.05) 45%, transparent 70%)',
        }}
      />
      {/* emerald ambient glow — behind card */}
      <div
        className="absolute left-1/2 top-[44%] h-[560px] w-[540px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,208,132,0.10) 0%, transparent 65%)',
        }}
      />
      {/* emerald ambient glow — bottom */}
      <div
        className="absolute -bottom-36 left-1/2 h-[380px] w-[560px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,183,120,0.09) 0%, transparent 70%)',
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
          stroke="rgba(0,208,132,0.14)"
          strokeWidth="1.2"
        />
        <path
          d="M-30 690 C 80 740, 210 640, 320 700 S 420 780, 440 740"
          stroke="rgba(0,208,132,0.10)"
          strokeWidth="1.2"
        />
        <path
          d="M330 -20 C 300 80, 380 140, 350 240"
          stroke="rgba(255,255,255,0.06)"
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
            opacity: p.o,
            background: p.c,
            boxShadow: `0 0 ${p.s * 3}px ${p.c}`,
            ['--du' as string]: p.du,
            ['--delay' as string]: p.delay,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared field styling                                               */
/* ------------------------------------------------------------------ */

const INPUT_BASE =
  'h-[54px] w-full rounded-[13px] bg-[#0A101B]/80 text-[16px] text-slate-100 outline-none transition-all duration-200 placeholder:text-[#5A6478] focus:bg-[#0B1220]'

const inputTone = (err?: string) =>
  err
    ? 'border-red-400/60 focus:border-red-400/70 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
    : 'border-white/[0.08] hover:border-white/[0.14] focus:border-emerald-400/60 focus:shadow-[0_0_0_3px_rgba(0,208,132,0.13)]'

const helpTone = (err?: string) => (err ? 'text-red-400' : 'text-[#5F6B7E]')

/* ------------------------------------------------------------------ */
/*  WatchPay — Registration (Step 1: Account Details)                  */
/* ------------------------------------------------------------------ */

type FieldKey = 'username' | 'mobile' | 'password' | 'confirm'
type FormValues = Record<FieldKey, string>
type FormErrors = Partial<Record<FieldKey, string>>

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {}
  if (!/^[A-Za-z0-9_]{4,20}$/.test(v.username.trim())) {
    e.username = 'Use 4–20 characters: letters, numbers, underscore'
  }
  if (!/^\d{10}$/.test(v.mobile.trim())) {
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

function passwordStrength(p: string): number {
  if (!p) return 0
  let s = 1
  if (p.length >= 6) s = 2
  if (
    p.length >= 6 &&
    /[A-Za-z]/.test(p) &&
    /\d/.test(p) &&
    (p.length >= 10 || /[^A-Za-z0-9]/.test(p))
  )
    s = 3
  return s
}

export default function WatchPayRegister() {
  const [dim, setDim] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [values, setValues] = useState<FormValues>({
    username: '',
    mobile: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const strength = passwordStrength(values.password)
  const filledBars = values.password ? strength : 1

  function update(key: FieldKey, val: string) {
    setValues((prev) => {
      const next = { ...prev, [key]: val }
      if (submitted) setErrors(validate(next))
      return next
    })
  }

  function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    setSubmitted(true)
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    /* UI-only flow: no backend is connected yet, so we simulate the
       request lifecycle without inventing any extra screens/steps. */
    setSubmitting(true)
    window.setTimeout(() => setSubmitting(false), 1400)
  }

  return (
    <main
      className={`relative min-h-svh overflow-x-hidden transition-colors duration-700 ${
        dim ? 'bg-[#0A1120]' : 'bg-[#05070B]'
      }`}
    >
      <AmbientBackground dim={dim} />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
        <div className="my-auto">
          {/* ============================ HEADER ============================ */}
          <header className="relative mb-4 flex flex-col items-center">
            <button
              type="button"
              aria-label={dim ? 'Switch to dark mode' : 'Switch to dim mode'}
              onClick={() => setDim((v) => !v)}
              className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300 active:scale-95"
            >
              {dim ? (
                <IconSun className="h-[18px] w-[18px]" />
              ) : (
                <IconMoon className="h-[18px] w-[18px]" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-b from-[#00E091] to-[#00B978] shadow-[0_6px_18px_-4px_rgba(0,208,132,0.6),inset_0_1px_0_rgba(255,255,255,0.35)]">
                <IconPlayFill className="h-4 w-4 translate-x-[1px] text-[#04120C]" />
              </div>
              <h1 className="text-[30px] font-extrabold italic leading-none tracking-tight">
                <span className="text-slate-100 [text-shadow:0_2px_18px_rgba(226,255,242,0.22)]">
                  WATCH
                </span>
                <span className="bg-gradient-to-b from-[#4DF7B8] via-[#00D084] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_14px_rgba(0,208,132,0.45))]">
                  PAY
                </span>
              </h1>
            </div>
            <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#7C8698]">
              Watch<span className="mx-1.5 text-emerald-400">•</span>Earn
              <span className="mx-1.5 text-emerald-400">•</span>Grow
            </p>
          </header>

          {/* ============================= CARD ============================= */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-7 -z-10 rounded-[44px] opacity-80 blur-2xl"
              style={{
                background:
                  'radial-gradient(55% 45% at 50% 42%, rgba(0,208,132,0.15) 0%, rgba(0,208,132,0.04) 55%, transparent 75%)',
              }}
            />

            <section className="relative overflow-hidden rounded-[26px] border border-emerald-400/[0.16] bg-[#080D16]/70 p-5 shadow-[0_30px_90px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-6">
              {/* hairline top light */}
              <div
                aria-hidden="true"
                className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent"
              />

              <h2 className="text-center text-[25px] font-extrabold leading-tight tracking-tight text-white">
                Create Your{' '}
                <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">
                  Account
                </span>
              </h2>
              <p className="mt-1.5 text-center text-[13.5px] text-[#8A94A6]">
                Create your account &amp; start earning
              </p>

              {/* ======================= STEP INDICATOR ======================= */}
              <div className="mb-5 mt-4 flex items-start justify-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b from-[#00E091] to-[#00B978] text-[14px] font-extrabold text-[#03130C] shadow-[0_0_0_4px_rgba(0,208,132,0.14),0_0_20px_rgba(0,208,132,0.55)]">
                    1
                  </div>
                  <span className="text-[11.5px] font-semibold text-emerald-400">
                    Account Details
                  </span>
                </div>

                <div className="mx-3 mt-[17px] h-[2px] w-14 rounded-full bg-gradient-to-r from-emerald-400/80 via-white/15 to-white/10" />

                <div className="flex flex-col items-center gap-1.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-[#0A101B] text-[14px] font-bold text-[#5A6478]">
                    2
                  </div>
                  <span className="text-[11.5px] font-medium text-[#5A6478]">
                    Verification
                  </span>
                </div>
              </div>

              {/* ============================= FORM ============================= */}
              <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                {/* Username */}
                <div>
                  <label
                    htmlFor="wp-username"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-200"
                  >
                    <IconUser className="h-3.5 w-3.5 text-emerald-400" />
                    Username
                  </label>
                  <div className="relative">
                    <IconUser className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#4E5A6E]" />
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
                    {errors.username ??
                      'Use 4–20 characters (letters, numbers, underscore)'}
                  </p>
                </div>

                {/* Mobile Number */}
                <div>
                  <label
                    htmlFor="wp-mobile"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-200"
                  >
                    <IconSmartphone className="h-3.5 w-3.5 text-emerald-400" />
                    Mobile Number
                  </label>
                  <div
                    className={`flex h-[54px] w-full items-center rounded-[13px] border bg-[#0A101B]/80 transition-all duration-200 focus-within:bg-[#0B1220] ${
                      errors.mobile
                        ? 'border-red-400/60 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
                        : 'border-white/[0.08] focus-within:border-emerald-400/60 focus-within:shadow-[0_0_0_3px_rgba(0,208,132,0.13)]'
                    }`}
                  >
                    <div className="flex h-full items-center gap-1.5 border-r border-white/10 pl-4 pr-3">
                      <span className="text-[14px] font-bold text-slate-100">IN</span>
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
                      className="h-full w-full flex-1 bg-transparent pl-3.5 pr-4 text-[16px] text-slate-100 outline-none placeholder:text-[#5A6478]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="wp-password"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-200"
                  >
                    <IconLock className="h-3.5 w-3.5 text-emerald-400" />
                    Password
                  </label>
                  <div className="relative">
                    <IconLock className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#4E5A6E]" />
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
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#5A6478] transition-colors duration-200 hover:bg-emerald-400/10 hover:text-emerald-300"
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
                  {/* strength meter */}
                  <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`h-[5px] w-14 rounded-full transition-colors duration-300 ${
                          n <= filledBars
                            ? 'bg-gradient-to-r from-[#00E091] to-[#00B978]'
                            : 'bg-white/[0.07]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="wp-confirm"
                    className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-200"
                  >
                    <IconLock className="h-3.5 w-3.5 text-emerald-400" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <IconLock className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#4E5A6E]" />
                    <input
                      id="wp-confirm"
                      name="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={values.confirm}
                      onChange={(e) => update('confirm', e.target.value)}
                      aria-invalid={!!errors.confirm}
                      aria-describedby="wp-confirm-help"
                      className={`${INPUT_BASE} ${inputTone(errors.confirm)} border pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#5A6478] transition-colors duration-200 hover:bg-emerald-400/10 hover:text-emerald-300"
                    >
                      {showConfirm ? (
                        <IconEyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <IconEye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                  {errors.confirm ? (
                    <p
                      id="wp-confirm-help"
                      className={`mt-1.5 text-[11.5px] leading-snug ${helpTone(errors.confirm)}`}
                    >
                      {errors.confirm}
                    </p>
                  ) : null}
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative mt-1 flex h-[56px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-[14px] bg-gradient-to-b from-[#00E091] to-[#00B978] text-[16px] font-bold text-white shadow-[0_14px_34px_-8px_rgba(0,208,132,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-200 hover:shadow-[0_18px_44px_-8px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-[1.06] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,208,132,0.3)] active:scale-[0.985] disabled:opacity-80"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  {submitting ? (
                    <>
                      <IconLoader className="h-5 w-5 animate-spin" />
                      <span>Sending OTP…</span>
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

              {/* ======================= BOTTOM SECTION ======================= */}
              <div className="my-4 flex items-center gap-3" role="separator" aria-hidden="true">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.12]" />
                <span className="text-[10px] font-bold tracking-[0.24em] text-[#5A6478]">
                  HAVE AN ACCOUNT?
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.12]" />
              </div>

              <p className="text-center text-[13.5px] text-[#8A94A6]">
                Already registered?{' '}
                <a
                  href="#"
                  className="group inline-flex items-center gap-1 font-semibold text-emerald-400 transition-colors duration-200 hover:text-emerald-300"
                >
                  Login
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
