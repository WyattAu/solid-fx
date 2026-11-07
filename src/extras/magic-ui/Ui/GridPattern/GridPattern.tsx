// Source: github.com/magicuidesign/magic-ui apps/www/registry/magicui/grid-pattern.tsx@37ce829f18dd7d0a7219531a4249b664419933ea. License: MIT.
import { createUniqueId, splitProps, For, Show } from 'solid-js'
import type { JSX } from 'solid-js'

interface GridPatternProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  squares?: Array<[x: number, y: number]>
  strokeDasharray?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

/**
 * GridPattern Component
 *
 * An SVG-pattern based grid background. The pattern tiles through a
 * `<pattern>` def stretched over a full-bleed `<rect>`; `squares` optionally
 * highlights individual cells (pattern coordinates, zero-indexed).
 *
 * PORT-NOTE: upstream extends React.SVGProps with `[key: string]: unknown`
 * (a React spread-typing crutch); the Solid port spreads via `splitProps`
 * and needs no index signature.
 */
export function GridPattern(props: GridPatternProps) {
  const [own, rest] = splitProps(props, [
    'width',
    'height',
    'x',
    'y',
    'squares',
    'strokeDasharray',
    'class',
    'className',
  ])

  const width = () => own.width ?? 40
  const height = () => own.height ?? 40
  const x = () => own.x ?? -1
  const y = () => own.y ?? -1
  const strokeDasharray = () => own.strokeDasharray ?? '0'
  const squares = () => own.squares

  // Upstream: React's useId(); replaced with Solid's createUniqueId.
  const id = createUniqueId()

  return (
    <svg
      aria-hidden="true"
      class={`pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30 ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      <defs>
        <pattern
          id={id}
          width={width()}
          height={height()}
          patternUnits="userSpaceOnUse"
          x={x()}
          y={y()}
        >
          <path
            d={`M.5 ${height()}V.5H${width()}`}
            fill="none"
            stroke-dasharray={strokeDasharray()}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" stroke-width={0} fill={`url(#${id})`} />
      <Show when={squares()}>
        {sq => (
          <svg x={x()} y={y()} class="overflow-visible">
            <For each={sq()}>
              {([sx, sy]) => (
                <rect
                  stroke-width="0"
                  width={width() - 1}
                  height={height() - 1}
                  x={sx * width() + 1}
                  y={sy * height() + 1}
                />
              )}
            </For>
          </svg>
        )}
      </Show>
    </svg>
  )
}

export default GridPattern
