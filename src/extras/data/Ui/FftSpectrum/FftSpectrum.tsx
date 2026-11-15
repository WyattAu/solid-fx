// solid-fx Data widget — original component (not a port).
// FFT spectrum bars: one-sided magnitude spectrum of a provided signal via
// the shared zero-Wasm kernel (Hann window + radix-2 Cooley-Tukey over
// Float64Arrays). Hover reads out bin frequency; the peak bin is labeled.
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, splitProps } from 'solid-js'
import { magnitudeSpectrum } from '@/lib/num'

export interface FftSpectrumProps {
  /** Time-domain samples (any length; zero-padded to a power of two). */
  signal: number[]
  /** Sample rate in Hz for frequency readouts (default 1 → bins are unitless). */
  sampleRate?: number
  /** Displayed bar count (default 48; bins are max-pooled into bars). */
  bars?: number
  /** dB display relative to the peak (default false → linear). */
  decibels?: boolean
  label?: string
  /** Accent color for the bars (default sky). */
  color?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function FftSpectrum(props: FftSpectrumProps) {
  const [own, rest] = splitProps(props, [
    'signal',
    'sampleRate',
    'bars',
    'decibels',
    'label',
    'color',
    'class',
    'className',
    'style',
  ])

  const sampleRate = () => own.sampleRate ?? 1
  const barCount = () => own.bars ?? 48
  const width = 320
  const height = () => 96

  // recomputed only when `signal` identity changes
  const spectrum = createMemo(() => {
    const { mags, n } = magnitudeSpectrum(own.signal)
    return { mags, n }
  })

  const binData = createMemo(() => {
    const { mags, n } = spectrum()
    const nb = barCount()
    const usable = Math.floor(mags.length / 2) // drop the Nyquist-adjacent tail
    const bins: Array<{ freq: number; mag: number }> = []
    for (let b = 0; b < nb; b++) {
      const lo = Math.floor((b * usable) / nb)
      const hi = Math.max(lo + 1, Math.floor(((b + 1) * usable) / nb))
      let peak = 0
      for (let k = lo; k < hi; k++) if (mags[k] > peak) peak = mags[k]
      bins.push({ freq: ((lo + hi) / 2) * (sampleRate() / n), mag: peak })
    }
    return bins
  })

  const peak = createMemo(() => Math.max(...binData().map(b => b.mag)) || 1)

  const barHeights = createMemo(() => {
    const pk = peak()
    return binData().map(b => {
      const v = own.decibels ? Math.max(0, 20 * Math.log10(b.mag / pk) + 60) / 60 : b.mag / pk
      return Math.max(1, v * (height() - 18))
    })
  })

  const [hoverBar, setHoverBar] = createSignal(-1)
  const fmtHz = (f: number) =>
    sampleRate() === 1
      ? `bin ${f.toFixed(2)}`
      : f >= 1000
        ? `${(f / 1000).toFixed(2)} kHz`
        : `${f.toFixed(0)} Hz`

  const peakFreq = createMemo(() => {
    const bins = binData()
    let best = 0
    let idx = 0
    for (let i = 0; i < bins.length; i++) {
      if (bins[i].mag > best) {
        best = bins[i].mag
        idx = i
      }
    }
    return bins[idx]?.freq ?? 0
  })

  const onPointerMove = (event: PointerEvent) => {
    const target = event.currentTarget as SVGSVGElement
    const rect = target.getBoundingClientRect()
    const frac = (event.clientX - rect.left) / rect.width
    setHoverBar(Math.min(barCount() - 1, Math.max(0, Math.floor(frac * barCount()))))
  }

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'spectrum'}</span>
        <span class="font-mono" aria-live="polite">
          {hoverBar() >= 0
            ? `${fmtHz(binData()[hoverBar()].freq)} · ${(100 * (binData()[hoverBar()].mag / peak())).toFixed(0)}%`
            : `peak ${fmtHz(peakFreq())}`}
        </span>
      </div>
      <svg
        width={width}
        height={height()}
        viewBox={`0 0 ${width} ${height()}`}
        role="img"
        aria-label={`${own.label ?? 'spectrum'} — peak at ${fmtHz(peakFreq())}`}
        class="w-full rounded-md bg-gray-900"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoverBar(-1)}
      >
        <For each={barHeights()}>
          {(h, i) => {
            const bw = width / barCount()
            const active = hoverBar() === i()
            return (
              <rect
                x={i() * bw + 0.5}
                y={height() - 12 - h}
                width={Math.max(1, bw - 1.5)}
                height={h}
                rx="1"
                fill={own.color ?? 'oklch(0.72 0.12 235)'}
                opacity={active ? 1 : 0.75}
              />
            )
          }}
        </For>
        <line
          x1="0"
          x2={width}
          y1={height() - 12}
          y2={height() - 12}
          stroke="oklch(0.35 0.02 250)"
          stroke-width="1"
        />
        {sampleRate() !== 1 && (
          <text x="4" y={height() - 2} class="fill-gray-500 font-mono text-[9px]">
            0
          </text>
        )}
        {sampleRate() !== 1 && (
          <text
            x={width - 4}
            y={height() - 2}
            text-anchor="end"
            class="fill-gray-500 font-mono text-[9px]"
          >
            {fmtHz((sampleRate() / 2) * 0.9)}
          </text>
        )}
      </svg>
    </div>
  )
}

export default FftSpectrum
