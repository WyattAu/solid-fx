// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-subscribe-button.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.

import { animate } from 'motion'
import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, onMount, splitProps, untrack } from 'solid-js'

// Type of the controls `animate()` returns (has .stop() and .finished).
type MotionControls = ReturnType<typeof animate>

export interface AnimatedSubscribeButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  /**
   * Controlled subscription state. Leave undefined for an uncontrolled,
   * self-toggling button.
   */
  subscribeStatus?: boolean
  /**
   * The button content. Must be exactly two <span> elements: the
   * unsubscribed label first, the subscribed label second.
   */
  children: JSX.Element
  /**
   * React parity alias; merges with `class`.
   */
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  onClick?: (event: MouseEvent) => void
}

// PORT-NOTE: upstream renders two <motion.button> branches under
// <AnimatePresence mode="wait"> — the outgoing branch plays its exit, then the
// incoming branch mounts and plays its enter. There is no declarative
// equivalent in Solid, so the port keeps one <button> mounted and sequences
// exit-then-enter explicitly (PORTING.md §5). framer-motion's implicit
// defaults are approximated: opacity/translate exit at 0.3s/0.1s tween, enter
// y at a default spring.
const EXIT_DURATION = 0.3
const UNSUB_EXIT_DURATION = 0.1

export const AnimatedSubscribeButton = (props: AnimatedSubscribeButtonProps) => {
  const [own, rest] = splitProps(props, [
    'subscribeStatus',
    'children',
    'class',
    'className',
    'onClick',
  ])

  // Upstream: React.Children validation — exactly two <span> children.
  // Solid children are already-created DOM nodes, so the equivalent check is
  // an instanceof test on the normalized array.
  const rawChildren = own.children
  const childrenArray: unknown[] = Array.isArray(rawChildren) ? rawChildren : [rawChildren]
  const isTwoSpans =
    childrenArray.length === 2 &&
    childrenArray.every(child => child instanceof Element && child.tagName === 'SPAN')
  if (!isTwoSpans) {
    throw new Error(
      'AnimatedSubscribeButton expects two children, both of which must be <span> elements.',
    )
  }
  const initialChild = childrenArray[0] as JSX.Element
  const changeChild = childrenArray[1] as JSX.Element

  const isControlled = () => own.subscribeStatus !== undefined
  const [isSubscribed, setIsSubscribed] = createSignal<boolean>(own.subscribeStatus ?? false)

  // What the DOM currently shows — mode="wait" keeps exactly one branch mounted.
  const [shownSubscribed, setShownSubscribed] = createSignal<boolean>(isSubscribed())

  let btnEl!: HTMLButtonElement
  let spanEl!: HTMLSpanElement

  let activeControls: MotionControls[] = []
  let cancelled = false
  onCleanup(() => {
    cancelled = true
    for (const controls of activeControls) controls.stop()
    activeControls = []
  })

  const runControls = (controls: MotionControls[]) => {
    activeControls = controls
    return Promise.all(controls.map(controls_ => controls_.finished))
  }

  // Upstream: controlled useEffect on [subscribeStatus] mirrors the prop into
  // state; AnimatePresence then plays the swap for both modes.
  createEffect(() => {
    const status = own.subscribeStatus
    if (status !== undefined) setIsSubscribed(status)
  })

  // Upstream: initial={{ opacity: 0 }} animate={{ opacity: 1 }} on the button,
  // and the subscribed branch's span animates y: -50 → 0 on mount.
  const playEnter = (subscribed: boolean) => {
    const controls: MotionControls[] = [
      animate(btnEl, { opacity: [0, 1] }, { duration: EXIT_DURATION }),
    ]
    if (subscribed) {
      controls.push(animate(spanEl, { y: [-50, 0] }, { type: 'spring' }))
    } else {
      spanEl.style.transform = ''
    }
    return runControls(controls)
  }

  // Upstream: exit={{ opacity: 0 }} on both branches; the unsubscribed span
  // additionally exits x: 0 → 50 in 0.1s.
  const playExit = (subscribed: boolean) => {
    const controls: MotionControls[] = [
      animate(btnEl, { opacity: [1, 0] }, { duration: EXIT_DURATION }),
    ]
    if (!subscribed) {
      controls.push(animate(spanEl, { x: [0, 50] }, { duration: UNSUB_EXIT_DURATION }))
    }
    return runControls(controls)
  }

  const swapping = { inFlight: false }

  // AnimatePresence mode="wait" equivalent: converge shownSubscribed() toward
  // isSubscribed(), exit → swap children → enter. The loop also absorbs
  // rapid re-toggles mid-flight (upstream: AnimatePresence queues/interrupts).
  const converge = async () => {
    if (swapping.inFlight) return
    swapping.inFlight = true
    try {
      while (untrack(shownSubscribed) !== untrack(isSubscribed)) {
        const current = untrack(shownSubscribed)
        const target = untrack(isSubscribed)
        await playExit(current)
        if (cancelled) return
        setShownSubscribed(target)
        await playEnter(target)
        if (cancelled) return
      }
    } finally {
      swapping.inFlight = false
    }
  }

  // Watch for state changes that require a swap.
  createEffect(() => {
    const target = isSubscribed()
    untrack(() => {
      if (shownSubscribed() !== target) void converge()
    })
  })

  // Mount enter animation (upstream: motion initial → animate on first render).
  onMount(() => {
    void playEnter(shownSubscribed())
  })

  const handleClick = (event: MouseEvent) => {
    if (!isControlled()) {
      setIsSubscribed(!isSubscribed()) // Only toggle manually if uncontrolled
    }
    own.onClick?.(event)
  }

  // Upstream branches differ slightly: the subscribed branch's button adds
  // `overflow-hidden` and its span is `h-full w-full`; the unsubscribed
  // branch's button adds `cursor-pointer border-none`.
  return (
    <button
      {...rest}
      ref={btnEl}
      onClick={handleClick}
      class={`bg-primary text-primary-foreground relative flex h-10 w-fit items-center justify-center rounded-lg px-6 ${
        shownSubscribed() ? 'overflow-hidden' : 'cursor-pointer border-none'
      } ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <span
        class={`relative flex items-center justify-center font-semibold ${
          shownSubscribed() ? 'h-full w-full' : ''
        }`}
      >
        {/* PORT-NOTE: Solid children are stable DOM nodes; insertion re-parents
            the active one, mirroring the upstream branch swap. */}
        {shownSubscribed() ? changeChild : initialChild}
      </span>
    </button>
  )
}

export default AnimatedSubscribeButton
