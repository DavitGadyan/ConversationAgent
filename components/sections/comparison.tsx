'use client'

import { motion } from 'framer-motion'
import { Check, Minus } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { comparison } from '@/content/trust'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

/**
 * Head-to-head comparison.
 *
 * The client's own competitor table, restructured. On the live site it is a wide
 * HTML table that collapses badly on a phone — where most paid traffic actually
 * lands. Here each row is a self-contained card on mobile and a clean two-column
 * grid on desktop, so the comparison survives the device it is read on.
 */
export function Comparison() {
  return (
    <Section
      id="comparison"
      label="Compare"
      title="How we stack up against self-storage"
      intro="Same job, very different deal."
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-line bg-card"
      >
        {/* Column headers — desktop only; the mobile cards label themselves. */}
        <div className="hidden grid-cols-[1.1fr_1fr_1fr] gap-4 border-b border-line px-6 py-4 md:grid">
          <span className="text-[13px] font-medium uppercase tracking-wider text-faint">
            Factor
          </span>
          <span className="text-[13px] font-semibold text-ink">Caravan Concierge</span>
          <span className="text-[13px] font-medium text-muted">Typical self-storage</span>
        </div>

        {comparison.map((row, i) => (
          <motion.div
            key={row.factor}
            variants={fadeUp}
            className={`px-6 py-5 md:grid md:grid-cols-[1.1fr_1fr_1fr] md:items-center md:gap-4 md:py-4 ${
              i > 0 ? 'border-t border-line' : ''
            }`}
          >
            <p className="text-[13px] font-medium uppercase tracking-wider text-faint md:text-[15px] md:normal-case md:tracking-normal md:text-ink-soft">
              {row.factor}
            </p>

            <div className="mt-2 flex items-start gap-2 md:mt-0">
              <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-tile-mint md:mt-0">
                <Check size={11} strokeWidth={3} className="text-[#1B7A55]" aria-hidden />
              </span>
              <span className="text-[15px] font-medium text-ink">
                {row.us}
                <span className="sr-only"> — Caravan Concierge</span>
              </span>
            </div>

            <div className="mt-1.5 flex items-start gap-2 md:mt-0">
              <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-sunken">
                <Minus size={11} strokeWidth={3} className="text-faint" aria-hidden />
              </span>
              <span className="text-[15px] text-muted">
                {row.them}
                <span className="sr-only"> — typical self-storage</span>
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}
