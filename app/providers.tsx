'use client'

import { MotionConfig } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { initVitals } from '@/lib/monitoring/vitals'

/**
 * Client-side providers.
 *
 * `reducedMotion="user"` is the important line: every Framer Motion animation in
 * the app collapses to an instant state change for anyone who has asked their OS
 * for less motion. Combined with the media query in globals.css, the whole page
 * is motion-safe without any component having to think about it.
 */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initVitals()
  }, [])

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.4 }}>
      {children}
    </MotionConfig>
  )
}
