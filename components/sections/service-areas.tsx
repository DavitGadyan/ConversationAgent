'use client'

import { motion } from 'framer-motion'
import { MapPin, Truck } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Sticker } from '@/components/ui/sticker'
import { serviceAreas } from '@/content/trust'
import { addOns } from '@/content/pricing'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

/**
 * Service areas and add-on services.
 *
 * "Do you cover where I am?" is a genuine blocker for a local service, and the
 * answer should not require a visit to a separate page — the live site has five
 * of those. Add-ons sit alongside because they are the answer to "can you also
 * just handle it for me", which is the difference between a price shopper and a
 * high-value customer.
 */
export function ServiceAreas() {
  return (
    <Section
      id="areas"
      label="Coverage"
      title="Where we operate"
      intro="Storage in South-East Queensland, and pickup or delivery Australia-wide."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-3 sm:grid-cols-2"
        >
          {serviceAreas.map((area) => (
            <motion.li
              key={area.name}
              variants={fadeUp}
              className="flex items-start gap-3 rounded-[20px] border border-line bg-card p-4"
            >
              <MapPin size={18} aria-hidden className="mt-0.5 shrink-0 text-ink" />
              <div>
                <p className="text-[15px] font-semibold text-ink">{area.name}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{area.note}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="rounded-[28px] bg-ink p-6 text-white sm:p-8"
        >
          <Sticker icon={Truck} tone="amber" size="lg" tilt={-6} />
          <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.03em]">
            Do not want to tow it yourself?
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            We collect it, store it and bring it back when you are ready — anywhere in Australia,
            with 15+ years of towing behind the wheel.
          </p>

          <ul className="mt-6 space-y-3 border-t border-white/15 pt-5">
            {addOns.map((addOn) => (
              <li key={addOn.id} className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium">{addOn.name}</p>
                  <p className="text-[13px] leading-snug text-white/55">{addOn.description}</p>
                </div>
                <span className="shrink-0 text-[14px] font-semibold text-white/85">
                  {addOn.price}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </Section>
  )
}
