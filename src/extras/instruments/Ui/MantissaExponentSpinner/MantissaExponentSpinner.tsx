// solid-fx Instruments widget — original component (not a port).
// Mantissa-exponent split spinner: spans 1e-18 … 1e+18 without typing `e-12`.
// The left wheel scrubs the normalized mantissa; the right pill steps the
// base-10 exponent (or engineering 10^3k when `engineering` is set).
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface MantissaExponentSpinnerProps {
  /** Initial value; decomposed into mantissa ∈ [1,10) and exponent. */
  value?: number
  /** Exponent floor (default −18). */
  minExponent?: number
  /** Exponent ceiling (default 18). */
  maxExponent?: number
  /** Snap the exponent to multiples of 3 (engineering notation); mantissa then spans [1,1000). */
  engineering?: boolean
  /** Exponent step per click (default 1, or 3 in engineering mode). */
  exponentStep?: number
  label?: string
  /** Fired with the composed value after any change. */
  onChange?: (value: number) => void
  /** Solid class alias, merged alongside `className`. */
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const decompose = (v: number, engineering: boolean): { m: number; e: number } => {
  if (!Number.isFinite(v) || v === 0) return { m: 1, e: 0 }
  const e = Math.floor(Math.log10(Math.abs(v)))
  const mRaw = v / 10 ** e
  if (!engineering) return { m: mRaw, e }
  // engineering: exponent multiple of 3, mantissa in [1, 1000)
  const e3 = Math.floor(e / 3) * 3
  return { m: v / 10 ** e3, e: e3 }
}

export function MantissaExponentSpinner(props: MantissaExponentSpinnerProps) {
  const [own, rest] = splitProps(props, [
    'value',
    'minExponent',
    'maxExponent',
    'engineering',
    'exponentStep',
    'label',
    'onChange',
    'class',
    'className',
    'style',
  ])

  const engineering = () => own.engineering ?? false
  const minExp = () => own.minExponent ?? -18
  const maxExp = () => own.maxExponent ?? 18
  const expStep = () => own.exponentStep ?? (engineering() ? 3 : 1)

  const initial = decompose(own.value ?? 1, engineering())
  const [mantissa, setMantissa] = createSignal(initial.m)
  const [exponent, setExponent] = createSignal(initial.e)

  const compose = () => {
    const v = mantissa() * 10 ** exponent()
    return Number.parseFloat(v.toPrecision(12))
  }

  const emit = () => own.onChange?.(compose())

  const clampExponent = (e: number) => Math.min(maxExp(), Math.max(minExp(), e))

  // Mantissa drag: 100 px of vertical travel = one decade, the caliper idiom.
  let wheel!: HTMLDivElement
  const [dragging, setDragging] = createSignal(false)
  let lastY = 0

  const renormalize = (m: number, e: number) => {
    // keep mantissa inside its register, borrowing across the exponent
    let mm = m
    let ee = e
    while (mm >= 10) {
      mm /= 10
      ee += 1
    }
    while (mm < 1) {
      mm *= 10
      ee -= 1
    }
    return { m: mm, e: clampExponent(ee) }
  }

  const setPair = (m: number, e: number) => {
    const next = renormalize(m, e)
    setMantissa(next.m)
    setExponent(next.e)
    emit()
  }

  const onWheelPointerDown = (event: PointerEvent) => {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    setDragging(true)
    lastY = event.clientY
  }

  const onWheelPointerMove = (event: PointerEvent) => {
    if (!dragging()) return
    const dy = event.clientY - lastY
    lastY = event.clientY
    setPair(mantissa() - dy * 0.01, exponent())
  }

  const onWheelPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  const onWheelKeyDown = (event: KeyboardEvent) => {
    let next: number | null = null
    if (event.key === 'ArrowUp') next = mantissa() + 0.01
    if (event.key === 'ArrowDown') next = mantissa() - 0.01
    if (event.key === 'PageUp') next = Math.floor(mantissa()) + 1
    if (event.key === 'PageDown') next = Math.max(0.01, mantissa() - 1)
    if (next === null) return
    event.preventDefault()
    setPair(next, exponent())
  }

  const stepExponent = (dir: 1 | -1) =>
    setPair(mantissa(), clampExponent(exponent() + dir * expStep()))

  const mantissaDisplay = () => {
    const digits = engineering() ? 3 : 2
    return mantissa().toFixed(digits)
  }

  return (
    <div
      {...rest}
      class={`inline-flex select-none items-stretch ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {own.label !== undefined && (
        <span class="mr-2 self-center text-xs text-gray-400">{own.label}</span>
      )}
      {/* mantissa wheel */}
      {/* biome-ignore lint/a11y/useFocusableInteractive: custom wheel —
          arrow/PageUp/PageDown handling in onWheelKeyDown */}
      <div
        ref={wheel}
        role="slider"
        tabindex={0}
        aria-label={`${own.label ?? 'value'} mantissa`}
        aria-valuemin={1}
        aria-valuemax={engineering() ? 1000 : 10}
        aria-valuenow={mantissa()}
        class={`flex h-10 min-w-[4.5rem] cursor-ns-resize items-center justify-center rounded-l-md bg-gray-800 font-mono text-sm text-sky-300 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          dragging() ? 'bg-gray-700' : ''
        }`}
        title="drag vertically to scrub"
        onPointerDown={onWheelPointerDown}
        onPointerMove={onWheelPointerMove}
        onPointerUp={onWheelPointerUp}
        onKeyDown={onWheelKeyDown}
      >
        {mantissaDisplay()}
      </div>
      <span class="flex items-center bg-gray-800 px-1.5 font-mono text-xs text-gray-500">×10</span>
      {/* exponent pill */}
      <div class="flex items-center rounded-r-md bg-gray-800 pr-1 font-mono text-sm text-amber-300">
        <button
          type="button"
          aria-label="decrease exponent"
          class="h-10 w-6 rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          onClick={() => stepExponent(-1)}
        >
          −
        </button>
        <span class="w-10 text-center" aria-live="polite">
          {exponent() >= 0 ? '+' : ''}
          {exponent()}
        </span>
        <button
          type="button"
          aria-label="increase exponent"
          class="h-10 w-6 rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          onClick={() => stepExponent(1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default MantissaExponentSpinner
