// Source: github.com/ibelick/motion-primitives components/core/text-scramble.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.

import { createEffect, createSignal, onCleanup, splitProps, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

// PORT-NOTE: upstream intersects MotionProps (framer-motion) and spreads the
// remainder onto the rendered element. There is no declarative motion layer
// here (the component only ever shuffles text), so the rest carries standard
// HTML attributes instead.
export type TextScrambleProps = {
  children: string
  duration?: number
  speed?: number
  characterSet?: string
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  trigger?: boolean
  onScrambleComplete?: () => void
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'class'>

const defaultChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function TextScramble(props: TextScrambleProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'duration',
    'speed',
    'characterSet',
    'as',
    'class',
    'className',
    'trigger',
    'onScrambleComplete',
  ])

  const [scrambledText, setScrambledText] = createSignal<string | null>(null)
  const [isAnimating, setIsAnimating] = createSignal(false)

  // Upstream never clears its interval on unmount (only on natural completion);
  // cleanup discipline requires disposal regardless.
  let interval: ReturnType<typeof setInterval> | undefined
  onCleanup(() => clearInterval(interval))

  const scramble = () => {
    if (isAnimating()) return
    setIsAnimating(true)

    const text = own.children
    const duration = own.duration ?? 0.8
    const speed = own.speed ?? 0.04
    const characterSet = own.characterSet ?? defaultChars
    const steps = duration / speed
    let step = 0

    interval = setInterval(() => {
      let scrambled = ''
      const progress = step / steps

      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          scrambled += ' '
          continue
        }

        if (progress * text.length > i) {
          scrambled += text[i]
        } else {
          scrambled +=
            characterSet[Math.floor(Math.random() * characterSet.length)]
        }
      }

      setScrambledText(scrambled)
      step++

      if (step > steps) {
        clearInterval(interval)
        interval = undefined
        setScrambledText(null)
        setIsAnimating(false)
        own.onScrambleComplete?.()
      }
    }, speed * 1000)
  }

  // Upstream: useEffect on [trigger] — restarts the scramble whenever trigger
  // flips truthy. Reads stay untracked so signals touched inside scramble()
  // don't re-enqueue this effect.
  createEffect(() => {
    if (own.trigger ?? true) untrack(scramble)
  })

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      {scrambledText() ?? own.children}
    </Dynamic>
  )
}

export default TextScramble
