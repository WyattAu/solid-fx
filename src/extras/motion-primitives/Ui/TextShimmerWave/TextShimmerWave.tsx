// Source: github.com/ibelick/motion-primitives components/core/text-shimmer-wave.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.

import { createEffect, onCleanup, splitProps, Index } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { animate } from 'motion'
import type { AnimationPlaybackControls, Transition } from 'motion'

export type TextShimmerWaveProps = {
  children: string
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  duration?: number
  zDistance?: number
  xDistance?: number
  yDistance?: number
  spread?: number
  scaleDistance?: number
  rotateYDistance?: number
  transition?: Transition
  style?: JSX.CSSProperties
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'>

const ROOT_CLASSES =
  'relative inline-block [perspective:500px] ' +
  '[--base-color:#a1a1aa] [--base-gradient-color:#000] ' +
  'dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff]'

const CHAR_CLASSES = 'inline-block whitespace-pre [transform-style:preserve-3d]'

export function TextShimmerWave(props: TextShimmerWaveProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'as',
    'class',
    'className',
    'style',
    'duration',
    'zDistance',
    'xDistance',
    'yDistance',
    'spread',
    'scaleDistance',
    'rotateYDistance',
    'transition',
  ])

  const chars = () => own.children.split('')
  const spanEls = new Map<number, HTMLSpanElement>()
  let controls: AnimationPlaybackControls[] = []

  onCleanup(() => {
    controls.forEach(control => control.stop())
    controls = []
  })

  // Upstream: each char is a motion.span with repeating keyframes, restarted
  // by React whenever children/geometry props change. The per-char animations
  // are (re)started in one tracked effect reading the same inputs.
  createEffect(() => {
    const text = own.children
    const duration = own.duration ?? 1
    const zDistance = own.zDistance ?? 10
    const xDistance = own.xDistance ?? 2
    const yDistance = own.yDistance ?? -2
    const spread = own.spread ?? 1
    const scaleDistance = own.scaleDistance ?? 1.1
    const rotateYDistance = own.rotateYDistance ?? 10

    controls.forEach(control => control.stop())
    controls = []

    text.split('').forEach((_, i) => {
      const el = spanEls.get(i)
      if (!el) return
      const delay = (i * duration * (1 / spread)) / text.length
      controls.push(
        animate(
          el,
          {
            translateZ: [0, zDistance, 0],
            translateX: [0, xDistance, 0],
            translateY: [0, yDistance, 0],
            scale: [1, scaleDistance, 1],
            rotateY: [0, rotateYDistance, 0],
            // PORT-NOTE: var() keyframes are resolved by motion against the
            // span (which inherits these custom properties from the root), so
            // the dark-mode palette flip keeps working without re-animation.
            color: ['var(--base-color)', 'var(--base-gradient-color)', 'var(--base-color)'],
          },
          {
            duration: duration,
            repeat: Infinity,
            repeatDelay: (text.length * 0.05) / spread,
            delay,
            ease: 'easeInOut',
            ...own.transition,
          },
        ),
      )
    })
  })

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      class={`${ROOT_CLASSES} ${own.class ?? ''} ${own.className ?? ''}`}
      style={{ color: 'var(--base-color)', ...own.style }}
    >
      <Index each={chars()}>
        {(char, i) => (
          <span ref={el => spanEls.set(i, el)} class={CHAR_CLASSES}>
            {char()}
          </span>
        )}
      </Index>
    </Dynamic>
  )
}

export default TextShimmerWave
