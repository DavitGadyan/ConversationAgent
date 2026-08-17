'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { QuoteForm } from '@/components/quote-form/quote-form'
import { FacilityVisual } from '@/components/ui/facility-visual'
import { useSegment } from '@/components/segment/segment-provider'
import { segments, segmentHeadline } from '@/content/segments'
import { cn } from '@/lib/utils'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

const PROOF_POINTS = [
  'No lock-in contract',
  'Price-lock guarantee',
  '24/7 monitored',
  'Pickup & delivery available',
]

/**
 * Hero.
 *
 * The form is above the fold on every viewport, which is what the client asked
 * for and what the traffic needs. On desktop it sits right of the copy; on
 * mobile it follows immediately after the headline, ahead of the visual — a
 * pretty picture is not worth pushing the CTA below the fold on a phone.
 *
 * The segment chips are the mechanism that lets this one page replace nine
 * vehicle-specific pages without diluting the message for any of them.
 */
export function Hero() {
  const { segment, setSegment } = useSegment()

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-8 md:pb-24 md:pt-12">
      {/* Soft radial wash — depth without a heavy background image. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-70"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 40%, rgb(230 241 253 / 0.9) 0%, rgb(244 244 244 / 0) 100%)',
        }}
      />

      <div className="container-page relative">
        {/* Segment chips */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mb-8 flex flex-wrap gap-2"
          role="group"
          aria-label="What are you storing?"
        >
          {segments.map((s) => {
            const active = s.id === segment.id
            return (
              <motion.button
                key={s.id}
                variants={fadeUp}
                type="button"
                onClick={() => setSegment(s.id)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium',
                  'transition-all duration-200 ease-[var(--ease-out-soft)]',
                  active
                    ? 'border-transparent bg-highlight text-ink shadow-[var(--shadow-soft)]'
                    : 'border-line bg-card text-muted hover:border-ink/20 hover:text-ink',
                )}
              >
                <span aria-hidden>{s.emoji}</span>
                {s.label}
                {active && <Check size={14} aria-hidden />}
              </motion.button>
            )
          })}
        </motion.div>

        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_minmax(380px,0.95fr)] lg:gap-14">
          {/* Copy — order-1 on mobile so the headline reads first */}
          <div className="order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="display-xl text-ink">{segmentHeadline(segment)}</h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                  {segment.subheadline}
                </p>
                <p className="mt-3 max-w-xl text-[15px] font-medium text-ink-soft">
                  {segment.painPoint}
                </p>
              </motion.div>
            </AnimatePresence>

            <motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-7 grid gap-2.5 sm:grid-cols-2"
            >
              {PROOF_POINTS.map((point) => (
                <motion.li
                  key={point}
                  variants={fadeUp}
                  className="flex items-center gap-2.5 text-[15px] text-ink-soft"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-tile-mint">
                    <Check size={12} strokeWidth={3} className="text-[#1B7A55]" aria-hidden />
                  </span>
                  {point}
                </motion.li>
              ))}
            </motion.ul>

            {/* Visual sits below the copy on mobile, so it never displaces the form. */}
            <div className="mt-12 hidden lg:mt-14 lg:block">
              <FacilityVisual />
            </div>
          </div>

          {/* Form — order-2 on mobile, still within the first screen-and-a-bit */}
          <div className="order-2 lg:sticky lg:top-24">
            <QuoteForm />
          </div>

          <div className="order-3 mt-4 lg:hidden">
            <FacilityVisual />
          </div>
        </div>
      </div>
    </section>
  )
}
