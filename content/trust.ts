/**
 * Trust signals, testimonials, FAQs and service areas.
 *
 * On the live site these are true but *told, not shown* — buried in body copy
 * far from the form. Here they sit in a strip directly under the CTA, because
 * a security claim is only worth anything at the moment someone is deciding to
 * hand over their $60,000 caravan.
 */

export interface TrustPoint {
  id: string
  label: string
  detail: string
  icon: 'shield' | 'key' | 'user' | 'calendar' | 'unlock' | 'lock-price'
}

export const trustPoints: TrustPoint[] = [
  { id: 'cctv', label: '24/7 CCTV', detail: 'Cameras cover every bay, recording around the clock.', icon: 'shield' },
  { id: 'pin', label: 'PIN-code entry', detail: 'Your own private keypad code. Every entry is logged.', icon: 'key' },
  { id: 'manager', label: 'On-site manager', detail: 'A real person on the ground, plus after-hours guard dogs.', icon: 'user' },
  { id: 'open', label: 'Open 365 days', detail: 'Get to your van on Christmas Day if you want to.', icon: 'calendar' },
  { id: 'nolockin', label: 'No lock-in contract', detail: 'Store for weeks or months. Leave whenever you like.', icon: 'unlock' },
  { id: 'pricelock', label: 'Price-lock guarantee', detail: 'Your rate is protected from the annual increases others charge.', icon: 'lock-price' },
]

export interface Benefit {
  id: string
  title: string
  body: string
  tint: 'lavender' | 'peach' | 'mint' | 'sky'
}

export const benefits: Benefit[] = [
  {
    id: 'price',
    title: 'Up to 50% less',
    body: 'Typical self-storage runs $250–$300 a month. Our bays start at $15 a week, and your rate is locked.',
    tint: 'mint',
  },
  {
    id: 'space',
    title: 'Room to manoeuvre',
    body: 'Wide lanes and generous bays. No inching a 7-metre van between two concrete pillars.',
    tint: 'lavender',
  },
  {
    id: 'concierge',
    title: 'We can do the towing',
    body: 'Pickup and delivery Australia-wide, with 15+ years of towing experience behind the wheel.',
    tint: 'peach',
  },
  {
    id: 'risk',
    title: 'Zero-risk reservation',
    body: 'No deposit, no obligation, no card required to hold a space while you decide.',
    tint: 'sky',
  },
]

export interface Testimonial {
  id: string
  quote: string
  author: string
  detail: string
  rating: 5
}

/** Verbatim from the live site — real customers, real named staff. */
export const testimonials: Testimonial[] = [
  {
    id: 'sarah-tom',
    quote:
      'Couldn’t be happier with Caravan Concierge! The pickup and delivery service saved us so much time, and the savings helped fund our trip to the coast. Thanks, Kassandra!',
    author: 'Sarah & Tom',
    detail: 'Caravan · pickup & delivery',
    rating: 5,
  },
  {
    id: 'alex-j',
    quote:
      'Kassandra went above and beyond to help. She even helped us reverse the caravan into its space. Excellent facility to keep a caravan safe.',
    author: 'Alex J.',
    detail: 'Caravan · standard bay',
    rating: 5,
  },
  {
    id: 'grant',
    quote:
      'Stored my motorhome at Gatton and saved nearly $1,000! The service was excellent, and Grant went above and beyond to help.',
    author: 'Motorhome owner',
    detail: 'Motorhome · wide bay',
    rating: 5,
  },
]

export interface ServiceArea {
  name: string
  note: string
}

export const serviceAreas: ServiceArea[] = [
  { name: 'Brisbane', note: 'Greater Brisbane and surrounds' },
  { name: 'Ipswich', note: 'Local facility, short drive from the CBD' },
  { name: 'Gold Coast', note: 'Pickup and delivery available' },
  { name: 'Scenic Rim', note: 'Including Beaudesert' },
  { name: 'Toowoomba', note: 'Servicing the Darling Downs' },
]

export interface Faq {
  q: string
  a: string
}

export const faqs: Faq[] = [
  {
    q: 'What can I store with you?',
    a: 'Caravans, motorhomes, RVs, campervans, boats, jetskis, cars, buses, trailers and 5th wheelers. If it has wheels or a hull, we almost certainly have a bay that fits — we store vehicles up to 12 metres.',
  },
  {
    q: 'How secure is the facility?',
    a: '24/7 CCTV covering every bay, private PIN-code entry with every access logged, high-security perimeter fencing, an on-site manager during the day and guard dogs after hours. The site is also set back out of view from main roads, so your van is not advertised to anyone passing.',
  },
  {
    q: 'When can I access my vehicle?',
    a: 'Private bays come with full 24/7 keypad access, 365 days a year — including public holidays. Our lowest-cost shared rear bays are blocked in, so those are moved on request rather than accessed on demand.',
  },
  {
    q: 'Am I locked into a contract?',
    a: 'No. There are no lock-in contracts. Store for a few weeks or several years and only pay for what you use. Most bays are billed monthly; the discounted long-term bay is billed annually.',
  },
  {
    q: 'How much does it cost?',
    a: 'Bays start at $15 per week and run to $46.50 per week for our extra-large 12m × 4m bay. Covered and indoor options are also available. Your exact rate depends on the size of your vehicle and how often you need access — tell us your length and we will confirm the number on the call.',
  },
  {
    q: 'Do you pick up and deliver?',
    a: 'Yes — Australia-wide, with over 15 years of towing experience. Plenty of our customers never touch the van between trips: we collect it, store it, and bring it back when you are ready. Pickup and delivery is quoted per job.',
  },
  {
    q: 'Do I need to pay a deposit to reserve a space?',
    a: 'No deposit and no obligation. We will hold a space while you decide, and no card details are required to do it.',
  },
  {
    q: 'Can you look after the van while it is stored?',
    a: 'We offer battery checks, tyre inspections and cleaning as add-on services, plus power connection at $5 per week to keep the battery topped up. Just tell us what you need when we speak.',
  },
]

export interface HowItWorksStep {
  step: number
  title: string
  body: string
}

export const howItWorks: HowItWorksStep[] = [
  {
    step: 1,
    title: 'Tell us what you have',
    body: 'Forty-five seconds on the form. Vehicle type, length and postcode is enough to price it.',
  },
  {
    step: 2,
    title: 'We confirm your bay and rate',
    body: 'A real person calls you back — usually the same business day — with the exact bay and the exact weekly price. No deposit to hold it.',
  },
  {
    step: 3,
    title: 'Drive in, or we collect it',
    body: 'Bring it in and we will help you reverse it, or we tow it for you. You get your PIN and 24/7 access from day one.',
  },
]

/** Head-to-head comparison, drawn from the client's own competitor table. */
export const comparison = [
  { factor: 'Monthly cost', us: '$65 – $180', them: '$250 – $300+' },
  { factor: 'Price increases', us: 'Price-lock guarantee', them: 'Frequent increases' },
  { factor: 'Contract', us: 'None — leave anytime', them: 'Long-term lock-in' },
  { factor: 'Access hours', us: '24/7, 365 days a year', them: 'Restricted hours' },
  { factor: 'Manoeuvring room', us: 'Wide lanes, generous bays', them: 'Tight and overcrowded' },
  { factor: 'Pickup & delivery', us: 'Australia-wide', them: 'Not offered' },
  { factor: 'Security', us: 'CCTV + PIN + fencing + on-site manager', them: 'Basic locks, shared access' },
  { factor: 'Privacy', us: 'Set back, out of public view', them: 'Visible from main roads' },
] as const
