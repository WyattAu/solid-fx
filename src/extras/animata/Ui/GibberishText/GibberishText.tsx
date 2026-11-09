// Source: github.com/codse/animata animata/text/gibberish-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { createEffect, createSignal, For, onCleanup } from 'solid-js'

interface GibberishTextProps {
  /**
   * The text to animate.
   */
  text: string

  /**
   * The class name to apply to each letter.
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this port
// template-joins, equivalent for the plain strings passed here. `text-foreground` is
// an upstream shadcn theme token — a no-op class in this repo's Tailwind setup (callers
// set the color via the wrapper).
const Letter = (props: { letter: string; class?: string; className?: string }) => {
  const [code, setCode] = createSignal(props.letter.toUpperCase().charCodeAt(0))

  // React: useEffect(fn, [letter]) — restarts the scramble whenever the letter changes.
  createEffect(() => {
    const letter = props.letter
    let count = Math.floor(Math.random() * 10) + 5
    const interval = setInterval(() => {
      setCode(() => Math.floor(Math.random() * 26) + 65)
      count--
      if (count === 0) {
        setCode(letter.toUpperCase().charCodeAt(0))
        clearInterval(interval)
      }
    }, 24)
    onCleanup(() => clearInterval(interval))
  })

  return (
    <span
      class={`inline-block min-w-[1ch] font-mono text-center text-foreground ${props.class ?? ''} ${props.className ?? ''}`}
    >
      {String.fromCharCode(code()) === ' ' ? '\u00A0' : String.fromCharCode(code())}
    </span>
  )
}

export default function GibberishText(props: GibberishTextProps) {
  return (
    <For each={props.text.split('')}>
      {letter => <Letter letter={letter} class={props.class} className={props.className} />}
    </For>
  )
}
