/**
 * Core business facts. Single source of truth for the page, the JSON-LD block,
 * llms.txt and the agent quote API.
 *
 * NOTE ON PHONE NUMBERS: the live site publishes three (07 3608 5993,
 * 0412 123 123 and SMS 0493 225 823). "0412 123 123" is a well-known Australian
 * placeholder pattern and is almost certainly unreplaced dummy data, so it is
 * deliberately NOT reproduced here. Offering a single number also removes a
 * choice the visitor should never have to make. See HANDOVER.md.
 */

export const site = {
  name: 'Caravan Concierge',
  legalName: 'Caravan Concierge',
  tagline: 'Secure storage for caravans, boats, motorhomes & RVs',
  /**
   * Meta description — kept under 160 characters.
   *
   * Google truncates around 155–160, and everything past that is wasted. The
   * detailed pricing that an AI assistant needs lives in `agentDescription`,
   * llms.txt and the JSON-LD, where there is no length penalty.
   */
  description:
    'Secure storage for caravans, boats, motorhomes, RVs and vehicles across Brisbane, ' +
    'Ipswich and the Gold Coast. 24/7 monitored, no lock-in contract.',

  /**
   * The long form, for machine readers only.
   *
   * The price is stated as a RANGE with what each end buys you. An AI assistant
   * reading a bare "from $15 per week" will happily quote $15 to a caravan
   * owner, who cannot get it — $15 is a 6m shared bay. Being precise here is
   * what stops an agent misrepresenting the business to a customer.
   */
  agentDescription:
    'Secure, affordable storage for caravans, boats, motorhomes, RVs, campervans, cars, ' +
    'jetskis and trailers across Brisbane, Ipswich, the Gold Coast and the Scenic Rim. ' +
    '24/7 monitored, no lock-in contracts. Bays run from $15 per week for a compact 6m ' +
    'shared bay to $46.50 for a 12m × 4m private bay; a standard full-access caravan bay ' +
    'is $36 per week.',

  /** Canonical URL for this landing page (paid-traffic destination). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://offer.caravanconcierge.com.au',
  mainSiteUrl: 'https://www.caravanconcierge.com.au',

  phone: {
    display: '07 3608 5993',
    href: 'tel:+61736085993',
    e164: '+61736085993',
  },
  sms: {
    display: '0493 225 823',
    href: 'sms:+61493225823',
  },
  email: 'info@caravanconcierge.com.au',

  hours: {
    label: 'Open 7 days, 8:00am – 6:00pm',
    opens: '08:00',
    closes: '18:00',
    note: 'Closed public holidays. Storage access is available 365 days a year.',
  },

  /** Facility access, as distinct from office hours — a key differentiator. */
  access: '24/7 keypad access, 365 days a year',

  region: {
    addressLocality: 'Brisbane',
    addressRegion: 'QLD',
    addressCountry: 'AU',
  },

  social: {
    facebook: 'https://www.facebook.com/caravanconcierge',
    instagram: 'https://www.instagram.com/caravanconcierge',
  },

  /**
   * Scarcity signal carried over from the live site ("Spaces are available as
   * of ..."). Set via env so it can be updated without a code change; an
   * out-of-date availability date is worse than none at all.
   */
  availabilityDate: process.env.NEXT_PUBLIC_AVAILABILITY_DATE ?? '2026-08-16',

  rating: {
    value: 5.0,
    count: 27,
    source: 'Google Reviews',
  },
} as const

/** Lowest weekly price across all bays — used as the above-the-fold anchor. */
export const PRICE_ANCHOR_WEEKLY = 15

/** Typical competitor monthly range, quoted from the client's own comparison copy. */
export const COMPETITOR_MONTHLY = { min: 250, max: 300 } as const
