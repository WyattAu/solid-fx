// Source: github.com/codse/animata animata/background/zigzag.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this port
// template-joins, equivalent for the plain strings passed here. `bg-background` is
// an upstream shadcn theme token — replaced with a white background-color default
// the caller can override via `style` (same approach as the Dot port).
import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

interface ZigZagProps {
  /**
   * Color of the pattern
   */
  color?: string

  /**
   * Size of the pattern in pixels
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

function Placeholder() {
  return (
    <div class="flex h-full min-h-64 w-full min-w-72 items-center justify-center">
      {/* PORT-NOTE: upstream uses the shadcn tokens bg-foreground/text-background, which
          don't exist in this repo's Tailwind setup; neutral palette keeps the same look. */}
      <div class="rounded bg-neutral-200 px-4 py-2 text-neutral-900">
        This has zigzag background
      </div>
    </div>
  )
}

export default function ZigZag(props: ZigZagProps) {
  const [own, rest] = splitProps(props, [
    'color',
    'size',
    'children',
    'class',
    'className',
    'style',
  ])

  const color = () => own.color ?? '#cacaca'
  const size = () => own.size ?? 10

  return (
    <div
      {...rest}
      style={{
        ...(own.style ?? { 'background-color': 'white' }),
        background: `linear-gradient(135deg, ${color()} 25%, transparent 25%) -${size()}px 0,
        linear-gradient(225deg, ${color()} 25%, transparent 25%) -${size()}px 0,
        linear-gradient(315deg, ${color()} 25%, transparent 25%),
        linear-gradient(45deg, ${color()} 25%, transparent 25%)`,
        'background-size': `calc(2 * ${size()}px) calc(2 * ${size()}px)`,
      }}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children ?? <Placeholder />}
    </div>
  )
}
