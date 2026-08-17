'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowRight, Phone } from 'lucide-react'
import { site } from '@/content/site'
import { track } from '@/lib/monitoring/analytics'

/**
 * Sticky mobile action bar.
 *
 * On a phone the hero form scrolls away within a screen or two, and from that
 * point the page has no CTA in view until the visitor reaches the bottom. This
 * keeps both actions permanently reachable with a thumb.
 *
 * It appears only after the visitor has scrolled past the hero — showing it
 * immediately would just cover the form it is meant to lead back to.
 */
export function MobileBar() {
  const [visible, setVisible] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => setVisible(y > 700))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur-lg md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center gap-2 p-3">
            <a
              href={site.phone.href}
              onClick={() => track({ name: 'call_clicked', placement: 'mobile-bar' })}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line text-[15px] font-medium text-ink"
            >
              <Phone size={17} aria-hidden />
              Call us
            </a>
            <a
              href="#quote-form"
              className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-white"
            >
              Get my quote
              <ArrowRight size={17} aria-hidden />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
