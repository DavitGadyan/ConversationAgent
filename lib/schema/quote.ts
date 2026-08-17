import { z } from 'zod'
import { LONGEST_FIT } from '@/content/pricing'
import { normalisePhone } from '@/lib/utils'

/**
 * The quote form contract, shared by the client form and the API route.
 *
 * The client uses this for inline validation (UX only). The server re-validates
 * with the same schema and treats its own result as authoritative — client
 * validation is a courtesy to the user, never a security control.
 *
 * The client explicitly wants the LONG form: every field they need to quote and
 * book is captured up front, so they are not chasing people for answers after
 * the fact. The step split is what keeps completion high.
 */

export const VEHICLE_TYPES = [
  'Caravan',
  'Boat',
  'Motorhome',
  'RV',
  'Campervan',
  'Car',
  'Jetski',
  'Trailer',
  'Bus',
  '5th Wheeler',
  'Other',
] as const

export const TIMELINES = [
  'ASAP — within a week',
  'In the next few weeks',
  'In a few months',
  'Just researching for now',
] as const

export const DURATIONS = [
  'Less than 1 month',
  '1 – 3 months',
  '3 – 6 months',
  '6 – 12 months',
  '12+ months',
  'Not sure yet',
] as const

export const COVERINGS = [
  'Outdoor — best value',
  'Shaded outdoor',
  'Covered shed',
  'Fully indoor',
  'Not sure — recommend one',
] as const

/**
 * Australian numbers after normalisation: a leading 0 or +61, then an area /
 * service digit (2, 3, 7, 8 landline; 4 mobile), then eight digits.
 */
const AU_PHONE = /^(?:\+?61|0)[23478]\d{8}$/

const auPhone = z
  .string()
  .min(1, 'We need a number to call you back on')
  .transform(normalisePhone)
  .refine((v) => AU_PHONE.test(v), 'That does not look like an Australian phone number')

/** Step 1 — the fold. Three fields, all of them cheap to answer. */
export const step1Schema = z.object({
  vehicleType: z.enum(VEHICLE_TYPES, {
    errorMap: () => ({ message: 'Pick the closest match' }),
  }),
  lengthMetres: z
    .number({ invalid_type_error: 'Enter a length in metres' })
    .min(1, 'That seems too short — enter the length in metres')
    .max(LONGEST_FIT + 2, `We store vehicles up to ${LONGEST_FIT}m — call us for anything longer`),
  postcode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Enter a 4-digit Australian postcode'),
})

/** Step 2 — qualification. Determines urgency, term and bay type. */
export const step2Schema = z.object({
  timeline: z.enum(TIMELINES, { errorMap: () => ({ message: 'Choose a timeframe' }) }),
  duration: z.enum(DURATIONS, { errorMap: () => ({ message: 'Choose a rough duration' }) }),
  covering: z.enum(COVERINGS, { errorMap: () => ({ message: 'Choose a storage type' }) }),
  needsPower: z.boolean().default(false),
  needsPickup: z.boolean().default(false),
})

/** Step 3 — contact. Asked last, once the visitor has already invested effort. */
export const step3Schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  phone: auPhone,
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(120)
    .or(z.literal(''))
    .optional(),
  notes: z.string().trim().max(1000, 'Please keep it under 1000 characters').optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm we can contact you about your quote' }),
  }),
})

/** Hidden fields — attribution and bot signals. Never shown to the user. */
export const metaSchema = z.object({
  segment: z.string().max(40).optional(),
  /** Honeypot. A real human never fills this; bots fill every input they find. */
  company: z.string().max(0, 'Submission rejected').optional().default(''),
  /** Client timestamp when the form was first rendered, for the timing heuristic. */
  startedAt: z.number().int().positive().optional(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
})

export const quoteSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(metaSchema)

export type QuoteInput = z.input<typeof quoteSchema>
export type Quote = z.output<typeof quoteSchema>
export type Step1 = z.output<typeof step1Schema>
export type Step2 = z.output<typeof step2Schema>
export type Step3 = z.output<typeof step3Schema>

/** Field names per step, so the form can validate only what is on screen. */
export const stepFields = {
  1: ['vehicleType', 'lengthMetres', 'postcode'],
  2: ['timeline', 'duration', 'covering', 'needsPower', 'needsPickup'],
  3: ['name', 'phone', 'email', 'notes', 'consent'],
} as const

export const TOTAL_STEPS = 3

/** Vehicle types that need a wide bay — drives the recommendation. */
const WIDE_TYPES = new Set(['Motorhome', 'RV', '5th Wheeler', 'Bus'])

export function needsWideBay(vehicleType: string): boolean {
  return WIDE_TYPES.has(vehicleType)
}
