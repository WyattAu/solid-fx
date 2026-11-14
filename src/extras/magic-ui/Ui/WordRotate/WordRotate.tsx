// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/word-rotate.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import { animate } from 'motion'
import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'

// PORT-NOTE: vanilla `motion` does not re-export motion/react's `Transition`
// and `MotionProps` types (see SpinningText). Structurally equivalent
// interfaces matching upstream usage (initial/animate/exit `opacity`/`y` +
// duration/ease/repeat/delay overrides) are declared locally so the
// `motionProps` prop keeps the same name and semantics. Only `opacity` and
// `y` are honored per phase — the upstream default (and every upstream/demo
// usage) only animates those two.
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

interface MotionValues {
  opacity?: number
  y?: number
}

interface MotionProps {
  initial?: MotionValues
  animate?: MotionValues
  exit?: MotionValues
  transition?: MotionTransition
}

interface WordRotateProps {
  words: string[]
  duration?: number
  motionProps?: MotionProps
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
}

const DEFAULT_MOTION_PROPS: Omit<MotionProps, 'transition'> = {
  initial: { opacity: 0, y: -50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
}

export function WordRotate(props: WordRotateProps) {
  const [own, rest] = splitProps(props, [
    'words',
    'duration',
    'motionProps',
    'class',
    'className',
    'style',
  ])

  const duration = () => own.duration ?? 2500
  const initial = () => own.motionProps?.initial ?? DEFAULT_MOTION_PROPS.initial
  const animateValues = () =>
    own.motionProps?.animate ?? DEFAULT_MOTION_PROPS.animate
  const exitValues = () => own.motionProps?.exit ?? DEFAULT_MOTION_PROPS.exit
  const transition = () =>
    own.motionProps?.transition ?? { duration: 0.25, ease: 'easeOut' as const }

  const [index, setIndex] = createSignal(0)

  let el!: HTMLHeadingElement

  // Upstream: one shared interval; recreated when `words`/`duration` change.
  createEffect(() => {
    const words = own.words
    const interval = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % words.length)
    }, duration())
    onCleanup(() => clearInterval(interval))
  })

  // Upstream: AnimatePresence mode="wait" — the outgoing word fades/slides
  // down before the incoming word fades/slides in from above. Ported to a
  // vanilla `animate` exit → text swap → enter sequence; a generation counter
  // discards stale completions if `index` moved again mid-exit.
  let generation = 0
  let active: ReturnType<typeof animate> | undefined

  onCleanup(() => active?.stop())

  onMount(() => {
    const enter = () => {
      active?.stop()
      active = animate(
        el,
        {
          opacity: [initial().opacity ?? 0, animateValues().opacity ?? 1],
          y: [initial().y ?? -50, animateValues().y ?? 0],
        },
        transition(),
      )
    }

    // First word enters on mount (AnimatePresence `initial` behavior).
    el.textContent = own.words[index()] ?? ''
    enter()

    createEffect(() => {
      const i = index()
      const word = own.words[i] ?? ''
      const gen = ++generation
      // Skip the mount run — the enter above already covers it.
      if (gen === 1) return

      const exit = animate(el, { opacity: exitValues().opacity ?? 0, y: exitValues().y ?? 50 }, transition())
      active = exit
      exit.then(() => {
        if (gen !== generation) return
        el.textContent = word
        enter()
      })
      onCleanup(() => exit.stop())
    })
  })

  return (
    <div class="overflow-hidden py-2">
      <h1
        ref={el}
        {...rest}
        class={`${own.class ?? ''} ${own.className ?? ''}`}
        style={own.style}
      />
    </div>
  )
}

export default WordRotate
