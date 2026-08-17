import { NextResponse } from 'next/server'
import { sinkStatus } from '@/lib/leads/deliver'
import { bays } from '@/content/pricing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Health and configuration probe.
 *
 * Point an uptime monitor at this. It answers two different questions:
 *
 *   "Is the site up?"          → status 200 and uptime
 *   "Is it wired up correctly?" → which lead sinks are live
 *
 * The second is the one that actually bites. A landing page that returns 200
 * while silently dropping every lead because an API key expired looks perfectly
 * healthy to a naive ping check. Alert on `integrations.sms === false` and you
 * will know within minutes.
 *
 * No secrets are exposed — only booleans about whether each one is present.
 */
export async function GET() {
  const sinks = sinkStatus()

  return NextResponse.json(
    {
      status: 'ok',
      service: 'caravan-concierge-lp',
      version: process.env.npm_package_version ?? '1.0.0',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      environment: process.env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      integrations: sinks,
      // A content sanity check: if this ever reads 0, the pricing data failed to
      // load and the page is quoting nothing.
      content: { bays: bays.length },
      warnings: [
        !sinks.email && 'email sink is not configured',
        !sinks.sms && 'SMS alerts are not configured — speed-to-lead will suffer',
        !sinks.webhook && 'no CRM webhook configured',
        !sinks.sheets && 'Google Sheet logging is not configured',
      ].filter(Boolean),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
