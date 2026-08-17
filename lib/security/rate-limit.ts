/**
 * Per-IP sliding-window rate limiter.
 *
 * In-memory by design: it is dependency-free and correct for a single instance,
 * which is what this landing page runs as. The interface is deliberately the
 * same shape as @upstash/ratelimit, so swapping in a distributed store when the
 * app scales to multiple regions is a one-file change.
 */

interface Bucket {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

/** Stop the map growing without bound on a long-lived server. */
const MAX_KEYS = 10_000

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  /** Unix ms when the caller may retry. */
  reset: number
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
  const cutoff = now - windowMs

  let bucket = buckets.get(key)
  if (!bucket) {
    if (buckets.size >= MAX_KEYS) evictStale(cutoff)
    bucket = { timestamps: [] }
    buckets.set(key, bucket)
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now
    return {
      success: false,
      limit,
      remaining: 0,
      reset: oldest + windowMs,
    }
  }

  bucket.timestamps.push(now)
  return {
    success: true,
    limit,
    remaining: limit - bucket.timestamps.length,
    reset: now + windowMs,
  }
}

function evictStale(cutoff: number) {
  for (const [key, bucket] of buckets) {
    const live = bucket.timestamps.filter((t) => t > cutoff)
    if (live.length === 0) buckets.delete(key)
    else bucket.timestamps = live
  }
}

/**
 * Best-effort client IP. Vercel and most proxies set x-forwarded-for; the first
 * entry is the client. Falls back to a constant so the limiter degrades to a
 * global cap rather than failing open entirely.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? 'unknown'
}

/** Limits tuned so a genuine user retrying a failed submit is never blocked. */
export const LIMITS = {
  quote: { limit: 5, windowMs: 60_000 },
  events: { limit: 120, windowMs: 60_000 },
  agent: { limit: 60, windowMs: 60_000 },
} as const

/** Test seam — the limiter is module-level state. */
export function __resetRateLimit() {
  buckets.clear()
}
