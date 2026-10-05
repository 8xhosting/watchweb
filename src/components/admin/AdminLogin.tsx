'use client'

import { useState, type FormEvent } from 'react'

/**
 * Admin gate — sign-in card for the Master Control panel.
 * Credentials: ADMIN_USERNAME / ADMIN_PASSWORD env (defaults admin / WatchPay@2025).
 * The default hint is shown because this build is the owner's dev deployment.
 */
export function AdminLogin({ onAuthed }: { onAuthed: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        onAuthed(String(data.username ?? 'admin'))
      } else {
        setError(data?.error ?? 'Invalid admin credentials')
        setShake((s) => s + 1)
      }
    } catch {
      setError('Network error — please try again')
      setShake((s) => s + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="w-full max-w-[380px]">
        {/* brand */}
        <div className="wp-pop mb-6 flex flex-col items-center">
          <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] shadow-[0_18px_40px_-10px_rgba(0,208,132,0.7),inset_0_1px_0_rgba(255,255,255,0.4)]">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#04120C]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <h1 className="mt-3 text-[24px] font-black tracking-tight text-[var(--wp-heading)]">
            WATCHPAY <span className="bg-gradient-to-b from-[#4DF7B8] to-[#00B978] bg-clip-text text-transparent [filter:drop-shadow(0_0_12px_rgba(0,208,132,0.4))]">ADMIN</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--wp-muted-2)]">
            <span className="wp-live-dot h-1.5 w-1.5 rounded-full bg-[#00D084]" />
            Master Control
          </p>
        </div>

        {/* card */}
        <form
          key={shake}
          noValidate
          onSubmit={submit}
          className={`rounded-[22px] border border-[var(--wp-border)] bg-[var(--wp-card)] p-5 shadow-[var(--wp-shadow-pop)] backdrop-blur-xl ${
            shake ? 'wp-shake' : ''
          }`}
        >
          <label
            htmlFor="admin-user"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]"
          >
            Admin username
          </label>
          <input
            id="admin-user"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3.5 text-[14px] font-semibold text-[var(--wp-text)] outline-none transition-colors duration-200 placeholder:font-normal placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60 focus:bg-[var(--wp-input-focus)]"
            placeholder="admin"
          />

          <label
            htmlFor="admin-pass"
            className="mt-3.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--wp-muted-2)]"
          >
            Password
          </label>
          <input
            id="admin-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-[var(--wp-border)] bg-[var(--wp-input)] px-3.5 text-[14px] font-semibold text-[var(--wp-text)] outline-none transition-colors duration-200 placeholder:font-normal placeholder:text-[var(--wp-faint)] focus:border-emerald-400/60 focus:bg-[var(--wp-input-focus)]"
            placeholder="••••••••••"
          />

          {error ? (
            <p role="alert" className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-[12px] font-bold text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#2BF5A6] via-[#00D084] to-[#00B978] text-[15px] font-extrabold text-white shadow-[0_16px_38px_-8px_rgba(0,208,132,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-[1.05] active:translate-y-0 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {busy ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Verifying…
              </>
            ) : (
              'Enter Master Control'
            )}
          </button>

          <p className="mt-3.5 rounded-xl border border-[var(--wp-border)] bg-[var(--wp-chip)] px-3 py-2 text-center text-[10.5px] leading-relaxed text-[var(--wp-muted)]">
            Default dev credentials: <span className="font-bold text-[var(--wp-accent-text)]">admin / WatchPay@2025</span>
            <br />
            Change via ADMIN_USERNAME &amp; ADMIN_PASSWORD env vars.
          </p>
        </form>

        <p className="mt-4 text-center text-[10px] font-semibold tracking-[0.18em] text-[var(--wp-faint)]">
          WATCHPAY ADMIN · V1.0.0
        </p>
      </div>
    </div>
  )
}
