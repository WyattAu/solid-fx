// Source: github.com/ibelick/motion-primitives components/core/spinning-text.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream `transition` (framer Transition) and `variants`
// (container/item framer Variants) props have no 1:1 vanilla mapping — the
// port honors transition.duration and drops the rest (upstream's base
// transition is repeat: Infinity + ease: 'linear'; the container rotates
// ±360deg while the per-character spans stay statically positioned via the
// same CSS custom properties and transform as upstream). The container
// variants animation maps to a vanilla motion animate() per PORTING.md §5.

import { For, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls } from 'motion'

export type SpinningTextProps = {
  children: string
  style?: JSX.CSSProperties
  duration?: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  reverse?: boolean
  fontSize?: number
  radius?: number
  /** Upstream framer Transition — only `duration` is honored. */
  transition?: { duration?: number }
}

const BASE_TRANSITION = {
  repeat: Infinity,
  ease: 'linear',
} as const

export function SpinningText(props: SpinningTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'style',
    'duration',
    'class',
    'className',
    'reverse',
    'fontSize',
    'radius',
    'transition',
  ])

  const letters = () => own.children.split('')
  const totalLetters = () => letters().length
  const fontSize = () => own.fontSize ?? 1
  const radius = () => own.radius ?? 5
  const reverse = () => own.reverse ?? false
  // Upstream finalTransition: duration ?? duration prop (default 10).
  const duration = () => own.transition?.duration ?? own.duration ?? 10

  let el!: HTMLDivElement
  let controls: AnimationPlaybackControls | undefined

  onMount(() => {
    // Upstream container variants: visible: { rotate: reverse ? -360 : 360 }.
    controls = animate(
      el,
      { rotate: reverse() ? -360 : 360 },
      { ...BASE_TRANSITION, duration: duration() },
    )
    onCleanup(() => controls?.stop())
  })

  return (
    <div
      {...rest}
      ref={el}
      class={`relative ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <For each={letters()}>
        {(letter, index) => (
          <span
            aria-hidden="true"
            class="absolute top-1/2 left-1/2 inline-block"
            style={{
              '--index': String(index()),
              '--total': String(totalLetters()),
              '--font-size': String(fontSize()),
              '--radius': String(radius()),
              'font-size': 'calc(var(--font-size, 2) * 1rem)',
              transform: `translate(-50%, -50%) rotate(calc(360deg / var(--total) * var(--index))) translateY(calc(var(--radius, 5) * -1ch))`,
              'transform-origin': 'center',
            }}
          >
            {letter}
          </span>
        )}
      </For>
      <span class="sr-only">{own.children}</span>
    </div>
  )
}

export default SpinningText
