// Source: github.com/codse/animata animata/text/mirror-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this port
// template-joins, equivalent for the plain strings passed here. Upstream's custom
// `ease-slow` timing token is not defined in this repo's Tailwind setup —
// `ease-in-out` is the closest standard approximation. `text-foreground` is an
// upstream shadcn theme token — a no-op class here (callers set the color).
import { For } from 'solid-js'

interface MirrorTextProps {
  /**
   * The text to mirror.
   */
  text: string

  /**
   * Class applied to each text copy.
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string

  /**
   * The direction of the animation
   * @default "up"
   */
  direction?: 'up' | 'down' | 'left' | 'right'

  /**
   * Class applied to the outer container.
   */
  containerClassName?: string
}

const ROWS = [
  { clip: 'h-3 overflow-hidden', delay: 'delay-200' },
  { clip: 'h-3 overflow-hidden', delay: 'delay-100' },
  { clip: 'h-3 overflow-hidden', delay: 'delay-75' },
  { clip: '', delay: '' },
] as const

export default function MirrorText(props: MirrorTextProps) {
  const direction = () => props.direction ?? 'up'
  const animation = () => {
    switch (direction()) {
      case 'down':
        return 'group-hover/mirror:translate-y-4'
      case 'left':
        return 'group-hover/mirror:-translate-x-4'
      case 'right':
        return 'group-hover/mirror:translate-x-4'
      default:
        return 'group-hover/mirror:-translate-y-4'
    }
  }

  // PORT-NOTE: upstream renders one shared `content` element four times; in Solid a
  // JSX expression is a single DOM node, so each row renders a fresh copy instead.
  return (
    <div
      class={`group/mirror relative w-fit justify-end overflow-hidden p-6 text-foreground ${props.containerClassName ?? ''}`}
    >
      <For each={ROWS}>
        {row => (
          <div class={`${row.clip} ${row.delay} ${animation()}`}>
            <div
              class={`inline-block text-4xl font-light uppercase leading-none ${props.class ?? ''} ${props.className ?? ''}`}
            >
              {props.text ?? 'This is a text'}
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
