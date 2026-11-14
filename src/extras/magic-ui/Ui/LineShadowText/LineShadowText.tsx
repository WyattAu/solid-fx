// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/line-shadow-text.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.
// Upstream styles/globals.css: --animate-line-shadow: line-shadow 15s linear
// infinite with @keyframes line-shadow { 0% { background-position: 0 0; }
// 100% { background-position: 100% -100%; } } — inlined here as a STYLE block
// (the site's Tailwind v4 entry does not carry the magicui theme variables).

import { Dynamic } from 'solid-js/web'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

const STYLE = `
@keyframes line-shadow {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 100% -100%;
  }
}

.animate-line-shadow {
  animation: line-shadow 15s linear infinite;
}
`

type MotionElementType =
  | 'article'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'li'
  | 'p'
  | 'section'
  | 'span'

export interface LineShadowTextProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'style'> {
  children: string
  shadowColor?: string
  as?: MotionElementType
  /** React parity alias; merges with `class`. */
  className?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  style?: JSX.CSSProperties
}

export function LineShadowText(props: LineShadowTextProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'shadowColor',
    'as',
    'class',
    'className',
    'style',
  ])

  const shadowColor = () => own.shadowColor ?? 'black'

  // Upstream renders the polymorphic `motion` component; motion is only used
  // as the element wrapper (the sweep is a CSS animation on the `::after`
  // pseudo-element), so a plain `Dynamic` element keeps identical behavior.
  const component = () => own.as ?? 'span'

  return (
    <>
      <style>{STYLE}</style>
      <Dynamic
        component={component()}
        {...rest}
        data-text={own.children}
        class={`relative z-0 inline-flex after:absolute after:top-[0.04em] after:left-[0.04em] after:content-[attr(data-text)] after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)] after:-z-10 after:bg-size-[0.06em_0.06em] after:bg-clip-text after:text-transparent after:animate-line-shadow ${own.class ?? ''} ${own.className ?? ''}`}
        style={{ '--shadow-color': shadowColor() } as JSX.CSSProperties}
      >
        {own.children}
      </Dynamic>
    </>
  )
}

export default LineShadowText
