// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/spinning-text.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { createEffect, onCleanup, splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'

// PORT-NOTE: vanilla `motion` does not re-export motion/react's `Transition`
// and `Variants` types; structural equivalents matching upstream usage
// (duration/ease/repeat/delay overrides) are declared locally so the props
// keep the same names, types and semantics.
interface MotionTransition {
  duration?: number
  ease?:
    | 'linear'
    | 'easeIn'
    | 'easeOut'
    | 'easeInOut'
    | 'circIn'
    | 'circOut'
    | 'circInOut'
    | 'backIn'
    | 'backOut'
    | 'backInOut'
    | 'anticipate'
    | ((t: number) => number)
    | [number, number, number, number]
  repeat?: number
  delay?: number
}

interface MotionVariants {
  container?: Record<string, Record<string, unknown>>
  item?: Record<string, Record<string, unknown>>
}

interface SpinningTextProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  children: string | string[]
  duration?: number
  reverse?: boolean
  radius?: number
  transition?: MotionTransition
  variants?: MotionVariants
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
}

const BASE_TRANSITION: MotionTransition = {
  repeat: Infinity,
  ease: 'linear',
}

type LetterStyle = JSX.CSSProperties & {
  '--index': number
  '--total': number
  '--radius': number
}

export function SpinningText(props: SpinningTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'duration',
    'reverse',
    'radius',
    'transition',
    'variants',
    'class',
    'className',
    'style',
  ])

  // Upstream: runtime validation + array join. One-shot in the Solid body
  // (component bodies run once per instance), same as upstream's per-render pass.
  let childrenValue: string | string[] = own.children
  if (typeof childrenValue !== 'string' && !Array.isArray(childrenValue)) {
    throw new Error('children must be a string or an array of strings')
  }

  if (Array.isArray(childrenValue)) {
    // Validate all elements are strings
    if (!childrenValue.every(child => typeof child === 'string')) {
      throw new Error('all elements in children array must be strings')
    }
    childrenValue = childrenValue.join('')
  }

  const letters = childrenValue.split('')
  letters.push(' ')

  const duration = () => own.duration ?? 10
  const reverse = () => own.reverse ?? false
  const radius = () => own.radius ?? 5

  let containerEl!: HTMLDivElement

  // Upstream: motion.div with container variants
  // { visible: { rotate: reverse ? -360 : 360 } } and transition
  // { repeat: Infinity, ease: 'linear', duration } — ported to a vanilla
  // `animate` loop on the container ref (controls stopped in onCleanup).
  // PORT-NOTE: upstream's `variants.container` / `variants.item` overrides are
  // accepted for API parity but not applied — the vanilla port drives the
  // container rotation directly, and the base item variants are no-ops
  // (opacity 1 → 1).
  createEffect(() => {
    const transition = own.transition
    const controls = animate(
      containerEl,
      { rotate: [0, reverse() ? -360 : 360] },
      {
        repeat: transition?.repeat ?? BASE_TRANSITION.repeat,
        ease: transition?.ease ?? BASE_TRANSITION.ease,
        delay: transition?.delay,
        duration: transition?.duration ?? duration(),
      },
    )
    onCleanup(() => controls.stop())
  })

  return (
    <div
      ref={containerEl}
      class={`relative ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      {...rest}
    >
      <For each={letters}>
        {(letter, index) => (
          <span
            aria-hidden="true"
            class="absolute top-1/2 left-1/2 inline-block"
            style={
              {
                '--index': index(),
                '--total': letters.length,
                '--radius': radius(),
                transform: `
                  translate(-50%, -50%)
                  rotate(calc(360deg / var(--total) * var(--index)))
                  translateY(calc(var(--radius, 5) * -1ch))
                `,
                'transform-origin': 'center',
              } as LetterStyle
            }
          >
            {letter}
          </span>
        )}
      </For>
      <span class="sr-only">{childrenValue}</span>
    </div>
  )
}

export default SpinningText
