// solid-fx Data widget — original component (not a port).
// Word-sized sparkline: crisp inline SVG micro-graphics for prose, table
// rows, and breadcrumbs — maximal data-ink density with no chart container.
import type { JSX } from 'solid-js'
import { For, splitProps } from 'solid-js'

export interface SparklineTextProps {
  data: number[]
  /** Pixel width (default 64). */
  width?: number
  /** Pixel height (default 16). */
  height?: number
  /** Render style (default 'line'). */
  type?: 'line' | 'bar' | 'area'
  /** Accessible description (e.g. "latency last 60s"). */
  title?: string
  /** Stroke/fill color (default currentColor). */
  color?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function SparklineText(props: SparklineTextProps) {
  const [own, rest] = splitProps(props, [
    'data',
    'width',
    'height',
    'type',
    'title',
    'color',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 64
  const height = () => own.height ?? 16
  const type = () => own.type ?? 'line'
  const color = () => own.color ?? 'currentColor'

  const scale = () => {
    const d = own.data
    if (d.length === 0) return { min: 0, max: 1 }
    let min = Math.min(...d)
    let max = Math.max(...d)
    if (min === max) {
      min -= 1
      max += 1
    }
    return { min, max }
  }

  // y is flipped (SVG origin top-left); values map into [pad, h - pad]
  const y = (v: number) => {
    const { min, max } = scale()
    const pad = 1
    const t = (v - min) / (max - min)
    return height() - pad - t * (height() - pad * 2)
  }

  const x = (i: number) =>
    own.data.length <= 1 ? width() / 2 : (i / (own.data.length - 1)) * width()

  const points = () => own.data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const areaPath = () => {
    if (own.data.length === 0) return ''
    const baseline = y(scale().min)
    return `M0,${baseline} L${points().replace(/ /g, ' L')} L${width()},${baseline} Z`
  }

  return (
    <svg
      {...rest}
      width={width()}
      height={height()}
      viewBox={`0 0 ${width()} ${height()}`}
      class={`inline-block align-baseline ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      role="img"
      aria-label={own.title ?? 'sparkline'}
    >
      <title>{own.title ?? 'sparkline'}</title>
      {type() === 'bar' && (
        <For each={own.data}>
          {(v, i) => (
            <rect
              x={x(i()) - Math.max(0.5, width() / own.data.length / 2 - 0.5)}
              y={Math.min(y(v), y(scale().min))}
              width={Math.max(1, width() / own.data.length - 0.8)}
              height={Math.max(1, Math.abs(y(v) - y(scale().min)))}
              fill={color()}
              rx="0.5"
            />
          )}
        </For>
      )}
      {type() === 'area' && <path d={areaPath()} fill={color()} opacity="0.35" />}
      {(type() === 'line' || type() === 'area') && (
        <polyline
          points={points()}
          fill="none"
          stroke={color()}
          stroke-width="1.2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      )}
    </svg>
  )
}

export default SparklineText
