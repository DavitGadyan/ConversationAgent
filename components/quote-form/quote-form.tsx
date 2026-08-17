'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Clock, Lock, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input, Select, Textarea, Checkbox } from '@/components/ui/field'
import { EstimatePanel } from './estimate-panel'
import { StepProgress } from './progress'
import { useSegment } from '@/components/segment/segment-provider'
import {
  COVERINGS,
  DURATIONS,
  TIMELINES,
  VEHICLE_TYPES,
  needsWideBay,
  quoteSchema,
  stepFields,
  TOTAL_STEPS,
  type QuoteInput,
} from '@/lib/schema/quote'
import { cheapestFitting, recommendBay } from '@/content/pricing'
import { captureAttribution, track } from '@/lib/monitoring/analytics'
import { stepSlide } from '@/lib/motion'

const DRAFT_KEY = 'cc_quote_draft'

/**
 * The quote form.
 *
 * The client's own diagnosis was that a SHORT form produced leads who then went
 * silent on the follow-up questions, so they moved to a long form. The long form
 * is the right call — but a long form presented as one wall of fields is where
 * conversion goes to die. So:
 *
 *   - Three steps. Step 1 is three cheap questions and sits above the fold.
 *   - The price estimate appears after step 1 and refines as they go, so each
 *     additional field visibly buys them something.
 *   - Contact details are asked LAST, once effort is already sunk.
 *   - Drafts persist to localStorage, so a phone call or a closed tab does not
 *     cost the lead.
 *   - Every step boundary emits an analytics event, which finally makes the
 *     drop-off measurable instead of guessed at.
 */
export function QuoteForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const { segment } = useSegment()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const startedAt = useRef(Date.now())
  const stepEnteredAt = useRef(Date.now())

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    mode: 'onBlur',
    defaultValues: {
      // Seeded synchronously at first render. Doing this in an effect instead
      // means writing to the field a moment AFTER it is interactive, which can
      // land in the middle of someone already typing into it.
      vehicleType: segment.formValue as QuoteInput['vehicleType'],
      lengthMetres: segment.typicalLengthMetres,
      postcode: '',
      needsPower: false,
      needsPickup: false,
      consent: undefined,
      company: '',
    },
  })

  /**
   * Keep the form in step with the hero chips.
   *
   * Two guards, and both are load-bearing:
   *
   *  - The touched flags mean that once the visitor edits a field, what they
   *    typed always wins.
   *  - The previous-segment ref means this only fires on an ACTUAL segment
   *    change. Without it the effect also ran on mount, writing to the length
   *    field a beat after it became interactive — which lands in the middle of
   *    anyone already typing and produces values like "77.2". The mount-time
   *    defaults are seeded synchronously in defaultValues instead.
   *
   * Without the length sync at all, switching Caravan (7m) → Motorhome (9m)
   * leaves 7m behind, and the hero headline then quotes a different price from
   * the estimate panel two inches to its right.
   */
  const typeTouched = useRef(false)
  const lengthTouched = useRef(false)
  const previousSegment = useRef(segment.id)

  useEffect(() => {
    if (segment.id === previousSegment.current) return
    previousSegment.current = segment.id

    if (!typeTouched.current) {
      setValue('vehicleType', segment.formValue as QuoteInput['vehicleType'])
    }
    if (!lengthTouched.current) {
      setValue('lengthMetres', segment.typicalLengthMetres)
    }
  }, [segment, setValue])

  /**
   * Restore a draft — either from a previous visit, or handed over by the
   * concierge widget, which writes the same key and then fires `cc:draft-updated`.
   */
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY)
        if (!raw) return
        const draft = JSON.parse(raw) as Partial<QuoteInput> & { _step?: number; _source?: string }

        for (const [key, value] of Object.entries(draft)) {
          if (key.startsWith('_') || value === undefined || value === null) continue
          setValue(key as keyof QuoteInput, value as never, { shouldValidate: false })
        }

        if (draft._step && draft._step > 1 && draft._step <= TOTAL_STEPS) {
          setStep(draft._step)
        }
      } catch {
        /* a corrupt draft must never stop the form rendering */
      }
    }

    load()
    window.addEventListener('cc:draft-updated', load)
    return () => window.removeEventListener('cc:draft-updated', load)
  }, [setValue])

  /**
   * Persist the draft, so an interrupting phone call or a closed tab does not
   * cost the lead.
   *
   * Typing is debounced — writing to localStorage on every keystroke is wasteful
   * — but a debounce alone loses the last few hundred milliseconds, which is
   * precisely the window in which someone leaves. So the draft is also flushed
   * synchronously on a step change and on the browser's "I am going away"
   * signals. `pagehide` is the reliable one; `visibilitychange` catches the
   * mobile case where the user switches apps and the tab is later discarded.
   */
  const values = watch()
  const latest = useRef({ values, step })
  latest.current = { values, step }

  const saveDraft = useCallback(() => {
    try {
      const { values: v, step: s } = latest.current
      const { company: _company, ...safe } = v
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...safe, _step: s }))
    } catch {
      /* storage full or blocked — not worth surfacing to the user */
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(saveDraft, 400)
    return () => clearTimeout(timer)
  }, [values, step, saveDraft])

  // Flush immediately when the step changes — a completed step is real progress.
  useEffect(() => {
    saveDraft()
  }, [step, saveDraft])

  useEffect(() => {
    const flush = () => saveDraft()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveDraft()
    }

    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [saveDraft])

  useEffect(() => {
    stepEnteredAt.current = Date.now()
    track({ name: 'form_step_viewed', step })
  }, [step])

  const lengthMetres = Number(values.lengthMetres) || 0
  const vehicleType = values.vehicleType ?? ''

  const recommendedBay = useMemo(
    () => (lengthMetres > 0 ? recommendBay(lengthMetres, needsWideBay(vehicleType)) : null),
    [lengthMetres, vehicleType],
  )

  // Shown as an explicit trade-down, never as the headline price.
  const cheaperBay = useMemo(
    () => (lengthMetres > 0 ? cheapestFitting(lengthMetres, needsWideBay(vehicleType)) : null),
    [lengthMetres, vehicleType],
  )

  // Report the estimate once per bay, not once per keystroke.
  const lastTrackedBay = useRef<string | null>(null)
  useEffect(() => {
    if (recommendedBay && recommendedBay.id !== lastTrackedBay.current) {
      lastTrackedBay.current = recommendedBay.id
      track({
        name: 'estimate_viewed',
        bayId: recommendedBay.id,
        weeklyPrice: recommendedBay.weeklyPrice,
      })
    }
  }, [recommendedBay])

  const next = useCallback(async () => {
    const fields = stepFields[step as keyof typeof stepFields]
    const valid = await trigger(fields as never, { shouldFocus: true })

    if (!valid) {
      for (const field of fields) {
        if (errors[field as keyof typeof errors]) {
          track({ name: 'form_field_error', step, field })
        }
      }
      return
    }

    track({ name: 'form_step_completed', step, msOnStep: Date.now() - stepEnteredAt.current })
    setDirection(1)
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }, [step, trigger, errors])

  const back = useCallback(() => {
    setDirection(-1)
    setStep((s) => Math.max(1, s - 1))
  }, [])

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          segment: segment.id,
          startedAt: startedAt.current,
          ...captureAttribution(),
        }),
      })

      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        reference?: string
      }

      if (!res.ok || !payload.ok) {
        throw new Error(payload.error ?? 'We could not send that. Please try again.')
      }

      track({
        name: 'form_step_completed',
        step: TOTAL_STEPS,
        msOnStep: Date.now() - stepEnteredAt.current,
      })
      track({
        name: 'quote_submitted',
        segment: segment.id,
        vehicleType: data.vehicleType,
        weeklyPrice: recommendedBay?.weeklyPrice ?? null,
      })

      window.localStorage.removeItem(DRAFT_KEY)

      const params = new URLSearchParams({ ref: payload.reference ?? '' })
      if (recommendedBay) params.set('bay', recommendedBay.id)
      router.push(`/thank-you?${params.toString()}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      setServerError(message)
      track({ name: 'quote_failed', reason: message })
      setSubmitting(false)
    }
  })

  return (
    <form
      id="quote-form"
      onSubmit={onSubmit}
      noValidate
      className="card-surface p-5 sm:p-6"
      aria-labelledby="quote-form-title"
    >
      <div className="mb-5">
        <h2
          id="quote-form-title"
          className="font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.02em] text-ink"
        >
          Get your storage quote
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} aria-hidden /> Takes 45 seconds
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={13} aria-hidden /> No deposit
          </span>
          <span className="inline-flex items-center gap-1">
            <Lock size={13} aria-hidden /> No obligation
          </span>
        </p>
      </div>

      <StepProgress current={step} total={TOTAL_STEPS} />

      {/* Honeypot. Hidden from sighted users AND from screen readers, so no real
          person is ever asked to fill it — only bots find it. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="cc-company">Company (leave blank)</label>
        <input id="cc-company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      <div className="relative mt-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepSlide}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-4"
          >
            {step === 1 && (
              <>
                <Select
                  label="What are you storing?"
                  options={VEHICLE_TYPES}
                  required
                  error={errors.vehicleType?.message}
                  {...register('vehicleType', {
                    onChange: () => {
                      typeTouched.current = true
                    },
                  })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Length"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={1}
                    max={20}
                    suffix="m"
                    placeholder="7.2"
                    required
                    hint="Including drawbar"
                    error={errors.lengthMetres?.message}
                    {...register('lengthMetres', {
                      valueAsNumber: true,
                      onChange: () => {
                        lengthTouched.current = true
                      },
                    })}
                  />
                  <Input
                    label="Postcode"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="postal-code"
                    placeholder="4305"
                    required
                    error={errors.postcode?.message}
                    {...register('postcode')}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Select
                  label="When do you need it stored?"
                  options={TIMELINES}
                  placeholder="Choose a timeframe"
                  required
                  defaultValue=""
                  error={errors.timeline?.message}
                  {...register('timeline')}
                />
                <Select
                  label="Roughly how long for?"
                  options={DURATIONS}
                  placeholder="Choose a duration"
                  required
                  defaultValue=""
                  error={errors.duration?.message}
                  {...register('duration')}
                />
                <Select
                  label="What kind of storage?"
                  options={COVERINGS}
                  placeholder="Choose an option"
                  required
                  defaultValue=""
                  hint="Not sure? Pick the last option and we will recommend one."
                  error={errors.covering?.message}
                  {...register('covering')}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="needsPower"
                    render={({ field }) => (
                      <Checkbox
                        label="Power connection (+$5/wk)"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="needsPickup"
                    render={({ field }) => (
                      <Checkbox
                        label="Pickup & delivery"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    )}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Input
                  label="Your name"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0412 345 678"
                  required
                  hint="So we can confirm your exact rate — usually same business day."
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  hint="Optional — for your written quote."
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Textarea
                  label="Anything else we should know?"
                  placeholder="Height, awnings, access needs, best time to call…"
                  rows={3}
                  error={errors.notes?.message}
                  {...register('notes')}
                />
                <Controller
                  control={control}
                  name="consent"
                  render={({ field }) => (
                    <Checkbox
                      label="Yes, contact me about my storage quote."
                      checked={field.value === true}
                      onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      error={errors.consent?.message}
                    />
                  )}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!compact && (
        <div className="mt-4">
          <EstimatePanel bay={recommendedBay} cheaper={cheaperBay} lengthMetres={lengthMetres} />
        </div>
      )}

      {serverError && (
        <p role="alert" className="mt-4 rounded-[14px] bg-danger/8 p-3 text-sm text-danger">
          {serverError} You can also call us on{' '}
          <a href="tel:+61736085993" className="font-medium underline">
            07 3608 5993
          </a>
          .
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        {step > 1 && (
          <Button type="button" variant="secondary" onClick={back} className="shrink-0 px-4">
            <ArrowLeft size={18} aria-hidden />
            <span className="sr-only">Back to step {step - 1}</span>
          </Button>
        )}

        {step < TOTAL_STEPS ? (
          <Button type="button" onClick={next} size="lg" className="flex-1">
            {step === 1 ? 'See my price' : 'Continue'}
            <ArrowRight size={18} aria-hidden />
          </Button>
        ) : (
          <Button type="submit" size="lg" loading={submitting} className="flex-1">
            Get my quote
            <ArrowRight size={18} aria-hidden />
          </Button>
        )}
      </div>

      <p className="mt-3 text-center text-[12px] leading-snug text-faint">
        We will only use your details to quote your storage. No spam, no sharing, and you can
        ask us to delete them at any time.
      </p>
    </form>
  )
}
