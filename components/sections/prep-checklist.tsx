'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

const ITEMS = [
  { id: 'empty', text: 'Empty the fridge and food cupboards — nothing that attracts pests' },
  { id: 'gas', text: 'Turn off and disconnect the gas bottles' },
  { id: 'battery', text: 'Charge the battery, or ask us about a power connection' },
  { id: 'tyres', text: 'Check tyre pressures before the tow in' },
  { id: 'water', text: 'Drain the water tanks and the hot water system' },
  { id: 'valuables', text: 'Take out anything valuable or sentimental' },
  { id: 'rego', text: 'Make sure registration and insurance are current' },
  { id: 'photos', text: 'Photograph the van as it goes in, for your own records' },
]

const STORAGE_KEY = 'cc_prep_checklist'

/**
 * Pre-storage checklist.
 *
 * Genuinely useful, and doing a job beyond usefulness: it gives the customer
 * something to *do* in the gap between enquiring and being called. A customer
 * who has drained their water tanks has already decided they are storing with
 * you.
 *
 * State persists to localStorage, so it survives the tab closing and is still
 * there the evening before drop-off.
 */
export function PrepChecklist() {
  const [checked, setChecked] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setChecked(JSON.parse(raw) as string[])
    } catch {
      /* ignore */
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked))
    } catch {
      /* ignore */
    }
  }, [checked, loaded])

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const done = checked.length
  const pct = Math.round((done / ITEMS.length) * 100)

  return (
    <section className="card-surface p-7 sm:p-8" aria-labelledby="prep-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="prep-heading"
            className="font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.02em] text-ink"
          >
            Getting it ready for storage
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            Worth doing before you drop it off. Ticks are saved on this device.
          </p>
        </div>
        <p className="text-[14px] font-medium text-muted" role="status" aria-live="polite">
          {done} of {ITEMS.length} done
        </p>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunken">
        <motion.div
          className="h-full rounded-full bg-highlight"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <motion.ul
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-6 grid gap-2 sm:grid-cols-2"
      >
        {ITEMS.map((item) => {
          const isChecked = checked.includes(item.id)
          return (
            <motion.li key={item.id} variants={fadeUp}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-[16px] border p-3.5 transition-colors',
                  isChecked ? 'border-transparent bg-highlight-soft' : 'border-line hover:bg-sunken/50',
                )}
              >
                <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(item.id)}
                    className="peer size-5 cursor-pointer appearance-none rounded-md border border-line bg-card checked:border-ink checked:bg-ink"
                  />
                  <Check
                    size={13}
                    strokeWidth={3}
                    aria-hidden
                    className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
                  />
                </span>
                <span
                  className={cn(
                    'text-[14px] leading-snug transition-colors',
                    isChecked ? 'text-muted line-through' : 'text-ink-soft',
                  )}
                >
                  {item.text}
                </span>
              </label>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}
