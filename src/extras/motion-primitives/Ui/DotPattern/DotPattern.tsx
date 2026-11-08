// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/dot-pattern.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// PORT-NOTE: PLAN.md's motion-primitives batch queues "Dot Pattern", but
// ibelick/motion-primitives @120f64f6 ships no dot-pattern.tsx (verified
// against the full repo tree and full commit history). The component family
// ships in Magic UI's registry — an MIT-vetted source per LICENSE-SOURCES.md —
// so it is ported from there. The magic-ui extras tree has its own copy of the
// same upstream file; extras trees never cross-import (layering rule), so this
// tree carries a self-contained port.

import { createMemo, createSignal, createUniqueId, onCleanup, onMount, splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'

/**
 *  DotPattern Component Props
 *
 * @param {number} [width=16] - The horizontal spacing between dots
 * @param {number} [height=16] - The vertical spacing between dots
 * @param {number} [x=0] - The x-offset of the entire pattern
 * @param {number} [y=0] - The y-offset of the entire pattern
 * @param {number} [cx=1] - The x-offset of individual dots
 * @param {number} [cy=1] - The y-offset of individual dots
 * @param {number} [cr=1] - The radius of each dot
 * @param {string} [className] - Additional CSS classes to apply to the SVG container
 * @param {boolean} [glow=false] - Whether dots should have a glowing animation effect
 */
export type DotPatternProps = {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  glow?: boolean
} & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, 'class' | 'style'>

/**
 * DotPattern Component
 *
 * A static (or optionally glowing) SVG dot pattern background. The pattern
 * automatically adjusts to fill its container; dots are drawn with
 * `currentColor`, so color is controlled via text color utility classes.
 *
 * PORT-NOTE: upstream extends React.SVGProps with `[key: string]: unknown`
 * (a React spread-typing crutch); the Solid port spreads via `splitProps`
 * and needs no index signature.
 */
export function DotPattern(props: DotPatternProps) {
  const [own, rest] = splitProps(props, [
    'width',
    'height',
    'x',
    'y',
    'cx',
    'cy',
    'cr',
    'class',
    'className',
    'glow',
  ])

  const width = () => own.width ?? 16
  const height = () => own.height ?? 16
  const x = () => own.x ?? 0
  const y = () => own.y ?? 0
  const cx = () => own.cx ?? 1
  const cy = () => own.cy ?? 1
  const cr = () => own.cr ?? 1
  const glow = () => own.glow ?? false

  // Upstream: useId() for the gradient def id.
  const id = createUniqueId()
  let containerRef!: SVGSVGElement
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 })

  // Upstream: useEffect([]) — measure + window resize listener.
  onMount(() => {
    const updateDimensions = () => {
      const box = containerRef.getBoundingClientRect()
      setDimensions({ width: box.width, height: box.height })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    onCleanup(() => window.removeEventListener('resize', updateDimensions))
  })

  // Upstream recomputes per render from `dimensions` state.
  const dots = createMemo(() =>
    Array.from(
      {
        length: Math.ceil(dimensions().width / width()) * Math.ceil(dimensions().height / height()),
      },
      (_, i) => {
        const col = i % Math.ceil(dimensions().width / width())
        const row = Math.floor(i / Math.ceil(dimensions().width / width()))
        return {
          x: col * width() + cx() + x(),
          y: row * height() + cy() + y(),
          delay: Math.random() * 5,
          duration: Math.random() * 3 + 2,
        }
      },
    ),
  )

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      class={`pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80 ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stop-color="currentColor" stop-opacity="1" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
        </radialGradient>
      </defs>
      <For each={dots()}>
        {dot => (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={cr()}
            fill={glow() ? `url(#${id}-gradient)` : 'currentColor'}
            // PORT-NOTE: upstream scales via motion.circle which measures the
            // bbox for its transform-origin; the vanilla port pins
            // transform-box/origin so the pulse stays centered on the dot.
            style={{ 'transform-box': 'fill-box', 'transform-origin': 'center' }}
            ref={el => {
              if (!glow()) return
              // Upstream initial={glow ? { opacity: 0.4, scale: 1 } : {}} —
              // hold the initial opacity through the animation delay.
              el.style.opacity = '0.4'
              const controls = animate(
                el,
                { opacity: [0.4, 1, 0.4], scale: [1, 1.5, 1] },
                {
                  duration: dot.duration,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: dot.delay,
                  ease: 'easeInOut',
                },
              )
              onCleanup(() => controls.stop())
            }}
          />
        )}
      </For>
    </svg>
  )
}

export default DotPattern
