// Source: github.com/ibelick/motion-primitives components/core/animated-number.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream useSpring(value) + spring.set(value) is ported to a
// motionValue starting at the initial value and spring animate() calls
// re-anchored on every value change (PORTING.md §5, Magnetic precedent) —
// the same spring engine drives both.

import type { AnimationPlaybackControls, SpringOptions } from 'motion'
import { animate, motionValue } from 'motion'
import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

export type AnimatedNumberProps = {
  value: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  springOptions?: SpringOptions
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
}

export function AnimatedNumber(props: AnimatedNumberProps) {
  const [own, rest] = splitProps(props, ['value', 'class', 'className', 'springOptions', 'as'])

  // Upstream useSpring(value, ...) initializes at the prop's first value.
  const current = motionValue(props.value)
  const format = (v: number) => Math.round(v).toLocaleString()
  const [display, setDisplay] = createSignal(format(current.get()))

  let spring: AnimationPlaybackControls | undefined

  // Upstream: useEffect(() => spring.set(value), [value]).
  createEffect(() => {
    const target = own.value
    spring?.stop()
    spring = animate(current, target, {
      type: 'spring',
      ...(own.springOptions ?? {}),
    })
  })

  const off = current.on('change', v => setDisplay(format(v)))
  onCleanup(() => {
    off()
    spring?.stop()
  })

  return (
    <Dynamic
      component={own.as ?? 'span'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      class={`tabular-nums ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {display()}
    </Dynamic>
  )
}

export default AnimatedNumber
