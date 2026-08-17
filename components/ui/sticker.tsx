'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { springSoft } from '@/lib/motion'

/**
 * Glossy 3D "sticker" icons.
 *
 * These are the emotional-design element from the reference — the floating
 * WhatsApp orb and orange envelope that give an otherwise flat, calm layout a
 * moment of delight and physical presence.
 *
 * Built entirely from gradients, an inner specular highlight and a coloured drop
 * shadow, so there is no image to download, nothing to go blurry on a retina
 * screen, and no extra byte on the critical path.
 */

const palettes = {
  blue: { from: '#5B9BFF', to: '#1D4ED8', glow: 'rgb(37 99 235 / 0.35)' },
  green: { from: '#5FE08A', to: '#15803D', glow: 'rgb(22 163 74 / 0.35)' },
  amber: { from: '#FFD98A', to: '#B45309', glow: 'rgb(217 119 6 / 0.32)' },
  orange: { from: '#FFB27A', to: '#EA580C', glow: 'rgb(234 88 12 / 0.32)' },
  violet: { from: '#B39CFF', to: '#6D28D9', glow: 'rgb(109 40 217 / 0.32)' },
  ink: { from: '#4A4A52', to: '#0B0B0C', glow: 'rgb(11 11 12 / 0.3)' },
} as const

export type StickerTone = keyof typeof palettes

const sizes = {
  sm: 'size-11 rounded-[14px]',
  md: 'size-14 rounded-[18px]',
  lg: 'size-20 rounded-[24px]',
} as const

const iconSizes = { sm: 18, md: 24, lg: 34 } as const

export function Sticker({
  icon: Icon,
  tone = 'blue',
  size = 'md',
  tilt = 0,
  float = false,
  className,
  label,
}: {
  icon: LucideIcon
  tone?: StickerTone
  size?: keyof typeof sizes
  /** Degrees of rotation — a few degrees off-axis reads as a physical sticker. */
  tilt?: number
  float?: boolean
  className?: string
  /** Accessible name. Omit for purely decorative stickers. */
  label?: string
}) {
  const p = palettes[tone]

  return (
    <motion.span
      whileHover={{ scale: 1.06, rotate: tilt + 2 }}
      transition={springSoft}
      style={
        {
          '--tilt': `${tilt}deg`,
          background: `linear-gradient(150deg, ${p.from} 0%, ${p.to} 100%)`,
          boxShadow: `0 10px 24px -6px ${p.glow}, inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -3px 8px rgb(0 0 0 / 0.14)`,
          transform: `rotate(${tilt}deg)`,
        } as React.CSSProperties
      }
      className={cn(
        'relative inline-grid shrink-0 place-items-center',
        sizes[size],
        float && 'animate-float-slow',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Specular highlight — the sheen that sells the gloss. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[12%] top-[6%] h-[38%] rounded-full opacity-70 blur-[2px]"
        style={{
          background:
            'linear-gradient(180deg, rgb(255 255 255 / 0.75) 0%, rgb(255 255 255 / 0) 100%)',
        }}
      />
      <Icon size={iconSizes[size]} strokeWidth={2} className="relative text-white" />
    </motion.span>
  )
}

/**
 * Flat pastel icon tile — the quieter treatment used for feature rows in the
 * reference. Stickers draw the eye; tiles organise information.
 */
const tints = {
  lavender: 'bg-tile-lavender text-[#4B4FA6]',
  peach: 'bg-tile-peach text-[#B4552A]',
  mint: 'bg-tile-mint text-[#1B7A55]',
  sky: 'bg-tile-sky text-[#1D4ED8]',
} as const

export type TileTint = keyof typeof tints

export function IconTile({
  icon: Icon,
  tint = 'lavender',
  className,
}: {
  icon: LucideIcon
  tint?: TileTint
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid size-11 shrink-0 place-items-center rounded-[14px]',
        tints[tint],
        className,
      )}
    >
      <Icon size={20} strokeWidth={2} />
    </span>
  )
}
