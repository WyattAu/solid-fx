// solid-fx Data widget — original component (not a port).
// Header-grade ACF correlogram: lag-1..L autocorrelations as micro-bars with
// the ±1.96/√n white-noise bounds — seasonality and persistence read before
// any chart is plotted (research 02 #122).
import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

export interface ACFCorrelogramProps {
  /** Time-ordered series. */
  data: number[]
  /** Max lag to plot (default 20). */
  maxLag?: number
  /** Plot width in px (default 220). */
  width?: number
  /** Plot height in px (default 64). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function ACFCorrelogram(props: ACFCorrelogramProps) {
  const [own, rest] = splitProps(props, [
    'data',
    'maxLag',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const maxLag = () => own.maxLag ?? 20
  const width = () => own.width ?? 220
  const height = () => own.height ?? 64

  const acf = createMemo(() => {
    const d = props.data
    const n = d.length
    if (n < 8) return []
    let mean = 0
    for (const v of d) mean += v
    mean /= n
    const c0 = d.reduce((a, v) => a + (v - mean) * (v - mean), 0)
    if (c0 === 0) return []
    const out: number[] = []
    const L = Math.min(maxLag(), n - 1)
    for (let lag = 1; lag <= L; lag++) {
      let acc = 0
      for (let i = 0; i < n - lag; i++) acc += (d[i] - mean) * (d[i + lag] - mean)
      out.push(acc / c0)
    }
    return out
  })

  const bound = () => 1.96 / Math.sqrt(Math.max(1, props.data.length))

  const barW = () => width() / Math.max(1, acf().length)

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <svg
        width={width()}
        height={height()}
        viewBox={`0 0 ${width()} ${height()}`}
        role="img"
        aria-label={`autocorrelation to lag ${acf().length}, bounds ±${bound().toFixed(3)}`}
        class="rounded-md bg-gray-900"
      >
        <title>{`${own.label ?? 'ACF'} — lags 1..${acf().length}`}</title>
        {/* white-noise bounds */}
        <line
          x1="0"
          x2={width()}
          y1={height() / 2 - bound() * (height() / 2 - 2)}
          y2={height() / 2 - bound() * (height() / 2 - 2)}
          stroke="oklch(0.45 0.03 85)"
          stroke-width="0.75"
          stroke-dasharray="3 3"
        />
        <line
          x1="0"
          x2={width()}
          y1={height() / 2 + bound() * (height() / 2 - 2)}
          y2={height() / 2 + bound() * (height() / 2 - 2)}
          stroke="oklch(0.45 0.03 85)"
          stroke-width="0.75"
          stroke-dasharray="3 3"
        />
        {/* zero line */}
        <line
          x1="0"
          x2={width()}
          y1={height() / 2}
          y2={height() / 2}
          stroke="oklch(0.3 0.02 250)"
          stroke-width="0.75"
        />
        {/* bars */}
        {acf().map((r, i) => {
          const x = i * barW() + barW() * 0.2
          const w = Math.max(1.2, barW() * 0.6)
          const h = Math.abs(r) * (height() / 2 - 2)
          const y = r >= 0 ? height() / 2 - h : height() / 2
          const outside = Math.abs(r) > bound()
          return (
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="0.5"
              fill={outside ? 'oklch(0.72 0.12 235)' : 'oklch(0.5 0.02 250)'}
            />
          )
        })}
        <text x="2" y="9" class="fill-gray-500 font-mono text-[9px]">
          {own.label ?? 'ACF'}
        </text>
      </svg>
    </figure>
  )
}

export default ACFCorrelogram
