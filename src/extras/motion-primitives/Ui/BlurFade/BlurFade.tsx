// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/blur-fade.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// PORT-NOTE: the motion-primitives batch queues "Blur Fade", but
// ibelick/motion-primitives @120f64f6 ships no blur-fade.tsx (verified against
// the full repo tree, the complete commit history, and Wayback captures of the
// docs site — the file never existed there). The component ships in Magic UI's
// registry — an MIT-vetted source per LICENSE-SOURCES.md — so it is ported
// from there, same substitution precedent as Ripple. Upstream wraps the
// animated div in <AnimatePresence>; Solid unmounts directly, so the exit path
// is dropped. Per PORTING.md §5: useInView → IntersectionObserver, motion
// variants → CSS transition. Framer merges each value's transition with the
// shared { delay: 0.04 + delay, duration, ease: 'easeOut' }, so every
// animated property (transform/opacity/filter) carries the same delay and
// duration — expressed here as one CSS `transition` declaration.

import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export type BlurFadeDirection = 'up' | 'down' | 'left' | 'right'

/** Upstream framer `UseInViewOptions['margin']` subset. */
type MarginType = `${number}px` | `${number}%`

export type BlurFadeVariant = {
  hidden: { x?: number; y?: number; opacity?: number; filter?: string }
  visible: { x?: number; y?: number; opacity?: number; filter?: string }
}

export type BlurFadeProps = {
  children?: JSX.Element
  /** Upstream custom variants — honors x/y/opacity/filter per state. */
  variant?: BlurFadeVariant
  duration?: number
  delay?: number
  offset?: number
  direction?: BlurFadeDirection
  inView?: boolean
  inViewMargin?: MarginType
  blur?: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class'>

const EASE_OUT_CSS = 'cubic-bezier(0, 0, 0.58, 1)' // CSS equivalent of framer's `easeOut`

export function BlurFade(props: BlurFadeProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'variant',
    'duration',
    'delay',
    'offset',
    'direction',
    'inView',
    'inViewMargin',
    'blur',
    'class',
    'className',
  ])

  const [inViewResult, setInViewResult] = createSignal(false)
  let el!: HTMLDivElement

  // Upstream: const isInView = !inView || inViewResult.
  const isInView = () => !(own.inView ?? false) || inViewResult()

  const duration = () => own.duration ?? 0.4
  const delay = () => own.delay ?? 0
  const offset = () => own.offset ?? 6
  const blur = () => own.blur ?? '6px'
  const direction = () => own.direction ?? 'down'
  const axis = () => (direction() === 'left' || direction() === 'right' ? 'x' : 'y')
  // Upstream: direction === 'right' || 'down' starts at -offset (moves with
  // the named direction into place); 'up'/'left' start at +offset.
  const hiddenOffset = () =>
    direction() === 'right' || direction() === 'down' ? -offset() : offset()

  const transformFor = (state: 'hidden' | 'visible') => {
    const v = own.variant?.[state]
    const fallback = state === 'hidden' ? hiddenOffset() : 0
    const x = v?.x ?? (axis() === 'x' ? fallback : 0)
    const y = v?.y ?? (axis() === 'y' ? fallback : 0)
    return `translate(${x}px, ${y}px)`
  }
  const opacityFor = (state: 'hidden' | 'visible') =>
    own.variant?.[state]?.opacity ?? (state === 'hidden' ? 0 : 1)
  const filterFor = (state: 'hidden' | 'visible') =>
    own.variant?.[state]?.filter ?? (state === 'hidden' ? `blur(${blur()})` : 'blur(0px)')

  onMount(() => {
    // Upstream: useInView(ref, { once: true, margin: inViewMargin }).
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInViewResult(true)
            observer.disconnect() // once: true
          }
        }
      },
      { rootMargin: own.inViewMargin ?? '-50px' },
    )
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  })

  const secs = () => `${duration()}s`
  const secsDelay = () => `${0.04 + delay()}s`
  const transitionValue = () =>
    `transform ${secs()} ${EASE_OUT_CSS} ${secsDelay()}, ` +
    `opacity ${secs()} ${EASE_OUT_CSS} ${secsDelay()}, ` +
    `filter ${secs()} ${EASE_OUT_CSS} ${secsDelay()}`

  return (
    <div
      {...rest}
      ref={el}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
      style={{
        transform: isInView() ? transformFor('visible') : transformFor('hidden'),
        opacity: isInView() ? opacityFor('visible') : opacityFor('hidden'),
        filter: isInView() ? filterFor('visible') : filterFor('hidden'),
        transition: transitionValue(),
      }}
    >
      {own.children}
    </div>
  )
}

export default BlurFade
