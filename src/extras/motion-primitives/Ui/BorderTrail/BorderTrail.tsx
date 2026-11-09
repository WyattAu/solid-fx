// Source: github.com/ibelick/motion-primitives components/core/border-trail.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.

import type { AnimationPlaybackControls, Transition } from 'motion'
import { animate } from 'motion'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'

export type BorderTrailProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  size?: number
  transition?: Transition
  onAnimationComplete?: () => void
  style?: JSX.CSSProperties
}

const DEFAULT_TRANSITION: Transition = {
  repeat: Infinity,
  duration: 5,
  ease: 'linear',
}

export function BorderTrail(props: BorderTrailProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'size',
    'transition',
    'onAnimationComplete',
    'style',
  ])

  let trailEl!: HTMLDivElement
  let controls: AnimationPlaybackControls | undefined

  onMount(() => {
    controls = animate(
      trailEl,
      { offsetDistance: ['0%', '100%'] },
      {
        ...(own.transition ?? DEFAULT_TRANSITION),
        // Upstream onAnimationComplete: fires when the animation finishes
        // (never with the default repeat: Infinity) — same wiring here.
        onComplete: () => own.onAnimationComplete?.(),
      },
    )
    onCleanup(() => controls?.stop())
  })

  return (
    <div
      {...rest}
      class="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <div
        ref={trailEl}
        class={`absolute aspect-square bg-zinc-500 ${own.class ?? ''} ${own.className ?? ''}`}
        style={{
          width: `${own.size ?? 60}px`,
          'offset-path': `rect(0 auto auto 0 round ${own.size ?? 60}px)`,
          ...own.style,
        }}
      />
    </div>
  )
}

export default BorderTrail
