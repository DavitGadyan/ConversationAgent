import type { Quote } from '@/lib/schema/quote'
import type { Bay } from '@/content/pricing'

/** A validated submission plus everything the server worked out about it. */
export interface Lead extends Quote {
  id: string
  receivedAt: string
  /** Bay our recommender matched, so the callback starts from a real number. */
  recommendedBay: Bay | null
  estimatedWeekly: number | null
  /** Bot heuristics score, kept for tuning the thresholds later. */
  botScore: number
  ipHash: string
  userAgent: string | null
}

export interface SinkResult {
  sink: string
  ok: boolean
  skipped?: boolean
  error?: string
  durationMs: number
}

export interface LeadSink {
  name: string
  /** False when the sink's env vars are absent — it then no-ops cleanly. */
  isEnabled(): boolean
  send(lead: Lead): Promise<void>
}
