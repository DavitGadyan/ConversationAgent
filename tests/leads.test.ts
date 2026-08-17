import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Lead } from '@/lib/leads/types'
import { redact } from '@/lib/monitoring/logger'
import { checkBotSignals } from '@/lib/security/bot'
import { rateLimit, __resetRateLimit } from '@/lib/security/rate-limit'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'CC-TEST-0001',
    receivedAt: '2026-08-16T00:00:00.000Z',
    vehicleType: 'Caravan',
    lengthMetres: 7.2,
    postcode: '4305',
    timeline: 'ASAP — within a week',
    duration: '6 – 12 months',
    covering: 'Outdoor — best value',
    needsPower: false,
    needsPickup: false,
    name: 'Jane Smith',
    phone: '0412345678',
    email: 'jane@example.com',
    notes: '',
    consent: true,
    company: '',
    recommendedBay: null,
    estimatedWeekly: 36,
    botScore: 0,
    ipHash: 'abc123',
    userAgent: 'test',
    ...overrides,
  } as Lead
}

describe('lead delivery fan-out', () => {
  let dir: string

  beforeEach(async () => {
    vi.resetModules()
    dir = await mkdtemp(join(tmpdir(), 'cc-leads-'))
    process.env.LEADS_FILE = join(dir, 'leads.jsonl')
    // Keep every optional sink disabled unless a test enables one.
    delete process.env.RESEND_API_KEY
    delete process.env.LEAD_EMAIL_TO
    delete process.env.LEAD_WEBHOOK_URL
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    delete process.env.GOOGLE_SHEET_ID
    delete process.env.TWILIO_ACCOUNT_SID
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('persists the lead to disk', async () => {
    const { deliverLead } = await import('@/lib/leads/deliver')
    const report = await deliverLead(makeLead(), 'req_test')

    expect(report.persisted).toBe(true)

    const contents = await readFile(process.env.LEADS_FILE!, 'utf8')
    expect(JSON.parse(contents.trim())).toMatchObject({ id: 'CC-TEST-0001', name: 'Jane Smith' })
  })

  it('skips unconfigured sinks cleanly rather than failing', async () => {
    const { deliverLead } = await import('@/lib/leads/deliver')
    const report = await deliverLead(makeLead(), 'req_test')

    const skipped = report.results.filter((r) => r.skipped).map((r) => r.sink)
    expect(skipped).toContain('sms')
    expect(skipped).toContain('webhook')
    expect(skipped).toContain('sheets')
    expect(report.results.every((r) => r.ok)).toBe(true)
  })

  it('still delivers to the other sinks when one fails', async () => {
    // THE important guarantee: a dead webhook must not cost the business a lead.
    process.env.LEAD_WEBHOOK_URL = 'https://webhook.invalid/hook'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    )

    const { deliverLead } = await import('@/lib/leads/deliver')
    const report = await deliverLead(makeLead(), 'req_test')

    expect(report.persisted).toBe(true)

    const webhook = report.results.find((r) => r.sink === 'webhook')
    expect(webhook?.ok).toBe(false)

    // And the lead is on disk regardless.
    const contents = await readFile(process.env.LEADS_FILE!, 'utf8')
    expect(contents).toContain('CC-TEST-0001')

    vi.unstubAllGlobals()
  })

  it('reports which integrations are live', async () => {
    const { sinkStatus } = await import('@/lib/leads/deliver')
    const status = sinkStatus()
    expect(status.store).toBe(true)
    expect(status.sms).toBe(false)
  })
})

describe('bot signals', () => {
  it('rejects a filled honeypot outright', () => {
    const verdict = checkBotSignals({ company: 'Acme', startedAt: Date.now() - 30_000 })
    expect(verdict.isBot).toBe(true)
    expect(verdict.reason).toBe('honeypot_filled')
  })

  it('accepts a human filling the form at a normal pace', () => {
    const verdict = checkBotSignals({
      company: '',
      startedAt: Date.now() - 45_000,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1.15',
    })
    expect(verdict.isBot).toBe(false)
  })

  it('flags a headless client that submits instantly', () => {
    const verdict = checkBotSignals({
      company: '',
      startedAt: Date.now() - 200,
      userAgent: 'Mozilla/5.0 HeadlessChrome/120.0',
    })
    expect(verdict.isBot).toBe(true)
  })

  it('does not reject a fast human with a real browser', () => {
    // Autofill can be quick; timing alone must never be conclusive.
    const verdict = checkBotSignals({
      company: '',
      startedAt: Date.now() - 2_000,
      userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    })
    expect(verdict.isBot).toBe(false)
  })
})

describe('rate limiting', () => {
  beforeEach(() => __resetRateLimit())

  it('allows requests up to the limit and blocks the next', () => {
    const opts = { limit: 3, windowMs: 60_000 }
    expect(rateLimit('ip-a', opts).success).toBe(true)
    expect(rateLimit('ip-a', opts).success).toBe(true)
    expect(rateLimit('ip-a', opts).success).toBe(true)

    const blocked = rateLimit('ip-a', opts)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.reset).toBeGreaterThan(Date.now())
  })

  it('tracks each client separately', () => {
    const opts = { limit: 1, windowMs: 60_000 }
    expect(rateLimit('ip-b', opts).success).toBe(true)
    expect(rateLimit('ip-c', opts).success).toBe(true)
    expect(rateLimit('ip-b', opts).success).toBe(false)
  })

  it('lets requests through again once the window slides past', () => {
    const opts = { limit: 1, windowMs: 50 }
    expect(rateLimit('ip-d', opts).success).toBe(true)
    expect(rateLimit('ip-d', opts).success).toBe(false)

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 100)
    expect(rateLimit('ip-d', opts).success).toBe(true)
    vi.useRealTimers()
  })
})

describe('log redaction', () => {
  it('never writes personal details to the log', () => {
    const redacted = redact({
      name: 'Jane Smith',
      phone: '0412345678',
      email: 'jane@example.com',
      postcode: '4305',
      vehicleType: 'Caravan',
      nested: { notes: 'Call after 5pm' },
    }) as Record<string, unknown>

    expect(redacted.name).not.toBe('Jane Smith')
    expect(redacted.phone).not.toContain('412345')
    expect(redacted.email).not.toContain('jane@example.com')
    expect(redacted.postcode).not.toBe('4305')
    expect((redacted.nested as Record<string, unknown>).notes).not.toContain('Call after 5pm')

    // Non-sensitive fields survive, or the logs become useless.
    expect(redacted.vehicleType).toBe('Caravan')
  })
})
