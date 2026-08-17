'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Camera, KeyRound, ShieldCheck } from 'lucide-react'
import { Sticker } from './sticker'
import { site } from '@/content/site'
import { Stars } from './stars'

/**
 * The hero visual.
 *
 * Drawn rather than photographed, on purpose. The brief asks for crisp imagery,
 * and vector art is crisp at every density with no download cost and no layout
 * shift — which matters when this sits next to the LCP element.
 *
 * It also lets the page ship complete today. Real facility photography is the
 * upgrade path, and IMAGES.md specifies exactly what to shoot; drop the files in
 * and swap this component out.
 *
 * The composition follows the reference: a soft grey frame, a white card inside
 * it, and glossy 3D stickers breaking the frame edge to create depth.
 */
export function FacilityVisual() {
  const reduced = useReducedMotion()

  return (
    <div className="relative">
      <div className="mockup-frame relative overflow-hidden">
        {/* Faint grid, echoing the bay markings of a real hardstand. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="bay-grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0v44" fill="none" stroke="#0B0B0C" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bay-grid)" />
        </svg>

        <div className="relative rounded-[28px] bg-card p-5 shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted">Your bay</p>
            <span className="rounded-full bg-tile-mint px-2.5 py-1 text-[11px] font-semibold text-[#1B7A55]">
              Secured
            </span>
          </div>

          <SecureBayScene />

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
            {[
              { icon: Camera, label: 'CCTV', value: '24/7' },
              { icon: KeyRound, label: 'Entry', value: 'PIN' },
              { icon: ShieldCheck, label: 'Open', value: '365d' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon size={16} aria-hidden className="mx-auto text-muted" />
                <p className="mt-1 text-[15px] font-semibold leading-none text-ink">{value}</p>
                <p className="mt-1 text-[11px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating stickers — the delight moment from the reference. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.6, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 18 }}
        className="absolute -left-3 top-10 sm:-left-6"
      >
        <Sticker icon={ShieldCheck} tone="green" size="lg" tilt={-8} float />
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.6, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 18 }}
        className="absolute -right-2 bottom-16 sm:-right-5"
      >
        <Sticker icon={KeyRound} tone="blue" size="md" tilt={10} float />
      </motion.div>

      {/* Social proof card, tucked into the corner of the frame. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-[18px] bg-card px-4 py-3 shadow-[var(--shadow-float)] sm:left-8"
      >
        <Stars rating={site.rating.value} size={14} />
        <p className="text-[13px] font-medium text-ink">
          {site.rating.value.toFixed(1)}
          <span className="font-normal text-muted"> from {site.rating.count} reviews</span>
        </p>
      </motion.div>
    </div>
  )
}

/** A caravan sitting in a fenced, monitored bay. Simple, warm, unmistakable. */
function SecureBayScene() {
  return (
    <svg
      viewBox="0 0 320 150"
      className="mt-3 w-full"
      role="img"
      aria-label="A caravan parked inside a fenced, camera-monitored storage bay"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6F1FD" />
          <stop offset="100%" stopColor="#F4F4F4" />
        </linearGradient>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8E8EA" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDEDED" />
          <stop offset="100%" stopColor="#E2E2E5" />
        </linearGradient>
      </defs>

      <rect width="320" height="150" rx="18" fill="url(#sky)" />

      {/* Hardstand */}
      <rect y="96" width="320" height="54" fill="url(#ground)" />
      <g stroke="#FBEF7E" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
        <path d="M40 150v-40" />
        <path d="M280 150v-40" />
      </g>

      {/* Perimeter fence */}
      <g stroke="#C9C9CF" strokeWidth="2" strokeLinecap="round">
        <path d="M0 96h320" />
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${8 + i * 26} 96V72`} />
        ))}
        <path d="M0 72h320" opacity="0.7" />
        <path d="M0 82h320" opacity="0.5" />
      </g>

      {/* Camera on a pole */}
      <g>
        <path d="M292 72V34" stroke="#9A9AA1" strokeWidth="3" strokeLinecap="round" />
        <rect x="276" y="24" width="24" height="12" rx="5" fill="#0B0B0C" />
        <circle cx="279" cy="30" r="2.4" fill="#5FE08A" />
        <path d="M276 30 258 20v20l18-10Z" fill="#0B0B0C" opacity="0.12" />
      </g>

      {/* Caravan */}
      <g transform="translate(58 34)">
        {/* Drawbar */}
        <path d="M-16 56h16" stroke="#9A9AA1" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="-18" cy="56" r="3.5" fill="#9A9AA1" />

        {/* Body */}
        <rect x="0" y="14" width="152" height="46" rx="12" fill="url(#body)" stroke="#D8D8DC" strokeWidth="1.5" />
        {/* Window */}
        <rect x="14" y="24" width="44" height="22" rx="7" fill="#E6F1FD" stroke="#D3E2F7" strokeWidth="1.5" />
        {/* Door */}
        <rect x="70" y="24" width="26" height="36" rx="6" fill="#F4F4F4" stroke="#D8D8DC" strokeWidth="1.5" />
        <circle cx="91" cy="43" r="1.8" fill="#9A9AA1" />
        {/* Awning */}
        <path d="M110 22h40a4 4 0 0 1 4 4v3h-48v-3a4 4 0 0 1 4-4Z" fill="#FBEF7E" />
        {/* Roof vent */}
        <rect x="52" y="8" width="24" height="7" rx="3" fill="#E8E8EA" />

        {/* Wheels */}
        <g>
          <circle cx="42" cy="62" r="11" fill="#0B0B0C" />
          <circle cx="42" cy="62" r="4.5" fill="#C9C9CF" />
          <circle cx="118" cy="62" r="11" fill="#0B0B0C" />
          <circle cx="118" cy="62" r="4.5" fill="#C9C9CF" />
        </g>
      </g>

      {/* Contact shadow */}
      <ellipse cx="140" cy="99" rx="88" ry="5" fill="#0B0B0C" opacity="0.08" />
    </svg>
  )
}
