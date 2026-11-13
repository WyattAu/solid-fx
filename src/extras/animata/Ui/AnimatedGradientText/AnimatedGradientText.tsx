// Source: github.com/codse/animata animata/text/animated-gradient-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream registers `bg-position` as a Tailwind theme token
// (--animate-bg-position in their globals.css); this port ships the keyframes
// and the animate-bg-position utility in an inline <style> so the component is
// self-contained under this repo's Tailwind setup (same treatment as
// MovingGradient). Upstream's `bg-size-[200%_auto]` has no matching utility in
// Tailwind v4.0 — kept verbatim plus the working equivalent
// `bg-[length:200%_auto]` so the sweep has room to travel. Upstream merges
// classes with cn() (clsx + tailwind-merge); this port template-joins,
// equivalent for the plain strings passed here.

import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface AnimatedGradientTextProps extends JSX.HTMLAttributes<HTMLDivElement> {
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

export default function AnimatedGradientText(props: AnimatedGradientTextProps) {
  const [own, rest] = splitProps(props, ['children', 'class', 'className'])

  return (
    <div
      {...rest}
      class={`bg-size animate-bg-position bg-linear-to-r from-yellow-500 from-30% via-yellow-700 via-50% to-pink-500 to-80% bg-size-[200%_auto] bg-[length:200%_auto] bg-clip-text text-transparent ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children}
    </div>
  )
}
