// solid-fx Instruments widget — original component (not a port).
// Continued-fraction rational stepper: shows the nearest low-denominator
// rational neighbors (Farey convergents) of any value and snaps to them in
// one click (research 02 #105). Gear ratios, sample strides, aspect ratios.
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface SternBrocotStepperProps {
  /** Initial value (default 3.14159 — the canonical demo). */
  value?: number
  /** Maximum denominator considered for snaps (default 64). */
  maxDenominator?: number
  /** Fine value buttons step (default 0.01). */
  step?: number
  label?: string
  /** Fired on any value change. */
  onInput?: (value: number) => void
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

/** Continued-fraction convergents of x with denominator ≤ maxDen. */
function convergents(x: number, maxDen: number): Array<{ p: number; q: number }> {
  const out: Array<{ p: number; q: number }> = []
  let h0 = 0
  let h1 = 1
  let k0 = 1
  let k1 = 0
  let rest = x
  for (let i = 0; i < 24; i++) {
    const a = Math.floor(rest)
    const h2 = a * h1 + h0
    const k2 = a * k1 + k0
    if (k2 > maxDen) break
    h0 = h1
    h1 = h2
    k0 = k1
    k1 = k2
    out.push({ p: h2, q: k2 })
    const frac = rest - a
    if (frac < 1e-12) break
    rest = 1 / frac
  }
  return out
}

export function SternBrocotStepper(props: SternBrocotStepperProps) {
  const [own, rest] = splitProps(props, [
    'value',
    'maxDenominator',
    'step',
    'label',
    'onInput',
    'class',
    'className',
    'style',
  ])

  const maxDen = () => own.maxDenominator ?? 64
  const step = () => own.step ?? 0.01

  let value = own.value ?? Math.PI
  const [display, setDisplay] = createSignal(value)

  const set = (v: number) => {
    value = v
    setDisplay(v)
    own.onInput?.(v)
  }

  const neighbors = () => {
    const convs = convergents(value, maxDen())
    if (convs.length === 0) return []
    // the two convergents bracketing the value most tightly
    return convs.slice(-3)
  }

  const errorOf = (p: number, q: number) => value - p / q

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'value'}</span>
        <span class="flex items-center gap-1">
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="decrease"
            onClick={() => set(value - step())}
          >
            −
          </button>
          <span class="w-24 text-center font-mono text-sky-300" aria-live="polite">
            {display().toFixed(6)}
          </span>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="increase"
            onClick={() => set(value + step())}
          >
            +
          </button>
        </span>
      </div>
      <div class="mt-1.5 space-y-1">
        {neighbors().map(c => {
          const err = errorOf(c.p, c.q)
          return (
            <button
              type="button"
              class="flex w-full items-baseline justify-between rounded border border-gray-800 bg-gray-900 px-2 py-1 text-left font-mono text-[11px] outline-none hover:border-sky-700 hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-sky-400"
              onClick={() => set(c.p / c.q)}
              title={`snap to ${c.p}/${c.q}`}
            >
              <span class="text-gray-300">
                {c.p}/{c.q} = {(c.p / c.q).toFixed(6)}
              </span>
              <span class={Math.abs(err) < 1e-9 ? 'text-emerald-400' : 'text-gray-500'}>
                {err >= 0 ? '+' : ''}
                {err.toExponential(2)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SternBrocotStepper
