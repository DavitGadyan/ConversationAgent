import type { Lead, LeadSink, SinkResult } from './types'
import { storeSink } from './sinks/store'
import { emailSink } from './sinks/email'
import { webhookSink } from './sinks/webhook'
import { sheetsSink } from './sinks/sheets'
import { smsSink } from './sinks/sms'
import { logger } from '@/lib/monitoring/logger'

/**
 * Lead delivery fan-out.
 *
 * Contract:
 *   1. The local store is written FIRST and awaited. If that succeeds the lead
 *      is safe and the visitor gets a success response, whatever else happens.
 *   2. Every other sink then runs CONCURRENTLY and independently. One provider
 *      being down must never stop the others — losing a lead because Twilio
 *      rate-limited you is unacceptable.
 *   3. Each sink gets one retry with backoff, then gives up and is logged.
 *   4. Disabled sinks (no env vars) are skipped silently, so the app runs with
 *      zero configuration and grows into the integrations later.
 */

const NOTIFY_SINKS: LeadSink[] = [emailSink, smsSink, webhookSink, sheetsSink]

const RETRY_DELAY_MS = 600

async function runSink(sink: LeadSink, lead: Lead, requestId: string): Promise<SinkResult> {
  const started = Date.now()

  if (!sink.isEnabled()) {
    return { sink: sink.name, ok: true, skipped: true, durationMs: 0 }
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await sink.send(lead)
      return { sink: sink.name, ok: true, durationMs: Date.now() - started }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      if (attempt === 2) {
        logger.error('lead sink failed', {
          requestId,
          sink: sink.name,
          leadId: lead.id,
          error: message,
        })
        return { sink: sink.name, ok: false, error: message, durationMs: Date.now() - started }
      }

      logger.warn('lead sink failed, retrying', { requestId, sink: sink.name, error: message })
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
    }
  }

  // Unreachable: the loop either returns or throws.
  return { sink: sink.name, ok: false, error: 'exhausted', durationMs: Date.now() - started }
}

export interface DeliveryReport {
  persisted: boolean
  results: SinkResult[]
}

export async function deliverLead(lead: Lead, requestId: string): Promise<DeliveryReport> {
  // Step 1 — durability. Awaited, and allowed to throw.
  const storeResult = await runSink(storeSink, lead, requestId)

  // Step 2 — notifications. Never allowed to fail the request.
  const notifyResults = await Promise.all(
    NOTIFY_SINKS.map((sink) => runSink(sink, lead, requestId)),
  )

  const results = [storeResult, ...notifyResults]

  logger.info('lead delivered', {
    requestId,
    leadId: lead.id,
    delivered: results.filter((r) => r.ok && !r.skipped).map((r) => r.sink),
    skipped: results.filter((r) => r.skipped).map((r) => r.sink),
    failed: results.filter((r) => !r.ok).map((r) => r.sink),
  })

  return { persisted: storeResult.ok, results }
}

/** Which integrations are live — surfaced by /api/health. */
export function sinkStatus(): Record<string, boolean> {
  return Object.fromEntries(
    [storeSink, ...NOTIFY_SINKS].map((sink) => [sink.name, sink.isEnabled()]),
  )
}
