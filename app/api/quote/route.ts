import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { quoteSchema, needsWideBay } from '@/lib/schema/quote'
import { recommendBay } from '@/content/pricing'
import { deliverLead } from '@/lib/leads/deliver'
import type { Lead } from '@/lib/leads/types'
import { checkBotSignals, verifyTurnstile } from '@/lib/security/bot'
import { clientIp, rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { logger, newRequestId, captureException } from '@/lib/monitoring/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Quote submission.
 *
 * Order of operations is deliberate — cheapest rejections first, so an abusive
 * client never gets to spend our Twilio credit or our Resend quota:
 *
 *   1. Rate limit by IP
 *   2. Parse and validate (server-side validation is the authoritative one)
 *   3. Bot heuristics + optional Turnstile
 *   4. Enrich with the bay recommendation
 *   5. Fan out to the delivery sinks
 *
 * A bot is answered with 200 OK. Telling a scraper exactly which signal caught
 * it is free tuning data for them; a silent accept wastes their time instead.
 */
export async function POST(request: Request) {
  const requestId = newRequestId()
  const ip = clientIp(request.headers)

  try {
    // 1. Rate limit
    const limit = rateLimit(`quote:${ip}`, LIMITS.quote)
    if (!limit.success) {
      logger.warn('quote rate limited', { requestId, route: 'quote' })
      return NextResponse.json(
        { ok: false, error: 'Too many submissions. Please try again in a minute, or call us.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limit.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': limit.limit.toString(),
            'X-RateLimit-Remaining': limit.remaining.toString(),
          },
        },
      )
    }

    // 2. Validate
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
    }

    const parsed = quoteSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      logger.info('quote validation failed', {
        requestId,
        route: 'quote',
        fields: Object.keys(fieldErrors),
      })
      return NextResponse.json(
        { ok: false, error: 'Please check the highlighted fields.', fields: fieldErrors },
        { status: 422 },
      )
    }

    const data = parsed.data

    // 3. Bot signals
    const verdict = checkBotSignals({
      company: data.company,
      startedAt: data.startedAt,
      userAgent: request.headers.get('user-agent'),
    })

    const turnstileOk = await verifyTurnstile(
      (body as { turnstileToken?: string }).turnstileToken,
      ip,
    )

    if (verdict.isBot || !turnstileOk) {
      logger.warn('quote rejected as bot', {
        requestId,
        route: 'quote',
        reason: verdict.reason ?? 'turnstile',
        score: verdict.score,
      })
      // Look identical to success from the outside.
      return NextResponse.json({ ok: true, reference: randomUUID().slice(0, 8).toUpperCase() })
    }

    // 4. Enrich
    const bay = recommendBay(data.lengthMetres, needsWideBay(data.vehicleType))
    const id = `CC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`

    const lead: Lead = {
      ...data,
      id,
      receivedAt: new Date().toISOString(),
      recommendedBay: bay,
      estimatedWeekly: bay?.weeklyPrice ?? null,
      botScore: verdict.score,
      // Hashed, not stored raw: enough to spot abuse patterns, not enough to
      // constitute retained personal data.
      ipHash: createHash('sha256').update(`${ip}:${process.env.IP_SALT ?? 'cc'}`).digest('hex').slice(0, 16),
      userAgent: request.headers.get('user-agent'),
    }

    // 5. Deliver
    const report = await deliverLead(lead, requestId)

    if (!report.persisted) {
      // The durability guarantee failed. Tell the truth and offer the phone.
      return NextResponse.json(
        {
          ok: false,
          error: 'We could not save your enquiry. Please call us on 07 3608 5993.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      reference: id,
      estimate: bay
        ? { bayId: bay.id, bayName: bay.name, weeklyPrice: bay.weeklyPrice, dimensions: bay.dimensions }
        : null,
    })
  } catch (error) {
    captureException(error, { requestId, route: 'quote' })
    return NextResponse.json(
      { ok: false, error: 'Something went wrong on our end. Please call us on 07 3608 5993.' },
      { status: 500 },
    )
  }
}
