// Source: github.com/codse/animata animata/background/moving-gradient.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream registers `bg-position` as a Tailwind theme token
// (--animate-bg-position in styles/globals.css); this port ships the keyframes
// and the animate-bg-position utility in an inline <style> so the component is
// self-contained under this repo's Tailwind setup. Upstream merges classes with
// cn() (clsx + tailwind-merge); this port template-joins, equivalent for the
// plain strings passed here. The `bg-size` class upstream also passes is inert
// there too (no matching utility or theme token in their setup) — kept verbatim.

import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface MovingGradientProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * Animate the gradient.
   */
  animated?: boolean

  /**
   * Additional classes for the gradient layer.
   */
  gradientClassName?: string

  /** React parity alias; merges with `class`. */
  className?: string
}

const gradientStyles = `
@keyframes bg-position {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
.animate-bg-position { animation: bg-position 3s infinite alternate; }
`

export default function MovingGradient(props: MovingGradientProps) {
  const [own, rest] = splitProps(props, [
    'animated',
    'gradientClassName',
    'children',
    'class',
    'className',
  ])

  const animated = () => own.animated ?? true
  const backgroundClassName = 'pointer-events-none absolute h-full w-full'

  return (
    <div
      {...rest}
      class={`relative overflow-hidden bg-white ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <style>{gradientStyles}</style>
      <div
        class={`bg-size bg-linear-to-r from-yellow-500 from-30% via-yellow-700 via-50% to-pink-500 to-80% opacity-15 ${backgroundClassName} ${
          animated() ? 'animate-bg-position bg-[length:300%_auto]' : ''
        } ${own.gradientClassName ?? ''}`}
      />
      <div class={`${backgroundClassName} z-1 blur-lg`} />
      {own.children}
    </div>
  )
}
