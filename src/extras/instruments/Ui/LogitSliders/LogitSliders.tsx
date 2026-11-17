// solid-fx Instruments widget — original component (not a port).
// Logit-scale probability input: the slider travels on the log-odds axis
// ln(p/(1−p)), so the distance between 99% and 99.9% visually matches its
// +10 dB Bayesian evidence weight (research 02 #77).
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface LogitSlidersProps {
  /** Initial probability in (0, 1) (default 0.95). */
  value?: number
  /** Log-odds range in dB-like units: slider spans ±logitMax (default 6 ≈ p ∈ [0.25%, 99.75%]). */
  logitMax?: number
  label?: string
  onInput?: (probability: number) => void
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const sigmoid = (t: number) => 1 / (1 + Math.exp(-t))

export function LogitSliders(props: LogitSlidersProps) {
  const [own, rest] = splitProps(props, [
    'value',
    'logitMax',
    'label',
    'onInput',
    'class',
    'className',
    'style',
  ])

  const logitMax = () => own.logitMax ?? 6
  const initial = own.value ?? 0.95
  const [logit, setLogit] = createSignal(Math.log(initial / (1 - initial)))

  const prob = () => sigmoid(logit())
  const odds = () => Math.exp(logit())
  const evidenceDb = () => (logit() * 4.3429).toFixed(2) // ln × 10/ln(10)

  const set = (t: number) => {
    const clamped = Math.min(logitMax(), Math.max(-logitMax(), t))
    setLogit(clamped)
    own.onInput?.(prob())
  }

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'probability'}</span>
        <span class="font-mono" aria-live="polite">
          <span class="text-sky-300">{(prob() * 100).toFixed(4)}%</span>
          <span class="mx-1 text-gray-600">·</span>
          odds {odds() < 1000 ? odds().toFixed(1) : odds().toExponential(2)}
          <span class="mx-1 text-gray-600">·</span>
          {evidenceDb()} dB
        </span>
      </div>
      <input
        type="range"
        min={-logitMax()}
        max={logitMax()}
        step={0.01}
        value={logit()}
        onInput={e => set(Number(e.currentTarget.value))}
        class="h-1 w-full cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
        aria-label={own.label ?? 'probability (log-odds scale)'}
        aria-valuemin={-logitMax()}
        aria-valuemax={logitMax()}
        aria-valuenow={prob()}
        aria-valuetext={`${(prob() * 100).toFixed(3)} percent`}
      />
      <div class="mt-1 flex justify-between font-mono text-[9px] text-gray-500">
        <span>1:{Math.exp(logitMax()).toFixed(0)} against</span>
        <span>log-odds axis</span>
        <span>{Math.exp(logitMax()).toFixed(0)}:1 for</span>
      </div>
    </div>
  )
}

export default LogitSliders
