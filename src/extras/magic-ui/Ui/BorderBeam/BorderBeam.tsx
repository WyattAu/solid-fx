// Source: github.com/magicuidesign/magic-ui apps/www/registry/magicui/border-beam.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import { onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { Transition } from 'motion'

interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number
  /**
   * The duration of the border beam.
   */
  duration?: number
  /**
   * The delay of the border beam.
   */
  delay?: number
  /**
   * The color of the border beam from.
   */
  colorFrom?: string
  /**
   * The color of the border beam to.
   */
  colorTo?: string
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition
  /**
   * The class name of the border beam.
   */
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  /**
   * The style of the border beam.
   */
  style?: JSX.CSSProperties
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number
  /**
   * The border width of the beam.
   */
  borderWidth?: number
}

export const BorderBeam = (props: BorderBeamProps) => {
  const size = () => props.size ?? 50
  const duration = () => props.duration ?? 6
  const delay = () => props.delay ?? 0
  const colorFrom = () => props.colorFrom ?? '#ffaa40'
  const colorTo = () => props.colorTo ?? '#9c40ff'
  const reverse = () => props.reverse ?? false
  const initialOffset = () => props.initialOffset ?? 0
  const borderWidth = () => props.borderWidth ?? 1

  let beamEl!: HTMLDivElement

  // Upstream: motion.div with initial/animate/transition on offsetDistance.
  onMount(() => {
    // Upstream: initial={{ offsetDistance: `${initialOffset}%` }}
    beamEl.style.setProperty('offset-distance', `${initialOffset()}%`)

    const controls = animate(
      beamEl,
      {
        offsetDistance: reverse()
          ? [`${100 - initialOffset()}%`, `${-initialOffset()}%`]
          : [`${initialOffset()}%`, `${100 + initialOffset()}%`],
      },
      {
        repeat: Infinity,
        ease: 'linear',
        duration: duration(),
        // Negative delay starts the loop partway through (phase offset).
        delay: -delay(),
        ...props.transition,
      },
    )
    onCleanup(() => controls.stop())
  })

  return (
    <div
      class="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={{ '--border-beam-width': `${borderWidth()}px` }}
    >
      <div
        ref={beamEl}
        class={`absolute aspect-square bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent ${props.class ?? ''} ${props.className ?? ''}`}
        style={{
          width: `${size()}px`,
          'offset-path': `rect(0 auto auto 0 round ${size()}px)`,
          '--color-from': colorFrom(),
          '--color-to': colorTo(),
          ...props.style,
        }}
      />
    </div>
  )
}

export default BorderBeam
