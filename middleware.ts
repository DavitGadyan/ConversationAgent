import { NextResponse, type NextRequest } from 'next/server'

/**
 * Nonce-based Content Security Policy.
 *
 * Next.js reads the `x-nonce` request header and stamps the nonce onto its own
 * script tags automatically, which lets us run `strict-dynamic` without
 * `unsafe-inline` for scripts — the meaningful half of a CSP.
 *
 * TRADE-OFF, stated plainly: a per-request nonce opts pages out of full static
 * rendering. For a form-bearing landing page that is the right call — it is
 * still server-rendered and edge-cacheable, and the page handles personal data
 * (names, phone numbers) that is worth protecting from injected script.
 *
 * `style-src` keeps `unsafe-inline`: React renders style attributes during SSR
 * and next/font injects an inline style block. Inline *style* is a far smaller
 * risk than inline script, and removing it would mean giving up either fonts or
 * server rendering.
 */

const isDev = process.env.NODE_ENV === 'development'

/** Third-party origins, only allowed when their integration is actually configured. */
function analyticsOrigins() {
  const script: string[] = []
  const connect: string[] = []
  const img: string[] = []

  if (process.env.NEXT_PUBLIC_GA_ID) {
    script.push('https://www.googletagmanager.com')
    connect.push('https://www.google-analytics.com', 'https://analytics.google.com')
    img.push('https://www.google-analytics.com', 'https://www.googletagmanager.com')
  }
  if (process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    script.push('https://connect.facebook.net')
    connect.push('https://www.facebook.com')
    img.push('https://www.facebook.com')
  }
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    script.push('https://challenges.cloudflare.com')
  }

  return { script, connect, img }
}

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const extra = analyticsOrigins()

  const csp = [
    `default-src 'self'`,
    // 'unsafe-eval' is required by the Next.js dev server's HMR runtime only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${extra.script.join(' ')} ${
      isDev ? "'unsafe-eval'" : ''
    }`.trim(),
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https: ${extra.img.join(' ')}`.trim(),
    `font-src 'self' data:`,
    `connect-src 'self' ${extra.connect.join(' ')} ${isDev ? 'ws: http://localhost:*' : ''}`.trim(),
    `frame-src 'self' https://challenges.cloudflare.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    // Ignored (and warned about) in report-only mode, so only emit it when enforcing.
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ]
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Report-Only in development so a mistake surfaces in the console without
  // breaking local work; enforced in production.
  response.headers.set(
    isDev ? 'content-security-policy-report-only' : 'content-security-policy',
    csp,
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation — those are served
     * directly and do not execute script.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
