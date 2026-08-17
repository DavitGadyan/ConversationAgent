'use client'

import { motion } from 'framer-motion'
import { CalendarPlus, MessageSquare, PhoneCall, Truck } from 'lucide-react'
import { IconTile } from '@/components/ui/sticker'
import { Button } from '@/components/ui/button'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'
import type { TileTint } from '@/components/ui/sticker'

const STEPS: Array<{
  icon: typeof PhoneCall
  tint: TileTint
  when: string
  title: string
  body: string
}> = [
  {
    icon: MessageSquare,
    tint: 'mint',
    when: 'Right now',
    title: 'Your space is held',
    body: 'No deposit taken and no card details needed. It stays held while we talk.',
  },
  {
    icon: PhoneCall,
    tint: 'sky',
    when: 'Within one business day',
    title: 'We call to confirm',
    body: 'A real person confirms the bay that fits, your exact weekly rate and your start date. Any questions get answered then.',
  },
  {
    icon: Truck,
    tint: 'peach',
    when: 'Whenever suits you',
    title: 'Drop it off, or we collect',
    body: 'Bring it in and we will help you reverse it into the bay, or we tow it for you. You get your PIN on the day.',
  },
]

/**
 * What happens next, with timing attached to each step.
 *
 * "We'll be in touch" is what most quote forms say, and it is the moment
 * momentum dies — the customer has no idea whether to wait an hour or a week, so
 * they keep shopping. Naming the window ("within one business day") both sets
 * the expectation and commits the business to meeting it.
 */
export function OnboardingTimeline() {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.02em] text-ink">
        What happens next
      </h2>

      <motion.ol
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-6 space-y-5"
      >
        {STEPS.map((step, i) => (
          <motion.li key={step.title} variants={fadeUp} className="flex gap-4">
            <div className="flex flex-col items-center">
              <IconTile icon={step.icon} tint={step.tint} />
              {i < STEPS.length - 1 && (
                <span aria-hidden className="mt-2 w-px flex-1 bg-line" />
              )}
            </div>
            <div className="pb-2">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-faint">
                {step.when}
              </p>
              <h3 className="mt-1 text-[16px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{step.body}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      <div className="mt-6 rounded-[20px] bg-sunken/70 p-4">
        <p className="text-[14px] font-medium text-ink">Do not want to miss the call?</p>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Pop a reminder in your calendar so you know to expect us.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-3">
          <a href={calendarLink()} download="caravan-concierge-callback.ics">
            <CalendarPlus size={16} aria-hidden />
            Add a reminder
          </a>
        </Button>
      </div>
    </div>
  )
}

/**
 * Builds an .ics reminder for tomorrow morning as a data URL.
 *
 * Generated client-side so no server round-trip is needed and it works even if
 * the page is served from a static cache.
 */
function calendarLink(): string {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Caravan Concierge//Callback//EN',
    'BEGIN:VEVENT',
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    'SUMMARY:Call from Caravan Concierge about storage',
    'DESCRIPTION:Caravan Concierge will call to confirm your bay and weekly rate. Reach them on 07 3608 5993.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}
