'use client'

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { BUDGETS, rateVital, type VitalName } from './budgets'

/**
 * Real-user Web Vitals collection.
 *
 * Lab scores (Lighthouse) tell you what a datacentre in California experiences.
 * These are the numbers your actual paid traffic experiences on a 4G phone in
 * Ipswich, which is the only measurement that correlates with conversion rate.
 *
 * Budgets live in ./budgets so the dashboard and Lighthouse CI share them.
 */

function report(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rawValue: metric.value,
    rating: rateVital(metric.name, metric.value),
    budget: BUDGETS[metric.name as VitalName] ?? null,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
    connection:
      (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
        ?.effectiveType ?? null,
    ts: Date.now(),
  })

  // sendBeacon survives page unload, which is exactly when CLS/INP finalise.
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', new Blob([body], { type: 'application/json' }))
  } else {
    void fetch('/api/vitals', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {})
  }
}

let started = false

export function initVitals() {
  if (started || typeof window === 'undefined') return
  started = true

  onLCP(report)
  onINP(report)
  onCLS(report)
  onFCP(report)
  onTTFB(report)
}
