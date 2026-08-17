import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Crisp imagery is a stated goal: serve modern formats and a wide set of
  // breakpoints so every device gets a sharp, correctly-sized asset.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'www.caravanconcierge.com.au' },
      { protocol: 'https', hostname: 'caravanconcierge.com.au' },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Security headers that do not need per-request state live here; the
  // nonce-based CSP is applied in middleware.ts where a nonce can be generated.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Allow AI agents and partner sites to read the machine-readable layer.
        source: '/api/agent/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ],
      },
    ]
  },
}

export default nextConfig
