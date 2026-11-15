// solid-fx Data widget — original component (not a port).
// Folded-band horizon strips: each time series folds into overlapping,
// intensity-graded bands inside a 16px row, so a screenful of series keeps
// full dynamic range without any vertical scrolling or axis juggling.
import type { JSX } from 'solid-js'
import { For, splitProps } from 'solid-js'

export interface HorizonSeries {
  label: string
  values: number[]
}

export interface HorizonStripsProps {
  series: HorizonSeries[]
  /** Row height in px (default 16). */
  rowHeight?: number
  /** Column resolution for downsampling (default 120). */
  columns?: number
  /** Number of folded bands (default 3). */
  bands?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function HorizonStrips(props: HorizonStripsProps) {
  const [own, rest] = splitProps(props, [
    'series',
    'rowHeight',
    'columns',
    'bands',
    'class',
    'className',
    'style',
  ])

  const rowHeight = () => own.rowHeight ?? 16
  const columns = () => own.columns ?? 120
  const bands = () => own.bands ?? 3

  const downsample = (values: number[]): number[] => {
    const n = values.length
    if (n <= columns()) return values
    const out: number[] = []
    for (let c = 0; c < columns(); c++) {
      const lo = Math.floor((c * n) / columns())
      const hi = Math.max(lo + 1, Math.floor(((c + 1) * n) / columns()))
      let acc = 0
      for (let k = lo; k < hi; k++) acc += values[k]
      out.push(acc / (hi - lo))
    }
    return out
  }

  const rowWidth = 240

  // horizon fold: value ∈ [min, max] is split into `bands` stacked layers,
  // each drawn at full row height with increasing opacity
  const rowPaths = (values: number[]) => {
    const data = downsample(values)
    if (data.length === 0) return []
    let min = Math.min(...data)
    let max = Math.max(...data)
    if (min === max) {
      min -= 1
      max += 1
    }
    const bandHeight = (max - min) / bands()
    const stepX = rowWidth / Math.max(1, data.length - 1)
    const paths: string[] = []
    for (let b = 0; b < bands(); b++) {
      const base = min + b * bandHeight
      let d = `M0,${rowHeight()}`
      for (let k = 0; k < data.length; k++) {
        const excess = Math.max(0, data[k] - base)
        const h = Math.min(1, excess / bandHeight) * rowHeight()
        d += ` L${(k * stepX).toFixed(1)},${(rowHeight() - h).toFixed(1)}`
      }
      d += ` L${rowWidth},${rowHeight()} Z`
      paths.push(d)
    }
    return paths
  }

  return (
    <div
      {...rest}
      class={`flex select-none flex-col gap-1 ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      aria-label="horizon chart strips"
      role="group"
    >
      <For each={own.series}>
        {s => (
          <div class="flex items-center gap-2">
            <span class="w-28 shrink-0 truncate font-mono text-[10px] text-gray-400">
              {s.label}
            </span>
            <svg
              width={rowWidth}
              height={rowHeight()}
              viewBox={`0 0 ${rowWidth} ${rowHeight()}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${s.label} series, horizon-folded`}
              class="rounded-sm bg-gray-900"
            >
              <title>{s.label}</title>
              <For each={rowPaths(s.values)}>
                {(d, b) => (
                  <path d={d} fill="oklch(0.72 0.12 30)" opacity={(0.28 + 0.26 * b()).toFixed(2)} />
                )}
              </For>
            </svg>
            <span class="font-mono text-[10px] text-gray-500">
              {s.values.length > 0
                ? `${Math.min(...s.values).toFixed(1)}…${Math.max(...s.values).toFixed(1)}`
                : ''}
            </span>
          </div>
        )}
      </For>
    </div>
  )
}

export default HorizonStrips
