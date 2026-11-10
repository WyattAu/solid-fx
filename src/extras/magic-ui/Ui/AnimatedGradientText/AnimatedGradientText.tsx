// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-gradient-text.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface AnimatedGradientTextProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  className?: string
  speed?: number
  colorFrom?: string
  colorTo?: string
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-gradient: gradient 8s linear infinite`) plus the `gradient`
// keyframes in the registry globals.css. They are embedded here so the port is
// self-contained without touching the site's Tailwind theme (same approach as
// Meteors).
const STYLE = `
@keyframes gradient {
  to {
    background-position: var(--bg-size, 300%) 0;
  }
}
.animate-gradient {
  animation: gradient 8s linear infinite;
}
`

export function AnimatedGradientText(props: AnimatedGradientTextProps) {
  const [own, rest] = splitProps(props, ['speed', 'colorFrom', 'colorTo', 'class', 'className'])

  const speed = () => own.speed ?? 1
  const colorFrom = () => own.colorFrom ?? '#ffaa40'
  const colorTo = () => own.colorTo ?? '#9c40ff'

  return (
    <>
      <style>{STYLE}</style>
      <span
        style={{
          '--bg-size': `${speed() * 300}%`,
          '--color-from': colorFrom(),
          '--color-to': colorTo(),
        }}
        class={`animate-gradient inline bg-linear-to-r from-(--color-from) via-(--color-to) to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent ${own.class ?? ''} ${own.className ?? ''}`}
        {...rest}
      >
        {props.children}
      </span>
    </>
  )
}

export default AnimatedGradientText
