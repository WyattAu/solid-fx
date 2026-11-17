// solid-fx Instruments widget — original component (not a port).
// Harmonic basis mixer: faders for the first N sine partials wired to a live
// waveform thumbnail — hearing-shape control for tone/easing design
// (research 02 #108).
import type { JSX } from 'solid-js'
import { createSignal, For, splitProps } from 'solid-js'

export interface HarmonicMixerProps {
  /** Partial count (default 8). */
  partials?: number
  /** Initial amplitudes (default: 1/k sawtooth-ish rolloff). */
  amplitudes?: number[]
  /** Waveform width in px (default 320). */
  width?: number
  /** Waveform height in px (default 96). */
  height?: number
  label?: string
  /** Fired with the current amplitude vector on any change. */
  onChange?: (amplitudes: number[]) => void
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function HarmonicMixer(props: HarmonicMixerProps) {
  const [own, rest] = splitProps(props, [
    'partials',
    'amplitudes',
    'width',
    'height',
    'label',
    'onChange',
    'class',
    'className',
    'style',
  ])

  const n = () => own.partials ?? 8
  const width = () => own.width ?? 320
  const height = () => own.height ?? 96

  const initial = (): number[] => {
    if (own.amplitudes && own.amplitudes.length === n()) return own.amplitudes.slice()
    return Array.from({ length: n() }, (_, k) => 1 / (k + 1))
  }

  const [amps, setAmps] = createSignal<number[]>(initial())

  const setAmp = (k: number, v: number) => {
    setAmps(a => {
      const next = a.slice()
      next[k] = v
      own.onChange?.(next)
      return next
    })
  }

  const normalize = () => {
    const max = Math.max(...amps().map(Math.abs)) || 1
    setAmps(a => a.map(v => v / max))
    own.onChange?.(amps())
  }

  const samples = () => {
    const steps = 96
    const a = amps()
    return Array.from({ length: steps }, (_, i) => {
      const t = (i / (steps - 1)) * Math.PI * 2
      let acc = 0
      for (let k = 0; k < a.length; k++) acc += a[k] * Math.sin((k + 1) * t)
      return acc
    })
  }

  const peak = () => Math.max(...samples().map(Math.abs)) || 1

  const waveformPath = () => {
    const s = samples()
    const pk = peak()
    return s
      .map(
        (v, i) =>
          `${i === 0 ? 'M' : 'L'}${((i / (s.length - 1)) * width()).toFixed(1)},${(height() / 2 - (v / pk) * (height() / 2 - 4)).toFixed(1)}`,
      )
      .join(' ')
  }

  return (
    <div
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'harmonic mixer'}</span>
        <button
          type="button"
          class="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
          onClick={normalize}
        >
          normalize
        </button>
      </div>
      <svg
        width={width()}
        height={height()}
        viewBox={`0 0 ${width()} ${height()}`}
        role="img"
        aria-label={`mixed waveform of ${n()} partials`}
        class="rounded-md bg-gray-900"
      >
        <line
          x1="0"
          x2={width()}
          y1={height() / 2}
          y2={height() / 2}
          stroke="oklch(0.32 0.02 250)"
          stroke-width="1"
        />
        <path d={waveformPath()} fill="none" stroke="oklch(0.75 0.12 235)" stroke-width="1.5" />
      </svg>
      <div class="mt-2 flex items-end gap-1.5">
        <For each={amps()}>
          {(a, k) => (
            <label class="flex flex-col items-center gap-1">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={a}
                onInput={e => setAmp(k(), Number(e.currentTarget.value))}
                class="h-20 w-4 cursor-ns-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
                style={{ 'writing-mode': 'vertical-lr', direction: 'rtl' }}
                aria-label={`partial ${k() + 1} amplitude`}
              />
              <span class="font-mono text-[9px] text-gray-500">{k() + 1}</span>
            </label>
          )}
        </For>
      </div>
    </div>
  )
}

export default HarmonicMixer
