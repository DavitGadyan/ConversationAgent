'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * Counts a number up when it scrolls into view.
 *
 * Used for the savings figure and the live price estimate. A number that
 * animates to its value reads as *calculated* rather than merely printed — which
 * is the impression we want when showing someone what they save.
 *
 * THE IMPORTANT PART: these are prices, so correctness outranks the effect
 * everywhere it conflicts.
 *
 *  - The initial state is the real value, so SSR, crawlers, printing, and any
 *    client where JS fails all render the correct figure.
 *  - It only drops to 0 to animate once it is certain the animation is running.
 *  - A watchdog snaps to the final value if the animation has not completed
 *    shortly after mount, so a missed IntersectionObserver callback can never
 *    strand the display at "$0.00".
 *
 * Seeding at 0 and hoping the observer fires — the obvious implementation — puts
 * "$0.00/week" on screen in every one of those failure cases.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduced = useReducedMotion()

  const [display, setDisplay] = useState(value)
  const settled = useRef(false)

  useEffect(() => {
    if (reduced || !inView) {
      // Not animating (yet): the correct value stays on screen.
      setDisplay(value)
      return
    }

    if (settled.current) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // Ease-out cubic: quick off the mark, settles gently on the final figure.
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)

      if (t < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        settled.current = true
        setDisplay(value)
      }
    }

    frame = requestAnimationFrame(tick)

    // Watchdog: if rAF is throttled (background tab) or cancelled mid-flight,
    // make sure the real number is what ends up on screen.
    const watchdog = setTimeout(() => {
      cancelAnimationFrame(frame)
      settled.current = true
      setDisplay(value)
    }, duration + 400)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(watchdog)
    }
  }, [inView, value, duration, reduced])

  const formatted = display.toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
