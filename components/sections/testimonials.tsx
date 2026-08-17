'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Stars } from '@/components/ui/stars'
import { testimonials } from '@/content/trust'
import { site } from '@/content/site'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

/**
 * Testimonials.
 *
 * These are the client's real reviews, kept verbatim. Two changes from the live
 * site: the aggregate rating and its source are stated up front (an unattributed
 * five stars is worth very little), and each quote carries the specific service
 * it relates to, so a boat owner can find someone like themselves.
 *
 * The same quotes feed the Review schema in lib/seo/jsonld.ts, so the stars can
 * appear in search results too.
 */
export function Testimonials() {
  return (
    <Section
      id="reviews"
      label="Reviews"
      title="What customers say"
      intro={
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <Stars rating={site.rating.value} size={16} />
          <span>
            {site.rating.value.toFixed(1)} from {site.rating.count} reviews on {site.rating.source}
          </span>
        </span>
      }
      tone="card"
    >
      <motion.ul
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="grid gap-5 md:grid-cols-3"
      >
        {testimonials.map((testimonial, i) => (
          <motion.li
            key={testimonial.id}
            variants={fadeUp}
            className="relative flex flex-col rounded-[28px] border border-line p-6"
          >
            <Quote
              size={28}
              aria-hidden
              className="absolute right-5 top-5 text-line"
              strokeWidth={1.5}
            />
            <Stars rating={testimonial.rating} size={15} />
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-soft">
              “{testimonial.quote}”
            </blockquote>
            <footer className="mt-5 flex items-center gap-3 border-t border-line pt-4">
              <span
                aria-hidden
                className={`grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
                  ['bg-tile-lavender text-[#4B4FA6]', 'bg-tile-peach text-[#B4552A]', 'bg-tile-mint text-[#1B7A55]'][i % 3]
                }`}
              >
                {testimonial.author.slice(0, 1)}
              </span>
              <div>
                <cite className="not-italic text-[14px] font-semibold text-ink">
                  {testimonial.author}
                </cite>
                <p className="text-[13px] text-muted">{testimonial.detail}</p>
              </div>
            </footer>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  )
}
