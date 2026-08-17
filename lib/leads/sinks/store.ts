import { appendFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Lead, LeadSink } from '../types'

/**
 * Local JSONL store. Always enabled, and always written FIRST.
 *
 * This is the durability guarantee: if Resend is down, the webhook 500s and
 * Twilio is out of credit, the lead still exists on disk and nobody loses a
 * customer. Every other sink is best-effort on top of this one.
 *
 * On a serverless host the filesystem is ephemeral, so set LEADS_FILE to a
 * mounted volume — or rely on the webhook/Sheets sinks for durability there.
 * The health endpoint reports which mode is active.
 */

const DEFAULT_PATH = join(process.cwd(), '.data', 'leads.jsonl')

export function leadsFilePath(): string {
  return process.env.LEADS_FILE ?? DEFAULT_PATH
}

export const storeSink: LeadSink = {
  name: 'store',

  isEnabled() {
    return true
  },

  async send(lead: Lead) {
    const path = leadsFilePath()
    await mkdir(dirname(path), { recursive: true })
    await appendFile(path, `${JSON.stringify(lead)}\n`, 'utf8')
  },
}
