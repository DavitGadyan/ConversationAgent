import type { Lead, LeadSink } from '../types'
import { leadEmailHtml, leadEmailText, leadSummaryLine } from '../format'
import { logger } from '@/lib/monitoring/logger'

/**
 * Email notification via Resend.
 *
 * Resend is used through plain fetch rather than its SDK — one less dependency
 * for a single POST. Swapping to SendGrid/Postmark/SES means changing the URL
 * and the body shape in one function.
 *
 * With no API key configured the sink prints the email to the server console
 * instead, so `npm run dev` demonstrates the full flow with zero setup.
 */

export const emailSink: LeadSink = {
  name: 'email',

  isEnabled() {
    // Always "enabled": with no key it falls back to a console render, which is
    // what makes the out-of-the-box dev experience work.
    return true
  },

  async send(lead: Lead) {
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.LEAD_EMAIL_TO
    const from = process.env.LEAD_EMAIL_FROM ?? 'leads@caravanconcierge.com.au'

    if (!apiKey || !to) {
      logger.info('email sink: no credentials, rendering to console', {
        leadId: lead.id,
        preview: leadSummaryLine(lead),
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n${'─'.repeat(60)}\n${leadEmailText(lead)}${'─'.repeat(60)}\n`)
      }
      return
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()),
        reply_to: lead.email || undefined,
        subject: `New storage enquiry — ${leadSummaryLine(lead)}`,
        html: leadEmailHtml(lead),
        text: leadEmailText(lead),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      throw new Error(`Resend responded ${res.status}: ${await res.text().catch(() => '')}`)
    }
  },
}
