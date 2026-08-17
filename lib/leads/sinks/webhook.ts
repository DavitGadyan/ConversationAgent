import { createHmac } from 'node:crypto'
import type { Lead, LeadSink } from '../types'

/**
 * Generic webhook for Zapier / Make / HubSpot / GoHighLevel.
 *
 * Payload is a flat, stable shape so a no-code tool can map fields without
 * digging through nesting. When LEAD_WEBHOOK_SECRET is set we sign the body
 * (HMAC-SHA256, same convention as Stripe) so the receiver can verify it really
 * came from us — lead data is worth spoofing if a competitor knows the URL.
 */

export const webhookSink: LeadSink = {
  name: 'webhook',

  isEnabled() {
    return Boolean(process.env.LEAD_WEBHOOK_URL)
  },

  async send(lead: Lead) {
    const url = process.env.LEAD_WEBHOOK_URL
    if (!url) return

    const payload = {
      id: lead.id,
      received_at: lead.receivedAt,
      name: lead.name,
      phone: lead.phone,
      email: lead.email ?? '',
      vehicle_type: lead.vehicleType,
      length_metres: lead.lengthMetres,
      postcode: lead.postcode,
      timeline: lead.timeline,
      duration: lead.duration,
      covering: lead.covering,
      needs_power: lead.needsPower,
      needs_pickup: lead.needsPickup,
      notes: lead.notes ?? '',
      recommended_bay: lead.recommendedBay?.name ?? '',
      recommended_bay_size: lead.recommendedBay?.dimensions ?? '',
      estimated_weekly_aud: lead.estimatedWeekly ?? '',
      segment: lead.segment ?? '',
      utm_source: lead.utm_source ?? '',
      utm_medium: lead.utm_medium ?? '',
      utm_campaign: lead.utm_campaign ?? '',
      gclid: lead.gclid ?? '',
      referrer: lead.referrer ?? '',
    }

    const body = JSON.stringify(payload)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    const secret = process.env.LEAD_WEBHOOK_SECRET
    if (secret) {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
      headers['X-CC-Timestamp'] = timestamp
      headers['X-CC-Signature'] = `sha256=${signature}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      throw new Error(`Webhook responded ${res.status}`)
    }
  },
}
