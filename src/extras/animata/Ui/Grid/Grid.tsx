// Source: github.com/codse/animata animata/background/grid.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

interface GridProps {
  /**
   * Color of the grid
   */
  color?: string

  /**
   * Size of the grid in pixels
   */
  size?: number

  /**
   * Content of the component
   */
  children?: JSX.Element

  /**
   * Class name
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string

  style?: JSX.CSSProperties
}

function Placeholder(props: { size: number }) {
  const widthSpread = 20
  const heightSpread = 10
  return (
    <div
      style={{
        // +1 to account for the border
        width: `${widthSpread * props.size + 1}px`,
        height: `${heightSpread * props.size + 1}px`,
      }}
      class="flex max-h-full max-w-full items-center justify-center"
    >
      {/* PORT-NOTE: upstream uses the shadcn tokens bg-foreground/text-background, which
          don't exist in this repo's Tailwind setup; neutral palette keeps the same look. */}
      <div class="rounded bg-neutral-200 px-4 py-2 text-neutral-900">This has grid background</div>
    </div>
  )
}

export default function Grid(props: GridProps) {
  const [own, rest] = splitProps(props, [
    'color',
    'size',
    'children',
    'class',
    'className',
    'style',
  ])

  const color = () => own.color ?? '#cacaca'
  const size = () => own.size ?? 20

  return (
    <div
      {...rest}
      style={{
        ...(own.style ?? { 'background-color': 'white' }),
        'background-image': `linear-gradient(${color()} 1px, transparent 1px), linear-gradient(to right, ${color()} 1px, transparent 1px)`,
        'background-size': `${size()}px ${size()}px`,
      }}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children ?? <Placeholder size={size()} />}
    </div>
  )
}
