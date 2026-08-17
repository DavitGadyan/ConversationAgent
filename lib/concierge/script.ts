import { bays, coverings, recommendBay } from '@/content/pricing'
import { faqs } from '@/content/trust'
import { site } from '@/content/site'
import { formatMoney } from '@/lib/utils'

/**
 * The concierge's decision tree.
 *
 * A scripted agent rather than an LLM, and that is a considered choice, not a
 * shortcut. This widget quotes prices for a real business. An LLM that
 * hallucinates "$12 a week" once has cost the client a customer and possibly an
 * argument; a decision tree can only ever say what is in content/pricing.ts.
 *
 * It also costs nothing per conversation, needs no API key, works offline, and
 * adds no latency — which for a qualification flow this shallow is simply the
 * better engineering.
 *
 * The tree is data, so the conversation can be extended without touching the
 * component that renders it.
 */

export type NodeId = string

export interface ConciergeOption {
  label: string
  next: NodeId
  /** Recorded into the answers bag, and used to pre-fill the quote form. */
  set?: Record<string, string | number | boolean>
}

export interface ConciergeNode {
  id: NodeId
  /** Message(s) the concierge sends on arrival. Functions get the answers so far. */
  say: string | ((answers: Answers) => string)
  options?: ConciergeOption[]
  /** A free-text step, e.g. asking for a length in metres. */
  input?: { kind: 'number' | 'text'; placeholder: string; key: string; next: NodeId }
  /** Terminal node that hands off to the form. */
  handoff?: boolean
}

export type Answers = Record<string, string | number | boolean>

export const conciergeTree: Record<NodeId, ConciergeNode> = {
  start: {
    id: 'start',
    say: 'Hi — I can give you a price in about 30 seconds. What are you looking to store?',
    options: [
      { label: '🚐 Caravan', next: 'length', set: { vehicleType: 'Caravan', segment: 'caravan' } },
      { label: '🛥️ Boat', next: 'length', set: { vehicleType: 'Boat', segment: 'boat' } },
      { label: '🚍 Motorhome or RV', next: 'length', set: { vehicleType: 'Motorhome', segment: 'motorhome' } },
      { label: 'Something else', next: 'otherType' },
    ],
  },

  otherType: {
    id: 'otherType',
    say: 'No problem — we store most things with wheels or a hull. Which is closest?',
    options: [
      { label: '🚙 Campervan', next: 'length', set: { vehicleType: 'Campervan', segment: 'campervan' } },
      { label: '🚗 Car or trailer', next: 'length', set: { vehicleType: 'Car', segment: 'vehicle' } },
      { label: '🌊 Jetski', next: 'length', set: { vehicleType: 'Jetski', segment: 'jetski' } },
      { label: 'Bus or 5th wheeler', next: 'length', set: { vehicleType: '5th Wheeler', segment: 'motorhome' } },
    ],
  },

  length: {
    id: 'length',
    say: 'How long is it, in metres? Include the drawbar or tow hitch — a rough number is fine.',
    input: { kind: 'number', placeholder: 'e.g. 7.2', key: 'lengthMetres', next: 'quote' },
  },

  quote: {
    id: 'quote',
    say: (answers) => {
      const length = Number(answers.lengthMetres) || 0
      const wide = ['Motorhome', 'RV', '5th Wheeler', 'Bus'].includes(String(answers.vehicleType))
      const bay = recommendBay(length, wide)

      if (!bay) {
        const longest = Math.max(...bays.map((b) => b.fitsUpToMetres))
        return `At ${length}m you are past our standard ${longest}m bay — but we can almost always sort something out. Give me your details and we will call you, or ring ${site.phone.display}.`
      }

      return `Good news. A ${bay.dimensions} ${bay.name.toLowerCase()} fits, at ${formatMoney(
        bay.weeklyPrice,
      )} a week — ${bay.access.toLowerCase()}. Want me to hold one for you? No deposit, no obligation.`
    },
    options: [
      { label: 'Yes, hold a space', next: 'handoff' },
      { label: 'What about covered storage?', next: 'covering' },
      { label: 'Is it secure?', next: 'security' },
    ],
  },

  covering: {
    id: 'covering',
    say: () =>
      `We have four levels: ${coverings
        .map((c) => `${c.name.toLowerCase()} at ${formatMoney(c.weeklyPrice)}/wk`)
        .join(', ')}. Covered and indoor currently have a waitlist — worth getting your name down early.`,
    options: [
      { label: 'Hold me a space', next: 'handoff' },
      { label: 'Is it secure?', next: 'security' },
    ],
  },

  security: {
    id: 'security',
    say: faqs.find((f) => f.q.includes('secure'))?.a ?? '24/7 CCTV, PIN entry and on-site staff.',
    options: [
      { label: 'Sounds good — hold a space', next: 'handoff' },
      { label: 'When can I access it?', next: 'access' },
    ],
  },

  access: {
    id: 'access',
    say: faqs.find((f) => f.q.includes('access'))?.a ?? site.access,
    options: [{ label: 'Great — hold a space', next: 'handoff' }],
  },

  handoff: {
    id: 'handoff',
    say: 'Perfect. I have filled in what you told me — just add your name and number and we will confirm the exact rate, usually the same business day.',
    handoff: true,
  },
}

export const START_NODE: NodeId = 'start'
