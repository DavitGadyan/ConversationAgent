# Security

This page collects names, phone numbers, email addresses and postcodes from the
public internet. That makes it a small but real target, and the controls below
are sized accordingly.

## What is in place

### Transport and headers

Set in `middleware.ts` (per-request) and `next.config.ts` (static):

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | nonce + `strict-dynamic` | Blocks injected inline script, the main XSS vector |
| `Strict-Transport-Security` | 2 years, preload | Forces HTTPS |
| `X-Frame-Options` / `frame-ancestors` | `DENY` / `'none'` | Prevents clickjacking the quote form |
| `X-Content-Type-Options` | `nosniff` | Stops MIME confusion |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Keeps query strings out of referrers |
| `Permissions-Policy` | camera, mic, geolocation off | The page needs none of them |

Two deliberate compromises, stated plainly:

- **`style-src` allows `'unsafe-inline'`.** React emits style attributes during
  SSR and `next/font` injects an inline style block. Inline *style* is a far
  smaller risk than inline *script*, and removing it would mean giving up either
  server rendering or the fonts.
- **The nonce makes pages dynamic.** A per-request nonce opts the page out of
  full static rendering. For a form-bearing page handling personal data that is
  the right trade; the page is still server-rendered and edge-cacheable.

### Input handling

- **Zod validates on the server** (`app/api/quote/route.ts`), and the server's
  result is authoritative. Client-side validation exists only to give the user
  fast feedback.
- Every string field has a maximum length, so no request can balloon a log line
  or a sink payload.
- `/api/events` caps the number of custom keys per record — it is a public write
  endpoint and must never become a free object store.

### Rate limiting

`lib/security/rate-limit.ts`, a per-IP sliding window:

| Endpoint | Limit |
|---|---|
| `POST /api/quote` | 5 per minute |
| `POST /api/events`, `/api/vitals` | 120 per minute |
| `GET /api/agent/quote` | 60 per minute |

In-memory, which is correct for a single instance. The interface matches
`@upstash/ratelimit`, so moving to a distributed store is a one-file change if
the app ever runs multi-region.

### Bot filtering

Three invisible signals (`lib/security/bot.ts`) instead of a CAPTCHA:

1. **Honeypot** — a field hidden from sighted users *and* from screen readers.
   Only a form-filling bot ever populates it. Near-conclusive on its own.
2. **Submit timing** — a human cannot read three fields and type a phone number
   in under three seconds. Contributory, never conclusive: autofill can be fast,
   and blocking a real customer costs more than accepting a spam lead.
3. **User agent** — headless and scripted clients announce themselves.

A detected bot receives `200 OK`. Telling a scraper which signal caught it is
free tuning data for them; a silent accept wastes their time instead.

Cloudflare Turnstile can be enabled with `TURNSTILE_SECRET_KEY` if spam ever
becomes a genuine problem. It is off by default because a CAPTCHA is a
conversion tax paid by every real customer to stop a handful of bots.

### Personal data

- **Logs are redacted at the logger**, not at the call site
  (`lib/monitoring/logger.ts`). Name, phone, email, postcode and notes never
  reach a log aggregator in readable form.
- **IPs are hashed** with a salt (`IP_SALT`) before storage — enough to spot
  abuse patterns, not enough to constitute retained personal data.
- **Leads are written to `.data/`**, which is gitignored. Do not commit it.
- **Consent is explicit** on the form and recorded with the lead.
- **First-party analytics set no cross-site identifier**, which is why funnel
  events need no cookie banner. Third-party pixels are consent-gated via Google
  Consent Mode v2 and default to denied.

## What you must do before launch

- [ ] **Set `IP_SALT`** to a long random value. Without it the IP hash is
      predictable and therefore reversible.
- [ ] **Protect `/admin/monitoring`.** It is unauthenticated and `noindex`, but
      noindex is not access control. Put it behind Vercel Deployment Protection,
      a proxy auth rule, or delete the route if you do not want it.
- [ ] **Set `LEAD_WEBHOOK_SECRET`** if using the webhook sink, so the receiver
      can verify payloads really came from you.
- [ ] **Confirm `.data/` is not served.** It is outside `public/`, so it is not —
      but verify after any hosting change.
- [ ] **Review data retention.** Australian Privacy Principles apply. Decide how
      long leads are kept and delete on request; `.data/leads.jsonl` is a plain
      JSONL file, so removal is a one-line operation.
- [ ] **Run `npm run audit:deps`** and keep it in CI.

## Reporting an issue

Email the site owner directly rather than opening a public issue. If it involves
customer data, say so in the subject line so it gets triaged immediately.
