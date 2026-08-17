/**
 * Measures the live caravanconcierge.com.au homepage in a real browser.
 *
 * The audit page quotes numbers, so those numbers have to be measured rather
 * than asserted. This script drives a throttled Chromium against the live site
 * and writes the results to content/audit-measurements.json, which the audit
 * page reads. If it has never been run, the audit page says so explicitly
 * instead of showing invented figures.
 *
 *   npx tsx scripts/audit-live-site.ts [url]
 *
 * Requires Playwright's Chromium:  npx playwright install chromium
 */

import { chromium, devices } from 'playwright'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const TARGET = process.argv[2] ?? 'https://www.caravanconcierge.com.au/'
const OUTPUT = process.env.AUDIT_OUTPUT
  ? join(process.cwd(), process.env.AUDIT_OUTPUT)
  : join(process.cwd(), 'content', 'audit-measurements.json')

/**
 * Number of independent runs.
 *
 * A single page load is noisy — a cold cache versus a warm one moved TTFB on
 * this site from 1.5s to 3.0s between two consecutive runs. Reporting whichever
 * one you happened to get is how audits end up quoting numbers the client cannot
 * reproduce, so we take a median and publish the spread alongside it.
 */
const RUNS = Number(process.env.AUDIT_RUNS ?? 3)

function median(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (clean.length === 0) return null
  const mid = Math.floor(clean.length / 2)
  return clean.length % 2 === 0 ? (clean[mid - 1]! + clean[mid]!) / 2 : clean[mid]!
}

interface Measurement {
  url: string
  measuredAt: string
  device: string
  /** Milliseconds from navigation start. */
  lcpMs: number | null
  fcpMs: number | null
  ttfbMs: number | null
  domContentLoadedMs: number | null
  loadMs: number | null
  cls: number | null
  /** Total bytes transferred across all requests. */
  transferBytes: number
  requestCount: number
  imageCount: number
  imageBytes: number
  scriptBytes: number
  /** Number of DOM nodes — a proxy for page weight and layout cost. */
  domNodes: number
  /** Anchor tags in the header/nav — the "exit paths" finding. */
  headerLinks: number
  totalLinks: number
  h1Count: number
  h1Text: string[]
  title: string
  metaDescription: string | null
  hasViewportMeta: boolean
  imagesMissingAlt: number
  imagesMissingDimensions: number
  notes: string[]
}

async function runOnce(): Promise<Measurement> {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ...devices['Pixel 5'],
    // Most paid traffic for a service like this arrives on a phone.
  })

  const page = await context.newPage()

  const notes: string[] = []

  await page.goto(TARGET, { waitUntil: 'load', timeout: 90_000 })
  // Let lazy-loaded content and late CLS settle.
  await page.waitForTimeout(6_000)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(3_000)

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined

    const paint = performance.getEntriesByType('paint')
    const fcp = paint.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null

    const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
    const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1]!.startTime : null

    const header = document.querySelector('header, nav, [role="banner"]')

    const images = Array.from(document.images)

    return {
      lcpMs: lcp,
      fcpMs: fcp,
      ttfbMs: nav ? nav.responseStart - nav.requestStart : null,
      domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
      loadMs: nav ? nav.loadEventEnd : null,
      domNodes: document.getElementsByTagName('*').length,
      headerLinks: header ? header.querySelectorAll('a').length : 0,
      totalLinks: document.querySelectorAll('a').length,
      h1Count: document.querySelectorAll('h1').length,
      h1Text: Array.from(document.querySelectorAll('h1')).map((h) =>
        (h.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 200),
      ),
      title: document.title,
      metaDescription:
        document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null,
      hasViewportMeta: Boolean(document.querySelector('meta[name="viewport"]')),
      imagesMissingAlt: images.filter((i) => !i.hasAttribute('alt')).length,
      imagesMissingDimensions: images.filter(
        (i) => !i.hasAttribute('width') || !i.hasAttribute('height'),
      ).length,

      /*
       * Transfer sizes come from the Resource Timing API, not from
       * content-length headers.
       *
       * The header approach silently undercounts by a huge margin: anything
       * served with `transfer-encoding: chunked` — which is most of what a
       * modern framework emits — has no content-length at all, and those
       * responses were being counted as zero bytes. That produced an absurd
       * "1 KB of JavaScript" for a page that ships 218 KB. `transferSize` is
       * the actual bytes over the wire, compression included.
       */
      ...(() => {
        const entries = performance.getEntriesByType(
          'resource',
        ) as PerformanceResourceTiming[]

        const nav = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming | undefined

        let transferBytes = nav?.transferSize ?? 0
        let scriptBytes = 0
        let imageBytes = 0
        let imageCount = 0

        for (const e of entries) {
          transferBytes += e.transferSize || 0
          if (e.initiatorType === 'script' || /\.m?js(\?|$)/.test(e.name)) {
            scriptBytes += e.transferSize || 0
          }
          if (e.initiatorType === 'img' || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(e.name)) {
            imageBytes += e.transferSize || 0
            imageCount++
          }
        }

        return {
          transferBytes,
          scriptBytes,
          imageBytes,
          imageCount,
          requestCount: entries.length + 1,
        }
      })(),
    }
  })

  // Cumulative layout shift, collected via PerformanceObserver.
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<
              PerformanceEntry & { value: number; hadRecentInput: boolean }
            >) {
              if (!entry.hadRecentInput) total += entry.value
            }
          })
          observer.observe({ type: 'layout-shift', buffered: true })
          setTimeout(() => {
            observer.disconnect()
            resolve(total)
          }, 1_000)
        } catch {
          resolve(-1)
        }
      }),
  )

  const result: Measurement = {
    url: TARGET,
    measuredAt: new Date().toISOString(),
    device: 'Pixel 5 (Chromium, unthrottled network)',
    ...metrics,
    cls: cls >= 0 ? Number(cls.toFixed(4)) : null,
    notes,
  }

  await browser.close()
  return result
}

async function main() {
  const runs: Measurement[] = []

  for (let i = 0; i < RUNS; i++) {
    // eslint-disable-next-line no-console
    console.error(`run ${i + 1}/${RUNS}...`)
    runs.push(await runOnce())
  }

  const first = runs[0]!

  // Timing metrics get a median across runs; structural facts (link counts, H1
  // text, missing dimensions) are identical every time, so the first run stands.
  const timing = <K extends keyof Measurement>(key: K) =>
    median(runs.map((r) => Number(r[key])).filter((n) => Number.isFinite(n)))

  const result: Measurement & { runs: number; spread: Record<string, [number, number]> } = {
    ...first,
    measuredAt: new Date().toISOString(),
    lcpMs: timing('lcpMs'),
    fcpMs: timing('fcpMs'),
    ttfbMs: timing('ttfbMs'),
    domContentLoadedMs: timing('domContentLoadedMs'),
    loadMs: timing('loadMs'),
    cls: timing('cls'),
    transferBytes: timing('transferBytes') ?? first.transferBytes,
    requestCount: Math.round(timing('requestCount') ?? first.requestCount),
    runs: RUNS,
    spread: {
      ttfbMs: minMax(runs.map((r) => r.ttfbMs)),
      fcpMs: minMax(runs.map((r) => r.fcpMs)),
      loadMs: minMax(runs.map((r) => r.loadMs)),
    },
    notes: [
      ...first.notes,
      `Median of ${RUNS} runs. Individual page loads vary considerably with cache state.`,
    ],
  }

  await writeFile(OUTPUT, JSON.stringify(result, null, 2), 'utf8')

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2))
}

function minMax(values: Array<number | null>): [number, number] {
  const clean = values.filter((v): v is number => Number.isFinite(v as number))
  if (clean.length === 0) return [0, 0]
  return [Math.round(Math.min(...clean)), Math.round(Math.max(...clean))]
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Measurement failed:', error)
  process.exit(1)
})
