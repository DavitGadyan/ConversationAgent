/**
 * The CRO audit findings.
 *
 * Every finding here is tied to something observable on the live site —
 * measured by scripts/audit-live-site.ts, or quoted directly from the page's own
 * copy. Nothing is asserted from intuition, and where a number could not be
 * captured the audit page says so rather than filling the gap.
 */

export type Severity = 'critical' | 'high' | 'medium'

export interface Finding {
  id: string
  severity: Severity
  area: 'Message match' | 'Funnel' | 'Pricing' | 'Trust' | 'Performance' | 'Mobile' | 'Measurement'
  title: string
  /** What is happening on the live site, stated factually. */
  observed: string
  /** Why it costs money. */
  impact: string
  /** What this project ships instead. */
  fix: string
  /** How we know — measurement, quote, or count. */
  evidence: string
}

export const findings: Finding[] = [
  {
    id: 'message-match',
    severity: 'critical',
    area: 'Message match',
    title: 'The headline sells caravans to an audience that is not all caravan owners',
    observed:
      'The homepage H1 reads “Secure Caravan Storage. No Lock-ins. No Surprises.” But the ' +
      'business advertises to boat, motorhome, RV, campervan, car, jetski, bus and trailer ' +
      'owners, and the site has a separate page for each of those nine vehicle types.',
    impact:
      'A boat owner who clicks a boat ad lands on caravan copy. The mismatch is resolved in ' +
      'the first second of the visit, and it is resolved against you. This is the single ' +
      'most expensive leak on the page, because it wastes the click you already paid for.',
    fix:
      'One page that rewrites its headline, sub-headline, imagery and form default per ' +
      'segment. Each ad group deep-links to its own variant (?v=boat), so the match is ' +
      'perfect before the visitor does anything. Six segments, one page, no dilution.',
    evidence: 'Measured: H1 text captured from the live homepage.',
  },
  {
    id: 'exit-paths',
    severity: 'critical',
    area: 'Funnel',
    title: 'The header offers 25 ways to leave a page you are paying for',
    observed:
      'The site navigation is carried onto the paid landing page: “What We Do” expands to ' +
      'nine vehicle pages, “Service Areas” to five, “Contact” to three. There are 25 links ' +
      'in the header alone and 88 on the page.',
    impact:
      'Every one is an alternative to converting. Paid traffic has one job to do; a full ' +
      'site nav invites browsing instead, and browsing on a landing page usually ends in a ' +
      'back button.',
    fix:
      'The landing page header carries a logo, one tracked phone number and one CTA. No ' +
      'nav. The information those pages held has been folded into this one — service areas ' +
      'and vehicle types are sections, not destinations.',
    evidence: 'Measured: 25 anchor elements in the header, 88 on the page.',
  },
  {
    id: 'page-weight',
    severity: 'high',
    area: 'Performance',
    title: 'The page ships 2.4 MB over 54 requests to show an offer and collect six fields',
    observed:
      '2.4 MB transferred across 54 requests, of which 478 KB is JavaScript and 481 KB is ' +
      'imagery. Median load completes at about 2.3 s with first contentful paint near 1.1 s. ' +
      'Three images ship without width and height attributes.',
    impact:
      'Warm-cache timings are acceptable, and this is not the emergency a single cold ' +
      'measurement first suggested. But 2.4 MB is a great deal of weight for a page whose ' +
      'job is to show an offer and collect six fields, every kilobyte of it paid for on a ' +
      'customer\u2019s mobile data. Weight is also what makes the cold-start case below bite ' +
      'as hard as it does.',
    fix:
      'The replacement page transfers about 353 KB over 18 requests — a seven-fold ' +
      'reduction — with self-hosted fonts and no render-blocking third-party requests. ' +
      'Real-user Web Vitals are then collected continuously so it cannot silently regress.',
    evidence:
      'Measured: median of Chromium runs on a Pixel 5 profile, using the Resource Timing ' +
      'API for true over-the-wire sizes. Comparison figures come from the same script run ' +
      'against a local production build — its network timings are therefore flattered, but ' +
      'transfer size, JavaScript size, request count and link counts are properties of the ' +
      'page itself and compare directly.',
  },
  {
    id: 'cold-start',
    severity: 'medium',
    area: 'Performance',
    title: 'Cold, uncached visits are several times slower than warm ones',
    observed:
      'Across repeated runs, time to first byte ranged from 391 ms to 2,939 ms, first ' +
      'contentful paint from 1,048 ms to 5,808 ms, and full load from 2.1 s to 7.9 s. Same ' +
      'page, same connection — the difference is cache state.',
    impact:
      'Paid traffic is overwhelmingly first-time traffic, so the cold end of that range is ' +
      'closer to what your ad clicks actually experience than the warm end. A five-second ' +
      'blank screen is a click you have already paid for and will not get back.',
    fix:
      'Static rendering and a far smaller payload leave much less to be slow: the ' +
      'replacement page measured a 75–185 ms TTFB range with no meaningful warm-up effect.',
    evidence:
      'Measured: the spread is reproducible across runs, not a single outlier. The cause is ' +
      'not established from the outside though — it is worth putting to your hosting ' +
      'provider, and worth confirming against Search Console field data before spending ' +
      'money on it.',
  },
  {
    id: 'price-expectation',
    severity: 'high',
    area: 'Pricing',
    title: 'The advertised entry price is not available to your core customer',
    observed:
      '“From $15 per week” is the site-wide anchor. But $15 buys a 6 m shared bay that is ' +
      'blocked in and moved on request. A typical 7 m caravan does not fit it. The cheapest ' +
      'bay that does fit is $27 — and that one permits one collection per year. A caravan ' +
      'owner who wants normal access pays $36.',
    impact:
      'This is very likely part of why enquiries go quiet after the callback. The visitor ' +
      'arrives expecting $15, hears $36, and re-rates everything else they were told. It is ' +
      'a lead-quality problem that looks like a follow-up problem.',
    fix:
      'Each segment states the entry price it can actually be charged, computed from the ' +
      'same pricing data the page uses everywhere else. The cheaper restricted bay is still ' +
      'offered — as an explicit trade-down with its limitation stated, not as the headline.',
    evidence: 'Derived from the published rate tables on the live site.',
  },
  {
    id: 'pricing-tables',
    severity: 'high',
    area: 'Pricing',
    title: 'Pricing is two raw tables and no guidance',
    observed:
      'Six bay sizes across two access levels, plus four covering types from $30 to $85 a ' +
      'week, presented as tables. Nothing indicates which row applies to a given vehicle.',
    impact:
      'The visitor has to do homework at the exact moment they are deciding whether to ' +
      'bother. Most will not; they will guess at the top number and leave.',
    fix:
      'One question — “how long is it?” — on a slider, returning the bay that fits, its ' +
      'weekly price, its annual cost and the alternatives. Same data, no homework.',
    evidence: 'Both rate tables transcribed from the live site.',
  },
  {
    id: 'form-blindness',
    severity: 'high',
    area: 'Measurement',
    title: 'The form produces no data about why people abandon it',
    observed:
      'The quote form is a single screen of fields with no progress indication, no ' +
      'reassurance about what happens next, and no instrumentation on individual fields.',
    impact:
      'You know the conversion rate and nothing else. When it moves you cannot tell whether ' +
      'it was the ad, the offer, or question four. Optimisation becomes guesswork.',
    fix:
      'Three steps, each emitting a discrete analytics event on view and on completion, so ' +
      'drop-off is attributable to a specific question. First-party, so the data survives a ' +
      'visitor declining cookies.',
    evidence: 'Observed on the live form.',
  },
  {
    id: 'trust-placement',
    severity: 'high',
    area: 'Trust',
    title: 'Strong trust signals are placed where they cannot do any work',
    observed:
      '24/7 CCTV, PIN entry, an on-site manager, guard dogs and a price-lock guarantee are ' +
      'all mentioned — in body copy, well below and away from the enquiry form. There is no ' +
      'aggregate rating and no named review source.',
    impact:
      'The objection being answered is “can I trust these people with a $60,000 asset?” That ' +
      'objection arrives at the form, so the answer has to be at the form.',
    fix:
      'A trust strip directly beneath the form, an aggregate rating with its source in the ' +
      'hero, and risk reversal printed on the button itself.',
    evidence: 'Observed on the live site.',
  },
  {
    id: 'placeholder-phone',
    severity: 'high',
    area: 'Trust',
    title: 'A placeholder phone number is published on the live site',
    observed:
      'Three numbers appear: 07 3608 5993, an SMS number, and “0412 123 123”. The last is a ' +
      'well-known Australian dummy pattern.',
    impact:
      'Anyone who notices it reads the whole site as less careful — and some will try it. ' +
      'Three numbers is also a choice the visitor should never have to make.',
    fix:
      'One number, tracked as a conversion event wherever it appears. The SMS number is kept ' +
      'in the footer as a secondary channel. The placeholder is not reproduced.',
    evidence: 'Quoted from the live site’s contact details.',
  },
  {
    id: 'no-emotion',
    severity: 'medium',
    area: 'Mobile',
    title: 'The page is static, and reads as a directory listing rather than a service',
    observed:
      'No motion, no depth, no interactive element anywhere in the funnel. Three images ship ' +
      'without width and height attributes.',
    impact:
      'Storage is a considered, emotional purchase — people are handing over something they ' +
      'saved years for. A page with no craft signals a business with no craft. Images without ' +
      'dimensions also risk layout shift on slower connections.',
    fix:
      'Purposeful motion that moves the eye toward the next commitment: scroll reveals, a ' +
      'live price that counts up, glossy depth on key moments, an interactive size finder. ' +
      'All of it disabled automatically for anyone who asks for reduced motion.',
    evidence: 'Measured: 3 images missing width/height. Layout shift itself measured at 0.',
  },
  {
    id: 'ai-invisible',
    severity: 'medium',
    area: 'Measurement',
    title: 'Nothing on the site tells an AI assistant what you charge',
    observed:
      'There is no llms.txt, and pricing exists only as HTML tables with no structured-data ' +
      'equivalent.',
    impact:
      'A growing share of “where can I store a caravan near Ipswich?” is answered by an ' +
      'assistant rather than a search page. With nothing authoritative to read, an assistant ' +
      'either omits the business or invents details about it — and “from $15 a week” is ' +
      'exactly the kind of thing it will repeat to someone it does not apply to.',
    fix:
      'Full JSON-LD (SelfStorage, Service, Offer, FAQPage, AggregateRating), a generated ' +
      'llms.txt with explicit accuracy notes about the pricing traps, and a machine-readable ' +
      'quote endpoint an assistant can call for a real number.',
    evidence: 'Checked: no llms.txt, no pricing structured data on the live site.',
  },
]

export const severityLabel: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
}
