'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Ruler } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { Button } from '@/components/ui/button'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { useSegment } from '@/components/segment/segment-provider'
import { annualCost, coverings, fittingBays, recommendBay } from '@/content/pricing'
import { needsWideBay } from '@/lib/schema/quote'
import { formatMoney, cn } from '@/lib/utils'
import { track } from '@/lib/monitoring/analytics'
import { fadeUp, springSoft, stagger, viewportOnce } from '@/lib/motion'

/**
 * Size & price finder — the biggest single CRO change on this page.
 *
 * The live site presents six bay sizes and four covering types as two raw
 * tables, and leaves the visitor to work out which row is theirs. That is
 * homework, delivered at the exact moment they are deciding whether to bother.
 *
 * Same data, one question instead: "how long is it?" Drag the slider, get your
 * bay and your price. The recommendation carries the yellow highlight from the
 * reference; alternatives stay visible underneath so the price/access trade-off
 * is legible rather than hidden.
 */
export function SizeFinder() {
  const { segment } = useSegment()
  const [length, setLength] = useState(segment.typicalLengthMetres)
  const [touched, setTouched] = useState(false)

  // Follow the hero chips until the visitor takes control of the slider.
  useEffect(() => {
    if (!touched) setLength(segment.typicalLengthMetres)
  }, [segment, touched])

  const wide = needsWideBay(segment.formValue)
  const best = useMemo(() => recommendBay(length, wide), [length, wide])
  const options = useMemo(() => fittingBays(length, wide), [length, wide])

  useEffect(() => {
    if (!touched) return
    const timer = setTimeout(
      () => track({ name: 'size_finder_used', lengthMetres: length, bayId: best?.id ?? null }),
      600,
    )
    return () => clearTimeout(timer)
  }, [length, best, touched])

  return (
    <Section
      id="pricing"
      label="Pricing"
      title="Find your bay and your price"
      intro="Drag the slider to your vehicle's length. We will show you the cheapest bay that actually fits."
      tone="card"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        {/* Control */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="rounded-[28px] border border-line p-6 sm:p-7">
            <label htmlFor="length-slider" className="flex items-center gap-2 text-sm font-medium text-ink-soft">
              <Ruler size={16} aria-hidden />
              How long is your {segment.noun}?
            </label>

            <p className="mt-4 font-[family-name:var(--font-display)] text-6xl font-medium tracking-[-0.04em] text-ink">
              {length.toFixed(1)}
              <span className="text-2xl font-normal text-muted">m</span>
            </p>

            <input
              id="length-slider"
              type="range"
              min={3}
              max={13}
              step={0.1}
              value={length}
              onChange={(e) => {
                setTouched(true)
                setLength(Number(e.target.value))
              }}
              aria-valuetext={`${length.toFixed(1)} metres`}
              className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-sunken accent-ink
                [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink
                [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(11,11,12,0.3)]
                [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink"
            />

            <div className="mt-2 flex justify-between text-[13px] text-faint">
              <span>3m</span>
              <span>13m</span>
            </div>

            <p className="mt-5 text-[13px] leading-relaxed text-muted">
              Measure the whole thing, including the drawbar or tow hitch. Not sure? Give us your
              best guess — we confirm it on the call.
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <div>
          <AnimatePresence mode="popLayout">
            {best ? (
              <motion.div
                key={best.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={springSoft}
                className="rounded-[28px] bg-highlight p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Best fit
                  </span>
                  <span className="rounded-full bg-ink/10 px-3 py-1 text-[11px] font-medium text-ink">
                    {best.dimensions}
                  </span>
                </div>

                <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.03em] text-ink">
                  {best.name}
                </h3>

                <p className="mt-3 font-[family-name:var(--font-display)] text-5xl font-medium tracking-[-0.04em] text-ink">
                  <AnimatedNumber
                    value={best.weeklyPrice}
                    prefix="$"
                    decimals={best.weeklyPrice % 1 === 0 ? 0 : 2}
                    duration={500}
                  />
                  <span className="text-xl font-normal text-ink/60"> /week</span>
                </p>

                <dl className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-2">
                  {[
                    ['Access', best.access],
                    ['Privacy', `${best.privacy} bay`],
                    ['Billing', best.billing],
                    ['Per year', `about ${formatMoney(annualCost(best.weeklyPrice))}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[12px] uppercase tracking-wider text-ink/70">{label}</dt>
                      <dd className="mt-0.5 text-[15px] font-medium text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>

                {best.note && (
                  <p className="mt-4 rounded-2xl bg-ink/5 p-3 text-[13px] leading-snug text-ink/80">
                    {best.note}
                  </p>
                )}

                <Button asChild size="lg" className="mt-5 w-full">
                  <a href="#quote-form">
                    Reserve this bay — no deposit
                    <ArrowRight size={18} aria-hidden />
                  </a>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-[28px] border border-line p-7"
              >
                <h3 className="text-xl font-semibold text-ink">Bigger than our standard bays</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Our largest standard bay takes 11.5m. Anything longer is worth a conversation —
                  we can usually still help.
                </p>
                <Button asChild variant="secondary" className="mt-5">
                  <a href="tel:+61736085993">Call 07 3608 5993</a>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alternatives */}
          {options.length > 1 && (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-4 space-y-2"
            >
              <p className="px-1 text-[13px] font-medium text-muted">
                Other bays that fit your {length.toFixed(1)}m {segment.noun}
              </p>
              {options
                .filter((bay) => bay.id !== best?.id)
                .map((bay) => (
                  <motion.div
                    key={bay.id}
                    variants={fadeUp}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-line px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink">{bay.name}</p>
                      <p className="truncate text-[13px] text-muted">
                        {bay.dimensions} · {bay.access}
                      </p>
                    </div>
                    <p className="shrink-0 text-[15px] font-semibold text-ink">
                      {formatMoney(bay.weeklyPrice)}
                      <span className="font-normal text-muted">/wk</span>
                    </p>
                  </motion.div>
                ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Covering upgrades — kept as a separate axis, because that is what they are. */}
      <div className="mt-12">
        <p className="mb-4 text-center text-[15px] font-medium text-ink">
          Want more protection? Covering options
        </p>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {coverings.map((covering) => (
            <motion.div
              key={covering.id}
              variants={fadeUp}
              className={cn(
                'rounded-[20px] border p-5',
                covering.waitlist ? 'border-dashed border-line' : 'border-line',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[15px] font-semibold text-ink">{covering.name}</h4>
                {covering.waitlist && (
                  <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                    Waitlist
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-medium tracking-[-0.02em] text-ink">
                {formatMoney(covering.weeklyPrice)}
                <span className="text-sm font-normal text-muted">/wk</span>
              </p>
              <p className="mt-2 text-[13px] leading-snug text-muted">{covering.description}</p>
            </motion.div>
          ))}
        </motion.div>
        <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[13px] text-faint">
          <Check size={14} className="mt-0.5 shrink-0" aria-hidden />
          All rates include 24/7 CCTV, PIN entry and no lock-in contract.
        </p>
      </div>
    </Section>
  )
}
