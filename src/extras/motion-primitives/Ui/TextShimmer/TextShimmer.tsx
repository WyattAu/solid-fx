// Source: github.com/ibelick/motion-primitives components/core/text-shimmer.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream renders a motion-created polymorphic element with a
// declarative repeating backgroundPosition animation (100% -> 0% center,
// linear, infinite). Solid has no declarative motion components, so the same
// keyframes run through one vanilla animate() restarted in a tracked effect
// when duration changes (PORTING.md §5). `--spread` stays a plain style var so
// children/spread changes apply declaratively without touching the animation.

import { createEffect, onCleanup, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { animate } from 'motion'
import type { AnimationPlaybackControls } from 'motion'

export type TextShimmerProps = {
  children: string
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  duration?: number
  spread?: number
  style?: JSX.CSSProperties
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'>

const ROOT_CLASSES =
  'relative inline-block bg-[length:250%_100%,auto] bg-clip-text ' +
  'text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000] ' +
  '[background-repeat:no-repeat,padding-box] ' +
  '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] ' +
  'dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] ' +
  'dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]'

export function TextShimmer(props: TextShimmerProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'as',
    'class',
    'className',
    'duration',
    'spread',
    'style',
  ])

  // Upstream: useMemo(() => children.length * spread, [children, spread]).
  const dynamicSpread = () => own.children.length * (own.spread ?? 2)

  let el!: HTMLElement
  let controls: AnimationPlaybackControls | undefined

  // Upstream: initial={{ backgroundPosition: '100% center' }}
  // animate={{ backgroundPosition: '0% center' }}
  // transition={{ repeat: Infinity, duration, ease: 'linear' }}.
  createEffect(() => {
    const duration = own.duration ?? 2
    controls?.stop()
    controls = animate(
      el,
      { backgroundPosition: ['100% center', '0% center'] },
      { repeat: Infinity, duration, ease: 'linear' },
    )
  })

  onCleanup(() => controls?.stop())

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      class={`${ROOT_CLASSES} ${own.class ?? ''} ${own.className ?? ''}`}
      style={{
        '--spread': `${dynamicSpread()}px`,
        'background-image': 'var(--bg), linear-gradient(var(--base-color), var(--base-color))',
        ...own.style,
      }}
    >
      {own.children}
    </Dynamic>
  )
}

export default TextShimmer
