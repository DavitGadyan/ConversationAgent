'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, MessageCircle, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { conciergeTree, START_NODE, type Answers, type NodeId } from '@/lib/concierge/script'
import { useSegment } from '@/components/segment/segment-provider'
import { track } from '@/lib/monitoring/analytics'
import { springSoft } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { SegmentId } from '@/content/segments'

interface Message {
  id: number
  from: 'agent' | 'user'
  text: string
}

/**
 * The on-page concierge.
 *
 * Two jobs. First, it catches the visitor who will not start a form but will
 * answer a question — a meaningful slice of paid traffic, especially on mobile.
 * Second, it hands off *warm*: everything it learns pre-fills the real form and
 * switches the page's segment, so nobody is asked the same thing twice.
 *
 * Every answer comes from content/, so it cannot invent a price. See
 * lib/concierge/script.ts for why that is deliberate.
 */
export function Concierge() {
  const [open, setOpen] = useState(false)
  const [nodeId, setNodeId] = useState<NodeId>(START_NODE)
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [inputValue, setInputValue] = useState('')
  const [typing, setTyping] = useState(false)

  const { setSegment } = useSegment()
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageId = useRef(0)
  const node = conciergeTree[nodeId]

  const pushAgentMessage = useCallback((text: string) => {
    setTyping(true)
    // A short, believable pause. Instant replies read as a lookup table; this
    // reads as an answer.
    const delay = Math.min(900, 260 + text.length * 6)
    const timer = setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { id: messageId.current++, from: 'agent', text }])
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  // Speak on arrival at each node.
  useEffect(() => {
    if (!open || !node) return
    const text = typeof node.say === 'function' ? node.say(answers) : node.say
    return pushAgentMessage(text)
    // `answers` is intentionally excluded: we speak once per node, using the
    // answers as they stood on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const choose = (label: string, next: NodeId, set?: Record<string, string | number | boolean>) => {
    setMessages((prev) => [...prev, { id: messageId.current++, from: 'user', text: label }])
    if (set) {
      setAnswers((prev) => ({ ...prev, ...set }))
      // Keep the rest of the page in step with what they just told us.
      if (typeof set.segment === 'string') setSegment(set.segment as SegmentId, 'chip')
    }
    setNodeId(next)
  }

  const submitInput = (e: React.FormEvent) => {
    e.preventDefault()
    if (!node?.input || !inputValue.trim()) return

    const raw = inputValue.trim()
    const value = node.input.kind === 'number' ? Number(raw) : raw
    if (node.input.kind === 'number' && (!Number.isFinite(value as number) || (value as number) <= 0)) {
      return
    }

    setMessages((prev) => [
      ...prev,
      { id: messageId.current++, from: 'user', text: node.input!.kind === 'number' ? `${raw}m` : raw },
    ])
    setAnswers((prev) => ({ ...prev, [node.input!.key]: value }))
    setInputValue('')
    setNodeId(node.input.next)
  }

  const handoff = () => {
    // Hand the collected answers to the form, then scroll to it.
    try {
      window.localStorage.setItem(
        'cc_quote_draft',
        JSON.stringify({ ...answers, _step: 2, _source: 'concierge' }),
      )
    } catch {
      /* storage blocked — the form still works, just without the pre-fill */
    }

    track({ name: 'concierge_completed', segment: String(answers.segment ?? 'unknown') })
    setOpen(false)
    document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // A full reload would lose the animation; the form reads the draft on mount,
    // so nudge it by dispatching a storage-like event the form listens for.
    window.dispatchEvent(new CustomEvent('cc:draft-updated'))
  }

  return (
    <>
      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => {
          setOpen(true)
          track({ name: 'concierge_opened', placement: 'floating' })
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, ...springSoft }}
        className={cn(
          'fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3',
          'text-[14px] font-medium text-white shadow-[var(--shadow-float)]',
          'transition-transform hover:scale-105 md:bottom-6',
          open && 'pointer-events-none opacity-0',
        )}
      >
        {/*
          No aria-label here on purpose. An aria-label of "Open the storage
          concierge" would override the visible text and break WCAG 2.5.3
          (Label in Name) — a speech-input user saying "click get a price"
          would find nothing. The visible text is a perfectly good name.
        */}
        <MessageCircle size={18} aria-hidden />
        <span className="hidden sm:inline">Get a price in 30 seconds</span>
        <span className="sm:hidden">Quick price</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={springSoft}
            role="dialog"
            aria-label="Storage concierge"
            className="fixed bottom-4 right-4 z-50 flex max-h-[min(560px,80vh)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[28px] bg-card shadow-[var(--shadow-float)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-highlight">
                  <Sparkles size={16} className="text-ink" aria-hidden />
                </span>
                <div>
                  <p className="text-[15px] font-semibold leading-tight text-ink">Storage concierge</p>
                  <p className="text-[12px] text-muted">Typically replies instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close concierge"
                className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {/* Transcript */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
              aria-live="polite"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', message.from === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <p
                    className={cn(
                      'max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-snug',
                      message.from === 'user'
                        ? 'rounded-br-md bg-ink text-white'
                        : 'rounded-bl-md bg-sunken text-ink-soft',
                    )}
                  >
                    {message.text}
                  </p>
                </motion.div>
              ))}

              {typing && (
                <div className="flex justify-start" aria-label="Concierge is typing">
                  <span className="flex gap-1 rounded-[18px] rounded-bl-md bg-sunken px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-faint"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
                      />
                    ))}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            {!typing && node && (
              <div className="border-t border-line p-4">
                {node.handoff ? (
                  <Button onClick={handoff} size="lg" className="w-full">
                    Finish my quote
                    <ArrowRight size={18} aria-hidden />
                  </Button>
                ) : node.input ? (
                  <form onSubmit={submitInput} className="flex gap-2">
                    <input
                      type={node.input.kind === 'number' ? 'number' : 'text'}
                      inputMode={node.input.kind === 'number' ? 'decimal' : 'text'}
                      step="0.1"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={node.input.placeholder}
                      aria-label={node.input.placeholder}
                      autoFocus
                      className="h-11 flex-1 rounded-full border border-line bg-canvas px-4 text-ink outline-none focus:border-action focus:ring-4 focus:ring-action/10"
                    />
                    <Button type="submit" className="shrink-0 px-4" aria-label="Send">
                      <ArrowRight size={18} aria-hidden />
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {node.options?.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => choose(option.label, option.next, option.set)}
                        className="rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-highlight-soft"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
