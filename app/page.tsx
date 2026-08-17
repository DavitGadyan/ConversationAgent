import { SegmentProvider } from '@/components/segment/segment-provider'
import { Header } from '@/components/sections/header'
import { Hero } from '@/components/sections/hero'
import { TrustStrip } from '@/components/sections/trust-strip'
import { MobileBar } from '@/components/sections/mobile-bar'
import { Footer } from '@/components/sections/footer'

import { HowItWorks } from '@/components/sections/how-it-works'
import { SizeFinder } from '@/components/sections/size-finder'
import { Savings } from '@/components/sections/savings'
import { Comparison } from '@/components/sections/comparison'
import { Testimonials } from '@/components/sections/testimonials'
import { ServiceAreas } from '@/components/sections/service-areas'
import { Faq } from '@/components/sections/faq'
import { FinalCta } from '@/components/sections/final-cta'

/*
 * The below-the-fold sections are imported eagerly, and that is a measured
 * decision rather than an oversight.
 *
 * Code-splitting them with next/dynamic was tried and reverted: because they all
 * server-render, Next bundles them into the initial chunks regardless, so the
 * First Load JS figure did not move at all — and total blocking time got worse,
 * not better. The only thing it added was indirection.
 *
 * The concierge and consent banner below ARE deferred, because neither is part
 * of the initial render at all.
 */
import dynamic from 'next/dynamic'

/**
 * The concierge and the consent banner are both deferred.
 *
 * Neither is part of the first impression — the concierge launcher appears after
 * a delay and the banner after 1.2s — but bundling them with the initial payload
 * charged their parse and hydration cost to the critical path, which showed up
 * as ~250ms of total blocking time. Loading them separately keeps the main
 * thread free while the visitor is reading the headline and starting the form.
 */
const Concierge = dynamic(() =>
  import('@/components/concierge/concierge').then((m) => m.Concierge),
)
const ConsentBanner = dynamic(() =>
  import('@/components/consent-banner').then((m) => m.ConsentBanner),
)

/**
 * The landing page.
 *
 * Section order is the argument, made in the order a buyer actually makes it:
 *
 *   Hero        — is this for me, and what does it cost?   (form is right here)
 *   Trust       — can I trust you with a $60k asset?
 *   How         — what actually happens if I enquire?
 *   Pricing     — which bay is mine, exactly?
 *   Savings     — what do I gain by switching?
 *   Comparison  — why you and not the storage place down the road?
 *   Reviews     — has this worked for people like me?
 *   Coverage    — do you even cover where I live?
 *   FAQ         — my remaining objection
 *   Final CTA   — right, let's go
 *
 * Every section carries a route back to the form, because the decision can land
 * at any one of them.
 */
export default function HomePage() {
  return (
    <SegmentProvider>
      <Header />

      <main id="main" tabIndex={-1}>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <SizeFinder />
        <Savings />
        <Comparison />
        <Testimonials />
        <ServiceAreas />
        <Faq />
        <FinalCta />
      </main>

      <Footer />

      <Concierge />
      <MobileBar />
      <ConsentBanner />
    </SegmentProvider>
  )
}
