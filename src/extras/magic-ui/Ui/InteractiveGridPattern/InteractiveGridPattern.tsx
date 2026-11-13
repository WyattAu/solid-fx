// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/interactive-grid-pattern.tsx@2712647e193295d2fd85b65e58095fb2009736d7. License: MIT.
import { createMemo, createSignal, splitProps, For } from 'solid-js'
import type { JSX } from 'solid-js'

/**
 * InteractiveGridPattern Component Props
 *
 * @param {number} [width=40] - The width of each square
 * @param {number} [height=40] - The height of each square
 * @param {[number, number]} [squares=[24, 24]] - [horizontal, vertical] square counts
 * @param {string} [className] - The class of the grid
 * @param {string} [squaresClassName] - The class of the squares
 */
interface InteractiveGridPatternProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  width?: number
  height?: number
  squares?: [number, number] // [horizontal, vertical]
  className?: string
  squaresClassName?: string
}

/**
 * The InteractiveGridPattern component.
 *
 * Renders a grid pattern whose squares light up under the pointer.
 *
 * PORT-NOTE: upstream extends React.SVGProps with `[key: string]: unknown`
 * (a React spread-typing crutch); the Solid port spreads via `splitProps`
 * and needs no index signature.
 */
export function InteractiveGridPattern(props: InteractiveGridPatternProps) {
  const [own, rest] = splitProps(props, [
    'width',
    'height',
    'squares',
    'class',
    'className',
    'squaresClassName',
  ])

  const width = () => own.width ?? 40
  const height = () => own.height ?? 40
  const squares = () => own.squares ?? ([24, 24] as [number, number])
  const horizontal = () => squares()[0]
  const vertical = () => squares()[1]

  const [hoveredSquare, setHoveredSquare] = createSignal<number | null>(null)

  // Upstream: Array.from({ length: horizontal * vertical }).map((_, index) => ...)
  const indices = createMemo(() =>
    Array.from({ length: horizontal() * vertical() }, (_, index) => index),
  )

  return (
    <svg
      width={width() * horizontal()}
      height={height() * vertical()}
      class={`absolute inset-0 h-full w-full border border-gray-400/30 ${own.class ?? ''} ${own.className ?? ''}`}
      {...rest}
    >
      <For each={indices()}>
        {index => {
          const x = (index % horizontal()) * width()
          const y = Math.floor(index / horizontal()) * height()
          return (
            <rect
              x={x}
              y={y}
              width={width()}
              height={height()}
              class={`stroke-gray-400/30 transition-all duration-100 ease-in-out not-[&:hover]:duration-1000 ${
                hoveredSquare() === index ? 'fill-gray-300/30' : 'fill-transparent'
              } ${own.squaresClassName ?? ''}`}
              onMouseEnter={() => setHoveredSquare(index)}
              onMouseLeave={() => setHoveredSquare(null)}
            />
          )
        }}
      </For>
    </svg>
  )
}

export default InteractiveGridPattern
