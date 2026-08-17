# Lighthouse CI notes

`lighthouserc.json` cannot carry comments, so the reasoning for each disabled
assertion lives here. Nothing below is switched off because the page failed it —
each one is either inapplicable to the environment or broken in the tooling, and
both cases are stated so the list can be re-checked later.

## Budgets

Tighter than Google's "good" thresholds, and shared with the runtime collector in
`lib/monitoring/budgets.ts` so lab and field agree on what fast means. "Not
penalised by Core Web Vitals" is a much lower bar than "fast enough that nobody
leaves".

| Assertion | Budget |
|---|---|
| Performance | ≥ 95 |
| Accessibility | **100** |
| Best practices | ≥ 95 |
| SEO | **100** |
| LCP | ≤ 2000 ms |
| FCP | ≤ 1500 ms |
| CLS | ≤ 0.05 |
| Total blocking time | ≤ 200 ms |
| Script transfer | ≤ 300 KB |
| Total transfer | ≤ 600 KB |

## Two configuration details worth knowing

### The user agent is set explicitly

`emulatedUserAgent` appends `Chrome-Lighthouse` to the desktop preset's UA
string. This is not gaming the audit — it is making Lighthouse identify itself
truthfully, and it matters because of how Next 15 serves metadata.

Next **streams** metadata: on a normal browser request the description and title
tags arrive near the end of `<body>` and React hoists them into `<head>` during
hydration. For crawlers that parse HTML without executing JavaScript, Next
detects the user agent and falls back to a blocking render so the tags really are
in `<head>`. Its detection list includes `Chrome-Lighthouse` — but Lighthouse's
`desktop` preset **overrides the UA and strips that token**, so Next treats it as
an ordinary browser, and the `meta-description` audit then fails on a page whose
meta description is perfectly correct.

Verified per-user-agent before changing anything:

| User agent | Description in `<head>`? |
|---|---|
| `…Chrome-Lighthouse` | yes — blocking render |
| `facebookexternalhit/1.1` | yes — blocking render |
| `Googlebot/2.1` | no — but Googlebot executes JS and sees it after hoisting |
| plain Chrome | no — hoisted during hydration |

### Total blocking time is noisy on a loaded machine

TBT on this page measured **40–44 ms** on an idle machine and **138–539 ms**
while other browser instances were running. Same build, same config.

Two things follow. First, do not tune against a single lab run — `numberOfRuns`
is 3 and even that is not always enough. Second, and more importantly, **the
number to trust is the field data**, not the lab data: `lib/monitoring/vitals.ts`
collects INP from real visitors on real devices and reports it at
`/admin/monitoring`. Lighthouse is a regression gate, not a source of truth.

An attempt to reduce TBT by code-splitting the below-the-fold sections with
`next/dynamic` was made and reverted. Because those sections server-render, Next
bundles them into the initial chunks anyway — First Load JS did not move by a
single byte — and the apparent TBT change was machine noise.

## Disabled assertions, and why

| Audit | Reason |
|---|---|
| `non-composited-animations`<br>`lcp-lazy-loaded`<br>`prioritize-lcp-image` | All three fail with the **same Lighthouse internal error** in this environment: `Required TraceElements gatherer encountered an error: Dependency "RootCauses" failed`. That is a tooling fault, not a page fault — the audits never run, so they report `null` and `lighthouse:recommended` treats that as a failure. **Re-enable and re-check after a Lighthouse upgrade.** |
| `tap-targets` | Only runs under the mobile preset, and this config uses `desktop`. Mobile touch-target size is covered instead by the Playwright `mobile` project, which drives a real Pixel 5 viewport. |
| `canonical` | The canonical URL points at the production domain (`offer.caravanconcierge.com.au`), which is correct. Running against `localhost` therefore always reports a cross-domain canonical. Re-enable when running CI against the deployed site. |
| `uses-http2` | `next start` on localhost serves HTTP/1.1. The production host (Vercel) serves HTTP/2. |
| `csp-xss` | The CSP is set per-request in `middleware.ts` with a nonce, which Lighthouse's static analysis does not evaluate. See `SECURITY.md` for what is actually enforced. |

## Warnings that are deliberately left as warnings

- **`unused-javascript`** — Next.js ships route-level chunks that include code
  for interactions that have not happened yet (the form's later steps, the
  concierge). Failing the build on this would mean shipping a worse experience to
  save bytes that are already lazily loaded.
- **`dom-size`** — the page is a long landing page with an inline SVG
  illustration, so the node count is naturally high. It is worth watching, not
  worth blocking on.

## Running it

```bash
npm run build
npm run lighthouse           # uses the config, starts its own server on :3101
```

Against an already-running server:

```bash
npx lhci autorun --collect.url=http://localhost:3100/ --collect.startServerCommand=""
```
