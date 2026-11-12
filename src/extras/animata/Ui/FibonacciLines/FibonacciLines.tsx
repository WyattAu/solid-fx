// Source: github.com/codse/animata animata/container/fibonacci-lines.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream `bg-foreground/10` is a shadcn theme token; this port
// uses bg-neutral-100/10, the dark-theme equivalent — upstream's dark mode
// renders the same near-white hairlines, matching this repo's dark demo stage.
// React auto-appends px to numeric marginTop; the px is written out explicitly
// here (Solid does not). cn() merges become template joins + classList.
import { For, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

interface FibonacciLinesProps {
  /**
   * Whether to reverse the direction of the lines
   */
  reverse?: boolean

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

export default function FibonacciLines(props: FibonacciLinesProps) {
  const [own, rest] = splitProps(props, ['reverse', 'children', 'class', 'className', 'style'])

  const reverse = () => own.reverse ?? false

  return (
    <div
      {...rest}
      class={`flex w-full ${own.class ?? ''} ${own.className ?? ''}`}
      classList={{
        'flex-col-reverse': reverse(),
        'flex-col': !reverse(),
      }}
      style={own.style}
    >
      <For each={Array.from({ length: 10 })}>
        {(_, i) => (
          <div
            style={{
              opacity: (i() + 1) * 0.1,
              'margin-top': `${fibonacci(i()) + 2}px`,
            }}
            class="w-full"
          >
            <div class="h-px w-full bg-neutral-100/10" />
          </div>
        )}
      </For>
      {own.children}
    </div>
  )
}
