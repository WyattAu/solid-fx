// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/sparkles-text.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
// PORT-NOTE: the batch brief named apps/www/registry/magicui/sparkles.tsx as
// upstream, but that file does not exist at HEAD (404) and never existed in the
// magicui repo's git history — no commits touch the path, it is absent from
// every sampled revision tree (2023–2025), there is no /r/sparkles.json
// registry payload, and no Wayback snapshot. The particle "Sparkles" component
// with SparklesCore/particleDensity props is Aceternity UI (tsparticles-based),
// not Magic UI. sparkles-text.tsx is Magic UI's surviving sparkles component,
// so it is ported here under its real upstream name.

import { createEffect, createSignal, onCleanup, splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'

interface Sparkle {
  id: string
  x: string
  y: string
  color: string
  delay: number
  scale: number
  lifespan: number
}

const Sparkle = (props: Sparkle) => {
  // Upstream: motion.svg with initial/animate/transition — ported to vanilla
  // `animate` bound in the ref (same pattern as DotPattern's glow circles).
  return (
    <svg
      ref={el => {
        // Upstream initial={{ opacity: 0, left: x, top: y }} — hold the
        // initial opacity through the animation delay, position via style.
        el.style.opacity = '0'
        el.style.left = props.x
        el.style.top = props.y
        const controls = animate(
          el,
          {
            opacity: [0, 1, 0],
            scale: [0, props.scale, 0],
            rotate: [75, 120, 150],
          },
          { duration: 0.8, repeat: Infinity, delay: props.delay },
        )
        onCleanup(() => controls.stop())
      }}
      class="pointer-events-none absolute z-20"
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
        fill={props.color}
      />
    </svg>
  )
}

interface SparklesTextProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * @default <div />
   * @type ReactElement
   * @description
   * The element to render as the text. PORT-NOTE: upstream declares `as` but
   * its implementation never applies it; kept for prop parity only.
   */
  as?: JSX.Element

  /**
   * React parity alias; merges with `class`.
   */
  className?: string

  /**
   * @required
   * @description
   * The content to be displayed.
   */
  children: JSX.Element

  /**
   * @default 10
   * @description
   * The count of sparkles.
   */
  sparklesCount?: number

  /**
   * @default "{ first: '#9E7AFF', second: '#FE8BBB' }"
   * @description
   * The colors of the sparkles.
   */
  colors?: {
    first: string
    second: string
  }
}

export const SparklesText = (props: SparklesTextProps) => {
  const [own, rest] = splitProps(props, [
    'as',
    'class',
    'className',
    'children',
    'sparklesCount',
    'colors',
  ])

  const colors = () => own.colors ?? { first: '#9E7AFF', second: '#FE8BBB' }
  const sparklesCount = () => own.sparklesCount ?? 10

  const [sparkles, setSparkles] = createSignal<Sparkle[]>([])

  // Upstream: useEffect on [colors.first, colors.second, sparklesCount] —
  // (re)initializes the field and starts the 100ms lifespan ticker.
  createEffect(() => {
    // Track the upstream deps so prop changes regenerate the field.
    const firstColor = colors().first
    const secondColor = colors().second
    const count = sparklesCount()

    const generateStar = (): Sparkle => {
      const starX = `${Math.random() * 100}%`
      const starY = `${Math.random() * 100}%`
      const color = Math.random() > 0.5 ? firstColor : secondColor
      const delay = Math.random() * 2
      const scale = Math.random() * 1 + 0.3
      const lifespan = Math.random() * 10 + 5
      const id = `${starX}-${starY}-${Date.now()}`
      return { id, x: starX, y: starY, color, delay, scale, lifespan }
    }

    // PORT-NOTE: upstream replaces every star object each tick
    // ({...star, lifespan: star.lifespan - 0.1}) and keys by id, so React
    // keeps DOM nodes stable. Solid's <For> keys by object reference, so
    // lifespan is decremented in place instead — the rendered fields
    // (x/y/color/delay/scale) never change between ticks, and only genuinely
    // regenerated stars get a new object (and thus a new DOM node).
    const updateStars = () => {
      setSparkles(currentSparkles =>
        currentSparkles.map(star => {
          if (star.lifespan <= 0) {
            return generateStar()
          }
          star.lifespan -= 0.1
          return star
        }),
      )
    }

    setSparkles(Array.from({ length: count }, generateStar))
    const interval = setInterval(updateStars, 100)
    onCleanup(() => clearInterval(interval))
  })

  return (
    <div
      {...rest}
      class={`text-6xl font-bold ${own.class ?? ''} ${own.className ?? ''}`}
      style={{
        '--sparkles-first-color': colors().first,
        '--sparkles-second-color': colors().second,
      }}
    >
      <span class="relative inline-block">
        <For each={sparkles()}>{sparkle => <Sparkle {...sparkle} />}</For>
        <strong>{own.children}</strong>
      </span>
    </div>
  )
}

export default SparklesText
