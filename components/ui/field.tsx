'use client'

import { forwardRef, useId } from 'react'
import { AlertCircle, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Form field primitives.
 *
 * Design decisions that matter for conversion:
 *  - 16px font on every control, so iOS does not zoom on focus and throw the
 *    fold out of position mid-form.
 *  - Native <select>. On mobile it opens the OS picker, which is faster and more
 *    familiar than any custom listbox, and it is accessible for free.
 *  - Errors are wired with aria-describedby and aria-invalid, and rendered with
 *    an icon as well as colour — a red outline alone is invisible to a
 *    colour-blind user.
 *  - 48px minimum touch target throughout.
 */

const base =
  'w-full rounded-[14px] border bg-card px-4 text-ink placeholder:text-faint ' +
  'transition-colors duration-150 outline-none ' +
  'focus:border-action focus:ring-4 focus:ring-action/10 ' +
  'disabled:cursor-not-allowed disabled:bg-sunken'

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-soft">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, suffix, ...props },
  ref,
) {
  const generatedId = useId()
  const id = props.id ?? generatedId

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            base,
            'h-12',
            suffix && 'pr-12',
            error ? 'border-danger' : 'border-line',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted"
          >
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  )
})

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  options: readonly string[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, options, placeholder, className, ...props },
  ref,
) {
  const generatedId = useId()
  const id = props.id ?? generatedId

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            base,
            'h-12 cursor-pointer appearance-none pr-11',
            error ? 'border-danger' : 'border-line',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </FieldShell>
  )
})

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, ...props },
  ref,
) {
  const generatedId = useId()
  const id = props.id ?? generatedId

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(base, 'min-h-24 resize-y py-3', error ? 'border-danger' : 'border-line', className)}
        {...props}
      />
    </FieldShell>
  )
})

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, className, ...props },
  ref,
) {
  const generatedId = useId()
  const id = props.id ?? generatedId

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn(
          'group flex cursor-pointer items-start gap-3 rounded-[14px] border p-3.5 transition-colors',
          'hover:bg-sunken/50 has-[:checked]:border-ink/20 has-[:checked]:bg-highlight-soft',
          error ? 'border-danger' : 'border-line',
          className,
        )}
      >
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer size-5 cursor-pointer appearance-none rounded-md border border-line bg-card transition-colors checked:border-ink checked:bg-ink"
            {...props}
          />
          <Check
            size={13}
            strokeWidth={3}
            aria-hidden
            className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>
        <span className="text-sm leading-snug text-ink-soft">{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
})
