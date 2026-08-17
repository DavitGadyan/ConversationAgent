import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { headers } from 'next/headers'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import { site } from '@/content/site'
import { pageJsonLd } from '@/lib/seo/jsonld'

/**
 * Inter Tight for display (the tight-tracked grotesque that gives the reference
 * its oversized headline treatment) and Inter for body.
 *
 * SELF-HOSTED, and deliberately so:
 *  - No request to fonts.gstatic.com on the critical path, which is worth real
 *    milliseconds of LCP on a mobile connection.
 *  - No third-party origin in the CSP, and no visitor IP handed to Google —
 *    which is the difference between a compliant page and an awkward
 *    conversation about privacy.
 *  - Builds work offline and in CI.
 *
 * Both are variable fonts subset to latin: ~93KB for the pair, covering every
 * weight from 400 to 600. `display: swap` keeps text visible while they load —
 * an invisible headline is both an LCP failure and a conversion failure.
 */
const interTight = localFont({
  src: '../public/fonts/InterTight-latin-var.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--font-inter-tight',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  // Tuned to Inter Tight's metrics so the fallback does not reflow on swap.
  adjustFontFallback: 'Arial',
})

const inter = localFont({
  src: '../public/fonts/Inter-latin-var.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  /**
   * No price in the title. The entry rate ranges from $15/week (a 6m shared bay)
   * to $46.50 (a 12m × 4m private bay), and a caravan owner cannot get the low
   * end — so leading with "$15" sets an expectation the call has to walk back.
   * Each segment states its own real "from" price in the H1 instead.
   */
  title: {
    default: 'Secure Caravan, Boat & RV Storage — Brisbane & Ipswich | Caravan Concierge',
    template: '%s | Caravan Concierge',
  },
  description: site.description,
  keywords: [
    'caravan storage Brisbane',
    'boat storage Brisbane',
    'motorhome storage',
    'RV storage Ipswich',
    'vehicle storage Gold Coast',
    'secure caravan storage',
  ],
  alternates: { canonical: site.url },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: site.url,
    siteName: site.name,
    title: 'Secure storage for your caravan, boat, motorhome or RV',
    description: site.description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: site.tagline }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secure vehicle storage in Brisbane, Ipswich & the Gold Coast',
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: true, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: '#f4f4f4',
  width: 'device-width',
  initialScale: 1,
  // Never block zoom — pinch-to-zoom is an accessibility requirement, and this
  // page will be read on phones by people in their sixties and seventies.
  maximumScale: 5,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en-AU" className={`${interTight.variable} ${inter.variable}`}>
      {/*
        No hand-written <head> element: Next builds it from the `metadata` and
        `viewport` exports above, and the JSON-LD sits in the body, which is
        valid and is the pattern Next documents.

        Worth knowing, because it looks alarming the first time you see it:
        Next 15 STREAMS metadata, so on a normal browser request the description
        and title tags appear near the end of <body> in the initial HTML, and
        React hoists them into <head> during hydration. For crawlers that parse
        HTML without executing JavaScript — Bingbot, Twitterbot, Slackbot,
        facebookexternalhit, LinkedInBot — Next detects the user agent and falls
        back to a blocking render so those tags really are in <head>. Verified
        per-UA with curl; see LIGHTHOUSE.md.
      */}
      <body>
        {/*
          Safety net for scroll-revealed content.

          Framer Motion server-renders its `initial` state as inline styles, so
          every below-the-fold section ships as opacity:0 and only becomes
          visible once JavaScript runs the IntersectionObserver. If JS fails,
          is blocked, or simply has not arrived yet, the page reads as blank
          below the hero. This forces everything visible in that case — the
          animation is an enhancement, never a precondition for seeing content.
        */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>

        {/*
          Structured data: rich results for search, ground truth for AI agents.

          No nonce, deliberately. `application/ld+json` is a data block, not
          executable script, so CSP does not gate it — and React does not
          serialise the nonce attribute to the client, which makes this the one
          place a nonce guarantees a hydration mismatch instead of preventing
          anything.
        */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd()) }}
        />

        {/*
          Skip link — the first tab stop.

          It targets #main rather than #quote-form: the form only exists on the
          landing page, and a skip link pointing at a missing anchor is worse
          than none at all (it silently does nothing, which is exactly what a
          keyboard user cannot debug). Every page renders <main id="main">.
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>

        <Providers>{children}</Providers>

        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                // Consent Mode v2: denied until the visitor opts in.
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  analytics_storage: 'denied'
                });
                gtag('config', '${gaId}', { send_page_view: true });
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  )
}
