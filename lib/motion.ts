import type { Variants, Transition } from 'framer-motion'

/**
 * Shared motion vocabulary.
 *
 * The brief calls for emotional design and animation, but motion on a lead-gen
 * page has one job: draw the eye toward the next commitment. Everything here is
 * short, soft and single-direction. Nothing bounces the form around while
 * someone is typing their phone number into it.
 *
 * Framer Motion respects `prefers-reduced-motion` via <MotionConfig reducedMotion="user">
 * in app/providers.tsx, and globals.css neutralises CSS animations for the same users.
 */

export const easeOutSoft = [0.22, 1, 0.36, 1] as const

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 0.9,
}

/** Section entrance: content rises a little as it fades in. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOutSoft },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: easeOutSoft } },
}

/** Parent that walks its children in one after another. */
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

/** Scale-in for cards and tiles that should feel like they land. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springSoft,
  },
}

/** Multi-step form: steps slide horizontally in the direction of travel. */
export const stepSlide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: easeOutSoft } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -32 : 32,
    transition: { duration: 0.22, ease: easeOutSoft },
  }),
}

/** Standard viewport trigger — fires once, slightly before the element is fully in view. */
export const viewportOnce = { once: true, amount: 0.25 } as const
