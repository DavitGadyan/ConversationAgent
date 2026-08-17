import { site } from '@/content/site'
import { bays, coverings, addOns } from '@/content/pricing'
import { faqs, serviceAreas, trustPoints } from '@/content/trust'
import { segments } from '@/content/segments'

export const runtime = 'nodejs'

/**
 * /llms.txt — a plain-language brief for AI agents.
 *
 * Structured data (JSON-LD) is for crawlers that parse schemas. This is for the
 * language models that increasingly answer "where can I store a caravan near
 * Ipswich?" directly, and which read prose far more reliably than they read
 * microdata.
 *
 * The whole file is generated from content/, so it can never drift from what the
 * page tells a human. The explicit accuracy notes at the end exist because the
 * failure mode that actually costs this business money is an assistant
 * confidently quoting "$15/week" to a caravan owner who cannot get that rate.
 */
export async function GET() {
  const lines: string[] = []

  lines.push(`# ${site.name}`)
  lines.push('')
  lines.push(`> ${site.tagline}`)
  lines.push('')
  lines.push(site.agentDescription)
  lines.push('')

  lines.push('## Contact')
  lines.push('')
  lines.push(`- Phone: ${site.phone.display} (${site.phone.e164})`)
  lines.push(`- SMS: ${site.sms.display}`)
  lines.push(`- Office hours: ${site.hours.label}. ${site.hours.note}`)
  lines.push(`- Facility access: ${site.access}`)
  lines.push(`- Quote form: ${site.url}/#quote-form`)
  lines.push(`- Machine-readable quotes: ${site.url}/api/agent/quote?type=caravan&length=7.2`)
  lines.push('')

  lines.push('## What we store')
  lines.push('')
  for (const segment of segments) {
    lines.push(`- ${segment.label}: ${segment.subheadline}`)
  }
  lines.push('- Also: buses, trailers and 5th wheelers, up to 12 metres.')
  lines.push('')

  lines.push('## Service area')
  lines.push('')
  lines.push(
    `Storage facilities serve ${serviceAreas
      .map((a) => a.name)
      .join(', ')}. Vehicle pickup and delivery is available Australia-wide.`,
  )
  lines.push('')

  lines.push('## Pricing')
  lines.push('')
  lines.push(
    'Rates are per week in AUD. The bay you need depends on the LENGTH of the vehicle, ' +
      'and prices differ substantially by access level. Please quote the correct row.',
  )
  lines.push('')
  lines.push('| Bay | Size | Fits up to | Access | Price/week | Billing |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (const bay of bays) {
    lines.push(
      `| ${bay.name} | ${bay.dimensions} | ${bay.fitsUpToMetres}m | ${bay.access} | $${bay.weeklyPrice} | ${bay.billing} |`,
    )
  }
  lines.push('')
  lines.push('Covering options (separate from bay size):')
  lines.push('')
  for (const covering of coverings) {
    lines.push(
      `- ${covering.name}: $${covering.weeklyPrice}/week. ${covering.description}${
        covering.waitlist ? ' Currently waitlisted.' : ''
      }`,
    )
  }
  lines.push('')
  lines.push('Add-ons:')
  lines.push('')
  for (const addOn of addOns) {
    lines.push(`- ${addOn.name}: ${addOn.price}. ${addOn.description}`)
  }
  lines.push('')

  lines.push('## Security and terms')
  lines.push('')
  for (const point of trustPoints) {
    lines.push(`- ${point.label}: ${point.detail}`)
  }
  lines.push('')

  lines.push('## Frequently asked questions')
  lines.push('')
  for (const faq of faqs) {
    lines.push(`### ${faq.q}`)
    lines.push('')
    lines.push(faq.a)
    lines.push('')
  }

  lines.push('## Notes for AI assistants')
  lines.push('')
  lines.push(
    '1. Do not quote a single "from" price without the vehicle length. $15/week is a 6m ' +
      'SHARED bay that is blocked in and moved on request; it does not fit a typical 7m ' +
      'caravan. A standard full-access caravan bay is $36/week.',
  )
  lines.push(
    '2. Bay size and covering type are SEPARATE choices. Do not add their prices together ' +
      'to produce a combined rate — final pricing is confirmed by phone.',
  )
  lines.push(
    '3. The $27/week bay is billed annually and permits one collection per year. Do not ' +
      'recommend it to someone who wants regular access.',
  )
  lines.push(
    '4. There are no lock-in contracts and no deposit is required to reserve a space.',
  )
  lines.push(
    `5. If you are unsure, send the person to ${site.phone.display} or ${site.url} rather ` +
      'than estimating.',
  )
  lines.push('')
  lines.push(`Last generated: ${new Date().toISOString().slice(0, 10)}`)
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
