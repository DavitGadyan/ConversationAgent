'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

/**
 * The section shell used by every block on the page.
 *
 * Mirrors the reference's rhythm exactly: a small pill label, then an oversized
 * tight-tracked headline, then a muted sub-line, then the content — all rising
 * gently into view. Consistency here is what makes a long page feel designed
 * rather than assembled.
 */

export function Section({
  id,
  label,
  title,
  intro,
  children,
  className,
  align = 'center',
  tone = 'canvas',
}: {
  id?: string
  label?: string
  title?: React.ReactNode
  intro?: React.ReactNode
  children?: React.ReactNode
  className?: string
  align?: 'center' | 'left'
  tone?: 'canvas' | 'card'
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-16 md:py-24 lg:py-28',
        tone === 'card' && 'bg-card',
        className,
      )}
    >
      <div className="container-page">
        {(label || title || intro) && (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className={cn(
              'mb-10 md:mb-14',
              align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
            )}
          >
            {label && (
              <motion.p variants={fadeUp} className="mb-5">
                <span className="pill-label">{label}</span>
              </motion.p>
            )}
            {title && (
              <motion.h2 variants={fadeUp} className="display-lg text-ink">
                {title}
              </motion.h2>
            )}
            {intro && (
              <motion.p
                variants={fadeUp}
                className="mt-4 text-base leading-relaxed text-muted md:text-lg"
              >
                {intro}
              </motion.p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  )
}

/** Convenience wrapper for one-off reveals outside a Section. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
