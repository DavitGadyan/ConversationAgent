'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, PiggyBank } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { useSegment } from '@/components/segment/segment-provider'
import { annualCost, recommendBay } from '@/content/pricing'
import { COMPETITOR_MONTHLY } from '@/content/site'
import { needsWideBay } from '@/lib/schema/quote'
import { formatMoney } from '@/lib/utils'
import { track } from '@/lib/monitoring/analytics'
import { fadeUp, viewportOnce } from '@/lib/motion'

/**
 * Savings calculator.
 *
 * The rational argument and the emotional one, in the same number. "$36 a week"
 * is a price; "$1,140 a year back in your pocket" is a holiday. The client's own
 * testimonial already makes this point — a customer who saved nearly $1,000 —
 * so the page should let every visitor compute their own version of it.
 *
 * The comparison figure is the client's published competitor range
 * ($250–$300/month), and the page says so rather than hiding the basis of the
 * claim. An unsourced savings number invites doubt about everything near it.
 */
export function Savings() {
  const { segment } = useSegment()
  const [competitorMonthly, setCompetitorMonthly] = useState<number>(COMPETITOR_MONTHLY.min)

  const bay = useMemo(
    () => recommendBay(segment.typicalLengthMetres, needsWideBay(segment.formValue)),
    [segment],
  )

  const ourAnnual = bay ? annualCost(bay.weeklyPrice) : 0
  const theirAnnual = competitorMonthly * 12
  const saving = Math.max(0, theirAnnual - ourAnnual)

  useEffect(() => {
    const timer = setTimeout(() => track({ name: 'savings_calculated', annualSaving: saving }), 800)
    return () => clearTimeout(timer)
  }, [saving])

  return (
    <Section
      id="savings"
      label="Your savings"
      title="What you would save in a year"
      intro="Set what you pay now — or what you have been quoted — and see the difference."
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mx-auto max-w-3xl"
      >
        <div className="card-surface overflow-hidden">
          <div className="grid sm:grid-cols-2">
            {/* Input side */}
            <div className="border-b border-line p-6 sm:border-b-0 sm:border-r sm:p-8">
              <label
                htmlFor="competitor-price"
                className="block text-sm font-medium text-ink-soft"
              >
                What you pay now, per month
              </label>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium tracking-[-0.03em] text-ink">
                {formatMoney(competitorMonthly)}
              </p>
              <input
                id="competitor-price"
                type="range"
                min={80}
                max={450}
                step={10}
                value={competitorMonthly}
                onChange={(e) => setCompetitorMonthly(Number(e.target.value))}
                aria-valuetext={`${formatMoney(competitorMonthly)} per month`}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-sunken
                  [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink
                  [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(11,11,12,0.3)]
                  [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink"
              />
              <p className="mt-3 text-[13px] leading-snug text-muted">
                Typical self-storage in South-East Queensland runs{' '}
                {formatMoney(COMPETITOR_MONTHLY.min)}–{formatMoney(COMPETITOR_MONTHLY.max)} a month.
              </p>
            </div>

            {/* Result side */}
            <div className="bg-highlight p-6 sm:p-8">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink/70">
                <PiggyBank size={15} aria-hidden />
                You would save, per year
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-medium tracking-[-0.04em] text-ink">
                <AnimatedNumber value={saving} prefix="$" duration={800} />
              </p>

              <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-[14px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/75">Your {segment.noun} with us</dt>
                  <dd className="font-medium text-ink">{formatMoney(ourAnnual)}/yr</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/75">What you pay now</dt>
                  <dd className="font-medium text-ink">{formatMoney(theirAnnual)}/yr</dd>
                </div>
              </dl>

              <Button asChild size="lg" className="mt-6 w-full">
                <a href="#quote-form">
                  Start saving
                  <ArrowRight size={18} aria-hidden />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
          Based on our published rate for a {bay?.dimensions ?? 'standard'} bay suiting a typical{' '}
          {segment.noun}, against the monthly figure you set above. Your exact rate is confirmed on
          the call.
        </p>
      </motion.div>
    </Section>
  )
}
