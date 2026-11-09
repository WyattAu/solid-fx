// Source: github.com/ibelick/motion-primitives components/core/scroll-progress.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream useScroll({ container }) is ported to a passive scroll
// listener on the container element (or the document when omitted); the
// progress value is spring-smoothed by motion's animate() re-anchored on
// every scroll event, the same physics as upstream useSpring (PORTING.md §5,
// Magnetic precedent).

import type { AnimationPlaybackControls, SpringOptions } from 'motion'
import { animate, motionValue } from 'motion'
import { onCleanup, onMount, splitProps } from 'solid-js'

export type ScrollProgressProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  springOptions?: SpringOptions
  /**
   * Upstream React RefObject of the scroll container; Solid callers pass
   * `{ current: el }`. When omitted, document scroll is tracked.
   */
  containerRef?: { current: HTMLElement | null }
}

const DEFAULT_SPRING_OPTIONS: SpringOptions = {
  stiffness: 200,
  damping: 50,
  restDelta: 0.001,
}

export function ScrollProgress(props: ScrollProgressProps) {
  const [own, rest] = splitProps(props, ['class', 'className', 'springOptions', 'containerRef'])

  let el!: HTMLDivElement

  // Upstream's useScroll spring initializes at the current scroll position;
  // here the value starts at 0 and springs to the measured progress on mount.
  const scaleX = motionValue(0)
  let spring: AnimationPlaybackControls | undefined

  const progressOf = (target: HTMLElement | null): number => {
    if (target) {
      const max = target.scrollHeight - target.clientHeight
      return max > 0 ? target.scrollTop / max : 0
    }
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    return max > 0 ? window.scrollY / max : 0
  }

  const springTo = (target: number) => {
    const options = {
      type: 'spring' as const,
      ...DEFAULT_SPRING_OPTIONS,
      ...(own.springOptions ?? {}),
    }
    spring?.stop()
    spring = animate(scaleX, target, options)
  }

  onMount(() => {
    // Upstream: useScroll({ container }) — read the current element at mount.
    const target = own.containerRef?.current ?? null
    const listenerTarget: HTMLElement | Window = target ?? window
    const onScroll = () => springTo(progressOf(target))
    listenerTarget.addEventListener('scroll', onScroll, { passive: true })
    springTo(progressOf(target))

    // Upstream: style={{ scaleX }} — applied manually since vanilla motion
    // values don't bind to the DOM on their own.
    const apply = () => {
      el.style.transform = `scaleX(${scaleX.get()})`
    }
    apply()
    const off = scaleX.on('change', apply)

    onCleanup(() => {
      listenerTarget.removeEventListener('scroll', onScroll)
      off()
      spring?.stop()
    })
  })

  return (
    <div
      {...rest}
      ref={el}
      class={`inset-x-0 top-0 h-1 origin-left ${own.class ?? ''} ${own.className ?? ''}`}
    />
  )
}

export default ScrollProgress
