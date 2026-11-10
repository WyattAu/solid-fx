// Source: github.com/ibelick/motion-primitives components/core/cursor.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream useSpring(cursorX) is ported to vanilla motionValues
// re-anchored by animate() spring calls on every mousemove (PORTING.md §5,
// Magnetic precedent). AnimatePresence is sequenced manually: the inner
// element runs its `exit` variant, then unmounts on completion. Upstream's
// parent listener cleanup passed fresh anonymous closures to
// removeEventListener (a no-op); named handlers are used here so removal
// actually works. The `variants` prop accepts Variant resolvers upstream;
// only static keyframes (DOMKeyframesDefinition) are supported here.

import { animate, motionValue } from 'motion'
import type {
  AnimationPlaybackControlsWithThen,
  DOMKeyframesDefinition,
  SpringOptions,
  Transition,
} from 'motion'
import { createEffect, createSignal, onCleanup, onMount, Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export type CursorVariants = {
  initial: DOMKeyframesDefinition
  animate: DOMKeyframesDefinition
  exit: DOMKeyframesDefinition
}

export type CursorProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  springConfig?: SpringOptions
  attachToParent?: boolean
  transition?: Transition
  variants?: CursorVariants
  onPositionChange?: (x: number, y: number) => void
}

// Numeric values that are not CSS lengths (framer adds `px` to lengths).
const UNITLESS_KEYS = new Set(['opacity', 'zIndex', 'fontWeight', 'flexGrow', 'flexShrink'])

/** Applies start-state keyframes synchronously (upstream: `initial` variant). */
function applyStartStyles(el: HTMLElement, keyframes: DOMKeyframesDefinition) {
  for (const key of Object.keys(keyframes)) {
    const value = (keyframes as Record<string, string | number>)[key]
    if (value === undefined) continue
    const styleValue =
      typeof value === 'number' && !UNITLESS_KEYS.has(key) ? `${value}px` : String(value)
    ;(el.style as unknown as Record<string, string>)[key] = styleValue
  }
}

export function Cursor(props: CursorProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'springConfig',
    'attachToParent',
    'transition',
    'variants',
    'onPositionChange',
  ])

  const cursorX = motionValue(0)
  const cursorY = motionValue(0)
  // Upstream springs start at the source motionValue's current value.
  const springX = motionValue(0)
  const springY = motionValue(0)

  const [isVisible, setIsVisible] = createSignal(!(own.attachToParent ?? false))
  const [present, setPresent] = createSignal(isVisible())

  let rootEl!: HTMLDivElement
  let innerEl: HTMLDivElement | undefined
  let xControls: AnimationPlaybackControlsWithThen | undefined
  let yControls: AnimationPlaybackControlsWithThen | undefined
  let enterControls: AnimationPlaybackControlsWithThen | undefined
  let exitControls: AnimationPlaybackControlsWithThen | undefined

  const springOptions = () => own.springConfig ?? { duration: 0 }

  const apply = () => {
    rootEl.style.transform = `translate3d(${springX.get()}px, ${springY.get()}px, 0) translate(-50%, -50%)`
  }

  onMount(() => {
    cursorX.set(window.innerWidth / 2)
    cursorY.set(window.innerHeight / 2)
    springX.set(cursorX.get())
    springY.set(cursorY.get())
    apply()

    if (!own.attachToParent) {
      document.body.style.cursor = 'none'
    } else {
      document.body.style.cursor = 'auto'
    }

    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      own.onPositionChange?.(e.clientX, e.clientY)
    }
    document.addEventListener('mousemove', updatePosition)

    // Upstream: useSpring follows the source motionValue continuously; the
    // equivalent here is a spring animate() re-anchored on every source
    // change (spring physics identical, retargeting approximated).
    const offs = [
      cursorX.on('change', v => {
        xControls?.stop()
        xControls = animate(springX, v, springOptions())
      }),
      cursorY.on('change', v => {
        yControls?.stop()
        yControls = animate(springY, v, springOptions())
      }),
      springX.on('change', apply),
      springY.on('change', apply),
    ]

    let parent: HTMLElement | null = null
    const handleParentEnter = () => {
      if (parent) parent.style.cursor = 'none'
      setIsVisible(true)
    }
    const handleParentLeave = () => {
      if (parent) parent.style.cursor = 'auto'
      setIsVisible(false)
    }
    if (own.attachToParent && rootEl.parentElement) {
      parent = rootEl.parentElement
      parent.addEventListener('mouseenter', handleParentEnter)
      parent.addEventListener('mouseleave', handleParentLeave)
    }

    onCleanup(() => {
      document.removeEventListener('mousemove', updatePosition)
      document.body.style.cursor = ''
      if (parent) {
        parent.removeEventListener('mouseenter', handleParentEnter)
        parent.removeEventListener('mouseleave', handleParentLeave)
      }
      offs.forEach(off => off())
      xControls?.stop()
      yControls?.stop()
      enterControls?.stop()
      exitControls?.stop()
    })
  })

  createEffect(() => {
    const visible = isVisible()
    if (visible) {
      if (!present()) setPresent(true)
    } else if (present()) {
      enterControls?.stop()
      if (innerEl && own.variants?.exit) {
        exitControls?.stop()
        exitControls = animate(innerEl, own.variants.exit, own.transition)
        void exitControls.then(() => {
          if (!isVisible()) setPresent(false)
        })
      } else {
        setPresent(false)
      }
    }
  })

  const innerRef = (node: HTMLDivElement) => {
    innerEl = node
    onCleanup(() => {
      enterControls?.stop()
      exitControls?.stop()
      innerEl = undefined
    })
    if (!own.variants) return
    // Upstream: initial variant is applied before the enter animation.
    applyStartStyles(node, own.variants.initial)
    enterControls?.stop()
    enterControls = animate(node, own.variants.animate, own.transition)
  }

  return (
    <div
      {...rest}
      ref={rootEl}
      class={`pointer-events-none fixed top-0 left-0 z-50 ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <Show when={present()}>
        <div ref={innerRef}>{own.children}</div>
      </Show>
    </div>
  )
}

export default Cursor
