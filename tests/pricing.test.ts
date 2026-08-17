import { describe, expect, it } from 'vitest'
import {
  annualCost,
  bays,
  cheapestFitting,
  fittingBays,
  fromPriceFor,
  recommendBay,
} from '@/content/pricing'
import { segments, segmentFromPrice, segmentHeadline } from '@/content/segments'

/**
 * The pricing recommender is the highest-stakes pure logic in the project: it
 * decides the number a customer sees before they enquire, and the number they
 * are then quoted on the phone. These tests exist to keep those two the same.
 */

describe('recommendBay', () => {
  it('never recommends a bay the vehicle does not fit in', () => {
    for (const length of [3, 5, 5.5, 6, 7.2, 8.5, 9, 11.5]) {
      const bay = recommendBay(length)
      expect(bay, `no bay found for ${length}m`).not.toBeNull()
      expect(bay!.fitsUpToMetres).toBeGreaterThanOrEqual(length)
    }
  })

  it('does NOT recommend restricted-access bays as the headline price', () => {
    // The regression this guards: a 7m caravan's cheapest fitting bay is the $27
    // annual bay, whose access is "one collection per year". Quoting that wins
    // the click and loses the sale.
    const bay = recommendBay(7)
    expect(bay?.accessTier).not.toBe('restricted')
    expect(bay?.weeklyPrice).toBe(36)
  })

  it('recommends a wide bay when the vehicle needs one', () => {
    const bay = recommendBay(9, true)
    expect(bay?.wide).toBe(true)
    expect(bay?.fitsUpToMetres).toBeGreaterThanOrEqual(9)
  })

  it('returns null when nothing fits, rather than a bay that does not', () => {
    expect(recommendBay(15)).toBeNull()
    expect(recommendBay(12.5)).toBeNull()
  })

  it('falls back to a restricted bay only when nothing else fits', () => {
    // A 5.5m jetski fits the shared bays; the recommendation should still be
    // the usable one, with the restricted one available as a trade-down.
    const recommended = recommendBay(5.5)
    const cheapest = cheapestFitting(5.5)
    expect(recommended?.accessTier).not.toBe('restricted')
    expect(cheapest!.weeklyPrice).toBeLessThanOrEqual(recommended!.weeklyPrice)
  })
})

describe('cheapestFitting', () => {
  it('is never more expensive than the recommendation', () => {
    for (const length of [4, 5.5, 7, 8.5, 11]) {
      const cheapest = cheapestFitting(length)
      const recommended = recommendBay(length)
      if (!cheapest || !recommended) continue
      expect(cheapest.weeklyPrice).toBeLessThanOrEqual(recommended.weeklyPrice)
    }
  })
})

describe('fittingBays', () => {
  it('returns results sorted cheapest first', () => {
    const list = fittingBays(7)
    const prices = list.map((b) => b.weeklyPrice)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('excludes narrow bays when a wide one is required', () => {
    expect(fittingBays(7, true).every((b) => b.wide)).toBe(true)
  })
})

describe('annualCost', () => {
  it('multiplies the weekly rate by 52', () => {
    expect(annualCost(36)).toBe(1872)
    expect(annualCost(46.5)).toBe(2418)
  })
})

describe('segment pricing honesty', () => {
  it('quotes each segment a price it can actually be charged', () => {
    for (const segment of segments) {
      const price = segmentFromPrice(segment)
      expect(price, `${segment.id} has no achievable price`).not.toBeNull()

      // The headline price must correspond to a bay that genuinely fits this
      // segment's typical vehicle.
      const wide = segment.id === 'motorhome'
      const bay = recommendBay(segment.typicalLengthMetres, wide)
      expect(bay?.weeklyPrice).toBe(price)
      expect(bay!.fitsUpToMetres).toBeGreaterThanOrEqual(segment.typicalLengthMetres)
    }
  })

  it('never advertises $15 to a caravan owner', () => {
    const caravan = segments.find((s) => s.id === 'caravan')!
    const headline = segmentHeadline(caravan)
    expect(headline).not.toContain('$15')
    expect(headline).toContain('$36')
  })

  it('substitutes a real price into every headline template', () => {
    for (const segment of segments) {
      expect(segmentHeadline(segment)).not.toContain('{price}')
    }
  })
})

describe('bay data integrity', () => {
  it('has unique ids', () => {
    const ids = bays.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('always leaves clearance between the bay and what it accepts', () => {
    for (const bay of bays) {
      expect(bay.fitsUpToMetres).toBeLessThan(bay.lengthMetres)
    }
  })

  it('marks every 4m-wide bay as wide', () => {
    for (const bay of bays) {
      expect(bay.wide).toBe(bay.widthMetres >= 4)
    }
  })
})

describe('fromPriceFor', () => {
  it('returns null rather than a misleading number when nothing fits', () => {
    expect(fromPriceFor(20)).toBeNull()
  })
})
