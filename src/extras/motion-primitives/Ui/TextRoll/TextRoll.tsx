// Source: github.com/ibelick/motion-primitives components/core/text-roll.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream renders each letter as two framer <motion.span>s with
// declarative initial/animate targets; the port drives the same keyframes
// with vanilla motion animate() calls on mount (PORTING.md §5). The
// `variants` prop is honored as the keyframe endpoint objects passed straight
// to animate(); `transition` honors ease (delay/duration are overridden by
// `duration` and the per-letter delay functions, exactly as upstream does).

import { For, onCleanup, onMount, splitProps, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls } from 'motion'

/** Upstream framer `Target` subset accepted by vanilla animate(). */
type TargetState = Record<string, number | string>

export type TextRollProps = {
  children: string
  duration?: number
  getEnterDelay?: (index: number) => number
  getExitDelay?: (index: number) => number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  /** Upstream framer Transition — ease is honored; delay/duration are overridden per letter. */
  transition?: { ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'circIn' | 'circOut' }
  variants?: {
    enter: { initial: TargetState; animate: TargetState }
    exit: { initial: TargetState; animate: TargetState }
  }
  onAnimationComplete?: () => void
}

/** Merge two target objects into motion's per-property keyframe array form. */
const toKeyframes = (from: TargetState, to: TargetState) => {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)])
  const keyframes: Record<string, (number | string)[]> = {}
  for (const k of keys) {
    keyframes[k] = [from[k] as number | string, to[k] as number | string]
  }
  return keyframes
}

export function TextRoll(props: TextRollProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'duration',
    'getEnterDelay',
    'getExitDelay',
    'class',
    'className',
    'transition',
    'variants',
    'onAnimationComplete',
  ])

  const letters = () => own.children.split('')
  const duration = () => own.duration ?? 0.5
  const ease = () => own.transition?.ease ?? 'easeIn'
  const getEnterDelay = () => own.getEnterDelay ?? ((i: number) => i * 0.1)
  const getExitDelay = () => own.getExitDelay ?? ((i: number) => i * 0.1 + 0.2)

  // Upstream defaultVariants (as const).
  const defaultVariants = {
    enter: { initial: { rotateX: 0 }, animate: { rotateX: 90 } },
    exit: { initial: { rotateX: 90 }, animate: { rotateX: 0 } },
  } as const

  const enterVariants = () => own.variants?.enter ?? defaultVariants.enter
  const exitVariants = () => own.variants?.exit ?? defaultVariants.exit

  return (
    <span
      {...(rest as unknown as JSX.HTMLAttributes<HTMLSpanElement>)}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      <For each={letters()}>
        {(letter, i) => {
          const glyph = letter === ' ' ? '\u00A0' : letter
          let enterEl!: HTMLSpanElement
          let exitEl!: HTMLSpanElement
          let controls: AnimationPlaybackControls[] | undefined

          onMount(() => {
            // Read once — upstream animations are declarative fire-once on mount.
            const enter = untrack(enterVariants)
            const exit = untrack(exitVariants)
            const isLast = untrack(() => i() === letters().length - 1)
            const c1 = animate(enterEl, toKeyframes(enter.initial, enter.animate), {
              ease: ease(),
              duration: duration(),
              delay: getEnterDelay()(i()),
            })
            const c2 = animate(exitEl, toKeyframes(exit.initial, exit.animate), {
              ease: ease(),
              duration: duration(),
              delay: getExitDelay()(i()),
              onComplete: isLast ? () => untrack(() => own.onAnimationComplete?.()) : undefined,
            })
            controls = [c1, c2]
            onCleanup(() => controls?.forEach(c => c.stop()))
          })

          return (
            <span
              aria-hidden="true"
              class="relative inline-block [perspective:10000px] [transform-style:preserve-3d] [width:auto]"
            >
              <span
                ref={enterEl}
                class="absolute inline-block [backface-visibility:hidden] [transform-origin:50%_25%]"
              >
                {glyph}
              </span>
              <span
                ref={exitEl}
                class="absolute inline-block [backface-visibility:hidden] [transform-origin:50%_100%]"
              >
                {glyph}
              </span>
              <span class="invisible">{glyph}</span>
            </span>
          )
        }}
      </For>
      <span class="sr-only">{own.children}</span>
    </span>
  )
}

export default TextRoll
