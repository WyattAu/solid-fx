// Source: github.com/codse/animata animata/background/dot.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

interface DotProps {
  /**
   * Color of the dot
   */
  color?: string

  /**
   * Size of the dot in pixels
   */
  size?: number

  /**
   * Spacing between dots
   */
  spacing?: number

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
      <div class="rounded bg-neutral-200 px-4 py-2 text-neutral-900">This has dot background</div>
    </div>
  )
}

export default function Dot(props: DotProps) {
  const [own, rest] = splitProps(props, [
    'color',
    'size',
    'spacing',
    'children',
    'class',
    'className',
    'style',
  ])

  const color = () => own.color ?? '#cacaca'
  const size = () => own.size ?? 1
  const spacing = () => own.spacing ?? 10

  return (
    <div
      {...rest}
      style={{
        ...(own.style ?? { 'background-color': 'white' }),
        'background-image': `radial-gradient(${color()} ${size()}px, transparent ${size()}px)`,
        'background-size': `calc(${spacing()} * ${size()}px) calc(${spacing()} * ${size()}px)`,
      }}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children ?? <Placeholder />}
    </div>
  )
}
