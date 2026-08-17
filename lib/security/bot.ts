/**
 * Bot filtering for the quote form.
 *
 * Three cheap, invisible signals instead of a CAPTCHA. A CAPTCHA on a lead form
 * is a conversion tax paid by every genuine customer to stop a handful of bots;
 * these checks cost the user nothing.
 *
 * Cloudflare Turnstile can be layered on top by setting TURNSTILE_SECRET_KEY —
 * it stays off unless spam actually becomes a problem.
 */

export interface BotVerdict {
  isBot: boolean
  reason?: string
  /** 0 = certainly human, 1 = certainly bot. Logged for tuning. */
  score: number
}

/** A human cannot read three fields and type a phone number this fast. */
const MIN_FILL_MS = 3_000
/** Older than this and the timestamp is meaningless (tab left open overnight). */
const MAX_FILL_MS = 6 * 60 * 60 * 1000

export function checkBotSignals(input: {
  company?: string
  startedAt?: number
  userAgent?: string | null
  now?: number
}): BotVerdict {
  const now = input.now ?? Date.now()
  let score = 0

  // 1. Honeypot. The field is hidden from humans and from screen readers; only
  //    a form-filling bot ever populates it. This alone is near-conclusive.
  if (input.company && input.company.trim().length > 0) {
    return { isBot: true, reason: 'honeypot_filled', score: 1 }
  }

  // 2. Timing. Suspicious rather than conclusive — a returning user with
  //    autofill can be quick, so this contributes to the score.
  if (typeof input.startedAt === 'number') {
    const elapsed = now - input.startedAt
    if (elapsed < 0) score += 0.5 // clock skew or a forged payload
    else if (elapsed < MIN_FILL_MS) score += 0.6
    else if (elapsed > MAX_FILL_MS) score += 0.2
  } else {
    // Missing entirely means the payload did not come from our form.
    score += 0.4
  }

  // 3. User agent. Headless and scripted clients announce themselves.
  const ua = (input.userAgent ?? '').toLowerCase()
  if (!ua) score += 0.3
  else if (/headless|phantom|puppeteer|selenium|scrapy|python-requests|curl|wget/.test(ua)) {
    score += 0.7
  }

  return {
    isBot: score >= 0.9,
    reason: score >= 0.9 ? 'signal_score' : undefined,
    score: Math.min(1, Number(score.toFixed(2))),
  }
}

/**
 * Optional Cloudflare Turnstile verification. Returns true when Turnstile is
 * not configured, so the form works out of the box.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5_000),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    // Never block a genuine lead because Cloudflare had a bad minute.
    return true
  }
}
