'use client'

import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'highlight'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  // Near-black pill, as per the reference's primary action treatment.
  primary:
    'bg-ink text-white hover:bg-ink-soft active:scale-[0.98] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]',
  secondary: 'bg-card text-ink border border-line hover:border-ink/25 hover:bg-sunken/60',
  ghost: 'bg-transparent text-ink hover:bg-card',
  // The yellow highlight — used for one action per screen, never two.
  highlight: 'bg-highlight text-ink hover:brightness-[0.97] active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[15px]',
  lg: 'h-14 px-8 text-base',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', asChild, loading, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium',
        'transition-all duration-200 ease-[var(--ease-out-soft)]',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span>Sending…</span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
})
