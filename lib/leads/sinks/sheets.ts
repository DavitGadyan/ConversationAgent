import { createSign } from 'node:crypto'
import type { Lead, LeadSink } from '../types'
import { leadFields } from '../format'

/**
 * Appends each lead as a row in a Google Sheet.
 *
 * Implemented directly against the REST API with a self-signed service-account
 * JWT rather than pulling in `googleapis` (~40MB, and a large dependency
 * surface for what amounts to two HTTP calls).
 *
 * Setup: create a service account, download the JSON key, share the target
 * sheet with the service account's email address as an Editor, then set
 * GOOGLE_SERVICE_ACCOUNT_JSON (the whole key file, as a single-line string)
 * and GOOGLE_SHEET_ID.
 */

interface ServiceAccount {
  client_email: string
  private_key: string
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

let cachedToken: { token: string; expiresAt: number } | null = null

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ServiceAccount
    if (!parsed.client_email || !parsed.private_key) return null
    // Env vars flatten newlines; restore them or the key will not parse.
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, '\n') }
  } catch {
    return null
  }
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  )

  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const signature = base64url(signer.sign(sa.private_key))
  const assertion = `${header}.${claim}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`)

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in }
  return data.access_token
}

/** Column order matches leadFields() so the header row stays meaningful. */
export function leadToRow(lead: Lead): string[] {
  return leadFields(lead).map(([, value]) => value)
}

export const HEADER_ROW = [
  'Name',
  'Phone',
  'Email',
  'Vehicle',
  'Postcode',
  'Timeline',
  'Duration',
  'Storage type',
  'Power needed',
  'Pickup/delivery',
  'Recommended bay',
  'Notes',
  'Segment',
  'Source',
  'Campaign',
  'Received',
]

export const sheetsSink: LeadSink = {
  name: 'sheets',

  isEnabled() {
    return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID)
  },

  async send(lead: Lead) {
    const sa = readServiceAccount()
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (!sa || !sheetId) return

    const token = await getAccessToken(sa)
    const range = encodeURIComponent(process.env.GOOGLE_SHEET_RANGE ?? 'Leads!A:P')

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append` +
        `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [leadToRow(lead)] }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!res.ok) {
      // A stale token is the most common failure; clear it so the next lead retries clean.
      if (res.status === 401) cachedToken = null
      throw new Error(`Sheets append failed: ${res.status}`)
    }
  },
}
