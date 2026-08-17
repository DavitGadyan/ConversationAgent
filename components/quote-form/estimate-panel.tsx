'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingDown } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { annualCost, type Bay } from '@/content/pricing'
import { COMPETITOR_MONTHLY } from '@/content/site'
import { formatMoney } from '@/lib/utils'
import { springSoft } from '@/lib/motion'

/**
 * The live price estimate.
 *
 * This is the reward mechanic that makes a long form finish. The moment the
 * visitor enters a length in step 1, a real bay and a real weekly price appear —
 * so the remaining questions feel like they are refining an answer they already
 * have, rather than tolls on the way to one.
 *
 * The yellow highlight from the reference is spent here, on the single most
 * persuasive element on the page.
 */
export function EstimatePanel({
  bay,
  cheaper,
  lengthMetres,
}: {
  bay: Bay | null
  /** The absolute cheapest fitting bay, when it differs by trading away access. */
  cheaper?: Bay | null
  lengthMetres: number
}) {
  return (
    <AnimatePresence mode="wait">
      {bay ? (
        <motion.div
          key={bay.id}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={springSoft}
          className="rounded-[18px] bg-highlight p-4"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink/70">
                <Sparkles size={14} aria-hidden />
                Your estimated rate
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-medium tracking-[-0.03em] text-ink">
                <AnimatedNumber
                  value={bay.weeklyPrice}
                  prefix="$"
                  decimals={bay.weeklyPrice % 1 === 0 ? 0 : 2}
                  duration={600}
                />
                <span className="text-lg font-normal text-ink/60"> /week</span>
              </p>
            </div>
            <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-medium text-ink">
              {bay.dimensions}
            </span>
          </div>

          <p className="mt-2 text-[13px] leading-snug text-ink/75">
            {bay.name} · {bay.access}. Fits up to {bay.fitsUpToMetres}m.
          </p>

          {/* If a cheaper bay exists but trades away access, say so here rather
              than quoting it as the headline price. See recommendBay(). */}
          {cheaper && cheaper.id !== bay.id && (
            <p className="mt-2 rounded-xl bg-ink/5 p-2 text-[12px] leading-snug text-ink/70">
              Rarely need access? A {cheaper.dimensions} bay is {formatMoney(cheaper.weeklyPrice)}
              /week — {cheaper.access.toLowerCase()}.
            </p>
          )}

          <div className="mt-3 flex items-center gap-1.5 border-t border-ink/10 pt-2.5 text-[13px] text-ink/75">
            <TrendingDown size={14} aria-hidden className="shrink-0" />
            <span>
              About {formatMoney(annualCost(bay.weeklyPrice))} a year — roughly{' '}
              {formatMoney(
                Math.max(0, COMPETITOR_MONTHLY.min * 12 - annualCost(bay.weeklyPrice)),
              )}{' '}
              less than typical self-storage.
            </span>
          </div>
        </motion.div>
      ) : lengthMetres > 0 ? (
        <motion.div
          key="oversize"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-[18px] border border-line bg-sunken/60 p-4 text-sm text-ink-soft"
          aria-live="polite"
        >
          <p className="font-medium text-ink">That is a big one.</p>
          <p className="mt-1 leading-snug text-muted">
            Our standard bays go to 12m. Finish the form and we will sort something out — we
            almost always can.
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
