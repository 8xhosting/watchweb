'use client'

import { useCountUp } from '@/hooks/use-count-up'

/**
 * Animated count-up number (shared by the Admin panel and the upgraded
 * user pages) — eases to the target so every figure "lands" with motion.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}) {
  const animated = useCountUp(value)
  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {prefix}
      {animated.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
