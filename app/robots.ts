import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

/**
 * robots.txt
 *
 * AI crawlers are explicitly allowed. For a local service business, being
 * quotable by ChatGPT, Claude, Perplexity and Google's AI answers is a
 * distribution channel, not a threat — and /llms.txt exists precisely so those
 * crawlers get the pricing right.
 *
 * /thank-you and /admin are excluded: one is a post-conversion page that would
 * only ever be an odd search result, the other is internal.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/thank-you', '/admin', '/api/'],
      },
      {
        // Named explicitly so the intent is unambiguous rather than inherited.
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-User',
          'PerplexityBot',
          'Google-Extended',
        ],
        allow: ['/', '/llms.txt', '/api/agent/'],
        disallow: ['/thank-you', '/admin'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
