// Source: github.com/kokonut-labs/kokonutui components/kokonutui/split-flap-text.tsx@a16d64c0d99ab5c6304ebcb88860d8d8bf201fd0. License: MIT.

/**
 * @author: @dorianbaffier
 * @description: Split Flap Text
 * @version: 1.0.0
 * @date: 2026-10-22
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { createEffect, createMemo, createSignal, Index, onCleanup, Show } from 'solid-js'
import type { JSX } from 'solid-js'

/** The order the flaps are printed in. A tile can only flip forward. */
const CHARSET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-/&!?'
/** One flap falling, in ms. Quick, so long trips round the drum still feel brisk. */
const FLIP = 56
/** Tiles start a beat apart, left to right. */
const STAGGER = 40

export interface SplitFlapTextProps {
  /** Show this text. Leave out to cycle through `words`. */
  text?: string
  /** Lines to cycle through when `text` isn't set. */
  words?: string[]
  /** Time each word stays up, in ms. */
  interval?: number
  /** Tiles always shown, so the board doesn't change width. Defaults to the longest word. */
  length?: number
  /** React parity alias; merges with `class`. PORT-NOTE: Solid ports accept both. */
  className?: string
  class?: string
  /** Classes for each tile, to recolor the board. */
  tileClassName?: string
}

const DEFAULT_WORDS = ['NOW BOARDING', 'GATE 12', 'ON TIME', 'LAST CALL']

const clean = (value: string) =>
  [...value.toUpperCase()].map((c) => (CHARSET.includes(c) ? c : ' ')).join('')

function Half(props: {
  char: string
  half: 'top' | 'bottom'
  class?: string
  ref?: (el: HTMLSpanElement) => void
  style?: JSX.CSSProperties
}) {
  return (
    <span
      class={`backface-hidden absolute inset-x-0 h-1/2 overflow-hidden bg-inherit ${
        props.half === 'top' ? 'top-0 rounded-t-[0.12em]' : 'bottom-0 rounded-b-[0.12em]'
      } ${props.class ?? ''}`}
      ref={(el) => props.ref?.(el)}
      style={props.style}
    >
      <span
        class={`absolute inset-x-0 flex h-[200%] items-center justify-center ${
          props.half === 'top' ? 'top-0' : 'bottom-0'
        }`}
      >
        {props.char}
      </span>
    </span>
  )
}

interface Flip {
  id: number
  from: string
  to: string
}

function Tile(props: {
  target: string
  delay: number
  reduceMotion: boolean
  class?: string
}) {
  const [shown, setShown] = createSignal(props.target)
  const [flip, setFlip] = createSignal<Flip | null>(null)
  // Upstream `shownRef` (mutable value ref) — a plain closure variable; the
  // component body runs once per instance.
  let current = props.target
  let topEl: HTMLSpanElement | undefined
  let bottomEl: HTMLSpanElement | undefined
  let shadeEl!: HTMLSpanElement

  createEffect(() => {
    const target = props.target
    const delay = props.delay
    if (props.reduceMotion) {
      current = target
      setShown(target)
      return
    }
    let timer: ReturnType<typeof setTimeout>
    let id = 0
    // Step through the drum one flap at a time until the target is up.
    const step = () => {
      const from = current
      if (from === target) {
        setFlip(null)
        return
      }
      const to = CHARSET[(CHARSET.indexOf(from) + 1) % CHARSET.length]
      id += 1
      setFlip({ id, from, to })
      timer = setTimeout(() => {
        current = to
        setShown(to)
        step()
      }, FLIP)
    }
    timer = setTimeout(step, delay)
    onCleanup(() => clearTimeout(timer))
  })

  // The top flap falls on its hinge, the bottom of the next letter lands,
  // and the lower half darkens for a moment under the falling flap.
  createEffect(() => {
    const f = flip()
    if (!f) {
      return
    }
    const half = FLIP / 2
    topEl?.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], {
      duration: half,
      easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)',
      fill: 'forwards',
    })
    bottomEl?.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], {
      duration: half,
      delay: half,
      easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)',
      fill: 'both',
    })
    shadeEl.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
      duration: FLIP,
      easing: 'linear',
    })
  })

  const front = createMemo(() => (flip() ? flip()!.to : shown()))
  const back = createMemo(() => (flip() ? flip()!.from : shown()))

  return (
    <span
      aria-hidden="true"
      class={`relative inline-block h-[1.15em] w-[0.72em] rounded-[0.12em] bg-zinc-900 text-zinc-50 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] [perspective:5em] ${props.class ?? ''}`}
    >
      {/* Still halves: the next letter's top, the old letter's bottom. */}
      <Half char={front()} half="top" />
      <Half char={back()} half="bottom" />
      <span
        class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-[0.12em] bg-black/50 opacity-0"
        ref={shadeEl}
      />
      <Show when={flip()} keyed>
        {(f) => (
          <>
            {/* Upstream keys these halves by flip id to remount each flap —
                `keyed` Show re-renders on the new flip object for the same
                effect (and resets the WAAPI `fill` state with it). */}
            <Half
              char={f.from}
              half="top"
              ref={(el) => (topEl = el)}
              style={{ 'transform-origin': '50% 100%' }}
            />
            <Half
              char={f.to}
              half="bottom"
              ref={(el) => (bottomEl = el)}
              style={{ 'transform-origin': '50% 0%', transform: 'rotateX(90deg)' }}
            />
          </>
        )}
      </Show>
      {/* The hinge. */}
      <span class="pointer-events-none absolute inset-x-0 top-1/2 h-[0.04em] -translate-y-1/2 bg-black/70" />
    </span>
  )
}

/**
 * Departure-board lettering. Each tile flips through its drum only as far
 * as its new letter, the tiles start a beat apart, and the flaps fall on a
 * real hinge with the half below darkening under them.
 */
export default function SplitFlapText(props: SplitFlapTextProps) {
  const words = () => props.words ?? DEFAULT_WORDS
  const [index, setIndex] = createSignal(0)
  const [reduceMotion, setReduceMotion] = createSignal(false)

  createEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(query.matches)
    const onChange = () => setReduceMotion(query.matches)
    query.addEventListener('change', onChange)
    onCleanup(() => query.removeEventListener('change', onChange))
  })

  createEffect(() => {
    if (props.text !== undefined || words().length < 2) {
      return
    }
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % words().length),
      props.interval ?? 3800,
    )
    onCleanup(() => window.clearInterval(id))
  })

  const value = createMemo(() => clean(props.text ?? words()[index()] ?? ''))
  const size = createMemo(() =>
    props.length ??
    Math.max(value().length, ...(props.text === undefined ? words().map((w) => w.length) : [0])),
  )
  const padded = createMemo(() => value().padEnd(size(), ' '))

  return (
    <span
      class={`inline-flex gap-[0.08em] font-semibold text-3xl tabular-nums leading-none sm:text-5xl ${
        props.class ?? ''
      } ${props.className ?? ''}`}
    >
      {/* Only announce text the app sets; a board cycling on its own would
          talk over the reader every few seconds. */}
      <span aria-live={props.text === undefined ? 'off' : 'polite'} class="sr-only">
        {value()}
      </span>
      <Index each={[...padded()]}>
        {(char, i) => (
          <Tile
            class={props.tileClassName}
            delay={i * STAGGER}
            reduceMotion={reduceMotion()}
            target={char()}
          />
        )}
      </Index>
    </span>
  )
}
