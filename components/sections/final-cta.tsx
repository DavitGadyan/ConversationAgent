'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sticker } from '@/components/ui/sticker'
import { ShieldCheck } from 'lucide-react'
import { site } from '@/content/site'
import { formatDate } from '@/lib/utils'
import { track } from '@/lib/monitoring/analytics'
import { fadeUp, viewportOnce } from '@/lib/motion'

/**
 * Closing CTA.
 *
 * Two ways out, because the two ways in are different people: the researcher
 * fills in the form, the ready buyer wants to talk to someone now. Forcing both
 * down one path loses one of them.
 *
 * The risk reversal sits directly on the button, not in a paragraph above it —
 * the objection arrives at the moment of clicking, so the answer has to be there
 * too.
 */
export function FinalCta() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-page">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative overflow-hidden rounded-[40px] bg-ink px-6 py-14 text-center text-white sm:px-12 md:py-20"
        >
          {/* Warm glow, so the dark block does not read as a dead end. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-32 h-80 opacity-40"
            style={{
              background:
                'radial-gradient(50% 60% at 50% 50%, rgb(251 239 126 / 0.5) 0%, rgb(11 11 12 / 0) 100%)',
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            <div className="mb-7 flex justify-center">
              <Sticker icon={ShieldCheck} tone="green" size="lg" tilt={-6} float />
            </div>

            <h2 className="display-lg">Get it stored, sorted and off your mind</h2>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Tell us what you have and we will confirm your bay and your exact weekly rate —
              usually the same business day.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="highlight" size="lg" className="w-full sm:w-auto">
                <a href="#quote-form">
                  Get my quote
                  <ArrowRight size={18} aria-hidden />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
              >
                <a
                  href={site.phone.href}
                  onClick={() => track({ name: 'call_clicked', placement: 'final-cta' })}
                >
                  <Phone size={18} aria-hidden />
                  {site.phone.display}
                </a>
              </Button>
            </div>

            <p className="mt-6 text-[14px] text-white/55">
              No deposit · No lock-in contract · Spaces available as of{' '}
              {formatDate(site.availabilityDate)}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
