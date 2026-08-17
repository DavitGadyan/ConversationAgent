import type { MetadataRoute } from 'next'
import { site } from '@/content/site'
import { segments } from '@/content/segments'

/**
 * Sitemap.
 *
 * Each segment variant is listed as its own URL. They render the same page with
 * different copy, so they carry the same canonical — but listing them means the
 * deep-linked ad destinations are discoverable and verifiable, rather than
 * looking like stray parameters.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: site.url,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...segments.map((segment) => ({
      url: `${site.url}/?v=${segment.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    {
      url: `${site.url}/audit`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]
}
