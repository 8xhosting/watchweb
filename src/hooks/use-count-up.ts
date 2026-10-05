'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Animated count-up number — eases from 0 (or previous value) to `target`
 * over `duration` ms with requestAnimationFrame. Used by admin KPI cards
 * and the upgraded user pages so every figure "lands" with motion.
 */
export function useCountUp(target: number, duration = 850): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let alive = true

    const tick = (now: number) => {
      if (!alive) return
      const t = Math.min(1, (now - start) / duration)
      // ease-out cubic — fast start, gentle landing
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      setValue(next)
      fromRef.current = next
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}
