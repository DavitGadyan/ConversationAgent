import { NextResponse } from 'next/server'
import { z } from 'zod'
import { recordTelemetry } from '@/lib/monitoring/telemetry-store'
import { clientIp, rateLimit, LIMITS } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * First-party funnel events.
 *
 * This is the endpoint that answers the question the current site cannot: where
 * exactly do people stop? Because it stores no cross-site identifier and never
 * leaves our own origin, it works with or without cookie consent — so the CRO
 * data stays complete even when a visitor declines tracking.
 *
 * The schema is permissive on payload but strict on shape and size: this is a
 * public write endpoint, and it should never become a free object store.
 */
const eventSchema = z
  .object({
    name: z.string().min(1).max(60),
    ts: z.number().optional(),
    session_id: z.string().max(60).optional(),
  })
  .catchall(z.union([z.string().max(300), z.number(), z.boolean(), z.null()]))

export async function POST(request: Request) {
  const limit = rateLimit(`events:${clientIp(request.headers)}`, LIMITS.events)
  if (!limit.success) return new NextResponse(null, { status: 429 })

  const body = await request.json().catch(() => null)
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return new NextResponse(null, { status: 204 })

  const { name, ts, ...rest } = parsed.data

  // Cap the number of custom keys so a malformed or hostile client cannot
  // balloon a single record.
  const trimmed = Object.fromEntries(Object.entries(rest).slice(0, 20))

  await recordTelemetry({ kind: 'event', name, ts: ts ?? Date.now(), ...trimmed })

  return new NextResponse(null, { status: 204 })
}
