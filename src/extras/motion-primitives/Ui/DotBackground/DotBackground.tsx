// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/dot-pattern.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// PORT-NOTE: PLAN.md's motion-primitives batch queues "Dot Background", but
// ibelick/motion-primitives @120f64f6 ships no dot-background.tsx (verified
// against the full repo tree and full commit history). The animated-SVG-dots
// behavior described for this component is the glow mode of Magic UI's
// dot-pattern.tsx (MIT-vetted source per LICENSE-SOURCES.md), so it ships here
// as a dedicated always-animated variant: upstream's motion.circle
// initial/animate/transition is re-targeted to vanilla motion `animate()`
// loops per PORTING.md §5. The DotPattern port in this tree covers the static
// mode with a runtime `glow` prop.

import { createMemo, createSignal, createUniqueId, onCleanup, onMount, splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'

export type DotBackgroundProps = {
  /** The horizontal spacing between dots */
  width?: number
  /** The vertical spacing between dots */
  height?: number
  /** The x-offset of the entire pattern */
  x?: number
  /** The y-offset of the entire pattern */
  y?: number
  /** The x-offset of individual dots */
  cx?: number
  /** The y-offset of individual dots */
  cy?: number
  /** The radius of each dot */
  cr?: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
} & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, 'class' | 'style'>

/**
 * DotBackground Component
 *
 * An animated SVG dot pattern background: dots pulse (opacity + scale) on
 * randomized, infinite, staggered loops. The pattern automatically adjusts to
 * fill its container; dot color follows the container's text color.
 */
export function DotBackground(props: DotBackgroundProps) {
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
  ])

  const width = () => own.width ?? 16
  const height = () => own.height ?? 16
  const x = () => own.x ?? 0
  const y = () => own.y ?? 0
  const cx = () => own.cx ?? 1
  const cy = () => own.cy ?? 1
  const cr = () => own.cr ?? 1

  // Upstream glow mode: radial gradient fills each dot.
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

  // Upstream recomputes per render from `dimensions` state; delay/duration are
  // randomized per dot, upstream parity.
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
            fill={`url(#${id}-gradient)`}
            // PORT-NOTE: upstream scales via motion.circle which measures the
            // bbox for its transform-origin; the vanilla port pins
            // transform-box/origin so the pulse stays centered on the dot.
            style={{ 'transform-box': 'fill-box', 'transform-origin': 'center' }}
            ref={el => {
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

export default DotBackground
