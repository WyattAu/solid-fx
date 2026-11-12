// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/aurora-text.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
import { createMemo } from 'solid-js'
import type { JSX } from 'solid-js'

interface AuroraTextProps {
  children: JSX.Element
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  colors?: string[]
  speed?: number
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-aurora: aurora 8s ease-in-out infinite alternate`) plus the
// `aurora` keyframes in apps/www/styles/globals.css. They are embedded here
// so the port is self-contained without touching the site's Tailwind theme
// (same approach as Meteors).
const STYLE = `
@keyframes aurora {
  0% { background-position: 0% 50%; transform: rotate(-5deg) scale(0.9); }
  25% { background-position: 50% 100%; transform: rotate(5deg) scale(1.1); }
  50% { background-position: 100% 50%; transform: rotate(-3deg) scale(0.95); }
  75% { background-position: 50% 0%; transform: rotate(3deg) scale(1.05); }
  100% { background-position: 0% 50%; transform: rotate(-5deg) scale(0.9); }
}
.animate-aurora {
  animation: aurora 8s ease-in-out infinite alternate;
}
`

export const AuroraText = (props: AuroraTextProps) => {
  const colors = () => props.colors ?? ['#FF0080', '#7928CA', '#0070F3', '#38bdf8']
  const speed = () => props.speed ?? 1

  const gradientStyle = createMemo(
    (): JSX.CSSProperties => ({
      'background-image': `linear-gradient(135deg, ${colors().join(', ')}, ${colors()[0]})`,
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
      'animation-duration': `${10 / speed()}s`,
    }),
  )

  return (
    <>
      <style>{STYLE}</style>
      <span class={`relative inline-block ${props.class ?? ''} ${props.className ?? ''}`}>
        <span class="sr-only">{props.children}</span>
        <span
          class="animate-aurora relative bg-size-[200%_auto] bg-clip-text text-transparent"
          style={gradientStyle()}
          aria-hidden="true"
        >
          {props.children}
        </span>
      </span>
    </>
  )
}

export default AuroraText
