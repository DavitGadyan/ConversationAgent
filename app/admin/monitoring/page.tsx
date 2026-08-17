import type { Metadata } from 'next'
import { readTelemetry, type TelemetryRecord } from '@/lib/monitoring/telemetry-store'
import { sinkStatus } from '@/lib/leads/deliver'
import { BUDGETS } from '@/lib/monitoring/budgets'
import { cn } from '@/lib/utils'
import { TOTAL_STEPS } from '@/lib/schema/quote'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Monitoring',
  robots: { index: false, follow: false },
}

/**
 * Internal monitoring dashboard.
 *
 * Answers the two questions that matter operationally:
 *
 *   1. Is the page fast for real visitors? (field Web Vitals, not lab scores)
 *   2. Where in the form are people giving up?
 *
 * The funnel table is the one the current site cannot produce at all. It reads
 * from first-party events, so it stays complete even for visitors who decline
 * cookies.
 *
 * NOTE: this route is unauthenticated and marked noindex. Put it behind your
 * host's access control (Vercel deployment protection, or a proxy auth rule)
 * before exposing it publicly — see SECURITY.md.
 */
export default async function MonitoringPage() {
  const records = await readTelemetry(2_000)
  const vitals = records.filter((r) => r.kind === 'vital')
  const events = records.filter((r) => r.kind === 'event')

  const vitalNames = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const

  return (
    <main id="main" tabIndex={-1} className="py-12">
      <div className="container-page max-w-5xl">
        <p className="mb-4">
          <span className="pill-label">Internal</span>
        </p>
        <h1 className="display-md text-ink">Monitoring</h1>
        <p className="mt-3 text-[15px] text-muted">
          {records.length === 0
            ? 'No telemetry recorded yet. Load the landing page and complete a form step to populate this.'
            : `${records.length} records in the current window.`}
        </p>

        {/* Integrations */}
        <section className="mt-10" aria-labelledby="integrations">
          <h2 id="integrations" className="text-[13px] font-semibold uppercase tracking-wider text-faint">
            Lead delivery
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(sinkStatus()).map(([name, enabled]) => (
              <span
                key={name}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-medium',
                  enabled ? 'bg-tile-mint text-[#1B7A55]' : 'bg-sunken text-muted',
                )}
              >
                {name}: {enabled ? 'live' : 'not configured'}
              </span>
            ))}
          </div>
        </section>

        {/* Web Vitals */}
        <section className="mt-10" aria-labelledby="vitals">
          <h2 id="vitals" className="text-[13px] font-semibold uppercase tracking-wider text-faint">
            Real-user Web Vitals — 75th percentile
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {vitalNames.map((name) => {
              const samples = vitals
                .filter((v) => v.name === name)
                .map((v) => Number(v.rawValue))
                .filter((n) => Number.isFinite(n))
                .sort((a, b) => a - b)

              const p75 = samples.length
                ? samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.75))]!
                : null

              const budget = BUDGETS[name]
              const over = p75 !== null && p75 > budget

              return (
                <div key={name} className="card-surface p-4">
                  <p className="text-[12px] font-medium text-muted">{name}</p>
                  <p
                    className={cn(
                      'mt-1 font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.02em]',
                      p75 === null ? 'text-faint' : over ? 'text-danger' : 'text-success',
                    )}
                  >
                    {p75 === null
                      ? '—'
                      : name === 'CLS'
                        ? p75.toFixed(3)
                        : `${Math.round(p75)}ms`}
                  </p>
                  <p className="mt-1 text-[11px] text-faint">
                    budget {name === 'CLS' ? budget : `${budget}ms`} · n={samples.length}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Funnel */}
        <section className="mt-10" aria-labelledby="funnel">
          <h2 id="funnel" className="text-[13px] font-semibold uppercase tracking-wider text-faint">
            Form funnel — where people stop
          </h2>
          <FunnelTable events={events} />
        </section>

        {/* Segments */}
        <section className="mt-10" aria-labelledby="segments">
          <h2 id="segments" className="text-[13px] font-semibold uppercase tracking-wider text-faint">
            Segment selections
          </h2>
          <CountTable
            events={events}
            eventName="segment_selected"
            key0="segment"
            empty="No segment selections recorded yet."
          />
        </section>

        {/* Raw events */}
        <section className="mt-10" aria-labelledby="raw">
          <h2 id="raw" className="text-[13px] font-semibold uppercase tracking-wider text-faint">
            Event counts
          </h2>
          <CountTable events={events} eventName={null} key0="name" empty="No events yet." />
        </section>
      </div>
    </main>
  )
}

function FunnelTable({ events }: { events: TelemetryRecord[] }) {
  const viewed = (step: number) =>
    events.filter((e) => e.name === 'form_step_viewed' && Number(e.step) === step).length
  const completed = (step: number) =>
    events.filter((e) => e.name === 'form_step_completed' && Number(e.step) === step).length

  const submitted = events.filter((e) => e.name === 'quote_submitted').length

  const rows = Array.from({ length: TOTAL_STEPS }, (_, i) => {
    const step = i + 1
    const v = viewed(step)
    const c = completed(step)
    return {
      step,
      viewed: v,
      completed: c,
      rate: v > 0 ? Math.round((c / v) * 100) : null,
    }
  })

  if (rows.every((r) => r.viewed === 0)) {
    return (
      <p className="mt-3 rounded-[20px] border border-dashed border-line p-5 text-[15px] text-muted">
        No form activity recorded yet.
      </p>
    )
  }

  return (
    <div className="card-surface mt-3 overflow-hidden">
      <table className="w-full text-left text-[14px]">
        <thead className="border-b border-line text-[12px] uppercase tracking-wider text-faint">
          <tr>
            <th className="px-5 py-3 font-medium">Step</th>
            <th className="px-5 py-3 font-medium">Viewed</th>
            <th className="px-5 py-3 font-medium">Completed</th>
            <th className="px-5 py-3 font-medium">Continue rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.step}>
              <td className="px-5 py-3 font-medium text-ink">Step {row.step}</td>
              <td className="px-5 py-3 text-muted">{row.viewed}</td>
              <td className="px-5 py-3 text-muted">{row.completed}</td>
              <td
                className={cn(
                  'px-5 py-3 font-medium',
                  row.rate === null ? 'text-faint' : row.rate < 60 ? 'text-danger' : 'text-ink',
                )}
              >
                {row.rate === null ? '—' : `${row.rate}%`}
              </td>
            </tr>
          ))}
          <tr className="bg-highlight-soft">
            <td className="px-5 py-3 font-semibold text-ink">Submitted</td>
            <td className="px-5 py-3" colSpan={3}>
              <span className="font-semibold text-ink">{submitted}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function CountTable({
  events,
  eventName,
  key0,
  empty,
}: {
  events: TelemetryRecord[]
  eventName: string | null
  key0: string
  empty: string
}) {
  const source = eventName ? events.filter((e) => e.name === eventName) : events
  const counts = new Map<string, number>()

  for (const e of source) {
    const key = String(e[key0] ?? 'unknown')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1])

  if (rows.length === 0) {
    return (
      <p className="mt-3 rounded-[20px] border border-dashed border-line p-5 text-[15px] text-muted">
        {empty}
      </p>
    )
  }

  return (
    <div className="card-surface mt-3 overflow-hidden">
      <table className="w-full text-left text-[14px]">
        <tbody className="divide-y divide-line">
          {rows.map(([key, count]) => (
            <tr key={key}>
              <td className="px-5 py-2.5 text-ink">{key}</td>
              <td className="px-5 py-2.5 text-right font-medium text-muted">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
