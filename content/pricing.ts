/**
 * Pricing, transcribed verbatim from caravanconcierge.com.au.
 *
 * The live site presents this as two raw tables (six bays × access levels, plus
 * four covering types) with no guidance on which row applies to you. That is a
 * lot of cognitive load at exactly the moment a visitor is deciding whether to
 * enquire. The SizeFinder component turns this same data into a single question
 * — "how long is it?" — and returns one answer.
 *
 * IMPORTANT: bays and coverings are two separate axes in the source material and
 * are kept separate here. We never invent a combined price; the recommender
 * returns a bay rate and lists coverings as upgrades, with final pricing
 * confirmed on the call.
 */

/**
 * How readily the customer can get to their vehicle.
 *
 * This matters more than the price difference for most people, which is why it
 * is modelled rather than left buried in a prose `access` string — see
 * recommendBay() for why.
 */
export type AccessTier =
  /** 24/7 keypad access, come and go. */
  | 'full'
  /** Reachable on demand, but shared — drive in, drive out. */
  | 'drive-in'
  /** Blocked in or contractually limited. Cheap, but not for regular use. */
  | 'restricted'

export interface Bay {
  id: string
  name: string
  /** Human-readable footprint, e.g. "12m × 3m". */
  dimensions: string
  lengthMetres: number
  widthMetres: number
  privacy: 'Private' | 'Shared'
  access: string
  accessTier: AccessTier
  weeklyPrice: number
  billing: 'Monthly' | 'Annual'
  idealFor: string
  /** Longest vehicle this bay comfortably takes, allowing for drawbar/tow hitch. */
  fitsUpToMetres: number
  /** True for bays that suit wide loads (motorhomes, 5th wheelers, wide boats). */
  wide: boolean
  note?: string
}

export const bays: Bay[] = [
  {
    id: 'rear-6x3',
    name: 'Compact bay — rear',
    dimensions: '6m × 3m',
    lengthMetres: 6,
    widthMetres: 3,
    privacy: 'Shared',
    access: 'Blocked in — moved on request',
    accessTier: 'restricted',
    weeklyPrice: 15,
    billing: 'Monthly',
    idealFor: 'Jetskis, camper trailers, small vessels',
    fitsUpToMetres: 5.5,
    wide: false,
    note: 'Our lowest rate. Best if you store for long stretches without needing quick access.',
  },
  {
    id: 'front-6x3',
    name: 'Compact bay — front',
    dimensions: '6m × 3m',
    lengthMetres: 6,
    widthMetres: 3,
    privacy: 'Shared',
    access: 'Drive in, drive out',
    accessTier: 'drive-in',
    weeklyPrice: 21,
    billing: 'Monthly',
    idealFor: 'Smaller rigs you take out often',
    fitsUpToMetres: 5.5,
    wide: false,
  },
  {
    id: 'standard-12x3-annual',
    name: 'Standard bay — annual',
    dimensions: '12m × 3m',
    lengthMetres: 12,
    widthMetres: 3,
    privacy: 'Private',
    access: 'Limited — one collection per year',
    accessTier: 'restricted',
    weeklyPrice: 27,
    billing: 'Annual',
    idealFor: 'Long-term storage you rarely touch',
    fitsUpToMetres: 11.5,
    wide: false,
    note: 'Paid annually. The cheapest way to store a full-size van long term.',
  },
  {
    id: 'standard-12x3',
    name: 'Standard bay',
    dimensions: '12m × 3m',
    lengthMetres: 12,
    widthMetres: 3,
    privacy: 'Private',
    access: 'Full 24/7 access',
    accessTier: 'full',
    weeklyPrice: 36,
    billing: 'Monthly',
    idealFor: 'Standard caravans, boats and buses up to 12m',
    fitsUpToMetres: 11.5,
    wide: false,
  },
  {
    id: 'wide-9x4',
    name: 'Wide bay',
    dimensions: '9m × 4m',
    lengthMetres: 9,
    widthMetres: 4,
    privacy: 'Private',
    access: 'Full 24/7 access',
    accessTier: 'full',
    weeklyPrice: 36,
    billing: 'Monthly',
    idealFor: 'Motorhomes, RVs, wide boats and 5th wheelers',
    fitsUpToMetres: 8.5,
    wide: true,
  },
  {
    id: 'xl-12x4',
    name: 'Extra-large bay',
    dimensions: '12m × 4m',
    lengthMetres: 12,
    widthMetres: 4,
    privacy: 'Private',
    access: 'Full 24/7 access',
    accessTier: 'full',
    weeklyPrice: 46.5,
    billing: 'Monthly',
    idealFor: 'Large caravans and oversized vehicles',
    fitsUpToMetres: 11.5,
    wide: true,
  },
]

export interface Covering {
  id: string
  name: string
  weeklyPrice: number
  description: string
  waitlist: boolean
}

export const coverings: Covering[] = [
  {
    id: 'outdoor',
    name: 'Outdoor',
    weeklyPrice: 30,
    description: 'Open hardstand inside the secured, monitored compound.',
    waitlist: false,
  },
  {
    id: 'shaded',
    name: 'Shaded outdoor',
    weeklyPrice: 40,
    description: 'Shade cover to keep the worst of the Queensland sun off your paint and seals.',
    waitlist: false,
  },
  {
    id: 'covered',
    name: 'Covered shed',
    weeklyPrice: 45,
    description: 'Roofed bay with open sides — full protection from sun and rain.',
    waitlist: true,
  },
  {
    id: 'indoor',
    name: 'Fully indoor',
    weeklyPrice: 85,
    description: 'Enclosed, lock-up storage. The highest level of protection we offer.',
    waitlist: true,
  },
]

export const addOns = [
  { id: 'power', name: 'Power connection', price: '$5/week', description: 'Keep the battery topped up and the fridge running.' },
  { id: 'pickup', name: 'Pickup & delivery', price: 'Quoted', description: 'We collect and return your van — available Australia-wide.' },
  { id: 'checks', name: 'Battery & tyre checks', price: 'Quoted', description: 'Regular checks so it is ready to roll when you are.' },
  { id: 'clean', name: 'Wash & clean', price: 'Quoted', description: 'Have it cleaned and ready before your next trip.' },
] as const

/**
 * Recommends the cheapest bay the customer can actually USE.
 *
 * The obvious implementation — cheapest bay that fits — is wrong, and expensively
 * so. For a 7m caravan the cheapest fitting bay is the $27 annual bay, whose
 * access is "one collection per year". Quoting that as the headline price wins
 * the click and then loses the sale on the phone, because almost nobody storing
 * a caravan intends to see it once a year. Worse, it teaches the customer that
 * the advertised price was not the real one.
 *
 * So restricted-access bays are excluded from the recommendation and offered
 * separately by cheapestFitting() as a deliberate trade-down for people who
 * genuinely want it. The recommended price is one the customer will actually be
 * charged for the service they think they are buying.
 */
export function recommendBay(lengthMetres: number, needsWide = false): Bay | null {
  const usable = fittingBays(lengthMetres, needsWide).filter(
    (b) => b.accessTier !== 'restricted',
  )

  // If only restricted bays fit, returning one is still better than nothing —
  // the UI labels its access clearly either way.
  return usable[0] ?? fittingBays(lengthMetres, needsWide)[0] ?? null
}

/**
 * The absolute cheapest bay that fits, including restricted-access ones.
 *
 * Used to offer "you could pay less if you rarely need access" as an explicit
 * downgrade, with its limitation stated — rather than as a bait price.
 */
export function cheapestFitting(lengthMetres: number, needsWide = false): Bay | null {
  return fittingBays(lengthMetres, needsWide)[0] ?? null
}

/**
 * The honest "from $X" for a given vehicle length — the number that belongs in
 * ad copy and headlines, because it is one this customer can actually get.
 */
export function fromPriceFor(lengthMetres: number, needsWide = false): number | null {
  return recommendBay(lengthMetres, needsWide)?.weeklyPrice ?? null
}

/**
 * All bays that fit, so the visitor can see the trade-off between price and
 * access rather than being handed a single take-it-or-leave-it number.
 */
export function fittingBays(lengthMetres: number, needsWide = false): Bay[] {
  return bays
    .filter((b) => b.fitsUpToMetres >= lengthMetres)
    .filter((b) => (needsWide ? b.wide : true))
    .sort((a, b) => a.weeklyPrice - b.weeklyPrice)
}

export const CHEAPEST_WEEKLY = Math.min(...bays.map((b) => b.weeklyPrice))
export const LONGEST_FIT = Math.max(...bays.map((b) => b.fitsUpToMetres))

/** Weekly rate → annual cost. Australian storage is quoted weekly; budgets are annual. */
export function annualCost(weeklyPrice: number): number {
  return Math.round(weeklyPrice * 52)
}
