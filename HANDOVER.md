# Handover

What was built, what needs your input, and what to do in the first fortnight.

---

## 1. Things I need you to confirm

These are genuine ambiguities in the source material. I made a defensible call on
each and documented it, but you know the business and I do not.

### The pricing model — most important

Your site publishes **two** rate tables:

- **Bays** — six sizes, $15 to $46.50/week, varying by size and access level.
- **Coverings** — outdoor $30, shaded $40, covered shed $45, indoor $85/week.

I have modelled these as **two separate choices**, because that is how the page
presents them, and I have deliberately **never added them together** to produce a
combined figure. The size finder returns a bay rate, and coverings are shown
separately as upgrades with "final pricing confirmed on the call".

If that is wrong — if a covering rate *replaces* the bay rate, or if outdoor is
already included in the bay price — tell me and it is a change to one file
(`content/pricing.ts`).

### The $15 problem

"From $15 per week" appears across your current site. But $15 is the 6 m shared
rear bay that is *blocked in and moved on request*. A typical 7 m caravan does
not fit it. The cheapest bay that fits is $27 — and that one permits **one
collection per year**. A caravan owner who wants normal access pays $36.

**This is very likely contributing to the problem you described.** You said leads
go quiet after the follow-up. A visitor who arrives expecting $15 and hears $36
on the phone has just had a 140% price increase sprung on them, and they will
re-rate everything else you told them at the same time. It looks like a follow-up
problem; it is a price-expectation problem that starts in the ad.

So each segment on the new page quotes the price it can actually be charged:

| Segment | Typical length | Honest "from" price |
|---|---|---|
| Caravan | 7 m | **$36**/week |
| Boat | 6 m | **$36**/week |
| Motorhome & RV | 9 m | **$46.50**/week |
| Campervan | 5.5 m | **$21**/week |
| Car & trailer | 5 m | **$21**/week |
| Jetski | 4 m | **$21**/week |

The cheaper restricted bay is still offered — as an explicit trade-down with its
limitation stated, not as the headline. If you would rather advertise the $15 and
handle the gap on the call, that is your call to make; change
`recommendBay()` in `content/pricing.ts` and the headlines follow automatically.

### The placeholder phone number

Your site publishes three numbers: `07 3608 5993`, SMS `0493 225 823`, and
`0412 123 123`. The last is a well-known Australian dummy pattern and is almost
certainly unreplaced test data.

I have **not** reproduced it. The new page uses one number for calls (with the
SMS number in the footer), because three numbers is a choice the visitor should
never have to make. **Please remove it from the main site too** — anyone who
notices reads the whole business as less careful.

### Review count

The aggregate rating is set to **5.0 from 27 reviews** in `content/site.ts`. I
could not verify the real count from the public page. Put your actual Google
review count in before launch — an inflated review count is both a trust risk and,
in structured data, a policy problem.

### Availability date

The strip reads "Spaces available as of 16 August 2026", carried over from your
site. It is driven by `NEXT_PUBLIC_AVAILABILITY_DATE` so you can update it without
a code change. **Keep it current** — a stale date is worse than no date.

---

## 2. What was built

- **One page, six segments.** `?v=boat`, `?v=motorhome`, etc. rewrite the
  headline, sub-headline and form default. Point each ad group at its own URL.
- **The long form you asked for**, split into three steps. Every field you wanted
  is still captured; the split is what keeps completion up. A live price estimate
  appears after step 1 and refines as they go, so each extra question visibly
  buys them something.
- **Drafts survive.** A closed tab or an interrupting phone call no longer costs
  you the lead.
- **Size finder** replacing the two rate tables with one question.
- **Savings calculator** against your own published competitor range.
- **Scripted concierge** that qualifies visitors and hands off pre-filled into the
  form. Rules-based, so it cannot invent a price.
- **AI-agent layer**: `llms.txt`, full JSON-LD, and `/api/agent/quote` so
  ChatGPT/Claude/Perplexity quote you correctly instead of guessing.
- **Onboarding page** with timing on every step, a calendar reminder and a prep
  checklist — aimed squarely at the leads-go-cold problem.
- **Monitoring**: real-user Web Vitals, per-step funnel drop-off, structured
  logging with PII redaction, and a health probe that reports which lead
  integrations are actually live.
- **Security**: nonce CSP, rate limiting, invisible bot filtering, server-side
  validation, hashed IPs.

---

## 3. Before you go live

- [ ] Confirm the pricing model above.
- [ ] Set the real review count in `content/site.ts`.
- [ ] Remove `0412 123 123` from the main site.
- [ ] Set `IP_SALT` to a random value (see `SECURITY.md`).
- [ ] Configure lead delivery — **do the SMS one first**. Speed-to-lead is the
      single biggest lever you have, and it is 4 environment variables.
- [ ] Protect or delete `/admin/monitoring` (see `SECURITY.md`).
- [ ] Point `NEXT_PUBLIC_SITE_URL` at the real domain.
- [ ] Supply photography (see `IMAGES.md`) — optional, the page is complete
      without it.
- [ ] Set up conversion tracking in Google Ads / Meta against `/thank-you`.

---

## 4. The first two weeks

Do not change anything for two weeks. Collect data first — that is the whole
point of the instrumentation.

**Week 1–2: watch `/admin/monitoring`.**

The funnel table answers the question your current site cannot: *where exactly do
people stop?* Look at the continue rate per step.

- **Step 1 continue rate low?** The offer or the message match is wrong, not the
  form. Look at which segments are arriving.
- **Step 2 low?** A qualification question is too invasive or too vague. The
  covering question is the usual suspect.
- **Step 3 low?** They do not want to give a phone number. Test making email the
  primary contact field.

**Then change one thing at a time.** With paid traffic you will have enough
volume to read a result in a week or two. Changing three things at once means you
learn nothing.

**Highest-expected-value tests, in order:**

1. **Headline price framing.** Now that the price is honest, test "from $36/week"
   against "under $160/month" — monthly framing often reads cheaper for a
   considered purchase, and it matches how people budget.
2. **Form length.** You moved from short to long for good reasons. Now you can
   actually measure it: try moving the covering question to post-submission and
   see whether step-2 completion rises more than lead quality falls.
3. **Segment-specific pain points.** The `painPoint` line in
   `content/segments.ts` is the cheapest thing on the page to test and the most
   likely to move it.

---

## 5. Where things live

Almost everything you will want to change is in `content/`:

| To change… | Edit |
|---|---|
| Prices, bays, coverings | `content/pricing.ts` |
| Headlines, segments, pain points | `content/segments.ts` |
| Phone, hours, rating, availability | `content/site.ts` |
| Testimonials, FAQs, service areas | `content/trust.ts` |
| Colours, radii, shadows, type | `app/globals.css` (`@theme` block) |
| Concierge conversation | `lib/concierge/script.ts` |

Change a price in `content/pricing.ts` and the hero headline, size finder, form
estimate, structured data, `llms.txt` and the agent API all update together. They
read the same source, so they cannot drift apart.

---

## 6. Honest limitations

- **No predicted uplift percentage.** Anyone quoting one before a test has run is
  guessing. The instrumentation is what will give you the real number.
- **No access to your ad or analytics data.** These findings come from the public
  site plus browser measurement. Your actual search terms, spend and conversion
  data would sharpen several of them considerably — particularly the segment mix,
  which currently assumes an even spread.
- **Performance comparison is partly unfair.** The new page was measured against
  a local build with no network latency. Page weight, request count and link
  counts are directly comparable; the timing rows are not, and the audit page
  says so.
- **Largest Contentful Paint was never captured** in the measurement environment,
  so it is not reported anywhere rather than being estimated.
- **The cold-start finding is a single observation**, not a median. The first
  uncached load of your site was dramatically slower than the four that followed.
  Worth confirming with your host before acting on it.
