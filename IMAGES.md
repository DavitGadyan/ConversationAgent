# Imagery specification

The brief called for crisp images. The page currently ships **without
photography**, and that is a deliberate interim state, not an oversight:

- The hero visual is vector art (`components/ui/facility-visual.tsx`) — sharp at
  every pixel density, zero bytes on the critical path, no layout shift.
- The glossy 3D icons are CSS gradients, not images.

That means the page is complete and fast today. Real photography of the real
facility will beat drawn art for trust, though, so here is exactly what to
supply.

Run `npm run assets:fetch` to pull the existing site's photos into
`public/images` as working placeholders first. They are prefixed `src-` so it is
obvious which assets still need replacing.

---

## What to shoot

| Slot | Dimensions | Aspect | What it needs to show |
|---|---|---|---|
| **Hero** | 1600 × 1200 | 4:3 | A caravan sitting in one of your bays, fence and camera visible in frame. Shot from a low three-quarter angle so the van looks substantial. Golden hour. |
| **Facility wide** | 2000 × 1125 | 16:9 | The compound from the entrance — wide lanes, clean hardstand, room to manoeuvre. This is the "no tight squeeze" proof. |
| **Security detail ×3** | 1200 × 900 | 4:3 | The keypad with a hand entering a PIN; a camera on its pole against sky; the perimeter fence and gate. |
| **Vehicle types ×5** | 1200 × 900 | 4:3 | One shot each of a boat, motorhome, campervan, jetski and car in storage. These make the segment switcher feel real instead of generic. |
| **Team** | 1200 × 1200 | 1:1 | Kassandra and/or Grant on site, in work clothes, mid-task. Named faces convert; posed corporate portraits do not. |
| **Open Graph** | 1200 × 630 | 1.91:1 | Hero shot with the logo and "From $36/week" overlaid. This is what appears when the link is shared. Save as `public/og.png`. |

## Rules

1. **Shoot in landscape**, even for square crops. Cropping down is easy; the
   reverse is not.
2. **Real facility, real vehicles.** Stock photography of a generic warehouse is
   worse than the drawn art currently in place — visitors recognise stock, and it
   reads as "they are hiding what it actually looks like".
3. **Bright and clean.** Sweep the bay first. A stray pallet in the background
   costs more trust than a slightly soft focus.
4. **No people's faces without permission**, other than staff who have agreed.
5. **Supply originals**, not resized exports. Next.js generates AVIF and WebP at
   every breakpoint automatically; feeding it a pre-shrunk file just makes the
   large sizes blurry.

## Wiring an image in

Drop the file in `public/images/`, then use `next/image` with explicit
dimensions — never without, or the page will shift as it loads:

```tsx
import Image from 'next/image'

<Image
  src="/images/hero-caravan.jpg"
  alt="A caravan parked in a private bay with security fencing and a camera behind it"
  width={1600}
  height={1200}
  priority          // hero only — it is the LCP element
  sizes="(max-width: 1024px) 100vw, 50vw"
  className="rounded-[28px] object-cover"
/>
```

For anything below the fold, drop `priority` and add
`placeholder="blur"` with a `blurDataURL`.

`next.config.ts` already sets AVIF/WebP output and the breakpoint list, so no
further configuration is needed.

## Alt text

Every image needs alt text that describes what is in it, not what it is called.
"Caravan storage" is useless; "A caravan parked in a private bay with security
fencing and a camera behind it" is what a screen-reader user actually needs —
and it is what an AI agent reads when summarising the page.
