/**
 * Pulls the client's existing facility photography off their live site into
 * /public/images, so the page can ship with real imagery of the real facility
 * rather than stock placeholders.
 *
 *   npx tsx scripts/fetch-brand-assets.ts
 *
 * These are the client's own images being used on the client's own landing page.
 * They are working placeholders, not the finished article — see IMAGES.md for
 * what to reshoot and at what dimensions. Files are written with a `src-`
 * prefix so it is obvious which assets are borrowed and still need replacing.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SOURCE = 'https://www.caravanconcierge.com.au/'
const OUT_DIR = join(process.cwd(), 'public', 'images')
const MAX_ASSETS = 20

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const res = await fetch(SOURCE, {
    headers: { 'User-Agent': 'CaravanConciergeLandingPage/1.0 (asset migration)' },
  })

  if (!res.ok) {
    throw new Error(`Could not fetch ${SOURCE}: ${res.status}`)
  }

  const html = await res.text()

  // Collect image URLs from src, data-src (lazy loading) and srcset.
  const urls = new Set<string>()
  const patterns = [
    /<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp|avif))["']/gi,
    /<img[^>]+data-src=["']([^"']+\.(?:jpe?g|png|webp|avif))["']/gi,
    /srcset=["']([^"']+)["']/gi,
  ]

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[1]
      if (!raw) continue
      for (const candidate of raw.split(',')) {
        const url = candidate.trim().split(/\s+/)[0]
        if (url && /\.(jpe?g|png|webp|avif)$/i.test(url)) {
          urls.add(new URL(url, SOURCE).href)
        }
      }
    }
  }

  const list = [...urls].slice(0, MAX_ASSETS)

  if (list.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      'No images found. The site may render them via JavaScript — save them manually into ' +
        'public/images instead, following the spec in IMAGES.md.',
    )
    return
  }

  // eslint-disable-next-line no-console
  console.log(`Found ${urls.size} images; downloading ${list.length}...`)

  let saved = 0

  for (const url of list) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'CaravanConciergeLandingPage/1.0 (asset migration)' },
      })
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`  skip ${url} — ${response.status}`)
        continue
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      // Ignore tracking pixels and spacer gifs.
      if (buffer.byteLength < 5_000) continue

      const name = `src-${decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'image')}`
        .replace(/[^a-zA-Z0-9.\-_]/g, '-')
        .toLowerCase()

      await writeFile(join(OUT_DIR, name), buffer)
      saved++
      // eslint-disable-next-line no-console
      console.log(`  saved ${name} (${Math.round(buffer.byteLength / 1024)} KB)`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`  failed ${url}:`, error instanceof Error ? error.message : error)
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nSaved ${saved} images to public/images.\n` +
      'These are working placeholders from the existing site. Read IMAGES.md before launch —\n' +
      'the hero and facility shots should be reshot at the dimensions listed there.',
  )
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Asset fetch failed:', error)
  process.exit(1)
})
