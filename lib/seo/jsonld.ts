import { site } from '@/content/site'
import { bays, coverings } from '@/content/pricing'
import { faqs, serviceAreas, testimonials } from '@/content/trust'
import { segments } from '@/content/segments'

/**
 * Structured data — the machine-readable half of this page.
 *
 * Two audiences, one artefact:
 *
 *   1. Search engines, for rich results (rating stars, FAQ accordions, prices).
 *   2. AI agents. ChatGPT, Claude, Perplexity and Google's AI answers are an
 *      increasingly large slice of local-service discovery, and they read
 *      structured data far more reliably than they read marketing prose. If the
 *      prices, service area and access hours are not machine-readable, an agent
 *      asked "where can I store a caravan in Ipswich?" will either skip this
 *      business or invent details about it.
 *
 * Every value is generated from content/, so the structured data can never drift
 * away from what the page actually says.
 */

export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SelfStorage',
    '@id': `${site.url}/#business`,
    name: site.name,
    description: site.agentDescription,
    url: site.url,
    telephone: site.phone.e164,
    email: site.email,
    priceRange: '$$',
    currenciesAccepted: 'AUD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.region.addressLocality,
      addressRegion: site.region.addressRegion,
      addressCountry: site.region.addressCountry,
    },
    areaServed: serviceAreas.map((area) => ({
      '@type': 'City',
      name: area.name,
      addressRegion: 'QLD',
      addressCountry: 'AU',
    })),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: site.hours.opens,
        closes: site.hours.closes,
      },
    ],
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: '24/7 CCTV surveillance', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'PIN code entry', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'On-site manager', value: true },
      { '@type': 'LocationFeatureSpecification', name: '24/7 access', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Security fencing', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Vehicle pickup and delivery', value: true },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.rating.value,
      reviewCount: site.rating.count,
      bestRating: 5,
    },
    review: testimonials.map((t) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 },
      author: { '@type': 'Person', name: t.author },
      reviewBody: t.quote,
    })),
    sameAs: [site.social.facebook, site.social.instagram, site.mainSiteUrl],
    makesOffer: bays.map((bay) => ({
      '@type': 'Offer',
      name: `${bay.name} — ${bay.dimensions}`,
      description: `${bay.privacy} bay. ${bay.access}. Ideal for ${bay.idealFor}.`,
      price: bay.weeklyPrice,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      eligibleDuration: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitCode: 'WEE',
      },
    })),
  }
}

export function serviceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${site.url}/#service`,
    serviceType: 'Vehicle storage',
    provider: { '@id': `${site.url}/#business` },
    areaServed: serviceAreas.map((a) => a.name),
    description: site.agentDescription,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Storage options',
      itemListElement: [
        ...segments.map((segment) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `${segment.label} storage`,
            description: segment.subheadline,
          },
        })),
        ...coverings.map((covering) => ({
          '@type': 'Offer',
          price: covering.weeklyPrice,
          priceCurrency: 'AUD',
          availability: covering.waitlist
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Service',
            name: `${covering.name} storage`,
            description: covering.description,
          },
        })),
      ],
    },
  }
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

export function breadcrumbJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.mainSiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Get a storage quote', item: site.url },
    ],
  }
}

/** Every block the landing page emits, as one graph. */
export function pageJsonLd() {
  return [localBusinessJsonLd(), serviceJsonLd(), faqJsonLd(), breadcrumbJsonLd()]
}
