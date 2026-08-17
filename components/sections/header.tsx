'use client'

import { useState } from 'react'
import { Phone, Warehouse } from 'lucide-react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { site } from '@/content/site'
import { formatDate } from '@/lib/utils'
import { track } from '@/lib/monitoring/analytics'
import { cn } from '@/lib/utils'

/**
 * Header.
 *
 * DELIBERATELY HAS NO SITE NAVIGATION.
 *
 * The current homepage carries a full nav — What We Do (nine vehicle
 * sub-pages), Service Areas (five), Contact (three). That is around twenty ways
 * to leave a page you are paying for every click on. A paid landing page has one
 * job, and every link that is not the phone number or the form works against it.
 *
 * What remains: the brand, one tracked phone number, and one CTA.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <>
      {/* Availability strip — genuine scarcity, dated so it stays honest. */}
      <div className="bg-ink px-4 py-2 text-center text-[13px] text-white/85">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5FE08A] opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#5FE08A]" />
          </span>
          Spaces available as of {formatDate(site.availabilityDate)} · {site.hours.label}
        </span>
      </div>

      <motion.header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'bg-canvas/85 backdrop-blur-lg' : 'bg-transparent',
        )}
      >
        <div
          className={cn(
            'container-page flex items-center justify-between gap-4 transition-all duration-300',
            scrolled ? 'h-16' : 'h-20',
          )}
        >
          <a href="#top" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
            <span className="grid size-9 place-items-center rounded-[11px] bg-ink text-white">
              <Warehouse size={18} aria-hidden />
            </span>
            <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-[-0.02em] text-ink">
              Caravan Concierge
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={site.phone.href}
              onClick={() => track({ name: 'call_clicked', placement: 'header' })}
              className="hidden items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-card sm:inline-flex"
            >
              <Phone size={16} aria-hidden />
              {site.phone.display}
            </a>
            <Button asChild size="sm" className="sm:h-12 sm:px-6 sm:text-[15px]">
              <a href="#quote-form">Get my quote</a>
            </Button>
          </div>
        </div>
      </motion.header>
    </>
  )
}
