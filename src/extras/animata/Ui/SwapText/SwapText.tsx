// Source: github.com/codse/animata animata/text/swap-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream `ease-slow` is a Tailwind theme token over --ease-slow
// (styles/globals.css); a token class can't resolve under this repo's Tailwind
// setup, so it ships as a plain rule in an inline <style> (same approach as the
// GlowingCard port). `text-foreground` is an upstream shadcn token — replaced
// with a near-black inline color default the caller can override via `style`
// (same approach as the ZigZag port). cn() merges become template joins +
// classList; the arbitrary-div-props spread is dropped for explicit props
// (like the ZigZag port).
import { createSignal, Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

interface SwapTextProps {
  /**
   * The initial text to display.
   */
  initialText: string

  /**
   * The final text to display.
   */
  finalText: string

  /**
   * Whether the component should toggle on hover as well as click.
   * @default true
   */
  supportsHover?: boolean

  /**
   * The class name for the text.
   */
  textClassName?: string

  /**
   * The class name for the initial text.
   */
  initialTextClassName?: string

  /**
   * The class name for the final text.
   */
  finalTextClassName?: string

  /**
   * Whether to disable the click interaction.
   */
  disableClick?: boolean

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

const swapTextStyles = `
  /* PORT-NOTE: upstream --ease-slow theme token (styles/globals.css) */
  .ease-slow {
    transition-timing-function: cubic-bezier(0.405, 0, 0.025, 1);
  }
`

export default function SwapText(props: SwapTextProps) {
  const [own, rest] = splitProps(props, [
    'initialText',
    'finalText',
    'supportsHover',
    'textClassName',
    'initialTextClassName',
    'finalTextClassName',
    'disableClick',
    'children',
    'class',
    'className',
    'style',
  ])

  const [active, setActive] = createSignal(false)
  const common = 'block transition-transform duration-1000 ease-slow'

  const longWord = () => (own.finalText.length > own.initialText.length ? own.finalText : null)

  return (
    <div
      {...rest}
      style={{ color: '#0a0a0a', ...(own.style ?? {}) }}
      class={`relative overflow-hidden ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <style>{swapTextStyles}</style>
      <button
        type="button"
        disabled={own.disableClick}
        class={`group/swap w-full cursor-pointer select-none border-0 bg-transparent p-0 text-left text-3xl font-bold text-inherit ${own.textClassName ?? ''}`}
        onClick={() => !own.disableClick && setActive(current => !current)}
      >
        <span
          class={`${common} flex flex-col ${own.initialTextClassName ?? ''}`}
          classList={{
            '-translate-y-full': active(),
            'group-hover/swap:-translate-y-full': own.supportsHover ?? true,
          }}
        >
          {own.initialText}
          {/* Trick to make sure it can always fit all available words after
              transition as the second word is set to absolute */}
          <Show when={longWord()}>{word => <span class="invisible h-0">{word()}</span>}</Show>
        </span>
        <span
          class={`${common} absolute top-full ${own.finalTextClassName ?? ''}`}
          classList={{
            '-translate-y-full': active(),
            'group-hover/swap:-translate-y-full': own.supportsHover ?? true,
          }}
        >
          {own.finalText}
        </span>
      </button>
      {own.children}
    </div>
  )
}
