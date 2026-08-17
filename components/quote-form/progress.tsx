'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEP_LABELS = ['Your vehicle', 'Your needs', 'Your details'] as const

/**
 * Step progress.
 *
 * Progress indication is not decoration on a multi-step form — it is the promise
 * that this ends. Showing "3 quick steps" up front converts better than an
 * unbounded scroll of fields, because the visitor can price the commitment
 * before making it.
 */
export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <div className="flex items-center gap-2" aria-hidden>
        {Array.from({ length: total }, (_, i) => {
          const stepNumber = i + 1
          const done = stepNumber < current
          const active = stepNumber === current

          return (
            <div key={stepNumber} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors duration-300',
                  done && 'bg-ink text-white',
                  active && 'bg-highlight text-ink ring-4 ring-highlight/30',
                  !done && !active && 'bg-sunken text-faint',
                )}
              >
                {done ? <Check size={12} strokeWidth={3} /> : stepNumber}
              </span>
              {stepNumber < total && (
                <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-sunken">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-ink"
                    initial={false}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-[13px] font-medium text-muted" role="status" aria-live="polite">
        Step {current} of {total} · {STEP_LABELS[current - 1]}
      </p>
    </div>
  )
}
