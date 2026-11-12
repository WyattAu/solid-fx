// Source: github.com/codse/animata animata/text/split-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream merges classes with cn() (clsx + tailwind-merge); this port
// template-joins, equivalent for the plain strings passed here, and the cn
// conditional object on each half becomes classList. The stale-hover timeout
// ref becomes a closure variable (a Solid component body runs once per
// instance), cleared on unmount per cleanup discipline. The offsetFrom helper
// is the reactive equivalent of upstream's `activeIndex !== undefined &&
// index === activeIndex ± N` narrowing, which accessors can't express inline.
import { createSignal, For, onCleanup } from 'solid-js'

interface SplitTextProps {
  /**
   * The text to split into individually animated halves
   */
  text: string

  /**
   * Class name for the container
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export default function SplitText(props: SplitTextProps) {
  const [activeIndex, setActiveIndex] = createSignal<number>()

  // PORT-NOTE: upstream stores the pending timeout in a useRef; a closure
  // variable is the direct translation.
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  const text = () => props.text ?? 'ANIMATA'
  const letters = () => text().split('')

  // Distance from the hovered letter, or undefined when nothing is hovered.
  const offsetFrom = (index: number) => {
    const active = activeIndex()
    return active === undefined ? undefined : index - active
  }

  const letterClassName =
    'inline h-1/2 select-none overflow-y-hidden leading-none transition-transform duration-300 ease-out whitespace-pre'

  return (
    <div
      class={`relative mx-auto text-4xl font-black uppercase text-yellow-500 md:text-5xl lg:text-9xl ${props.class ?? ''} ${props.className ?? ''}`}
    >
      {/* add hidden text so that we maintain the size for any text */}
      <div class="invisible leading-none">{text()}</div>
      <div class="absolute top-0 flex h-full">
        <For each={letters()}>
          {(letter, index) => (
            <div
              onMouseEnter={() => {
                if (timer !== undefined) {
                  clearTimeout(timer)
                }
                setActiveIndex(index())
              }}
              onMouseLeave={() => {
                timer = setTimeout(() => {
                  setActiveIndex(undefined)
                })
              }}
              class="relative inline-flex h-full flex-col leading-none"
              aria-hidden="true"
            >
              {/* top half */}
              <span
                class={letterClassName}
                classList={{
                  '-translate-y-5': offsetFrom(index()) === 0,
                  '-translate-y-3': offsetFrom(index()) === 1 || offsetFrom(index()) === -1,
                  '-translate-y-1': offsetFrom(index()) === 2 || offsetFrom(index()) === -2,
                }}
              >
                {letter}
              </span>

              {/* bottom half */}
              <span
                class={letterClassName}
                classList={{
                  'translate-y-5': offsetFrom(index()) === 0,
                  'translate-y-3': offsetFrom(index()) === 1 || offsetFrom(index()) === -1,
                  'translate-y-1': offsetFrom(index()) === 2 || offsetFrom(index()) === -2,
                }}
              >
                <span class="absolute -translate-y-1/2 leading-none">{letter}</span>
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
