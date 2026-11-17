// solid-fx Instruments widget — original component (not a port).
// Vernier caliper input: a 1D track geared by perpendicular drag — moving
// along the track scrubs coarsely, pulling away from the track continuously
// downshifts the gear into 1e-4-scale micro-precision without releasing
// (research 04 #43). Sibling of MantissaExponentSpinner.
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface VernierCaliperProps {
  /** Current value (default 0). */
  value?: number
  /** Coarse travel: value change per full track sweep (default 10). */
  range?: number
  /** Fine gear: value change per pixel of perpendicular travel gain (default 0.0001). */
  fineStep?: number
  label?: string
  /** Fired continuously while dragging. */
  onInput?: (value: number) => void
  /** Fired on release. */
  onChange?: (value: number) => void
  /** Track width in px (default 320). */
  width?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function VernierCaliper(props: VernierCaliperProps) {
  const [own, rest] = splitProps(props, [
    'value',
    'range',
    'fineStep',
    'label',
    'onInput',
    'onChange',
    'width',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 320
  const range = () => own.range ?? 10
  const fineStep = () => own.fineStep ?? 0.0001

  let value = own.value ?? 0
  const [display, setDisplay] = createSignal(value)
  const [gear, setGear] = createSignal(1) // precision multiplier: 2^(perp/18)
  const [dragging, setDragging] = createSignal(false)
  let track!: HTMLDivElement
  let lastX = 0
  let lastY = 0
  let perpAccum = 0

  const commit = (fireChange = false) => {
    setDisplay(value)
    own.onInput?.(value)
    if (fireChange) own.onChange?.(value)
  }

  const clamp = (v: number) => Math.min(range() / 2, Math.max(-range() / 2, v))

  const onPointerDown = (event: PointerEvent) => {
    ;(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId)
    setDragging(true)
    lastX = event.clientX
    lastY = event.clientY
    perpAccum = 0
    setGear(1)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging()) return
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    // pulling DOWN from the track (positive dy) downshifts the gear into
    // micro-precision: each 18px doubles the resolution
    perpAccum = Math.max(0, perpAccum + dy)
    const gearNow = Math.min(64, 2 ** (perpAccum / 18))
    setGear(gearNow)
    value = clamp(value + dx * fineStep() * gearNow)
    commit()
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId)
    setDragging(false)
    own.onChange?.(value)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const gearNow = gear()
    if (event.key === 'ArrowLeft') value = clamp(value - fineStep() * gearNow * 10)
    if (event.key === 'ArrowRight') value = clamp(value + fineStep() * gearNow * 10)
    if (event.key === 'ArrowUp') setGear(g => Math.min(64, g * 2))
    if (event.key === 'ArrowDown') setGear(g => Math.max(1, g / 2))
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      commit(true)
    }
  }

  const decimals = () => (gear() > 32 ? 4 : gear() > 8 ? 3 : gear() > 2 ? 2 : 1)

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {/* biome-ignore lint/a11y/useFocusableInteractive: geared caliper —
          arrows scrub, up/down shifts the precision gear */}
      <div
        ref={track}
        class="relative h-10 rounded-md bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        style={{ width: `${width()}px` }}
        role="slider"
        tabindex={0}
        aria-label={own.label ?? 'vernier caliper'}
        aria-valuemin={-range() / 2}
        aria-valuemax={range() / 2}
        aria-valuenow={display()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* center zero mark */}
        <div class="absolute top-0 left-1/2 h-full w-px bg-gray-600" />
        {/* value grip */}
        <div
          class="absolute top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400"
          style={{ left: `${50 + (display() / range()) * 100}%` }}
        />
        {/* gear rail: visualizes the perpendicular sensitivity */}
        <div class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {[1, 2, 4, 8].map(g => (
            <div
              class={`h-3 w-1 rounded-full ${gear() >= g ? 'bg-sky-300' : 'bg-gray-600'}`}
              title={`${g}× precision`}
            />
          ))}
        </div>
      </div>
      <div class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'value'}</span>
        <span class="font-mono text-sky-300" aria-live="polite">
          {display().toFixed(decimals())}
          <span class="ml-1 text-gray-500">
            · gear {gear().toFixed(1)}× · pull down while dragging for micro-precision
          </span>
        </span>
      </div>
    </div>
  )
}

export default VernierCaliper
