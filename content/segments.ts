/**
 * Customer segments.
 *
 * THE CENTRAL CRO FIX: the live site's H1 sells "Secure Caravan Storage" while
 * the ad account targets boat, motorhome, RV, campervan, car, jetski and trailer
 * owners too. Every non-caravan visitor arrives to a message mismatch.
 *
 * One page now serves all of them. Each ad group deep-links to its own segment
 * (`?v=boat`) and the hero re-writes itself to match the ad the visitor clicked.
 */

import { fromPriceFor } from './pricing'

export type SegmentId =
  | 'caravan'
  | 'boat'
  | 'motorhome'
  | 'campervan'
  | 'vehicle'
  | 'jetski'

export interface Segment {
  id: SegmentId
  /** Chip label — short enough to fit six across on desktop. */
  label: string
  /** Noun used inline in copy, e.g. "your caravan". */
  noun: string
  /**
   * Headline template. `{price}` is replaced with the real entry price for THIS
   * segment — see segmentHeadline() for why it is not hardcoded.
   */
  headline: string
  subheadline: string
  /** The specific anxiety this owner has. Speaks to the segment, not the product. */
  painPoint: string
  /** Typical length in metres — pre-fills the size finder. */
  typicalLengthMetres: number
  /** Matching option value in the quote form's vehicle select. */
  formValue: string
  emoji: string
}

export const segments: Segment[] = [
  {
    id: 'caravan',
    label: 'Caravan',
    noun: 'caravan',
    headline: 'Secure caravan storage from {price} a week',
    subheadline:
      'Get it off the driveway and out of the weather. 24/7 monitored, no lock-in contract, ' +
      'and you only pay for the weeks you need.',
    painPoint: 'Tired of it taking up the driveway — or breaching your body corporate rules?',
    typicalLengthMetres: 7,
    formValue: 'Caravan',
    emoji: '🚐',
  },
  {
    id: 'boat',
    label: 'Boat',
    noun: 'boat',
    headline: 'Secure boat storage from {price} a week',
    subheadline:
      'Hardstand and covered storage for trailer boats and larger vessels. Wide bays, easy ' +
      'reversing, and drive-in access so you are on the water faster.',
    painPoint: 'Sick of paying marina rates or squeezing the trailer down the side of the house?',
    typicalLengthMetres: 6,
    formValue: 'Boat',
    emoji: '🛥️',
  },
  {
    id: 'motorhome',
    label: 'Motorhome & RV',
    noun: 'motorhome',
    headline: 'Secure motorhome & RV storage from {price} a week',
    subheadline:
      'Extra-wide 9m and 12m private bays built for motorhomes, RVs and 5th wheelers — with ' +
      'room to actually manoeuvre.',
    painPoint: 'Struggling to find a bay wide enough that you are not inching in every time?',
    typicalLengthMetres: 9,
    formValue: 'Motorhome',
    emoji: '🚍',
  },
  {
    id: 'campervan',
    label: 'Campervan',
    noun: 'campervan',
    headline: 'Secure campervan storage from {price} a week',
    subheadline:
      'Short bays priced for smaller rigs. Drive in, drive out, 365 days a year — with no ' +
      'minimum term.',
    painPoint: 'Only need it stored between trips, not locked into a 12-month contract?',
    typicalLengthMetres: 5.5,
    formValue: 'Campervan',
    emoji: '🚙',
  },
  {
    id: 'vehicle',
    label: 'Car & Trailer',
    noun: 'vehicle',
    headline: 'Secure car & trailer storage from {price} a week',
    subheadline:
      'A safe, monitored home for the project car, the work trailer or the second vehicle — ' +
      'without the self-storage price tag.',
    painPoint: 'Need it off the street but not paying $250 a month for a shed you cannot reach?',
    typicalLengthMetres: 5,
    formValue: 'Car',
    emoji: '🚗',
  },
  {
    id: 'jetski',
    label: 'Jetski',
    noun: 'jetski',
    headline: 'Secure jetski storage from {price} a week',
    subheadline:
      'Our lowest-cost bays suit jetskis, camper trailers and small vessels — fully fenced, ' +
      'CCTV monitored, and open every day of the year.',
    painPoint: 'Want it secure over winter without paying for space you do not need?',
    typicalLengthMetres: 4,
    formValue: 'Jetski',
    emoji: '🌊',
  },
]

export const DEFAULT_SEGMENT: SegmentId = 'caravan'

export function getSegment(id: string | null | undefined): Segment {
  const found = segments.find((s) => s.id === id)
  return found ?? segments.find((s) => s.id === DEFAULT_SEGMENT)!
}

/** Vehicle types that need a wide bay. Mirrors needsWideBay() in the form schema. */
const WIDE_SEGMENTS = new Set<SegmentId>(['motorhome'])

/**
 * The entry price a visitor in THIS segment can actually be charged.
 *
 * Worth stating plainly, because it is one of the audit findings: the site-wide
 * "from $15/week" is only achievable in a 6m blocked-in shared bay. A 7m caravan
 * — the client's core customer — cannot get $15, or even $27 without accepting
 * one collection per year. Advertising a price the customer cannot have creates
 * a price-expectation gap that surfaces later as leads going quiet after the
 * quote call, which is precisely the symptom the client described.
 *
 * So each segment quotes its own real number, computed from the same pricing
 * data the rest of the page uses.
 */
export function segmentFromPrice(segment: Segment): number | null {
  return fromPriceFor(segment.typicalLengthMetres, WIDE_SEGMENTS.has(segment.id))
}

export function segmentHeadline(segment: Segment): string {
  const price = segmentFromPrice(segment)
  if (price === null) return segment.headline.replace(' from {price} a week', '')

  const formatted = price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`
  return segment.headline.replace('{price}', formatted)
}

/** Generic headline used before a segment is chosen — covers every customer at once. */
export const UNIVERSAL_HEADLINE = {
  headline: 'Secure storage for your caravan, boat, motorhome or RV',
  subheadline:
    'Across Brisbane, Ipswich and the Gold Coast. 24/7 monitored, no lock-in contract, ' +
    'and you only pay for the weeks you actually need.',
}
