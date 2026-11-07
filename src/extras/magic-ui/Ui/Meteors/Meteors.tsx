// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/meteors.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import { createEffect, createSignal, splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'

interface MeteorsProps {
  /**
   * The number of meteors to render.
   */
  number?: number
  /**
   * The minimum animation delay in seconds.
   */
  minDelay?: number
  /**
   * The maximum animation delay in seconds.
   */
  maxDelay?: number
  /**
   * The minimum animation duration in seconds.
   */
  minDuration?: number
  /**
   * The maximum animation duration in seconds.
   */
  maxDuration?: number
  /**
   * The angle of the meteor trajectory in degrees.
   */
  angle?: number
  /**
   * The class name of the meteor head.
   */
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-meteor: meteor 5s linear infinite`) plus the `meteor` keyframes
// in the registry globals.css. They are embedded here so the port is
// self-contained without touching the site's Tailwind theme (same approach as
// Marquee).
const STYLE = `
@keyframes meteor {
  0% { transform: rotate(var(--angle)) translateX(0); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: rotate(var(--angle)) translateX(-500px); opacity: 0; }
}
.animate-meteor {
  animation: meteor 5s linear infinite;
}
`

type MeteorStyle = JSX.CSSProperties & { '--angle': string }

export const Meteors = (props: MeteorsProps) => {
  const [own] = splitProps(props, [
    'number',
    'minDelay',
    'maxDelay',
    'minDuration',
    'maxDuration',
    'angle',
    'class',
    'className',
  ])

  const number = () => own.number ?? 20
  const minDelay = () => own.minDelay ?? 0.2
  const maxDelay = () => own.maxDelay ?? 1.2
  const minDuration = () => own.minDuration ?? 2
  const maxDuration = () => own.maxDuration ?? 10
  const angle = () => own.angle ?? 215

  const [meteorStyles, setMeteorStyles] = createSignal<MeteorStyle[]>([])

  // Upstream: useEffect on [number, minDelay, maxDelay, minDuration,
  // maxDuration, angle] — one random pass per change of those props. Solid:
  // reads become accessor calls so this re-runs reactively.
  // PORT-NOTE: hyphenated CSS property/variable keys (Solid style objects),
  // and window.innerWidth keeps upstream's viewport-random spawn position.
  createEffect(() => {
    const count = number()
    const min = minDelay()
    const max = maxDelay()
    const minDurationValue = minDuration()
    const maxDurationValue = maxDuration()
    const angleValue = angle()

    const styles = Array.from({ length: count }, (): MeteorStyle => ({
      '--angle': `${-angleValue}deg`,
      top: '-5%',
      left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
      'animation-delay': `${Math.random() * (max - min) + min}s`,
      'animation-duration': `${Math.floor(Math.random() * (maxDurationValue - minDurationValue) + minDurationValue)}s`,
    }))
    setMeteorStyles(styles)
  })

  return (
    <>
      <style>{STYLE}</style>
      <For each={meteorStyles()}>
        {style => (
          // Meteor Head
          <span
            style={style}
            class={`animate-meteor pointer-events-none absolute size-0.5 rotate-(--angle) rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10] ${own.class ?? ''} ${own.className ?? ''}`}
          >
            {/* Meteor Tail */}
            <div class="pointer-events-none absolute top-1/2 -z-10 h-px w-12.5 -translate-y-1/2 bg-linear-to-r from-zinc-500 to-transparent" />
          </span>
        )}
      </For>
    </>
  )
}

export default Meteors
