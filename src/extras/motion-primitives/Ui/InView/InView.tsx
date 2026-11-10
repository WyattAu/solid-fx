// Source: github.com/ibelick/motion-primitives components/core/in-view.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: useInView maps to an IntersectionObserver in onMount + onCleanup
// (PORTING.md §5); the 'some'/'all' amounts map to thresholds 0/1. The
// declarative variants animate maps to a vanilla animate() restarted by a
// tracked effect on view changes, and `once` latches visible when the enter
// animation completes (upstream onAnimationComplete). Variant objects are
// typed as DOMKeyframesDefinition — the same shape the vanilla animate()
// consumes.

import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { animate } from 'motion'
import type { DOMKeyframesDefinition, Transition } from 'motion'

/** Upstream `UseInViewOptions` (motion/react), element instead of ref-object root. */
export type InViewOptions = {
  root?: Element | Document | null
  margin?: string
  amount?: 'some' | 'all' | number
}

export type InViewProps = {
  children?: JSX.Element
  variants?: {
    hidden: DOMKeyframesDefinition
    visible: DOMKeyframesDefinition
  }
  transition?: Transition
  viewOptions?: InViewOptions
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
  once?: boolean
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'>

const DEFAULT_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export function InView(props: InViewProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'variants',
    'transition',
    'viewOptions',
    'as',
    'once',
    'class',
    'className',
    'style',
  ])

  let el!: HTMLElement
  const [isInView, setIsInView] = createSignal(false)
  const [isViewed, setIsViewed] = createSignal(false)
  // animate() returns controls with a `.then` (AnimationPlaybackControlsWithThen).
  let controls: ReturnType<typeof animate> | undefined

  // Upstream: useInView(ref, viewOptions).
  onMount(() => {
    const options = own.viewOptions
    const amount = options?.amount ?? 'some'
    const observer = new IntersectionObserver(
      entries => setIsInView(entries[entries.length - 1]?.isIntersecting ?? false),
      {
        root: options?.root ?? null,
        rootMargin: options?.margin,
        threshold: amount === 'some' ? 0 : amount === 'all' ? 1 : amount,
      },
    )
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  })

  // Upstream: animate={(isInView || isViewed) ? 'visible' : 'hidden'}.
  createEffect(() => {
    const active = isInView() || isViewed()
    const variants = own.variants ?? DEFAULT_VARIANTS
    const target = active ? variants.visible : variants.hidden

    controls?.stop()
    controls = animate(el, target, own.transition)
    if (active && own.once) {
      void controls.then(() => {
        // Latch only if the enter animation actually completed in view.
        if (isInView() || isViewed()) setIsViewed(true)
      })
    }
  })

  onCleanup(() => controls?.stop())

  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      ref={el}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {own.children}
    </Dynamic>
  )
}

export default InView
