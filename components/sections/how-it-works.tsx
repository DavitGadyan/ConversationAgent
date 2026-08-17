'use client'

import { motion } from 'framer-motion'
import { ClipboardList, PhoneCall, Truck } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Sticker } from '@/components/ui/sticker'
import { howItWorks } from '@/content/trust'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

const STEP_ICONS = [ClipboardList, PhoneCall, Truck] as const
const STEP_TONES = ['violet', 'blue', 'green'] as const

/**
 * How it works.
 *
 * Three steps, and the third one ends with the customer's van already stored.
 * The purpose is to shrink the perceived distance between "I filled in a form"
 * and "this is sorted" — uncertainty about what happens next is a real reason
 * people abandon a quote form on a considered purchase like this.
 */
export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      label="How it works"
      title="Sorted in three steps"
      intro="No site visit required, no deposit, and a real person on the other end of the phone."
    >
      <motion.ol
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="relative grid gap-6 md:grid-cols-3 md:gap-5"
      >
        {/* Connecting line, desktop only — the visual spine of the timeline. */}
        <span
          aria-hidden
          className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent md:block"
        />

        {howItWorks.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? ClipboardList
          return (
            <motion.li key={step.step} variants={fadeUp} className="relative">
              <div className="card-surface h-full p-6">
                <div className="flex items-center gap-3">
                  <Sticker icon={Icon} tone={STEP_TONES[i] ?? 'blue'} size="md" tilt={i % 2 ? 6 : -6} />
                  <span className="text-[13px] font-semibold uppercase tracking-wider text-faint">
                    Step {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
              </div>
            </motion.li>
          )
        })}
      </motion.ol>
    </Section>
  )
}
