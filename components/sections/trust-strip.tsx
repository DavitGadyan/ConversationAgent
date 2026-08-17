'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, KeyRound, LockKeyhole, ShieldCheck, Unlock, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { trustPoints } from '@/content/trust'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

const ICONS: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  key: KeyRound,
  user: UserRound,
  calendar: CalendarCheck,
  unlock: Unlock,
  'lock-price': LockKeyhole,
}

/**
 * Trust strip.
 *
 * Placed immediately below the fold, directly under the form, because that is
 * where the objection lives: "am I handing my $60,000 caravan to someone
 * reliable?" On the current site these same facts are true but sit in body copy
 * several screens away from the enquiry, which is the same as not saying them.
 */
export function TrustStrip() {
  return (
    <section aria-label="Why our facility is secure" className="border-y border-line bg-card">
      <div className="container-page py-10 md:py-12">
        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
        >
          {trustPoints.map((point) => {
            const Icon = ICONS[point.icon] ?? ShieldCheck
            return (
              <motion.li key={point.id} variants={fadeUp} className="flex gap-3.5">
                <Icon size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden />
                <div>
                  <p className="text-[15px] font-semibold text-ink">{point.label}</p>
                  <p className="mt-0.5 text-sm leading-snug text-muted">{point.detail}</p>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
