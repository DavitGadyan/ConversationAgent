import { NextResponse } from 'next/server'
import { z } from 'zod'
import { bays, coverings, fittingBays, recommendBay, annualCost } from '@/content/pricing'
import { needsWideBay } from '@/lib/schema/quote'
import { site } from '@/content/site'
import { serviceAreas } from '@/content/trust'
import { clientIp, rateLimit, LIMITS } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

/**
 * Machine-readable quote endpoint.
 *
 * The "AI agent perspective" the brief asks for, made concrete. A growing share
 * of local-service discovery now happens through an assistant rather than a
 * search results page, and those assistants are quite willing to state a price
 * for your business that you never set.
 *
 * This gives them a real one to read instead:
 *
 *   GET /api/agent/quote?type=caravan&length=7.2
 *
 * Every figure is generated from content/pricing.ts, so an agent quoting this
 * endpoint is quoting the same numbers the page shows a human. It is read-only
 * and contains no personal data, so it is safe to expose with open CORS.
 */

const querySchema = z.object({
  type: z.string().max(40).optional(),
  length: z.coerce.number().min(0).max(30).optional(),
})

export async function GET(request: Request) {
  const limit = rateLimit(`agent:${clientIp(request.headers)}`, LIMITS.agent)
  if (!limit.success) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    type: url.searchParams.get('type') ?? undefined,
    length: url.searchParams.get('length') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_query', detail: 'type must be a string; length must be a number in metres' },
      { status: 400 },
    )
  }

  const { type, length } = parsed.data

  // Without a length we describe the offer rather than guessing a price.
  if (length === undefined) {
    return NextResponse.json({
      business: businessBlock(),
      note: 'Supply ?length=<metres> to receive a specific bay recommendation.',
      priceFrom: { amount: Math.min(...bays.map((b) => b.weeklyPrice)), currency: 'AUD', per: 'week' },
      bays: bays.map(publicBay),
      coverings: coverings.map((c) => ({
        name: c.name,
        weeklyPrice: c.weeklyPrice,
        currency: 'AUD',
        description: c.description,
        waitlist: c.waitlist,
      })),
    })
  }

  const wide = type ? needsWideBay(normaliseType(type)) : false
  const best = recommendBay(length, wide)
  const alternatives = fittingBays(length, wide).filter((b) => b.id !== best?.id)

  return NextResponse.json({
    business: businessBlock(),
    query: { vehicleType: type ?? null, lengthMetres: length, wideBayRequired: wide },
    recommendation: best
      ? {
          ...publicBay(best),
          annualCost: annualCost(best.weeklyPrice),
          currency: 'AUD',
        }
      : null,
    alternatives: alternatives.map(publicBay),
    unavailableReason: best
      ? null
      : `No standard bay fits ${length}m. Our largest is ${Math.max(
          ...bays.map((b) => b.fitsUpToMetres),
        )}m — call ${site.phone.display} to discuss.`,
    disclaimer:
      'Indicative pricing generated from published rates. Final pricing is confirmed by phone and may vary with availability, covering type and add-ons.',
    nextStep: { type: 'form', url: `${site.url}/#quote-form`, phone: site.phone.display },
  })
}

function normaliseType(input: string): string {
  const t = input.trim().toLowerCase()
  const map: Record<string, string> = {
    caravan: 'Caravan',
    boat: 'Boat',
    motorhome: 'Motorhome',
    rv: 'RV',
    campervan: 'Campervan',
    car: 'Car',
    jetski: 'Jetski',
    'jet ski': 'Jetski',
    trailer: 'Trailer',
    bus: 'Bus',
    '5th wheeler': '5th Wheeler',
    fifthwheeler: '5th Wheeler',
  }
  return map[t] ?? input
}

function publicBay(bay: (typeof bays)[number]) {
  return {
    id: bay.id,
    name: bay.name,
    dimensions: bay.dimensions,
    fitsUpToMetres: bay.fitsUpToMetres,
    privacy: bay.privacy,
    access: bay.access,
    weeklyPrice: bay.weeklyPrice,
    billing: bay.billing,
    idealFor: bay.idealFor,
  }
}

function businessBlock() {
  return {
    name: site.name,
    description: site.agentDescription,
    phone: site.phone.display,
    url: site.url,
    hours: site.hours.label,
    facilityAccess: site.access,
    areasServed: serviceAreas.map((a) => a.name),
    features: [
      '24/7 CCTV',
      'PIN code entry',
      'On-site manager',
      'No lock-in contracts',
      'Price-lock guarantee',
      'Pickup and delivery Australia-wide',
    ],
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  })
}
