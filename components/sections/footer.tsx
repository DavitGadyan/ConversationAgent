import { Warehouse } from 'lucide-react'
import { site } from '@/content/site'
import { serviceAreas } from '@/content/trust'

/**
 * Footer.
 *
 * Kept minimal on purpose. A paid landing page's footer is not a site map — the
 * only links here are the ones a visitor has a legitimate reason to want
 * (contact, privacy, the main site) and the trust/legal information that
 * legitimises the business.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="container-page py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-[11px] bg-ink text-white">
                <Warehouse size={18} aria-hidden />
              </span>
              <span className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-[-0.02em] text-ink">
                Caravan Concierge
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted">
              Secure, affordable storage for caravans, boats, motorhomes, RVs and vehicles across
              South-East Queensland — with pickup and delivery Australia-wide.
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-faint">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              <li>
                <a href={site.phone.href} className="font-medium text-ink hover:text-action">
                  {site.phone.display}
                </a>
              </li>
              <li>
                <a href={site.sms.href} className="text-muted hover:text-ink">
                  SMS {site.sms.display}
                </a>
              </li>
              <li className="text-muted">{site.hours.label}</li>
              <li className="text-[13px] leading-snug text-faint">{site.hours.note}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-faint">
              Service areas
            </h3>
            <ul className="mt-4 space-y-2 text-[14px] text-muted">
              {serviceAreas.map((area) => (
                <li key={area.name}>{area.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <a href={`${site.mainSiteUrl}/privacy-policy`} className="hover:text-ink">
              Privacy policy
            </a>
            <a href={`${site.mainSiteUrl}/terms-conditions`} className="hover:text-ink">
              Terms &amp; conditions
            </a>
            <a href={site.mainSiteUrl} className="hover:text-ink">
              Main site
            </a>
            <a href="/audit" className="hover:text-ink">
              CRO audit
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
