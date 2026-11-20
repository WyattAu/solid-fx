// solid-fx Data widget — original component (not a port).
// Re-binnable histogram with live VaR/CVaR cutoffs: 100k samples rebinned
// at any bin width in about a millisecond (typed-array counting), Value-at-
// Risk and Conditional VaR (expected shortfall) marked directly on the
// distribution — the risk analytics without a server round-trip
// (research 03 #67, CPU typed-array form).
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, splitProps } from 'solid-js'
import { mulberry32, normalSampler } from '@/lib/num'

export interface VaRHistogramProps {
  /** Sample array (default: 60k seeded Student-t-ish returns). */
  samples?: number[]
  /** Bin count (default 60; re-bin freely). */
  bins?: number
  /** VaR tail probability (default 0.05 → 95% VaR). */
  varAlpha?: number
  /** Label for the loss side (default 'loss'). */
  label?: string
  /** Plot width in px (default 420). */
  width?: number
  /** Plot height in px (default 160). */
  height?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const quantileSorted = (sorted: number[], p: number): number => {
  const pos = (sorted.length - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function VaRHistogram(props: VaRHistogramProps) {
  const [own, rest] = splitProps(props, [
    'samples',
    'bins',
    'varAlpha',
    'label',
    'width',
    'height',
    'class',
    'className',
    'style',
  ])

  const samples = () => own.samples ?? []
  const bins = () => own.bins ?? 60
  const alpha = () => own.varAlpha ?? 0.05
  const width = () => own.width ?? 420
  const height = () => own.height ?? 160

  const [binCount, setBinCount] = createSignal(own.bins ?? 60)

  const sorted = createMemo(() => [...samples()].sort((a, b) => a - b))

  const extent = createMemo(() => {
    const s = sorted()
    if (s.length === 0) return { min: 0, max: 1 }
    const lo = quantileSorted(s, 0.001)
    const hi = quantileSorted(s, 0.999)
    const pad = (hi - lo) * 0.02
    return { min: lo - pad, max: hi + pad }
  })

  // re-bin: O(n) counting per bin-width change
  const hist = createMemo(() => {
    const nb = binCount()
    const s = samples()
    const e = extent()
    const counts = new Array(nb).fill(0)
    const span = e.max - e.min || 1
    for (const v of s) {
      const b = Math.min(nb - 1, Math.max(0, Math.floor(((v - e.min) / span) * nb)))
      counts[b] += 1
    }
    return { counts, e }
  })

  const peak = createMemo(() => Math.max(...hist().counts, 1))

  // sorted-array quantiles: VaR = the alpha-quantile, CVaR = mean beyond it
  const varStats = createMemo(() => {
    const s = sorted()
    if (s.length === 0) return { value: 0, expectedShortfall: 0 }
    const v = quantileSorted(s, alpha())
    const tail = s.slice(0, Math.max(1, Math.round(s.length * alpha())))
    const cv = tail.reduce((a, b) => a + b, 0) / tail.length
    return { value: v, expectedShortfall: cv }
  })

  const xOf = (v: number) => {
    const e = extent()
    return ((v - e.min) / (e.max - e.min)) * width()
  }

  const barW = () => width() / binCount()

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between gap-3 text-xs text-gray-400">
        <span>{own.label ?? 'distribution'}</span>
        <label class="flex items-center gap-1 font-mono text-[10px]">
          bins
          <input
            type="range"
            min={12}
            max={120}
            step={2}
            value={binCount()}
            onInput={e => setBinCount(Number(e.currentTarget.value))}
            class="h-1 w-24 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
            aria-label="bin count"
          />
          {binCount()}
        </label>
      </div>
      <svg
        width={width()}
        height={height()}
        viewBox={`0 0 ${width()} ${height()}`}
        role="img"
        aria-label={`histogram, ${alpha() * 100}% VaR at ${varStats().value.toFixed(3)}`}
        class="rounded-md bg-gray-900"
      >
        <For each={hist().counts}>
          {(c, i) => {
            const h = (c / peak()) * (height() - 24)
            const inTail =
              xOf(i() * ((extent().max - extent().min) / binCount()) + extent().min) <
              xOf(varStats().value)
            return (
              <rect
                x={i() * barW() + 0.5}
                y={height() - 14 - h}
                width={Math.max(1, barW() - 1)}
                height={h}
                fill={inTail ? 'oklch(0.62 0.16 30)' : 'oklch(0.62 0.12 235)'}
                opacity={inTail ? 0.85 : 0.6}
              />
            )
          }}
        </For>
        {/* VaR marker */}
        <line
          x1={xOf(varStats().value)}
          x2={xOf(varStats().value)}
          y1="4"
          y2={height() - 14}
          stroke="oklch(0.85 0.15 85)"
          stroke-width="1.5"
        />
        <text x={xOf(varStats().value) + 4} y="14" class="fill-amber-300 font-mono text-[9px]">
          {alpha() * 100}% VaR
        </text>
        <text x="4" y={height() - 4} class="fill-gray-500 font-mono text-[9px]">
          {extent().min.toFixed(2)}
        </text>
        <text
          x={width() - 4}
          y={height() - 4}
          text-anchor="end"
          class="fill-gray-500 font-mono text-[9px]"
        >
          {extent().max.toFixed(2)}
        </text>
        {/* CVaR marker: expected shortfall mean */}
        <line
          x1={xOf(varStats().expectedShortfall)}
          x2={xOf(varStats().expectedShortfall)}
          y1={height() - 14}
          y2={height() - 2}
          stroke="oklch(0.85 0.15 30)"
          stroke-width="1.5"
        />
      </svg>
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>
          {own.label ?? 'distribution'} · {samples().length.toLocaleString()} samples
        </span>
        <span class="font-mono text-[10px] text-gray-500">
          {alpha() * 100}% VaR {varStats().value.toFixed(2)} · CVaR{' '}
          {varStats().expectedShortfall.toFixed(2)}
        </span>
      </figcaption>
    </figure>
  )
}

export default VaRHistogram
