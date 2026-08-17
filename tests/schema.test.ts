import { describe, expect, it } from 'vitest'
import { quoteSchema, step1Schema, step3Schema, needsWideBay } from '@/lib/schema/quote'

const validQuote = {
  vehicleType: 'Caravan',
  lengthMetres: 7.2,
  postcode: '4305',
  timeline: 'ASAP — within a week',
  duration: '6 – 12 months',
  covering: 'Outdoor — best value',
  needsPower: false,
  needsPickup: false,
  name: 'Jane Smith',
  phone: '0412 345 678',
  email: 'jane@example.com',
  notes: '',
  consent: true,
} as const

describe('quoteSchema', () => {
  it('accepts a complete, valid submission', () => {
    const result = quoteSchema.safeParse(validQuote)
    expect(result.success).toBe(true)
  })

  it('normalises the phone number so the callback list is clean', () => {
    const result = quoteSchema.parse(validQuote)
    expect(result.phone).toBe('0412345678')
  })

  it('treats email as genuinely optional', () => {
    expect(quoteSchema.safeParse({ ...validQuote, email: '' }).success).toBe(true)
    const { email: _email, ...withoutEmail } = validQuote
    expect(quoteSchema.safeParse(withoutEmail).success).toBe(true)
  })

  it('requires explicit consent', () => {
    expect(quoteSchema.safeParse({ ...validQuote, consent: false }).success).toBe(false)
    const { consent: _consent, ...withoutConsent } = validQuote
    expect(quoteSchema.safeParse(withoutConsent).success).toBe(false)
  })

  it('rejects a filled honeypot', () => {
    const result = quoteSchema.safeParse({ ...validQuote, company: 'Acme Pty Ltd' })
    expect(result.success).toBe(false)
  })

  it('accepts an empty honeypot', () => {
    expect(quoteSchema.safeParse({ ...validQuote, company: '' }).success).toBe(true)
  })
})

describe('phone validation', () => {
  const cases: Array<[string, boolean]> = [
    ['0412345678', true],
    ['0412 345 678', true],
    ['+61412345678', true],
    ['61412345678', true],
    ['0736085993', true], // Brisbane landline
    ['(07) 3608 5993', true],
    ['07 3608 5993', true],
    ['0212345678', true], // Sydney landline
    ['041234567', false], // too short
    ['04123456789', false], // too long
    ['0112345678', false], // invalid leading digit
    ['not a phone', false],
    ['', false],
  ]

  for (const [input, valid] of cases) {
    it(`${valid ? 'accepts' : 'rejects'} "${input}"`, () => {
      const result = step3Schema.safeParse({ ...validQuote, phone: input })
      expect(result.success).toBe(valid)
    })
  }
})

describe('step1Schema', () => {
  it('requires a 4-digit postcode', () => {
    expect(step1Schema.safeParse({ vehicleType: 'Boat', lengthMetres: 6, postcode: '430' }).success).toBe(false)
    expect(step1Schema.safeParse({ vehicleType: 'Boat', lengthMetres: 6, postcode: '4305' }).success).toBe(true)
    expect(step1Schema.safeParse({ vehicleType: 'Boat', lengthMetres: 6, postcode: 'ABCD' }).success).toBe(false)
  })

  it('rejects an implausible length rather than silently quoting nothing', () => {
    expect(step1Schema.safeParse({ vehicleType: 'Boat', lengthMetres: 0, postcode: '4305' }).success).toBe(false)
    expect(step1Schema.safeParse({ vehicleType: 'Boat', lengthMetres: 40, postcode: '4305' }).success).toBe(false)
  })

  it('rejects a vehicle type that is not on the list', () => {
    expect(
      step1Schema.safeParse({ vehicleType: 'Spaceship', lengthMetres: 6, postcode: '4305' }).success,
    ).toBe(false)
  })
})

describe('needsWideBay', () => {
  it('flags the vehicle types that genuinely need width', () => {
    expect(needsWideBay('Motorhome')).toBe(true)
    expect(needsWideBay('RV')).toBe(true)
    expect(needsWideBay('5th Wheeler')).toBe(true)
    expect(needsWideBay('Bus')).toBe(true)
  })

  it('does not flag narrow vehicles', () => {
    expect(needsWideBay('Caravan')).toBe(false)
    expect(needsWideBay('Jetski')).toBe(false)
    expect(needsWideBay('Car')).toBe(false)
  })
})
