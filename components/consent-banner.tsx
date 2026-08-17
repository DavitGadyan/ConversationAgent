'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { getConsent, setConsent } from '@/lib/monitoring/analytics'

/**
 * Consent banner.
 *
 * Only shown when a third-party pixel is actually configured. A consent prompt
 * on a page that sets no third-party cookies is pure conversion friction with no
 * legal benefit — so if GA and Meta are not wired up, this renders nothing.
 *
 * Declining does not blind the funnel: first-party events still flow to
 * /api/events, which sets no cross-site identifier and needs no consent. That is
 * why the CRO data stays trustworthy either way.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  const hasThirdParty = Boolean(
    process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID,
  )

  useEffect(() => {
    if (!hasThirdParty) return
    // Delay slightly so it never competes with the hero for first impression.
    const timer = setTimeout(() => setVisible(getConsent() === 'unknown'), 1200)
    return () => clearTimeout(timer)
  }, [hasThirdParty])

  if (!hasThirdParty) return null

  const decide = (state: 'granted' | 'denied') => {
    setConsent(state)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed bottom-4 left-4 z-50 hidden max-w-sm rounded-[24px] bg-card p-5 shadow-[var(--shadow-float)] md:block"
        >
          <p className="text-[14px] leading-relaxed text-ink-soft">
            We use cookies to measure our advertising. Decline and the site works exactly the same —
            we simply will not know which ad brought you here.
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => decide('granted')} className="flex-1">
              Accept
            </Button>
            <Button size="sm" variant="secondary" onClick={() => decide('denied')} className="flex-1">
              Decline
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
