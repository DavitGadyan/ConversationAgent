import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** $46.50 → "$46.50", $36 → "$36". Trailing ".00" reads as fake precision. */
export function formatMoney(amount: number, opts: { cents?: boolean } = {}): string {
  const hasCents = amount % 1 !== 0
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: opts.cents ?? hasCents ? 2 : 0,
    maximumFractionDigits: opts.cents ?? hasCents ? 2 : 0,
  }).format(amount)
}

/** 2026-08-16 → "16 August 2026". */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** Australian mobile/landline, tolerant of spaces, +61 and brackets. */
export function normalisePhone(input: string): string {
  return input.replace(/[\s()-]/g, '')
}
