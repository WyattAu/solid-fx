// Source: github.com/ibelick/motion-primitives components/core/sliding-number.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: react-use-measure maps to a per-digit ResizeObserver on the digit
// cell (the height it measures is identical to upstream's per-<Number>
// bounds). useSpring + useTransform map to a motionValue per digit with a
// spring animate() re-anchored on every value change and translateY derived in
// the change handler (AnimatedNumber precedent, PORTING.md §5). Upstream's
// layoutId shared-layout transition needs framer's layout engine and is
// dropped — the per-digit spring produces the identical visual roll; the
// useId it keyed on has no remaining role in the port. Digits render hidden
// until the first height measurement, matching upstream's conditional render.

import { Index, Show, createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls } from 'motion'

const SPRING = {
  stiffness: 280,
  damping: 18,
  mass: 0.3,
} as const

function Digit(props: { value: number; place: number }) {
  // Upstream: Math.floor(value / place) % 10, reactive on value/place.
  const valueRoundedToPlace = () => Math.floor(props.value / props.place) % 10

  // Upstream useSpring(motionValue(initial), TRANSITION).
  const animatedValue = motionValue(valueRoundedToPlace())
  const [placeValue, setPlaceValue] = createSignal(animatedValue.get())
  const [height, setHeight] = createSignal(0)

  let cell!: HTMLDivElement
  let controls: AnimationPlaybackControls | undefined

  // Upstream: useEffect(() => animatedValue.set(valueRoundedToPlace), [...]).
  createEffect(() => {
    const target = valueRoundedToPlace()
    controls?.stop()
    controls = animate(animatedValue, target, { type: 'spring', ...SPRING })
  })

  const changeOff = animatedValue.on('change', latest => setPlaceValue(latest))

  // react-use-measure equivalent: observe the digit cell (its height comes
  // from the invisible '0' placeholder, same value upstream measures).
  onMount(() => {
    const ro = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height)
    })
    ro.observe(cell)
    onCleanup(() => ro.disconnect())
  })

  onCleanup(() => {
    changeOff()
    controls?.stop()
  })

  // Upstream useTransform(mv, latest => ...) body, per digit index n.
  const yFor = (n: number) => {
    const h = height()
    if (!h) return 0
    const offset = (10 + n - placeValue()) % 10
    let memo = offset * h
    if (offset > 5) {
      memo -= 10 * h
    }
    return memo
  }

  return (
    <div
      ref={cell}
      class="relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums"
    >
      <div class="invisible">0</div>
      <Index each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}>
        {(number) => (
          <span
            class={`absolute inset-0 flex items-center justify-center ${height() ? '' : 'invisible'}`}
            style={{ transform: `translateY(${yFor(number())}px)` }}
          >
            {number()}
          </span>
        )}
      </Index>
    </div>
  )
}

export type SlidingNumberProps = {
  value: number
  padStart?: boolean
  decimalSeparator?: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function SlidingNumber(props: SlidingNumberProps) {
  const [own, rest] = splitProps(props, ['value', 'padStart', 'decimalSeparator', 'class', 'className'])

  const absValue = () => Math.abs(own.value)
  const parts = () => absValue().toString().split('.')
  const integerValue = () => parseInt(parts()[0], 10)
  const paddedInteger = () =>
    (own.padStart ?? false) && integerValue() < 10 ? `0${parts()[0]}` : parts()[0]
  const integerDigits = () => paddedInteger().split('')
  const decimalPart = () => parts()[1]

  return (
    <div
      {...(rest as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
      class={`flex items-center ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <Show when={own.value < 0}>-</Show>
      <Index each={integerDigits()}>
        {(_, index) => (
          <Digit
            value={integerValue()}
            place={Math.pow(10, integerDigits().length - index - 1)}
          />
        )}
      </Index>
      <Show when={decimalPart()}>
        <>
          <span>{own.decimalSeparator ?? '.'}</span>
          <Index each={decimalPart()!.split('')}>
            {(_, index) => (
              <Digit
                value={parseInt(decimalPart()!, 10)}
                place={Math.pow(10, decimalPart()!.length - index - 1)}
              />
            )}
          </Index>
        </>
      </Show>
    </div>
  )
}

export default SlidingNumber
