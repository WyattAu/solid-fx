// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/striped-pattern.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
import { createUniqueId, splitProps, Show } from 'solid-js'
import type { JSX } from 'solid-js'

interface StripedPatternProps extends Omit<JSX.SvgSVGAttributes<SVGSVGElement>, 'direction'> {
  direction?: 'left' | 'right'
  className?: string
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
}

export function StripedPattern(props: StripedPatternProps) {
  const [own, rest] = splitProps(props, ['direction', 'width', 'height', 'class', 'className'])

  const id = createUniqueId()
  const direction = () => own.direction ?? 'left'
  const w = () => Number(own.width ?? 10)
  const h = () => Number(own.height ?? 10)

  return (
    <svg
      aria-hidden="true"
      {...rest}
      xmlns="http://www.w3.org/2000/svg"
      class={`pointer-events-none absolute inset-0 z-10 h-full w-full stroke-[0.5] ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <defs>
        <pattern id={id} width={w()} height={h()} patternUnits="userSpaceOnUse">
          <Show
            when={direction() === 'left'}
            fallback={
              <>
                <line x1="0" y1="0" x2={w()} y2={h()} stroke="currentColor" />
                <line x1={-w()} y1="0" x2="0" y2={h()} stroke="currentColor" />
                <line x1={w()} y1="0" x2={w() * 2} y2={h()} stroke="currentColor" />
              </>
            }
          >
            <line x1="0" y1={h()} x2={w()} y2="0" stroke="currentColor" />
            <line x1={-w()} y1={h()} x2="0" y2="0" stroke="currentColor" />
            <line x1={w()} y1={h()} x2={w() * 2} y2="0" stroke="currentColor" />
          </Show>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export default StripedPattern
