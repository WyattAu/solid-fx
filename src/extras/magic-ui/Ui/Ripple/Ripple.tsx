// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/ripple.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
import { splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'

interface RippleProps extends JSX.HTMLAttributes<HTMLDivElement> {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-ripple: ripple var(--duration, 2s) ease calc(var(--i, 0) * 0.2s)
// infinite`) plus the `ripple` keyframes in apps/www/styles/globals.css. They
// are embedded here so the port is self-contained without touching the site's
// Tailwind theme (same approach as Meteors). The per-circle inline
// `animation-delay` still wins over the shorthand's `--i`-derived delay, as
// upstream.
const STYLE = `
@keyframes ripple {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(0.9); }
}
.animate-ripple {
  animation: ripple var(--duration, 2s) ease calc(var(--i, 0) * 0.2s) infinite;
}
`

type RippleStyle = JSX.CSSProperties & { '--i': number }

export const Ripple = (props: RippleProps) => {
  const [own, rest] = splitProps(props, [
    'mainCircleSize',
    'mainCircleOpacity',
    'numCircles',
    'class',
    'className',
  ])

  const mainCircleSize = () => own.mainCircleSize ?? 210
  const mainCircleOpacity = () => own.mainCircleOpacity ?? 0.24
  const numCircles = () => own.numCircles ?? 8

  // Upstream: `Array.from({ length: numCircles }, ...)` rendering sized
  // circles. Solid: `<For>` over the same computed styles.
  // PORT-NOTE: hyphenated CSS property keys (Solid style objects).
  const circles = (): RippleStyle[] =>
    Array.from({ length: numCircles() }, (_, i) => {
      const size = mainCircleSize() + i * 70
      const opacity = mainCircleOpacity() - i * 0.03
      const animationDelay = `${i * 0.06}s`
      const borderStyle = 'solid'

      return {
        '--i': i,
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        'animation-delay': animationDelay,
        'border-style': borderStyle,
        'border-width': '1px',
        'border-color': 'var(--foreground)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
      }
    })

  return (
    <>
      <style>{STYLE}</style>
      <div
        {...rest}
        class={`pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,white,transparent)] select-none ${own.class ?? ''} ${own.className ?? ''}`}
      >
        <For each={circles()}>
          {style => (
            <div
              class="animate-ripple bg-foreground/25 absolute rounded-full border shadow-xl"
              style={style}
            />
          )}
        </For>
      </div>
    </>
  )
}

export default Ripple
