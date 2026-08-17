import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Star rating.
 *
 * Rendered as a single accessible string for assistive tech and as filled icons
 * for everyone else — a row of five identical "star" labels is noise in a screen
 * reader.
 */
export function Stars({
  rating = 5,
  size = 16,
  className,
  showLabel = false,
  count,
}: {
  rating?: number
  size?: number
  className?: string
  showLabel?: boolean
  count?: number
}) {
  const label = count
    ? `Rated ${rating} out of 5 from ${count} reviews`
    : `Rated ${rating} out of 5`

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex gap-0.5" role="img" aria-label={label}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={size}
            aria-hidden
            className={cn(
              i < Math.round(rating) ? 'fill-[#F5B301] text-[#F5B301]' : 'fill-none text-faint',
            )}
          />
        ))}
      </span>
      {showLabel && (
        <span aria-hidden className="text-sm font-medium text-ink">
          {rating.toFixed(1)}
          {count ? <span className="font-normal text-muted"> ({count})</span> : null}
        </span>
      )}
    </span>
  )
}
