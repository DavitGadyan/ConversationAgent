import type { Lead, LeadSink } from '../types'
import { leadSms } from '../format'

/**
 * Instant SMS alert via Twilio.
 *
 * This is the highest-leverage sink in the pipeline. Speed-to-lead is the single
 * best-evidenced driver of close rate in local services — a callback inside five
 * minutes converts dramatically better than one the next morning. Email gets
 * checked when it gets checked; a text gets read now.
 *
 * Plain fetch against Twilio's REST API; no SDK required for one POST.
 */

export const smsSink: LeadSink = {
  name: 'sms',

  isEnabled() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM &&
        process.env.LEAD_SMS_TO,
    )
  },

  async send(lead: Lead) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM
    const to = process.env.LEAD_SMS_TO
    if (!sid || !token || !from || !to) return

    const auth = Buffer.from(`${sid}:${token}`).toString('base64')

    // Notify every number in LEAD_SMS_TO, so the owner and the site manager can
    // both be alerted without a second integration.
    const recipients = to.split(',').map((s) => s.trim()).filter(Boolean)

    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: from, To: recipient, Body: leadSms(lead) }),
          signal: AbortSignal.timeout(10_000),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text().catch(() => '')}`)
        }),
      ),
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length === recipients.length) {
      throw new Error(`All ${recipients.length} SMS sends failed`)
    }
  },
}
