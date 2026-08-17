'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Section } from '@/components/ui/section'
import { faqs } from '@/content/trust'
import { site } from '@/content/site'
import { track } from '@/lib/monitoring/analytics'
import { fadeUp, stagger, viewportOnce } from '@/lib/motion'

/**
 * FAQ.
 *
 * Radix accordion, so keyboard interaction and ARIA state are correct without
 * hand-rolling them. Each open is tracked: which questions people actually
 * expand is a direct readout of what the page failed to answer earlier, and the
 * top one is usually worth promoting into the hero copy.
 *
 * The same content generates FAQPage structured data, which both earns the
 * expandable FAQ treatment in search results and gives AI assistants a reliable
 * source for these answers.
 */
export function Faq() {
  return (
    <Section
      id="faq"
      label="Questions"
      title="Everything else you might be wondering"
      tone="card"
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mx-auto max-w-3xl"
      >
        <Accordion.Root type="single" collapsible className="space-y-2.5">
          {faqs.map((faq) => (
            <motion.div key={faq.q} variants={fadeUp}>
              <Accordion.Item
                value={faq.q}
                className="overflow-hidden rounded-[20px] border border-line transition-colors data-[state=open]:bg-canvas"
              >
                <Accordion.Header>
                  <Accordion.Trigger
                    onClick={() => track({ name: 'faq_opened', question: faq.q })}
                    className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[16px] font-medium text-ink">{faq.q}</span>
                    <Plus
                      size={18}
                      aria-hidden
                      className="shrink-0 text-muted transition-transform duration-300 ease-[var(--ease-out-soft)] group-data-[state=open]:rotate-45"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_0.22s_ease] data-[state=open]:animate-[accordion-down_0.28s_ease]">
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{faq.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            </motion.div>
          ))}
        </Accordion.Root>

        <p className="mt-8 text-center text-[15px] text-muted">
          Still not sure?{' '}
          <a
            href={site.phone.href}
            onClick={() => track({ name: 'call_clicked', placement: 'faq' })}
            className="font-medium text-ink underline underline-offset-4 hover:text-action"
          >
            Call {site.phone.display}
          </a>{' '}
          — we are happy to talk it through.
        </p>
      </motion.div>
    </Section>
  )
}
