/**
 * Performance budgets, shared by the client collector, the server dashboard and
 * Lighthouse CI so lab and field agree on what "good" means.
 *
 * Deliberately tighter than Google's "good" thresholds. This page exists to
 * convert paid traffic; "not penalised by Core Web Vitals" is a much lower bar
 * than "fast enough that nobody leaves". For reference, the current site
 * measures a ~3.0s TTFB and ~6.0s FCP.
 *
 * Kept in its own module (no 'use client') so a server component can read it
 * without dragging the web-vitals collector across the boundary.
 */
export const BUDGETS = {
  /** Largest contentful paint — the hero headline and form. */
  LCP: 2000,
  /** Interaction to next paint — form fields must feel instant. */
  INP: 200,
  /** Cumulative layout shift — a form that jumps loses submissions. */
  CLS: 0.05,
  /** First contentful paint. */
  FCP: 1500,
  /** Time to first byte. */
  TTFB: 600,
} as const

export type VitalName = keyof typeof BUDGETS

export function rateVital(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const budget = BUDGETS[name as VitalName]
  if (budget === undefined) return 'good'
  if (value <= budget) return 'good'
  if (value <= budget * 1.6) return 'needs-improvement'
  return 'poor'
}
