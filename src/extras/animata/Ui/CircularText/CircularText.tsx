// Source: github.com/codse/animata animata/text/circular-text.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import { createMemo, For } from 'solid-js'

interface CircularTextProps {
  /**
   * The text to arrange on the circle.
   */
  text: string

  /**
   * Seconds per full revolution.
   * @default 30
   */
  spinDuration?: number

  /**
   * Extra inward offset of the characters in pixels.
   * @default 5
   */
  radius?: number

  /**
   * Class name
   */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

// PORT-NOTE: upstream drives the rotation with motion/react (rotate 0→360, linear,
// repeat: Infinity). This port uses the Tailwind `animate-spin` keyframes (kept in
// the class list so the keyframes are emitted) with an inline animation shorthand
// override; changing `spinDuration` now retimes the loop live instead of restarting
// it from 0 (upstream remounts via key={spinDuration}) — visually equivalent. The
// upstream WebkitTransform duplicate is kept as `-webkit-transform`.
export default function CircularText(props: CircularTextProps) {
  const characters = createMemo(() => [...props.text])
  const spinDuration = () => props.spinDuration ?? 30
  const radius = () => props.radius ?? 5

  return (
    <div
      class={`relative mx-auto flex aspect-square h-48 origin-center cursor-pointer items-center justify-center rounded-full text-center font-bold text-foreground animate-spin ${props.class ?? ''} ${props.className ?? ''}`}
      style={{ animation: `spin ${spinDuration()}s linear infinite` }}
    >
      <For each={characters()}>
        {(char, index) => {
          const angle = (360 / characters().length) * index()
          const transform = `rotate(${angle}deg) translateY(-${radius()}px)`
          return (
            <span
              style={{ transform, '-webkit-transform': transform }}
              class="absolute inset-0 inline-block font-medium"
            >
              {char}
            </span>
          )
        }}
      </For>
    </div>
  )
}
