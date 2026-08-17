'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_SEGMENT, getSegment, type Segment, type SegmentId } from '@/content/segments'
import { track } from '@/lib/monitoring/analytics'

/**
 * Segment state — the mechanism that lets ONE page serve every customer type.
 *
 * Two entry points:
 *   1. `?v=boat` on the URL. Each ad group links to its own segment, so a boat
 *      ad lands on boat copy and the message match is perfect before the visitor
 *      has done anything. This is the fix for the current site's biggest leak.
 *   2. The chips in the hero, for anyone who arrives generic or clicked the
 *      wrong ad.
 *
 * The choice is written back to the URL (replaceState, so it never adds a
 * history entry the back button has to chew through), which makes the page
 * shareable and keeps the selection through a refresh.
 */

interface SegmentContextValue {
  segment: Segment
  segmentId: SegmentId
  setSegment: (id: SegmentId, source?: 'chip' | 'url') => void
  /** True until the URL has been read, so we can avoid a copy flash on hydration. */
  ready: boolean
}

const SegmentContext = createContext<SegmentContextValue | null>(null)

export function SegmentProvider({ children }: { children: React.ReactNode }) {
  const [segmentId, setSegmentId] = useState<SegmentId>(DEFAULT_SEGMENT)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('v') ?? params.get('segment')
    const resolved = getSegment(fromUrl)

    if (fromUrl && resolved.id === fromUrl) {
      setSegmentId(resolved.id)
      track({ name: 'segment_selected', segment: resolved.id, source: 'url' })
    }

    setReady(true)
    track({ name: 'page_view', segment: resolved.id })
  }, [])

  const setSegment = useCallback((id: SegmentId, source: 'chip' | 'url' = 'chip') => {
    setSegmentId(id)
    track({ name: 'segment_selected', segment: id, source })

    const url = new URL(window.location.href)
    url.searchParams.set('v', id)
    window.history.replaceState(null, '', url)
  }, [])

  const value = useMemo<SegmentContextValue>(
    () => ({ segment: getSegment(segmentId), segmentId, setSegment, ready }),
    [segmentId, setSegment, ready],
  )

  return <SegmentContext.Provider value={value}>{children}</SegmentContext.Provider>
}

export function useSegment(): SegmentContextValue {
  const ctx = useContext(SegmentContext)
  if (!ctx) throw new Error('useSegment must be used inside <SegmentProvider>')
  return ctx
}
