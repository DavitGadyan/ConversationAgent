/**
 * Structured server-side logging with PII redaction.
 *
 * This page collects names, phone numbers, email addresses and postcodes. None
 * of that belongs in a log aggregator, so redaction happens here rather than
 * relying on every call site to remember.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const SENSITIVE_KEYS = new Set([
  'phone',
  'email',
  'name',
  'notes',
  'postcode',
  'authorization',
  'cookie',
  'password',
  'token',
  'apikey',
  'api_key',
])

function redactValue(value: string): string {
  if (value.length <= 2) return '••'
  return `${value.slice(0, 1)}••••${value.slice(-1)}`
}

export function redact(input: unknown, depth = 0): unknown {
  if (depth > 6) return '[deep]'
  if (input === null || input === undefined) return input
  if (Array.isArray(input)) return input.map((v) => redact(v, depth + 1))
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = typeof v === 'string' ? redactValue(v) : '[redacted]'
      } else {
        out[k] = redact(v, depth + 1)
      }
    }
    return out
  }
  return input
}

export interface LogContext {
  requestId?: string
  route?: string
  [key: string]: unknown
}

function emit(level: Level, message: string, context: LogContext = {}) {
  const line = JSON.stringify({
    level,
    message,
    ts: new Date().toISOString(),
    ...(redact(context) as object),
  })

  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  fn(line)
}

export const logger = {
  debug: (m: string, c?: LogContext) =>
    process.env.NODE_ENV !== 'production' && emit('debug', m, c),
  info: (m: string, c?: LogContext) => emit('info', m, c),
  warn: (m: string, c?: LogContext) => emit('warn', m, c),
  error: (m: string, c?: LogContext) => emit('error', m, c),
}

/** Correlates every log line and lead-sink result for a single request. */
export function newRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Error reporting hook. Wired to console today; drop a Sentry/Bugsnag call in
 * here and every error path in the app is covered at once.
 */
export function captureException(error: unknown, context: LogContext = {}) {
  logger.error(error instanceof Error ? error.message : 'Unknown error', {
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  })
}
