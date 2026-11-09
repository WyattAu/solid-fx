// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/word-rotate.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// PORT-NOTE: the motion-primitives batch queues "Words Rotate", but
// ibelick/motion-primitives @120f64f6 ships no words-rotate.tsx (verified
// against the full repo tree, the complete commit history, and Wayback
// captures of the docs site). The component ships in Magic UI's registry as
// `WordRotate` — an MIT-vetted source per LICENSE-SOURCES.md — ported here
// under the batched Solid name. AnimatePresence mode="wait" maps to an
// await-sequenced exit-then-enter (the exit completes before the next word
// animates in, PORTING.md §5); upstream's `motionProps` (framer MotionProps)
// is dropped and its documented defaults are ported verbatim: initial
// { opacity: 0, y: -50 }, animate { opacity: 1, y: 0 }, exit
// { opacity: 0, y: 50 }, transition { duration: 0.25, ease: 'easeOut' }.

import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { AnimationOptions, AnimationPlaybackControls, DOMKeyframesDefinition } from 'motion'

export type WordsRotateProps = {
  words: string[]
  /** Interval between rotations, in milliseconds (default 2500). */
  duration?: number
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
} & Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'children' | 'class'>

// Upstream motionProps defaults, as keyframes.
const ENTER: { keyframes: DOMKeyframesDefinition; transition: AnimationOptions } = {
  keyframes: { opacity: [0, 1], y: [-50, 0] },
  transition: { duration: 0.25, ease: 'easeOut' },
}
const EXIT: { keyframes: DOMKeyframesDefinition; transition: AnimationOptions } = {
  keyframes: { opacity: [1, 0], y: [0, 50] },
  transition: { duration: 0.25, ease: 'easeOut' },
}

export function WordsRotate(props: WordsRotateProps) {
  const [own, rest] = splitProps(props, ['words', 'duration', 'class', 'className'])

  const words = () => own.words
  const duration = () => own.duration ?? 2500

  const [index, setIndex] = createSignal(0)
  let el!: HTMLHeadingElement

  // Generation counter: invalidates in-flight exit sequences after unmount
  // or an interval restart (upstream AnimatePresence handles interruption).
  let gen = 0
  let interval: ReturnType<typeof setInterval> | undefined
  let enterControls: AnimationPlaybackControls | undefined
  let exitControls: AnimationPlaybackControls | undefined

  const playEnter = () => {
    enterControls?.stop()
    enterControls = animate(el, ENTER.keyframes, ENTER.transition)
  }
  // Resolves true only if the exit completed while this generation is alive
  // (mode="wait": the enter begins only after a full, current exit).
  const playExit = async (myGen: number) => {
    exitControls?.stop()
    exitControls = animate(el, EXIT.keyframes, EXIT.transition)
    await exitControls
    return myGen === gen
  }

  onMount(() => {
    playEnter()
  })

  // Upstream: useEffect([words, duration]) — rotation interval re-created
  // on change, cleared on unmount.
  createEffect(() => {
    const list = words()
    const ms = duration()
    if (interval !== undefined) clearInterval(interval)
    if (list.length === 0) return
    const myGen = gen
    interval = setInterval(() => {
      void playExit(myGen).then(ok => {
        if (!ok) return
        setIndex(prev => (prev + 1) % list.length)
        playEnter()
      })
    }, ms)
    onCleanup(() => {
      gen++
      if (interval !== undefined) clearInterval(interval)
    })
  })

  onCleanup(() => {
    gen++
    if (interval !== undefined) clearInterval(interval)
    enterControls?.stop()
    exitControls?.stop()
  })

  const current = () => {
    const list = words()
    return list.length > 0 ? (list[index() % list.length] ?? '') : ''
  }

  return (
    <div class="overflow-hidden py-2">
      <h1 {...rest} ref={el} class={`${own.class ?? ''} ${own.className ?? ''}`}>
        {current()}
      </h1>
    </div>
  )
}

export default WordsRotate
