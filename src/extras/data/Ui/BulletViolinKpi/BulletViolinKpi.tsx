// solid-fx Data widget — original component (not a port).
// 48px KPI strip replacing the giant empty KPI card: a horizontal KDE violin
// of historical values, a target interquartile band, yesterday's tick, and
// today's live needle packed into one crisp SVG row.
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { gaussianKde } from '@/lib/num'

export interface BulletViolinKpiProps {
  /** Metric name (e.g. "p99 latency"). */
  label: string
  /** Historical values driving the violin density. */
  history: number[]
  /** Target band [low, high] (e.g. an SLO interquartile window). */
  target?: [number, number]
  /** Yesterday's value — rendered as a tick. */
  yesterday?: number
  /** Today's value — rendered as the needle. */
  live?: number
  /** Unit suffix for the value readout. */
  unit?: string
  /** Strip height in px (default 48). */
  height?: number
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function BulletViolinKpi(props: BulletViolinKpiProps) {
  const [own, rest] = splitProps(props, [
    'label',
    'history',
    'target',
    'yesterday',
    'live',
    'unit',
    'height',
    'class',
    'className',
    'style',
  ])

  const width = 260
  const height = () => own.height ?? 48
  const pad = 6

  const domain = () => {
    const all = [
      ...own.history,
      ...(own.target ?? []),
      ...(own.yesterday !== undefined ? [own.yesterday] : []),
      ...(own.live !== undefined ? [own.live] : []),
    ]
    if (all.length === 0) return { min: 0, max: 1 }
    let min = Math.min(...all)
    let max = Math.max(...all)
    const span = max - min
    min -= span * 0.08
    max += span * 0.08
    return { min, max: max === min ? min + 1 : max }
  }

  const xOf = (v: number) => {
    const { min, max } = domain()
    return pad + ((v - min) / (max - min)) * (width - pad * 2)
  }

  // violin: gaussian KDE mirrored around the horizontal center line
  const violinPath = () => {
    const h = own.history
    if (h.length < 2) return null
    const { min, max } = domain()
    const steps = 72
    const points: number[] = Array.from(
      { length: steps + 1 },
      (_, k) => min + ((max - min) * k) / steps,
    )
    const density = gaussianKde(h, points)
    const peak = Math.max(...density) || 1
    const half = height() / 2 - 2
    const upper = points.map(
      (p, k) => `${xOf(p).toFixed(1)},${(height() / 2 - (density[k] / peak) * half).toFixed(1)}`,
    )
    const lower = points
      .map(
        (p, k) => `${xOf(p).toFixed(1)},${(height() / 2 + (density[k] / peak) * half).toFixed(1)}`,
      )
      .reverse()
    return `M${upper.join(' L')} L${lower.join(' L')} Z`
  }

  const fmt = (v: number) =>
    `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}${own.unit ?? ''}`

  return (
    <div
      {...rest}
      class={`flex select-none items-center gap-3 ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="w-28 shrink-0">
        <div class="text-xs font-medium text-gray-200">{own.label}</div>
        <div class="font-mono text-sm text-sky-300" aria-live="polite">
          {own.live !== undefined ? fmt(own.live) : '—'}
        </div>
      </div>
      <svg
        width={width}
        height={height()}
        viewBox={`0 0 ${width} ${height()}`}
        role="img"
        aria-label={`${own.label}: distribution with target band${own.live !== undefined ? `, current ${fmt(own.live)}` : ''}`}
      >
        {/* target band */}
        {own.target && (
          <rect
            x={xOf(own.target[0])}
            y="2"
            width={Math.max(1, xOf(own.target[1]) - xOf(own.target[0]))}
            height={height() - 4}
            fill="oklch(0.55 0.1 155)"
            opacity="0.18"
          />
        )}
        {/* violin */}
        {violinPath() && <path d={violinPath()!} fill="oklch(0.62 0.1 235)" opacity="0.4" />}
        {/* baseline axis */}
        <line
          x1={pad}
          x2={width - pad}
          y1={height() / 2}
          y2={height() / 2}
          stroke="oklch(0.35 0.02 250)"
          stroke-width="1"
        />
        {/* yesterday tick */}
        {own.yesterday !== undefined && (
          <line
            x1={xOf(own.yesterday)}
            x2={xOf(own.yesterday)}
            y1={height() / 2 - 7}
            y2={height() / 2 + 7}
            stroke="oklch(0.7 0.02 250)"
            stroke-width="1.5"
          />
        )}
        {/* live needle */}
        {own.live !== undefined && (
          <g>
            <line
              x1={xOf(own.live)}
              x2={xOf(own.live)}
              y1="1"
              y2={height() - 1}
              stroke="oklch(0.78 0.15 30)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx={xOf(own.live)} cy={height() / 2} r="2.5" fill="oklch(0.78 0.15 30)" />
          </g>
        )}
      </svg>
      {own.target && (
        <div class="shrink-0 text-[10px] text-gray-500">
          target
          <br />
          {fmt(own.target[0])}–{fmt(own.target[1])}
        </div>
      )}
    </div>
  )
}

export default BulletViolinKpi
