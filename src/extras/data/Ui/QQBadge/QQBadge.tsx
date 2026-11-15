// solid-fx Data widget — original component (not a port).
// 32px Q-Q normality badge: sorted sample quantiles against theoretical
// standard-normal quantiles. A straight diagonal confirms Gaussianity; an
// S-bend flags fat tails / skew instantly, beside any metric in a dense table.
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { excessKurtosis, normalQuantile } from '@/lib/num'

export interface QQBadgeProps {
  /** Sample data (order doesn't matter). */
  data: number[]
  /** Badge size in px (default 32). */
  size?: number
  /** Points plotted on the diagonal (default 24). */
  points?: number
  /** Extra context line under the badge (default: auto verdict). */
  verdict?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function QQBadge(props: QQBadgeProps) {
  const [own, rest] = splitProps(props, [
    'data',
    'size',
    'points',
    'verdict',
    'class',
    'className',
    'style',
  ])

  const size = () => own.size ?? 32
  const nPoints = () => own.points ?? 24

  const pairs = () => {
    const d = [...own.data].sort((a, b) => a - b)
    const n = d.length
    if (n < 4) return []
    const out: Array<{ theo: number; obs: number }> = []
    const k = Math.min(nPoints(), n)
    for (let i = 0; i < k; i++) {
      const p = (i + 0.5) / k
      const theo = normalQuantile(p)
      // observed quantile by index into the sorted sample
      const obs = d[Math.min(n - 1, Math.floor(p * n))]
      out.push({ theo, obs })
    }
    return out
  }

  const scale = () => {
    const ps = pairs()
    if (ps.length === 0) return { min: -1, max: 1 }
    const vals = ps.flatMap(q => [q.theo, q.obs])
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.1 || 1
    return { min: min - pad, max: max + pad }
  }

  const px = (v: number) => {
    const { min, max } = scale()
    return ((v - min) / (max - min)) * size()
  }

  const autoVerdict = () => {
    const k = excessKurtosis(own.data)
    if (k > 1) return 'fat tails'
    if (k < -1) return 'thin tails'
    return '~normal'
  }

  const text = () => own.verdict ?? autoVerdict()
  const tailColor = () =>
    excessKurtosis(own.data) > 1 ? 'oklch(0.72 0.15 30)' : 'oklch(0.72 0.12 235)'

  return (
    <span
      {...rest}
      class={`inline-flex select-none items-center gap-1.5 ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <svg
        width={size()}
        height={size()}
        viewBox={`0 0 ${size()} ${size()}`}
        role="img"
        aria-label={`Q-Q plot: ${text()}`}
        class="rounded-sm bg-gray-900"
      >
        <title>{`Q-Q plot — ${text()}`}</title>
        {/* 45° reference */}
        <line
          x1="2"
          y1={size() - 2}
          x2={size() - 2}
          y2="2"
          stroke="oklch(0.4 0.02 250)"
          stroke-width="1"
        />
        {pairs().map(q => (
          <circle
            cx={px(q.theo)}
            cy={size() - px(q.obs)}
            r="1.3"
            fill={tailColor()}
            opacity="0.9"
          />
        ))}
      </svg>
      <span class="text-[10px] text-gray-400">{text()}</span>
    </span>
  )
}

export default QQBadge
