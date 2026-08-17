'use client'

import { CheckCircle2 } from 'lucide-react'
import { Sticker } from './sticker'

/**
 * Client-side wrapper for the confirmation sticker.
 *
 * Lucide icons are React components, and a React component cannot cross the
 * server → client boundary as a prop. Rather than degrade Sticker's API to
 * icon-name strings everywhere, the handful of server components that need a
 * sticker use a small named wrapper like this one.
 */
export function SuccessBadge() {
  return <Sticker icon={CheckCircle2} tone="green" size="lg" tilt={-6} float />
}
