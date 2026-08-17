import type { Lead } from './types'
import { formatMoney } from '@/lib/utils'

/**
 * One place that decides how a lead reads, so the email, the SMS and the Sheet
 * row never drift apart.
 *
 * Ordering is deliberate: whoever picks up the phone needs the name, the number
 * and the vehicle first. Attribution is last — useful for the ad account, not
 * for the call.
 */

export function leadSummaryLine(lead: Lead): string {
  const price = lead.estimatedWeekly ? ` · ~${formatMoney(lead.estimatedWeekly)}/wk` : ''
  return `${lead.name} · ${lead.vehicleType} ${lead.lengthMetres}m · ${lead.postcode}${price}`
}

/** Short enough for a single SMS segment where possible. */
export function leadSms(lead: Lead): string {
  const bay = lead.recommendedBay ? ` (${lead.recommendedBay.dimensions})` : ''
  return [
    `NEW LEAD: ${lead.name}`,
    lead.phone,
    `${lead.vehicleType} ${lead.lengthMetres}m${bay}`,
    `${lead.postcode} · ${lead.timeline}`,
  ].join('\n')
}

export function leadFields(lead: Lead): Array<[string, string]> {
  return [
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email || '—'],
    ['Vehicle', `${lead.vehicleType} · ${lead.lengthMetres}m`],
    ['Postcode', lead.postcode],
    ['Timeline', lead.timeline],
    ['Duration', lead.duration],
    ['Storage type', lead.covering],
    ['Power needed', lead.needsPower ? 'Yes' : 'No'],
    ['Pickup/delivery', lead.needsPickup ? 'Yes — quote required' : 'No'],
    [
      'Recommended bay',
      lead.recommendedBay
        ? `${lead.recommendedBay.name} (${lead.recommendedBay.dimensions}) — ${formatMoney(
            lead.recommendedBay.weeklyPrice,
          )}/week`
        : 'No standard bay fits — call to discuss',
    ],
    ['Notes', lead.notes || '—'],
    ['Segment', lead.segment || '—'],
    ['Source', lead.utm_source || (lead.gclid ? 'google-ads' : '—')],
    ['Campaign', lead.utm_campaign || '—'],
    ['Received', new Date(lead.receivedAt).toLocaleString('en-AU')],
  ]
}

export function leadEmailText(lead: Lead): string {
  const rows = leadFields(lead)
    .map(([k, v]) => `${k.padEnd(18)}${v}`)
    .join('\n')
  return `New storage enquiry\n\n${rows}\n\nCall back: ${lead.phone}\nLead ID: ${lead.id}\n`
}

export function leadEmailHtml(lead: Lead): string {
  const rows = leadFields(lead)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#6b6b70;font-size:14px;white-space:nowrap;vertical-align:top">${escapeHtml(
          k,
        )}</td><td style="padding:8px 0;color:#0b0b0c;font-size:14px;font-weight:500">${escapeHtml(
          v,
        )}</td></tr>`,
    )
    .join('')

  return `<!doctype html>
<html><body style="margin:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border-radius:20px;padding:28px">
      <p style="margin:0 0 4px;font-size:13px;color:#6b6b70">New storage enquiry</p>
      <h1 style="margin:0 0 20px;font-size:24px;color:#0b0b0c;letter-spacing:-0.02em">${escapeHtml(
        leadSummaryLine(lead),
      )}</h1>
      <a href="tel:${escapeHtml(lead.phone)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;font-size:15px">Call ${escapeHtml(
        lead.name,
      )}</a>
      <table style="width:100%;margin-top:24px;border-collapse:collapse">${rows}</table>
      <p style="margin:24px 0 0;font-size:12px;color:#9a9aa1">Lead ID ${escapeHtml(lead.id)}</p>
    </div>
  </div>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
