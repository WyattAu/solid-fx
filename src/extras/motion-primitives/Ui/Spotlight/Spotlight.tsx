// Source: github.com/ibelick/motion-primitives components/core/spotlight.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.

import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls, SpringOptions } from 'motion'

export type SpotlightProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  size?: number
  springOptions?: SpringOptions
}

const ROOT_CLASSES =
  'pointer-events-none absolute rounded-full ' +
  'bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] blur-xl ' +
  'transition-opacity duration-200 ' +
  'from-zinc-100 via-zinc-200 to-zinc-400 dark:from-zinc-50 dark:via-zinc-100 dark:to-zinc-200'

export function Spotlight(props: SpotlightProps) {
  const [own, rest] = splitProps(props, ['class', 'className', 'size', 'springOptions'])

  const size = () => own.size ?? 200
  const [isHovered, setIsHovered] = createSignal(false)

  let rootEl!: HTMLDivElement

  // PORT-NOTE: upstream useSpring(0, springOptions) (React layer) is ported to
  // vanilla motionValues retargeted by spring animate() calls per
  // PORTING.md §5 — motion's spring engine drives the same physics as
  // useSpring, re-anchoring on every mousemove target change.
  const mouseX = motionValue(0)
  const mouseY = motionValue(0)
  let springX: AnimationPlaybackControls | undefined
  let springY: AnimationPlaybackControls | undefined

  // Upstream default springOptions = { bounce: 0 }.
  const springTo = (targetX: number, targetY: number) => {
    const options = { type: 'spring' as const, bounce: 0, ...own.springOptions }
    springX?.stop()
    springY?.stop()
    springX = animate(mouseX, targetX, options)
    springY = animate(mouseY, targetY, options)
  }

  // Upstream: useTransform(mouseX, x => `${x - size / 2}px`) — applied manually
  // since vanilla motion values don't bind to the DOM on their own.
  const apply = () => {
    rootEl.style.left = `${mouseX.get() - size() / 2}px`
    rootEl.style.top = `${mouseY.get() - size() / 2}px`
  }

  onMount(() => {
    // Upstream: useEffect([]) — the parent element becomes the hover/move
    // surface and is clamped to relative + overflow-hidden.
    const parent = rootEl.parentElement
    if (parent) {
      parent.style.position = 'relative'
      parent.style.overflow = 'hidden'
    }

    apply()
    const offs = [mouseX.on('change', apply), mouseY.on('change', apply)]

    const handleMouseMove = (event: MouseEvent) => {
      if (!parent) return
      const { left, top } = parent.getBoundingClientRect()
      springTo(event.clientX - left, event.clientY - top)
    }
    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseenter', handleMouseEnter)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }

    onCleanup(() => {
      offs.forEach(off => off())
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseenter', handleMouseEnter)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
      springX?.stop()
      springY?.stop()
    })
  })

  return (
    <div
      {...rest}
      ref={rootEl}
      class={`${ROOT_CLASSES} ${own.class ?? ''} ${own.className ?? ''}`}
      classList={{ 'opacity-100': isHovered(), 'opacity-0': !isHovered() }}
      style={{ width: `${size()}px`, height: `${size()}px` }}
    />
  )
}

export default Spotlight
