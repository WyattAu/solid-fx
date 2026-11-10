// Source: github.com/codse/animata animata/text/typing-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this port
// template-joins, equivalent for the plain strings passed here. React custom hooks
// (useTypingInterval/useTypingEndpoint) become inline createEffects — signals
// auto-track, so the dependency arrays disappear. The latest-callback ref pattern
// (onCompleteRef) maps to untrack(() => props.onComplete?.()).
import { createEffect, createSignal, For, on, onCleanup, Show, untrack } from 'solid-js'
import type { JSX } from 'solid-js'

interface TypingTextProps {
  /**
   * Text to type
   */
  text: string

  /**
   * Delay between typing each character or word (smooth mode) in milliseconds
   * @default 32
   */
  delay?: number

  /**
   * If true, the text will be erased after typing and then typed again.
   */
  repeat?: boolean

  /**
   * Custom cursor to show at the end of the text.
   * Applies only when `smooth` is false.
   */
  cursor?: JSX.Element

  /**
   * Additional classes to apply to the container
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string

  /**
   * If true, the container will grow to fit the text as it types
   */
  grow?: boolean

  /**
   * Number of characters to keep always visible
   */
  alwaysVisibleCount?: number

  /**
   * If true, the typing effect will be smooth instead of typing one character at a time.
   * Looks better for multiple words.
   */
  smooth?: boolean

  /**
   * Time to wait before starting the next cycle of typing
   * Applies only when `repeat` is true.
   *
   * @default 1000
   */
  waitTime?: number

  /**
   * Callback function to be called when the typing is complete
   */
  onComplete?: () => void

  /**
   * If true, the cursor will be hidden after typing is complete
   * @default false
   */
  hideCursorOnComplete?: boolean
}

// React: Blinker's useState + useEffect(fn, []) — the interval lives for the whole
// component lifetime, so it sits in the component body with an in-scope onCleanup.
function Blinker() {
  const [show, setShow] = createSignal(true)
  const interval = setInterval(() => setShow(prev => !prev), 500)
  onCleanup(() => clearInterval(interval))
  return <span class={show() ? '' : 'opacity-0'}>|</span>
}

function SmoothEffect(props: { words: string[]; index: number; alwaysVisibleCount: number }) {
  return (
    <div class="flex flex-wrap whitespace-pre">
      <For each={props.words}>
        {(word, wordIndex) => (
          <span
            class="transition-opacity duration-300 ease-in-out"
            classList={{
              'opacity-100': wordIndex() < props.index,
              'opacity-0': wordIndex() >= props.index + props.alwaysVisibleCount,
            }}
          >
            {word}
            {wordIndex() < props.words.length && <span>&nbsp;</span>}
          </span>
        )}
      </For>
    </div>
  )
}

function NormalEffect(props: { text: string; index: number; alwaysVisibleCount: number }) {
  return (
    <>
      {props.text.slice(
        0,
        Math.max(props.index, Math.min(props.text.length, props.alwaysVisibleCount ?? 1)),
      )}
    </>
  )
}

enum TypingDirection {
  Forward = 1,
  Backward = -1,
}

function CursorWrapper(props: { visible?: boolean; waiting?: boolean; children?: JSX.Element }) {
  const [on, setOn] = createSignal(true)
  const interval = setInterval(() => setOn(prev => !prev), 100)
  onCleanup(() => clearInterval(interval))

  return <Show when={props.visible && (on() || props.waiting)}>{props.children}</Show>
}

function Type(props: TypingTextProps) {
  const [index, setIndex] = createSignal(0)
  const [direction, setDirection] = createSignal(TypingDirection.Forward)
  // React: completedRef (MutableRefObject) — a plain closure variable in Solid.
  let completed = false

  const words = () => props.text.split(/\s+/)
  const total = () => (props.smooth ? words().length : props.text.length)
  const stepMs = () => Math.max(1, props.delay ?? 32)

  // React: render-phase clamp (caret + setIndex) — moved into an effect.
  createEffect(() => {
    const clamped = Math.min(Math.max(index(), 0), total())
    if (index() !== clamped) setIndex(clamped)
  })

  const caret = () => Math.min(Math.max(index(), 0), total())
  const isComplete = () => caret() === total() && !props.repeat
  const atEnd = () => caret() >= total()
  const atStart = () => caret() <= 0
  const paused = () =>
    (atEnd() && direction() === TypingDirection.Forward) ||
    (atStart() && direction() === TypingDirection.Backward)

  // React: useTypingInterval hook — interval restarts whenever a tracked input changes.
  createEffect(() => {
    if (paused()) return
    const interval = setInterval(() => {
      setIndex(current => {
        const next = current + direction()
        if (direction() === TypingDirection.Forward) return Math.min(next, total())
        return Math.max(next, 0)
      })
    }, stepMs())
    onCleanup(() => clearInterval(interval))
  })

  // React: useTypingEndpoint hook — waits at the endpoints before reversing (repeat)
  // or fires onComplete once (latest callback read untracked at call time).
  createEffect(() => {
    const end = atEnd()
    const start = atStart()
    if (!end && !start) return

    const dir = direction()
    const repeat = props.repeat ?? true
    const wait = props.waitTime ?? 1000

    if (end && dir === TypingDirection.Forward) {
      if (!repeat) {
        if (!completed) {
          completed = true
          untrack(() => props.onComplete?.())
        }
        return
      }

      const timeout = setTimeout(() => setDirection(TypingDirection.Backward), wait)
      onCleanup(() => clearTimeout(timeout))
    }

    if (start && dir === TypingDirection.Backward && repeat) {
      const timeout = setTimeout(() => setDirection(TypingDirection.Forward), wait)
      onCleanup(() => clearTimeout(timeout))
    }
  })

  // PORT-NOTE: upstream remounts <Type key={text}> in TypingText to reset state on
  // text change; this port resets state in an on(text) effect (no DOM recreation).
  createEffect(
    on(
      () => props.text,
      () => {
        setIndex(0)
        setDirection(TypingDirection.Forward)
        completed = false
      },
    ),
  )

  const waitingNextCycle = () => caret() === total() || caret() === 0
  // React: `cursor = <Blinker />` default param — destructuring is forbidden, so the
  // default lives here. `Boolean(cursor)` truthiness: undefined falls back to Blinker.
  const cursorEl = () => props.cursor ?? <Blinker />
  const cursorVisible = () =>
    Boolean(!props.smooth && (!props.hideCursorOnComplete || !isComplete()))

  return (
    <div class={`relative font-mono ${props.class ?? ''} ${props.className ?? ''}`}>
      <Show when={!props.grow}>
        <div class="invisible">{props.text}</div>
      </Show>
      <div classList={{ 'absolute inset-0 h-full w-full': !props.grow }}>
        <Show
          when={props.smooth}
          fallback={
            <NormalEffect
              text={props.text}
              index={caret()}
              alwaysVisibleCount={props.alwaysVisibleCount ?? 1}
            />
          }
        >
          <SmoothEffect
            words={words()}
            index={caret()}
            alwaysVisibleCount={props.alwaysVisibleCount ?? 1}
          />
        </Show>
        <CursorWrapper waiting={waitingNextCycle()} visible={cursorVisible()}>
          {cursorEl()}
        </CursorWrapper>
      </div>
    </div>
  )
}

export default function TypingText(props: TypingTextProps) {
  return (
    <Type
      text={props.text}
      delay={props.delay ?? 32}
      waitTime={props.waitTime ?? 1000}
      grow={props.grow}
      repeat={props.repeat}
      cursor={props.cursor}
      class={props.class}
      className={props.className}
      smooth={props.smooth}
      alwaysVisibleCount={props.alwaysVisibleCount}
      onComplete={props.onComplete}
      hideCursorOnComplete={props.hideCursorOnComplete}
    />
  )
}
