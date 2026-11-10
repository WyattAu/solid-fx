// Source: github.com/codse/animata animata/text/wave-reveal.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream builds the node list with words.reduce(createAnimatedNodes)
// and renders {nodes}; this port renders nested <For> over the words and derives
// each word's running `offset` with a memo — same output, no eager JSX. The
// reveal/blur keyframes and the fill-mode-forwards utility live in upstream
// styles/globals.css; this port ships them in an inline <style> so the component
// is self-contained under this repo's Tailwind setup. cn() merges become
// template joins; upstream's unreachable `duration ?? 60` reduce fallback
// (default is "2000ms") is dropped.
import { createMemo, For, Show } from 'solid-js'

interface WaveRevealProps {
  /**
   * The text to animate
   */
  text: string

  /**
   * Additional classes for the container
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string

  /**
   * The direction of the animation
   * @default "down"
   */
  direction?: 'up' | 'down'

  /**
   * The mode of the animation
   * @default "letter"
   */
  mode?: 'letter' | 'word'

  /**
   * Duration of the animation
   * E.g. 2000ms
   */
  duration?: string

  /**
   * If true, the text will apply a blur effect as seen in WWDC.
   */
  blur?: boolean

  letterClassName?: string

  /**
   * Delay for each letter/word in ms
   */
  delay?: number
}

const createDelay = (args: { offset: number; delay: number; index: number }) => {
  return `${args.delay + (args.index + args.offset) * 50}ms`
}

const waveRevealStyles = `
@keyframes reveal-up {
  0% { opacity: 0; transform: translateY(80%); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes reveal-down {
  0% { opacity: 0; transform: translateY(-80%); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes content-blur {
  0% { filter: blur(0.3rem); }
  100% { filter: blur(0); }
}
.fill-mode-forwards { animation-fill-mode: forwards; }
`

export default function WaveReveal(props: WaveRevealProps) {
  const words = () => props.text.trim().split(/\s/)

  // React: the reduce carried `offset` (word.length + 1 per word in letter mode,
  // 1 per word in word mode) as it accumulated nodes.
  const offsets = createMemo(() => {
    let offset = 0
    return words().map(word => {
      const current = offset
      offset += props.mode === 'word' ? 1 : word.length + 1
      return current
    })
  })

  const duration = () => props.duration ?? '2000ms'
  const delay = () => props.delay ?? 0
  const blur = () => props.blur ?? true

  const animatedClass = () => {
    const isUp = props.direction === 'up'
    const animation =
      !isUp && !blur()
        ? 'animate-[reveal-down]'
        : isUp && !blur()
          ? 'animate-[reveal-up]'
          : !isUp && blur()
            ? 'animate-[reveal-down,content-blur]'
            : 'animate-[reveal-up,content-blur]'
    return `inline-block opacity-0 transition-opacity ease-in-out fill-mode-forwards ${animation} ${props.letterClassName ?? ''}`
  }

  return (
    <Show when={props.text}>
      <style>{waveRevealStyles}</style>
      <div
        class={`relative flex flex-wrap justify-center whitespace-pre px-2 text-4xl font-medium md:px-6 md:text-7xl ${props.class ?? ''} ${props.className ?? ''}`}
      >
        <For each={words()}>
          {(word, index) => {
            const isWordMode = () => props.mode === 'word'
            // React: `length` is the word count in word mode, the raw text
            // length in letter mode (upstream behavior, kept as-is).
            const isLast = () => index() === (isWordMode() ? words().length : props.text.length) - 1
            const offset = () => offsets()[index()]
            return (
              <span
                class={`contents ${isWordMode() ? animatedClass() : ''}`}
                style={
                  isWordMode()
                    ? {
                        'animation-duration': `${duration()}`,
                        'animation-delay': createDelay({
                          index: index(),
                          offset: offset(),
                          delay: delay(),
                        }),
                      }
                    : undefined
                }
              >
                <Show
                  when={isWordMode()}
                  fallback={
                    <For each={word.split('')}>
                      {(letter, letterIndex) => (
                        <span
                          class={animatedClass()}
                          style={{
                            'animation-duration': `${duration()}`,
                            'animation-delay': createDelay({
                              index: letterIndex(),
                              offset: offset(),
                              delay: delay(),
                            }),
                          }}
                        >
                          {letter === ' ' ? '\u00A0' : letter}
                        </span>
                      )}
                    </For>
                  }
                >
                  {word}
                </Show>
                {isLast() ? null : '\u00A0'}
              </span>
            )
          }}
        </For>
        <div class="sr-only">{props.text}</div>
      </div>
    </Show>
  )
}
