// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-shiny-text.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export interface AnimatedShinyTextProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  className?: string
  shimmerWidth?: number
}

// PORT-NOTE: upstream ships the animation through the Tailwind theme
// (`--animate-shiny-text: shiny-text 8s infinite`) plus the `shiny-text`
// keyframes in the registry globals.css. They are embedded here so the port is
// self-contained without touching the site's Tailwind theme (same approach as
// Meteors).
const STYLE = `
@keyframes shiny-text {
  0%, 90%, 100% {
    background-position: calc(-100% - var(--shiny-width)) 0;
  }
  30%, 60% {
    background-position: calc(100% + var(--shiny-width)) 0;
  }
}
.animate-shiny-text {
  animation: shiny-text 8s infinite;
}
`

export const AnimatedShinyText = (props: AnimatedShinyTextProps) => {
  const [own, rest] = splitProps(props, ['shimmerWidth', 'class', 'className'])

  const shimmerWidth = () => own.shimmerWidth ?? 100

  return (
    <>
      <style>{STYLE}</style>
      <span
        style={{
          '--shiny-width': `${shimmerWidth()}px`,
        }}
        class={`mx-auto max-w-md text-neutral-600/70 dark:text-neutral-400/70 animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite] bg-linear-to-r from-transparent via-black/80 via-50% to-transparent dark:via-white/80 ${own.class ?? ''} ${own.className ?? ''}`}
        {...rest}
      >
        {props.children}
      </span>
    </>
  )
}

export default AnimatedShinyText
