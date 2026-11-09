// Source: github.com/ibelick/motion-primitives components/core/text-loop.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream sequences items through <AnimatePresence mode='popLayout'>.
// Solid has no AnimatePresence (PORTING.md §5) — the port runs the exit
// animate() on the outgoing child, pops it to position:absolute during exit
// (popLayout behavior), swaps content on completion, then runs the enter
// animate(). The overlap-free sequencing matches upstream's mode='wait'; the
// `mode` prop is accepted for surface parity but popLayout's simultaneous
// enter/exit overlap is not replicated. `variants` is honored as keyframe
// endpoint objects for initial/animate/exit; `transition` honors
// duration/ease/delay. React's Children.toArray normalization maps to
// accepting a single node or an array of nodes for `children`.

import { createEffect, createMemo, createSignal, onCleanup, splitProps, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls } from 'motion'

type TargetState = Record<string, number | string>
type LoopTransition = { duration?: number; delay?: number; ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }

/** Merge two target objects into motion's per-property keyframe array form. */
const toKeyframes = (from: TargetState, to: TargetState) => {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)])
  const keyframes: Record<string, (number | string)[]> = {}
  for (const k of keys) {
    keyframes[k] = [from[k] as number | string, to[k] as number | string]
  }
  return keyframes
}

export type TextLoopProps = {
  children: JSX.Element | JSX.Element[]
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  interval?: number
  transition?: LoopTransition
  variants?: { initial?: TargetState; animate?: TargetState; exit?: TargetState }
  onIndexChange?: (index: number) => void
  trigger?: boolean
  mode?: 'popLayout' | 'sync' | 'wait'
}

export function TextLoop(props: TextLoopProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'interval',
    'transition',
    'variants',
    'onIndexChange',
    'trigger',
    'mode',
  ])

  // React Children.toArray equivalent: normalize to an array of nodes.
  const items = createMemo<JSX.Element[]>(() => {
    const c = own.children
    return Array.isArray(c) ? c : [c]
  })

  const transition = () => own.transition ?? { duration: 0.3 }
  const variants = () => ({
    initial: own.variants?.initial ?? { y: 20, opacity: 0 },
    animate: own.variants?.animate ?? { y: 0, opacity: 1 },
    exit: own.variants?.exit ?? { y: -20, opacity: 0 },
  })

  const [index, setIndex] = createSignal(0)
  // The item currently mounted in the DOM (lags `index` during exit).
  const [shown, setShown] = createSignal(0)
  // Mutable one-shot flag (useRef equivalent): plain closure variable.
  let firstRender = true

  let el!: HTMLDivElement

  // Upstream: useEffect interval advancing currentIndex while trigger is on.
  createEffect(() => {
    const count = items().length
    const trigger = own.trigger ?? true
    const intervalMs = (own.interval ?? 2) * 1000
    if (!trigger || count === 0) return

    const timer = setInterval(() => {
      setIndex(current => {
        const next = (current + 1) % count
        untrack(() => own.onIndexChange?.(next))
        return next
      })
    }, intervalMs)
    onCleanup(() => clearInterval(timer))
  })

  // Exit-then-swap sequencing when `index` moves ahead of `shown`.
  createEffect(() => {
    const target = index()
    if (target === shown()) return
    const exit = variants().exit
    const t = transition()

    // popLayout pops the exiting element out of the flow immediately.
    el.style.position = 'absolute'
    const controls: AnimationPlaybackControls = animate(el, exit, {
      ...t,
      onComplete: () => {
        controls.stop()
        setShown(target)
      },
    })
    onCleanup(() => {
      controls.stop()
      el.style.position = ''
    })
  })

  // Enter animation after each swap (AnimatePresence initial={false}: the
  // first render mounts directly in the animate state).
  createEffect(() => {
    shown() // tracked: re-runs on every swap
    if (firstRender) {
      firstRender = false
      return
    }
    const enter = variants()
    el.style.position = ''
    const controls: AnimationPlaybackControls = animate(
      el,
      toKeyframes(enter.initial, enter.animate),
      {
        ...transition(),
      },
    )
    onCleanup(() => controls.stop())
  })

  return (
    <div
      {...(rest as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
      ref={el}
      class={`relative inline-block whitespace-nowrap ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {items()[shown()]}
    </div>
  )
}

export default TextLoop
