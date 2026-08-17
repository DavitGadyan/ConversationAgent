# Caravan Concierge — paid-traffic landing page

One landing page covering every customer segment (caravan, boat, motorhome/RV,
campervan, car & trailer, jetski), built to convert paid traffic that currently
lands on a homepage designed for browsing.

**Live audit of the current site:** [`/audit`](#the-audit) · **Handover notes:**
[`HANDOVER.md`](./HANDOVER.md)

```bash
npm install
npm run dev          # http://localhost:3000
```

No configuration is required to run it. The form works out of the box: leads are
written to `.data/leads.jsonl` and the notification email is printed to the
server console.

---

## What this fixes

The current homepage was measured in a real browser
(`npm run audit:live`) before anything was designed. The findings that drove
every decision here:

| Problem on the live site | Measured | What this page does |
|---|---|---|
| H1 sells *caravan* storage to an audience of boat, RV, car and jetski owners | H1 captured | Six segments, one page. Each ad group deep-links to `?v=boat` and the hero rewrites itself |
| Site nav carried onto a paid page | **25 links in the header**, 88 on the page | 3 links total. Logo, one phone number, one CTA |
| Pricing is two raw tables with no guidance | 6 bays × 4 coverings | One slider: "how long is it?" → your bay and your price |
| "From $15/week" is unreachable for a caravan owner | Derived from the rate tables | Each segment quotes the price it can actually be charged ($36 for a caravan) |
| 2.4 MB, 738 KB of JavaScript | Median of 5 runs | 94 KB over 18 requests |
| Form produces no drop-off data | — | Three steps, each emitting analytics events |

The full write-up, with the caveats on every number, is at `/audit`.

---

## Architecture

```
app/
  page.tsx                  Landing page — sections in CRO order
  thank-you/                Post-submission onboarding
  audit/                    The CRO audit deliverable
  admin/monitoring/         Web Vitals + funnel drop-off dashboard
  api/
    quote/                  Form submission → validation → bot check → fan-out
    events/  vitals/        First-party telemetry
    health/                 Uptime + integration status probe
    agent/quote/            Machine-readable quotes for AI agents
  llms.txt/                 Generated brief for AI assistants

content/                    SINGLE SOURCE OF TRUTH
  pricing.ts                Bays, coverings, and the recommendation logic
  segments.ts               The six customer segments
  site.ts  trust.ts         Business facts, testimonials, FAQs
  audit.ts                  Audit findings
  audit-measurements*.json  Real browser measurements

components/
  quote-form/               The three-step form + live estimate
  segment/                  Segment state — the one-page-many-audiences mechanism
  concierge/                Scripted conversational agent
  sections/                 Page sections
  ui/                       Design system primitives

lib/
  schema/quote.ts           Zod contract, shared client and server
  leads/                    Delivery fan-out (store, email, SMS, webhook, Sheets)
  monitoring/               Analytics, Web Vitals, logging, budgets
  security/                 Rate limiting, bot heuristics
  seo/jsonld.ts             Structured data, generated from content/
```

**Everything price-related flows from `content/pricing.ts`.** The hero headline,
the size finder, the form estimate, the JSON-LD, `llms.txt` and the agent API all
read the same data, so they cannot disagree with each other.

---

## The design

Follows the Outcrowd *PitchBot.AI* reference: a soft grey canvas, white cards
with very large radii, oversized tight-tracked display type, pill section labels,
pastel icon tiles, glossy 3D sticker icons, and **one yellow highlight** spent
only on the active state and the price.

Tokens are in `app/globals.css` under `@theme`. Motion vocabulary is in
`lib/motion.ts` and every animation is gated on `prefers-reduced-motion` via
`<MotionConfig reducedMotion="user">`.

Fonts are **self-hosted** variable Inter and Inter Tight (~93 KB for the pair,
latin subset) — no request to Google, no third-party origin in the CSP, no
visitor IP handed to an ad network, and builds work offline.

---

## Lead delivery

Leads fan out to every configured channel in parallel. The local store is written
**first and awaited** — once that succeeds the lead is safe and the visitor gets
a success response, whatever else happens.

| Sink | Enabled by | Notes |
|---|---|---|
| Local JSONL | always on | The durability guarantee |
| Email | `RESEND_API_KEY` + `LEAD_EMAIL_TO` | Console fallback in dev |
| SMS | `TWILIO_*` + `LEAD_SMS_TO` | Highest-leverage: speed-to-lead drives close rate |
| Webhook | `LEAD_WEBHOOK_URL` | Zapier/Make/CRM, HMAC-signed if a secret is set |
| Google Sheet | `GOOGLE_SERVICE_ACCOUNT_JSON` + `GOOGLE_SHEET_ID` | Direct REST, no SDK |

A failing sink is retried once, then logged and skipped. It never blocks the
others, and it never costs you the lead. Unconfigured sinks no-op silently.

See `.env.example` for setup.

---

## Commands

```bash
npm run dev            # development server
npm run build          # production build
npm start              # serve the production build

npm test               # unit tests (Vitest) — pricing logic, schema, fan-out
npm run test:e2e       # end-to-end (Playwright) — form flow, a11y, endpoints
npm run typecheck      # tsc --noEmit
npm run lighthouse     # Lighthouse CI against the budgets in lighthouserc.json

npm run audit:live     # measure the live site → content/audit-measurements.json
npm run assets:fetch   # pull the client's existing photos into public/images
npm run audit:deps     # production dependency vulnerability scan
```

---

## Verifying it works

```bash
npm run dev

# Segments — headline, image and form default should all change
open 'http://localhost:3000/?v=boat'
open 'http://localhost:3000/?v=motorhome'

# Machine-readable quote
curl 'http://localhost:3000/api/agent/quote?type=caravan&length=7.2' | jq .recommendation

# Integration status — tells you which sinks are actually live
curl http://localhost:3000/api/health | jq .

# The AI-agent brief, including the pricing warnings
curl http://localhost:3000/llms.txt

# Rate limiting: the 6th submission in a minute should return 429
for i in $(seq 1 8); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:3000/api/quote \
    -H 'Content-Type: application/json' -d '{}'
done
```

Then submit the form and check `.data/leads.jsonl` and the server console.

Funnel data appears at `/admin/monitoring` — read `SECURITY.md` before exposing
that route.

---

## Deployment

Built for Vercel, but it is a standard Next.js app and will run anywhere Node 20+
runs.

1. Push to a Git repository and import it.
2. Set `NEXT_PUBLIC_SITE_URL` to the real domain.
3. Set `IP_SALT` (see `SECURITY.md`).
4. Add whichever lead sinks you want.
5. Point ads at `offer.caravanconcierge.com.au/?v=<segment>` per ad group.

The existing WordPress site is untouched.

**On serverless hosts**, the filesystem is ephemeral — set `LEADS_FILE` to a
mounted volume, or rely on the webhook/Sheets sinks for durability. `/api/health`
reports which sinks are live so an uptime monitor can alert on a silent
misconfiguration.

---

## Before launch

See `HANDOVER.md` for the full list. The three that matter most:

1. **Confirm the pricing model.** Bays and coverings are treated as separate
   choices because that is how the current site presents them. If a covering rate
   *replaces* a bay rate, that is a one-file change.
2. **Remove the placeholder phone number** from the main site — `0412 123 123` is
   published there and is almost certainly dummy data.
3. **Supply real photography.** See `IMAGES.md`. The page ships complete without
   it, but real facility shots will beat vector art on trust.
