import { NextResponse } from 'next/server'
import { z } from 'zod'
import { recordTelemetry } from '@/lib/monitoring/telemetry-store'
import { clientIp, rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { logger } from '@/lib/monitoring/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const vitalSchema = z.object({
  name: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']),
  value: z.number(),
  rawValue: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  budget: z.number().nullable(),
  id: z.string().max(80),
  navigationType: z.string().max(40).optional(),
  path: z.string().max(200),
  connection: z.string().max(20).nullable(),
  ts: z.number(),
})

/**
 * Real-user Web Vitals ingestion.
 *
 * Anything over budget is logged at warn level so it shows up in whatever log
 * drain the host provides — a slow LCP on mobile is a conversion problem, and it
 * should not require someone to remember to open a dashboard to find out.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`vitals:${clientIp(request.headers)}`, LIMITS.events)
  if (!limit.success) return new NextResponse(null, { status: 429 })

  const body = await request.json().catch(() => null)
  const parsed = vitalSchema.safeParse(body)
  if (!parsed.success) return new NextResponse(null, { status: 204 })

  const vital = parsed.data
  await recordTelemetry({ kind: 'vital', ...vital })

  if (vital.rating === 'poor') {
    logger.warn('web vital over budget', {
      route: 'vitals',
      metric: vital.name,
      value: vital.rawValue,
      budget: vital.budget,
      path: vital.path,
      connection: vital.connection,
    })
  }

  // 204 keeps the response body empty — this is fire-and-forget from the client.
  return new NextResponse(null, { status: 204 })
}
