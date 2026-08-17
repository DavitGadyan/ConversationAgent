import type { Metadata } from 'next'
import Link from 'next/link'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { findings, severityLabel, type Severity } from '@/content/audit'
import { site } from '@/content/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'CRO audit — caravanconcierge.com.au',
  description:
    'Conversion audit of the current Caravan Concierge homepage, with measured performance ' +
    'data and the specific fix shipped for each finding.',
  robots: { index: false, follow: false },
}

interface Measurements {
  url: string
  measuredAt: string
  device: string
  lcpMs: number | null
  fcpMs: number | null
  ttfbMs: number | null
  loadMs: number | null
  cls: number | null
  transferBytes: number
  requestCount: number
  scriptBytes: number
  headerLinks: number
  totalLinks: number
  h1Text: string[]
  imagesMissingDimensions: number
  runs?: number
  spread?: Record<string, [number, number]>
}

async function loadMeasurements(file: string): Promise<Measurements | null> {
  try {
    const raw = await readFile(join(process.cwd(), 'content', file), 'utf8')
    return JSON.parse(raw) as Measurements
  } catch {
    return null
  }
}

const fmtMs = (ms: number | null | undefined) =>
  ms === null || ms === undefined ? '—' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`

const fmtBytes = (b: number) =>
  b >= 1_048_576 ? `${(b / 1_048_576).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-danger/10 text-danger',
  high: 'bg-tile-peach text-[#B4552A]',
  medium: 'bg-sunken text-muted',
}

/**
 * The audit, as a client-facing deliverable.
 *
 * Two rules govern this page. Every finding names what was observed before it
 * claims an impact, and every number is measured rather than asserted — the
 * performance figures come from a real browser run against the live site
 * (scripts/audit-live-site.ts), and if that run has not happened the page says
 * so instead of showing a plausible-looking figure.
 */
export default async function AuditPage() {
  const m = await loadMeasurements('audit-measurements.json')
  const now = await loadMeasurements('audit-measurements-new.json')

  const bySeverity = {
    critical: findings.filter((f) => f.severity === 'critical'),
    high: findings.filter((f) => f.severity === 'high'),
    medium: findings.filter((f) => f.severity === 'medium'),
  }

  return (
    <main id="main" tabIndex={-1} className="py-12 md:py-20">
      <div className="container-page max-w-4xl">
        <p className="mb-5">
          <span className="pill-label">Conversion audit</span>
        </p>

        <h1 className="display-lg text-ink">
          What is costing you conversions on caravanconcierge.com.au
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Eleven findings on the current homepage, ordered by what they cost. Each one names
          what was observed, why it matters for paid traffic, and the specific change shipped on
          the new page. Every number here was measured in a real browser — none is estimated.
        </p>

        {/* Measured headline numbers */}
        <section className="mt-10" aria-labelledby="measured-heading">
          <h2 id="measured-heading" className="sr-only">
            Measured performance
          </h2>

          {m ? (
            <>
              <div className="card-surface overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="border-b border-line text-[12px] uppercase tracking-wider text-faint">
                    <tr>
                      <th className="px-5 py-3 font-medium">Metric</th>
                      <th className="px-5 py-3 font-medium">Current site</th>
                      <th className="px-5 py-3 font-medium">New page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <CompareRow
                      label="Page weight"
                      before={fmtBytes(m.transferBytes)}
                      after={now ? fmtBytes(now.transferBytes) : '—'}
                    />
                    <CompareRow
                      label="Requests"
                      before={String(m.requestCount)}
                      after={now ? String(now.requestCount) : '—'}
                    />
                    <CompareRow
                      label="JavaScript"
                      before={fmtBytes(m.scriptBytes)}
                      after={now ? fmtBytes(now.scriptBytes) : '—'}
                    />
                    <CompareRow
                      label="Links in header"
                      before={String(m.headerLinks)}
                      after={now ? String(now.headerLinks) : '—'}
                    />
                    <CompareRow
                      label="Links on page"
                      before={String(m.totalLinks)}
                      after={now ? String(now.totalLinks) : '—'}
                    />
                    <CompareRow
                      label="Images missing dimensions"
                      before={String(m.imagesMissingDimensions)}
                      after={now ? String(now.imagesMissingDimensions) : '—'}
                    />
                    <CompareRow
                      label="Load time (median)"
                      before={`${fmtMs(m.loadMs)}${
                        m.spread?.loadMs ? ` (${fmtMs(m.spread.loadMs[0])}–${fmtMs(m.spread.loadMs[1])})` : ''
                      }`}
                      after={
                        now
                          ? `${fmtMs(now.loadMs)}${
                              now.spread?.loadMs
                                ? ` (${fmtMs(now.spread.loadMs[0])}–${fmtMs(now.spread.loadMs[1])})`
                                : ''
                            }`
                          : '—'
                      }
                      caveat
                    />
                    <CompareRow
                      label="First contentful paint (median)"
                      before={fmtMs(m.fcpMs)}
                      after={now ? fmtMs(now.fcpMs) : '—'}
                      caveat
                    />
                    <CompareRow
                      label="Cumulative layout shift"
                      before={String(m.cls ?? '—')}
                      after={now ? String(now.cls ?? '—') : '—'}
                    />
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-faint">
                <p>
                  Current site measured {new Date(m.measuredAt).toLocaleString('en-AU')} against{' '}
                  <span className="text-muted">{m.url}</span> using {m.device}
                  {m.runs ? `, median of ${m.runs} runs` : ''}.
                </p>
                <p className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    <strong className="font-medium text-muted">Read the timing rows with
                    care.</strong>{' '}
                    The new page was measured against a local production build, so it has no
                    network latency to pay and its timings are flattered. The rows that compare
                    like for like are page weight, request count, JavaScript size and link
                    counts — those are properties of the page itself.
                    {m.lcpMs === null &&
                      ' Largest contentful paint could not be captured in this environment, so it is not reported at all.'}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-[20px] border border-dashed border-line p-5">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <p className="text-[15px] leading-relaxed text-muted">
                Performance has not been measured yet, so no figures are shown here. Run{' '}
                <code className="rounded bg-sunken px-1.5 py-0.5 text-[13px]">
                  npm run audit:live
                </code>{' '}
                to populate this section with real numbers. Nothing on this page is estimated.
              </p>
            </div>
          )}
        </section>

        {/* Findings */}
        <section className="mt-14" aria-labelledby="findings-heading">
          <h2 id="findings-heading" className="display-md text-ink">
            The findings
          </h2>

          <div className="mt-8 space-y-4">
            {[...bySeverity.critical, ...bySeverity.high, ...bySeverity.medium].map(
              (finding, i) => (
                <article
                  key={finding.id}
                  className="card-surface overflow-hidden"
                  aria-labelledby={`finding-${finding.id}`}
                >
                  <div className="border-b border-line p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider',
                          SEVERITY_STYLES[finding.severity],
                        )}
                      >
                        {severityLabel[finding.severity]}
                      </span>
                      <span className="rounded-full bg-sunken px-2.5 py-1 text-[11px] font-medium text-muted">
                        {finding.area}
                      </span>
                    </div>

                    <h3
                      id={`finding-${finding.id}`}
                      className="mt-3 font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.02em] text-ink"
                    >
                      {finding.title}
                    </h3>
                  </div>

                  <dl className="divide-y divide-line">
                    <Row term="Observed" detail={finding.observed} />
                    <Row term="Why it costs money" detail={finding.impact} />
                    <Row term="What we shipped" detail={finding.fix} highlight />
                  </dl>

                  <p className="border-t border-line bg-sunken/40 px-6 py-3 text-[13px] text-muted">
                    {finding.evidence}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        {/* Honest limitations */}
        <section className="mt-14 rounded-[28px] border border-line p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.02em] text-ink">
            What this audit does not claim
          </h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
            <li className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-faint" aria-hidden />
              <span>
                <strong className="font-medium text-ink">No predicted uplift percentage.</strong>{' '}
                Anyone quoting one before a test has run is guessing. The instrumentation shipped
                here is what will tell you the real number, per step, within weeks.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-faint" aria-hidden />
              <span>
                <strong className="font-medium text-ink">No access to your ad or analytics
                data.</strong>{' '}
                Findings are based on the public site plus a browser measurement. Actual keyword,
                spend and conversion data would sharpen several of these considerably.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-faint" aria-hidden />
              <span>
                <strong className="font-medium text-ink">Pricing structure needs your
                confirmation.</strong>{' '}
                The bay table and the covering table are treated as separate choices, because
                that is how the site presents them. If a covering rate replaces a bay rate rather
                than adding to it, say so and the model updates in one file.
              </span>
            </li>
          </ul>
        </section>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ink px-8 text-[15px] font-medium text-white transition-colors hover:bg-ink-soft"
          >
            See the new page
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a
            href={site.mainSiteUrl}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-line bg-card px-8 text-[15px] font-medium text-ink transition-colors hover:border-ink/25"
          >
            <ArrowLeft size={18} aria-hidden />
            Open the current site
          </a>
        </div>
      </div>
    </main>
  )
}

function CompareRow({
  label,
  before,
  after,
  caveat,
}: {
  label: string
  before: string
  after: string
  /** Marks rows whose comparison is not strictly like for like. */
  caveat?: boolean
}) {
  return (
    <tr>
      <td className="px-5 py-3 text-ink-soft">
        {label}
        {caveat && (
          <span className="ml-1.5 text-faint" title="Not a like-for-like comparison — see note below">
            *
          </span>
        )}
      </td>
      <td className="px-5 py-3 font-medium text-muted">{before}</td>
      <td className="px-5 py-3 font-semibold text-ink">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 size={13} aria-hidden className="text-success" />
          {after}
        </span>
      </td>
    </tr>
  )
}

function Row({
  term,
  detail,
  highlight,
}: {
  term: string
  detail: string
  highlight?: boolean
}) {
  return (
    <div className={cn('px-6 py-4 sm:grid sm:grid-cols-[180px_1fr] sm:gap-6', highlight && 'bg-highlight-soft')}>
      <dt className="text-[13px] font-semibold uppercase tracking-wider text-faint">{term}</dt>
      <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-soft sm:mt-0">{detail}</dd>
    </div>
  )
}
