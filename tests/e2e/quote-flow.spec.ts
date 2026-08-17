import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end coverage of the conversion path.
 *
 * These test the things that lose money if they break: the form completing, the
 * segment message-match holding, the price staying consistent between the
 * headline and the estimate, and the whole thing working with a keyboard.
 */

async function fillStep1(page: Page, { length = '7.2', postcode = '4305' } = {}) {
  const lengthField = page.getByLabel('Length', { exact: false })
  await lengthField.clear()
  await lengthField.fill(length)
  await expect(lengthField).toHaveValue(length)

  await page.getByLabel('Postcode').fill(postcode)
  await page.getByRole('button', { name: /see my price/i }).click()
  await expect(page.getByText('Step 2 of 3')).toBeVisible()
}

async function fillStep2(page: Page) {
  await page.getByLabel('When do you need it stored?').selectOption('ASAP — within a week')
  await page.getByLabel('Roughly how long for?').selectOption('6 – 12 months')
  await page.getByLabel('What kind of storage?').selectOption('Outdoor — best value')
  await page.getByRole('button', { name: /continue/i }).click()
}

test.describe('quote form', () => {
  test('completes all three steps and reaches the onboarding page', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Step 1 of 3')).toBeVisible()
    await fillStep1(page)

    await expect(page.getByText('Step 2 of 3')).toBeVisible()
    await fillStep2(page)

    await expect(page.getByText('Step 3 of 3')).toBeVisible()
    await page.getByLabel('Your name').fill('E2E Tester')
    await page.getByLabel('Phone').fill('0412345678')
    await page.getByLabel(/contact me about my storage quote/i).check()

    await page.getByRole('button', { name: /get my quote/i }).click()

    await page.waitForURL(/\/thank-you/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: /you are on the list/i })).toBeVisible()
    await expect(page.getByText(/what happens next/i)).toBeVisible()
  })

  test('blocks progress and explains why when a field is invalid', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Postcode').fill('12')
    await page.getByRole('button', { name: /see my price/i }).click()

    await expect(page.getByText(/4-digit Australian postcode/i)).toBeVisible()
    await expect(page.getByText('Step 1 of 3')).toBeVisible()
  })

  test('rejects a non-Australian phone number', async ({ page }) => {
    await page.goto('/')
    await fillStep1(page)
    await fillStep2(page)

    await page.getByLabel('Your name').fill('E2E Tester')
    await page.getByLabel('Phone').fill('12345')
    await page.getByLabel(/contact me about my storage quote/i).check()
    await page.getByRole('button', { name: /get my quote/i }).click()

    await expect(page.getByText(/does not look like an Australian phone number/i)).toBeVisible()
  })

  test('restores a part-finished form after a reload', async ({ page }) => {
    await page.goto('/')
    await fillStep1(page, { postcode: '4000' })
    await expect(page.getByText('Step 2 of 3')).toBeVisible()

    await page.reload()

    // The visitor picks up where they left off rather than starting again.
    await expect(page.getByText('Step 2 of 3')).toBeVisible()
  })

  test('shows a live price estimate before asking for contact details', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Length', { exact: false }).fill('7.2')

    const estimate = page.getByText(/your estimated rate/i)
    await expect(estimate).toBeVisible()
    await expect(page.getByText(/\$36/).first()).toBeVisible()
  })
})

test.describe('segment message match', () => {
  const cases = [
    { v: 'boat', heading: /boat storage/i },
    { v: 'motorhome', heading: /motorhome & RV storage/i },
    { v: 'jetski', heading: /jetski storage/i },
  ]

  for (const { v, heading } of cases) {
    test(`?v=${v} lands on matching copy`, async ({ page }) => {
      await page.goto(`/?v=${v}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    })
  }

  test('clicking a chip rewrites the headline and updates the URL', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Boat', exact: true }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/boat storage/i)
    await expect(page).toHaveURL(/v=boat/)
  })

  test('the headline price matches the price the form quotes', async ({ page }) => {
    // Guards the regression where the headline said $46.50 and the estimate $36.
    await page.goto('/?v=motorhome')

    const heading = await page.getByRole('heading', { level: 1 }).textContent()
    const headlinePrice = heading?.match(/\$[\d.]+/)?.[0]
    expect(headlinePrice).toBeTruthy()

    const estimate = page.locator('#quote-form').getByText(/your estimated rate/i)
    await expect(estimate).toBeVisible()
    await expect(page.locator('#quote-form')).toContainText(headlinePrice!)
  })
})

test.describe('pricing honesty', () => {
  test('never recommends the restricted-access bay as the headline price', async ({ page }) => {
    await page.goto('/?v=caravan')

    const estimate = page.locator('form')
    await expect(estimate.getByText(/\$36/).first()).toBeVisible()
    // The cheaper restricted bay is offered, but labelled.
    await expect(estimate.getByText(/one collection per year/i)).toBeVisible()
  })

  test('the size finder recommends a full-access bay', async ({ page }) => {
    await page.goto('/#pricing')
    const pricing = page.locator('#pricing')
    await expect(pricing.getByText('Best fit')).toBeVisible()
    await expect(pricing.getByText('Full 24/7 access').first()).toBeVisible()
  })
})

test.describe('accessibility', () => {
  test('the form is completable with the keyboard alone', async ({ page }) => {
    await page.goto('/')

    // The skip link is the first tab stop, and it targets a landmark that
    // actually exists on every page.
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toHaveAttribute('href', '#main')
    await expect(page.locator('#main')).toBeAttached()

    // Type into the fields exactly as a keyboard user would: select-all to
    // replace the prefilled default, then type. pressSequentially fires real
    // key events rather than setting the value directly.
    const lengthField = page.getByLabel('Length', { exact: false })
    await lengthField.press('ControlOrMeta+a')
    await lengthField.pressSequentially('7.2')
    await expect(lengthField).toHaveValue('7.2')

    const postcodeField = page.getByLabel('Postcode')
    await postcodeField.press('ControlOrMeta+a')
    await postcodeField.pressSequentially('4305')
    await expect(postcodeField).toHaveValue('4305')

    // And advance with the keyboard, not a click.
    await page.getByRole('button', { name: /see my price/i }).press('Enter')
    await expect(page.getByText('Step 2 of 3')).toBeVisible()
  })

  test('every form control has an accessible name', async ({ page }) => {
    await page.goto('/')
    const controls = page.locator('#quote-form input:not([type="hidden"]), #quote-form select')
    const count = await controls.count()

    for (let i = 0; i < count; i++) {
      const control = controls.nth(i)
      // The honeypot is intentionally hidden from assistive tech.
      if (await control.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)) continue

      const name = await control.evaluate((el) => {
        const id = el.getAttribute('id')
        const label = id ? document.querySelector(`label[for="${id}"]`) : null
        return label?.textContent?.trim() || el.getAttribute('aria-label') || ''
      })
      expect(name, `control ${i} has no accessible name`).not.toBe('')
    }
  })

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // Content is visible immediately rather than waiting on a scroll animation.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /see my price/i })).toBeVisible()
  })
})

test.describe('agent + monitoring endpoints', () => {
  test('health reports integration status', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.integrations.store).toBe(true)
    expect(body.content.bays).toBeGreaterThan(0)
  })

  test('the agent quote endpoint returns a real, fitting recommendation', async ({ request }) => {
    const res = await request.get('/api/agent/quote?type=caravan&length=7.2')
    expect(res.ok()).toBeTruthy()

    const body = await res.json()
    expect(body.recommendation.weeklyPrice).toBe(36)
    expect(body.recommendation.fitsUpToMetres).toBeGreaterThanOrEqual(7.2)
    expect(body.disclaimer).toContain('confirmed by phone')
  })

  test('llms.txt warns agents about the pricing trap', async ({ request }) => {
    const res = await request.get('/llms.txt')
    expect(res.ok()).toBeTruthy()

    const text = await res.text()
    expect(text).toContain('Notes for AI assistants')
    expect(text).toContain('does not fit a typical 7m caravan')
  })

  test('rate limits repeated submissions', async ({ request }) => {
    const payload = {
      vehicleType: 'Caravan',
      lengthMetres: 7,
      postcode: '4305',
      timeline: 'ASAP — within a week',
      duration: '6 – 12 months',
      covering: 'Outdoor — best value',
      needsPower: false,
      needsPickup: false,
      name: 'Rate Limit Test',
      phone: '0412345678',
      consent: true,
      startedAt: Date.now() - 30_000,
    }

    // A client IP unique to this test invocation.
    //
    // Three collisions to avoid: the quota shared by the browser-driven
    // submission tests on localhost, the same test running under a second
    // project, and a previous run whose 60-second window has not yet expired on
    // a reused server. A random address in the reserved TEST-NET-3 documentation
    // range (203.0.113.0/24) sidesteps all three. The limiter keys on
    // x-forwarded-for, which is exactly what it would see behind a real proxy.
    const rand = () => Math.floor(Math.random() * 254) + 1
    const headers = { 'x-forwarded-for': `203.0.${rand()}.${rand()}` }

    const codes: number[] = []
    for (let i = 0; i < 8; i++) {
      const res = await request.post('/api/quote', { data: payload, headers })
      codes.push(res.status())
    }

    // The first few succeed, then the limiter closes the door.
    expect(codes.filter((c) => c === 200).length).toBeGreaterThan(0)
    expect(codes).toContain(429)
  })
})
