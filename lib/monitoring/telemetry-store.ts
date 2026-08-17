import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * First-party telemetry store for Web Vitals and funnel events.
 *
 * Deliberately boring: append-only JSONL on disk, with an in-memory ring buffer
 * for the dashboard so reading never blocks on I/O. No third-party analytics
 * account is required for the CRO numbers to work, and no visitor data leaves
 * the server — which is also why these events need no cookie consent.
 *
 * On a serverless host, set TELEMETRY_FILE to a mounted volume or forward these
 * to your warehouse; the ring buffer alone survives only as long as the instance.
 */

export interface TelemetryRecord {
  kind: 'vital' | 'event'
  name: string
  ts: number
  [key: string]: unknown
}

const RING_SIZE = 2_000
const ring: TelemetryRecord[] = []

function filePath(): string {
  return process.env.TELEMETRY_FILE ?? join(process.cwd(), '.data', 'telemetry.jsonl')
}

export async function recordTelemetry(record: TelemetryRecord): Promise<void> {
  ring.push(record)
  if (ring.length > RING_SIZE) ring.splice(0, ring.length - RING_SIZE)

  if (process.env.TELEMETRY_PERSIST === 'false') return

  const path = filePath()
  await mkdir(dirname(path), { recursive: true })
  await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8')
}

/** Most recent first. Reads the ring, falling back to disk on a cold start. */
export async function readTelemetry(limit = 1_000): Promise<TelemetryRecord[]> {
  if (ring.length > 0) return ring.slice(-limit).reverse()

  try {
    const raw = await readFile(filePath(), 'utf8')
    return raw
      .trim()
      .split('\n')
      .slice(-limit)
      .map((line) => {
        try {
          return JSON.parse(line) as TelemetryRecord
        } catch {
          return null
        }
      })
      .filter((r): r is TelemetryRecord => r !== null)
      .reverse()
  } catch {
    return []
  }
}

/** Test seam. */
export function __resetTelemetry() {
  ring.length = 0
}
