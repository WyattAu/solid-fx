// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/ripple.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// PORT-NOTE: PLAN.md's motion-primitives batch queues "Ripple", but
// ibelick/motion-primitives @120f64f6 ships no ripple.tsx (verified against
// the full repo tree and full commit history). The component ships in Magic
// UI's registry — an MIT-vetted source per LICENSE-SOURCES.md — so it is
// ported from there. Upstream styles the rings with the Tailwind v4 theme
// animation `animate-ripple` (defined in Magic UI's globals.css as
// `ripple var(--duration, 2s) ease calc(var(--i, 0) * 0.2s) infinite`); the
// keyframes ship inline here (renamed `ripple-pulse` to avoid global keyframe
// collisions) and ring colors use the neutral palette because this repo's
// theme has no `--foreground` token. Upstream's inline `animation-delay`
// (`i * 0.06s`) intentionally wins over the shorthand's `--i`-staggered delay —
// kept as-is for behavioral parity. React.memo/displayName dropped per
// PORTING.md §2.

import { splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'

export type RippleProps = {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'>

const STYLE =
  '.ripple-pulse-ring{animation:ripple-pulse var(--duration,2s) ease calc(var(--i,0)*0.2s) infinite}' +
  '@keyframes ripple-pulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(0.9)}}'

export function Ripple(props: RippleProps) {
  const [own, rest] = splitProps(props, [
    'mainCircleSize',
    'mainCircleOpacity',
    'numCircles',
    'class',
    'className',
    'style',
  ])

  const mainCircleSize = () => own.mainCircleSize ?? 210
  const mainCircleOpacity = () => own.mainCircleOpacity ?? 0.24
  const numCircles = () => own.numCircles ?? 8

  const rings = () =>
    Array.from({ length: numCircles() }, (_, i) => ({
      size: mainCircleSize() + i * 70,
      opacity: mainCircleOpacity() - i * 0.03,
      delay: `${i * 0.06}s`,
    }))

  return (
    <div
      {...rest}
      // Upstream mask utility `mask-[linear-gradient(to_bottom,white,transparent)]`
      // written as an explicit arbitrary property for Tailwind v4.
      class={`pointer-events-none absolute inset-0 select-none [mask-image:linear-gradient(to_bottom,white,transparent)] ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <style>{STYLE}</style>
      <For each={rings()}>
        {(ring, i) => (
          <div
            class="ripple-pulse-ring bg-neutral-400/25 absolute rounded-full border border-neutral-400 shadow-xl"
            style={{
              '--i': String(i()),
              width: `${ring.size}px`,
              height: `${ring.size}px`,
              opacity: ring.opacity,
              'animation-delay': ring.delay,
              'border-style': 'solid',
              'border-width': '1px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1)',
            }}
          />
        )}
      </For>
    </div>
  )
}

export default Ripple
