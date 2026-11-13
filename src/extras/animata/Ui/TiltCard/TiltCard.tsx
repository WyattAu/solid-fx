// Source: github.com/codse/animata animata/card/tilted-card.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn(); this port template-joins
// `class`/`className` (React parity alias), equivalent for the plain strings
// passed here. The `text-background` classes reference an upstream-site theme
// token — kept for parity; callers can override via the merged class.
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

interface TiltCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export default function TiltCard(props: TiltCardProps) {
  const [own, rest] = splitProps(props, ['title', 'class', 'className'])

  return (
    <div
      {...rest}
      class={`max-h-fit transform rounded-full border-2 border-gray-200 bg-gray-200 p-2 px-6 transition-all duration-500 ease-out hover:-rotate-2 hover:scale-110 hover:text-background hover:shadow-xl ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <span class="text-xl text-background">{own.title}</span>
    </div>
  )
}
