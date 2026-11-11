// Source: github.com/codse/animata animata/card/glowing-card.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream applies the glow via `hover:shadow-glow`, a Tailwind
// variant over the --shadow-glow theme token in styles/globals.css; a variant
// can't resolve for a hand-shipped class, so the :hover box-shadow rule is
// written out in the inline <style> instead (transition stays a Tailwind
// class). `blur-20` ships as a plain rule for the same reason. Upstream merges
// classes with cn(); this port template-joins, equivalent for the plain
// strings passed here.

import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface GlowCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * Starting gradient color.
   */
  fromColor?: string
  /**
   * Middle gradient color.
   */
  viaColor?: string
  /**
   * Ending gradient color.
   */
  toColor?: string

  /** React parity alias; merges with `class`. */
  className?: string
}

const glowStyles = `
.glow-card:hover {
  box-shadow: 0 0 20px rgba(255, 204, 112, 0.7), 0 0 40px rgba(200, 80, 192, 0.5),
    0 0 60px rgba(65, 88, 208, 0.3);
}
.blur-20 { filter: blur(20px); }
`

export default function GlowingCard(props: GlowCardProps) {
  const [own, rest] = splitProps(props, ['fromColor', 'viaColor', 'toColor', 'class', 'className'])

  const fromColor = () => own.fromColor ?? '#4158D0'
  const viaColor = () => own.viaColor ?? '#C850C0'
  const toColor = () => own.toColor ?? '#FFCC70'
  const gradient = () => `linear-gradient(to right, ${fromColor()}, ${viaColor()}, ${toColor()})`

  return (
    <div
      {...rest}
      style={{ 'background-image': gradient() }}
      class={`glow-card rounded-3xl p-0.5 transition-[box-shadow,filter] duration-500 ease-in-out hover:brightness-150 ${
        own.class ?? ''
      } ${own.className ?? ''}`}
    >
      <style>{glowStyles}</style>
      <div class="relative w-56 overflow-hidden rounded-[calc(1.5rem-2px)]">
        <div
          aria-hidden
          class="blur-20 pointer-events-none absolute inset-0 rounded-[calc(1.5rem-2px)] transition-[filter] duration-500 ease-in-out"
          style={{ 'background-image': gradient() }}
        />
        <div class="relative flex h-64 flex-col gap-2 bg-blue-950 p-4">
          <div class="mb-2 text-xl font-bold text-gray-50">Glowing</div>

          <div class="flex-1 text-sm font-medium text-gray-100/80">
            A glowing card is a card that glows.
          </div>
        </div>
      </div>
    </div>
  )
}
