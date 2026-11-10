// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/orbiting-circles.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { children, splitProps, Show, Index } from 'solid-js'
import type { JSX, Accessor } from 'solid-js'

export interface OrbitingCirclesProps extends JSX.HTMLAttributes<HTMLDivElement> {
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  children?: JSX.Element
  reverse?: boolean
  duration?: number
  delay?: number
  radius?: number
  path?: boolean
  iconSize?: number
  speed?: number
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-orbit: orbit calc(var(--duration) * 1s) linear infinite`) plus
// the `orbit` keyframes in the registry globals.css. They are embedded here so
// the port is self-contained without touching the site's Tailwind theme (same
// approach as Meteors).
const STYLE = `
@keyframes orbit {
  0% {
    transform: rotate(calc(var(--angle) * 1deg))
      translateY(calc(var(--radius) * 1px)) rotate(calc(var(--angle) * -1deg));
  }
  100% {
    transform: rotate(calc(var(--angle) * 1deg + 360deg))
      translateY(calc(var(--radius) * 1px))
      rotate(calc((var(--angle) * -1deg) - 360deg));
  }
}
.animate-orbit {
  animation: orbit calc(var(--duration) * 1s) linear infinite;
}
`

type OrbitStyle = JSX.CSSProperties & {
  '--duration': string
  '--radius': string
  '--angle': string
  '--icon-size': string
}

export function OrbitingCircles(props: OrbitingCirclesProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'reverse',
    'duration',
    'radius',
    'path',
    'iconSize',
    'speed',
    'class',
    'className',
  ])

  const duration = () => own.duration ?? 20
  const radius = () => own.radius ?? 160
  const path = () => own.path ?? true
  const iconSize = () => own.iconSize ?? 30
  const speed = () => own.speed ?? 1

  const calculatedDuration = () => duration() / speed()

  // Upstream walks React.Children; `children()` resolves the Solid JSX
  // children into a plain array so each child can be wrapped and indexed.
  const resolved = children(() => own.children) as Accessor<JSX.Element[]>

  return (
    <>
      <style>{STYLE}</style>
      <Show when={path()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          class="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            class="stroke-black/10 stroke-1 dark:stroke-white/10"
            cx="50%"
            cy="50%"
            r={radius()}
            fill="none"
          />
        </svg>
      </Show>
      <Index each={resolved()}>
        {(child, index) => {
          const angle = (360 / resolved().length) * index
          return (
            <div
              style={
                {
                  '--duration': `${calculatedDuration()}`,
                  '--radius': `${radius()}`,
                  '--angle': `${angle}`,
                  '--icon-size': `${iconSize()}px`,
                } as OrbitStyle
              }
              class={`animate-orbit absolute flex size-(--icon-size) transform-gpu items-center justify-center rounded-full ${own.class ?? ''} ${own.className ?? ''}`}
              classList={{ '[animation-direction:reverse]': own.reverse ?? false }}
              {...rest}
            >
              {child()}
            </div>
          )
        }}
      </Index>
    </>
  )
}

export default OrbitingCircles
