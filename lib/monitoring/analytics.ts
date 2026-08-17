'use client'

/**
 * Typed analytics event bus.
 *
 * The point of this file is CRO, not vanity metrics. Every event here answers a
 * specific question about where money is leaking:
 *
 *   segment_selected      → which vehicle types actually arrive from the ads
 *   form_step_viewed/completed → per-step drop-off (the single most valuable
 *                          number on this page; the old form gave none of it)
 *   estimate_viewed       → did the price reward land before they bailed
 *   quote_submitted       → the conversion
 *   call_clicked          → the conversion that never touches the form
 *
 * Adapters fan out to GA4 and Meta Pixel if their IDs are configured, and are
 * gated behind consent. With no consent and no IDs, events still flow to the
 * first-party /api/vitals sink so the funnel works without third parties.
 */

export type AnalyticsEvent =
  | { name: 'page_view'; segment: string }
  | { name: 'segment_selected'; segment: string; source: 'chip' | 'url' }
  | { name: 'form_step_viewed'; step: number }
  | { name: 'form_step_completed'; step: number; msOnStep: number }
  | { name: 'form_field_error'; step: number; field: string }
  | { name: 'estimate_viewed'; bayId: string; weeklyPrice: number }
  | { name: 'size_finder_used'; lengthMetres: number; bayId: string | null }
  | { name: 'savings_calculated'; annualSaving: number }
  | { name: 'quote_submitted'; segment: string; vehicleType: string; weeklyPrice: number | null }
  | { name: 'quote_failed'; reason: string }
  | { name: 'call_clicked'; placement: string }
  | { name: 'sms_clicked'; placement: string }
  | { name: 'concierge_opened'; placement: string }
  | { name: 'concierge_completed'; segment: string }
  | { name: 'faq_opened'; question: string }
  | { name: 'gallery_opened'; imageId: string }

type ConsentState = 'granted' | 'denied' | 'unknown'

const CONSENT_KEY = 'cc_consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unknown'
  const v = window.localStorage.getItem(CONSENT_KEY)
  return v === 'granted' || v === 'denied' ? v : 'unknown'
}

export function setConsent(state: Exclude<ConsentState, 'unknown'>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, state)
  // Google Consent Mode v2 — required for EEA/UK traffic and increasingly for AU.
  window.gtag?.('consent', 'update', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  })
  window.dispatchEvent(new CustomEvent('cc:consent', { detail: state }))
}

/** A stable per-visit id so first-party funnel events can be stitched together. */
function sessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const KEY = 'cc_sid'
  let id = window.sessionStorage.getItem(KEY)
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    window.sessionStorage.setItem(KEY, id)
  }
  return id
}

/** Meta Pixel expects a small set of standard event names; map ours onto them. */
const META_STANDARD: Partial<Record<AnalyticsEvent['name'], string>> = {
  quote_submitted: 'Lead',
  call_clicked: 'Contact',
  form_step_completed: 'InitiateCheckout',
}

export function track(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return

  const { name, ...params } = event
  const payload = { ...params, session_id: sessionId() }

  // 1. First-party sink — always on, no consent required (no cross-site identifiers).
  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...payload, ts: Date.now() }),
    keepalive: true,
  }).catch(() => {
    /* analytics must never break the page */
  })

  // 2. Third-party adapters — consent-gated.
  if (getConsent() !== 'granted') return

  window.gtag?.('event', name, payload)

  const metaName = META_STANDARD[name]
  if (metaName) window.fbq?.('track', metaName, payload)

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, payload)
  }
}

/** Pulls ad attribution off the URL so it can ride along with the lead. */
export function captureAttribution(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const keys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
  ]
  const out: Record<string, string> = {}
  for (const k of keys) {
    const v = params.get(k)
    if (v) out[k] = v.slice(0, 200)
  }
  if (document.referrer) out.referrer = document.referrer.slice(0, 500)
  return out
}
