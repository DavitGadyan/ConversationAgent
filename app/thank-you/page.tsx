import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Phone } from 'lucide-react'
import { OnboardingTimeline } from '@/components/sections/onboarding-timeline'
import { PrepChecklist } from '@/components/sections/prep-checklist'
import { Button } from '@/components/ui/button'
import { SuccessBadge } from '@/components/ui/success-badge'
import { site } from '@/content/site'
import { bays } from '@/content/pricing'
import { formatMoney } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Thanks — we have your enquiry',
  robots: { index: false, follow: false },
}

/**
 * Post-submission onboarding.
 *
 * This page exists to solve the exact problem the client described: leads that
 * go quiet after they enquire. A bare "thanks, we'll be in touch" leaves the
 * customer with nothing to do and no idea when anything happens, so the
 * enthusiasm they had while filling in the form evaporates before the callback.
 *
 * So instead: what happens next, when, what to have ready, and a way to reach us
 * in the meantime. It also doubles as the conversion confirmation page for the
 * ad platforms.
 */
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; bay?: string }>
}) {
  const params = await searchParams
  const bay = params.bay ? bays.find((b) => b.id === params.bay) : undefined

  return (
    <main id="main" tabIndex={-1} className="min-h-screen py-10 md:py-16">
      <div className="container-page max-w-3xl">
        <div className="card-surface overflow-hidden">
          <div className="border-b border-line p-7 text-center sm:p-10">
            <div className="mb-5 flex justify-center">
              <SuccessBadge />
            </div>

            <h1 className="display-md text-ink">You are on the list</h1>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-muted">
              We have your enquiry and a space is being held for you. Someone will call to confirm
              your exact rate — usually the same business day, and always within one.
            </p>

            {params.ref && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-sunken px-4 py-2 text-[13px] text-muted">
                Your reference
                <span className="font-semibold tracking-wide text-ink">{params.ref}</span>
              </p>
            )}

            {bay && (
              <div className="mx-auto mt-6 max-w-sm rounded-[20px] bg-highlight p-4">
                <p className="text-[13px] font-medium text-ink/70">Held for you</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-medium tracking-[-0.03em] text-ink">
                  {bay.name} · {formatMoney(bay.weeklyPrice)}
                  <span className="text-base font-normal text-ink/60">/week</span>
                </p>
                <p className="mt-1 text-[13px] text-ink/70">
                  {bay.dimensions} · {bay.access}
                </p>
              </div>
            )}
          </div>

          <div className="p-7 sm:p-10">
            <OnboardingTimeline />
          </div>
        </div>

        <div className="mt-6">
          <PrepChecklist />
        </div>

        {/* Reachable in the meantime — the gap between enquiry and callback is
            where doubt creeps in. */}
        <div className="mt-6 rounded-[28px] bg-ink p-7 text-white sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.02em]">
            Need us sooner?
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            If your timing is tight, call and we will sort it now. {site.hours.label}.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="highlight"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a href={site.phone.href}>
                <Phone size={18} aria-hidden />
                {site.phone.display}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
            >
              <a href={site.sms.href}>Text us instead</a>
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-muted hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to the storage page
          </Link>
        </p>
      </div>
    </main>
  )
}
