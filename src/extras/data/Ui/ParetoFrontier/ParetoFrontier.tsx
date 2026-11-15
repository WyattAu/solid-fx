// solid-fx Data widget — original component (not a port).
// Pareto-frontier envelope: efficient points picked out of a scatter via the
// O(n log n) sort-and-sweep kernel, dominated region shaded, hover for
// coordinates. The classic "efficient frontier" view for any trade-off pair.
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, splitProps } from 'solid-js'
import { buildSpatialHash, paretoFrontier, type XYPoint } from '@/lib/num'

export interface ParetoFrontierProps {
  points: XYPoint[]
  /** Axis labels (default "x"/"y"). */
  labels?: [string, string]
  /** Plot size in px (default 300). */
  size?: number
  /** Frontier color (default amber). */
  color?: string
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function ParetoFrontier(props: ParetoFrontierProps) {
  const [own, rest] = splitProps(props, [
    'points',
    'labels',
    'size',
    'color',
    'label',
    'class',
    'className',
    'style',
  ])

  const size = () => own.size ?? 300
  const pad = 28
  const labels = () => own.labels ?? ['x', 'y']

  const extent = createMemo(() => {
    const ps = own.points
    if (ps.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    const xs = ps.map(p => p.x)
    const ys = ps.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = (maxX - minX) * 0.05 || 1
    const spanY = (maxY - minY) * 0.05 || 1
    return { minX: minX - spanX, maxX: maxX + spanX, minY: minY - spanY, maxY: maxY + spanY }
  })

  const px = (x: number) =>
    pad + ((x - extent().minX) / (extent().maxX - extent().minX)) * (size() - pad * 1.4)
  const py = (y: number) =>
    size() - pad - ((y - extent().minY) / (extent().maxY - extent().minY)) * (size() - pad * 1.4)

  const frontier = createMemo(() => paretoFrontier(own.points))
  const frontierPath = createMemo(() =>
    frontier()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
      .join(' '),
  )

  // dominated region: under the frontier step-line down to the floor
  const regionPath = createMemo(() => {
    const f = frontier()
    if (f.length < 2) return ''
    const line = f
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
      .join(' ')
    const floor = size() - pad
    return `${line} L${px(f[f.length - 1].x).toFixed(1)},${floor} L${px(f[0].x).toFixed(1)},${floor} Z`
  })

  // hover: spatial hash gives O(1) nearest lookup in screen space; rebuilt
  // whenever the points or plot geometry change
  const [hover, setHover] = createSignal(-1)
  const hoverModel = createMemo(() => {
    own.points
    size()
    const sx = Float64Array.from(own.points, p => px(p.x))
    const sy = Float64Array.from(own.points, p => py(p.y))
    return { hash: buildSpatialHash(sx, sy, 24), sx, sy }
  })

  const onPointerMove = (event: PointerEvent) => {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
    const scale = size() / rect.width
    const { hash, sx, sy } = hoverModel()
    const qx = (event.clientX - rect.left) * scale
    const qy = (event.clientY - rect.top) * scale
    setHover(hash.queryNearest(qx, qy, sx, sy))
  }

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'Pareto frontier'}</span>
        <span class="font-mono" aria-live="polite">
          {hover() >= 0 && own.points[hover()] ? (
            <>
              {labels()[0]} {fmt(own.points[hover()].x)} · {labels()[1]}{' '}
              {fmt(own.points[hover()].y)}
              {frontier().includes(own.points[hover()]) ? ' · efficient' : ' · dominated'}
            </>
          ) : (
            `${frontier().length} efficient of ${own.points.length}`
          )}
        </span>
      </div>
      <svg
        width={size()}
        height={size()}
        viewBox={`0 0 ${size()} ${size()}`}
        role="img"
        aria-label={`${own.label ?? 'Pareto frontier'}: ${frontier().length} efficient points of ${own.points.length}`}
        class="touch-none rounded-lg bg-gray-900 outline-none"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(-1)}
      >
        {/* dominated region */}
        <path d={regionPath()} fill="oklch(0.72 0.12 85)" opacity="0.08" />
        {/* axes */}
        <line
          x1={pad}
          x2={size() - 4}
          y1={size() - pad}
          y2={size() - pad}
          stroke="oklch(0.35 0.02 250)"
          stroke-width="1"
        />
        <line
          x1={pad}
          x2={pad}
          y1={4}
          y2={size() - pad}
          stroke="oklch(0.35 0.02 250)"
          stroke-width="1"
        />
        <text
          x={size() - 4}
          y={size() - 8}
          text-anchor="end"
          class="fill-gray-500 font-mono text-[10px]"
        >
          {labels()[0]} →
        </text>
        <text x={10} y={14} class="fill-gray-500 font-mono text-[10px]">
          ↑ {labels()[1]}
        </text>
        {/* frontier step line */}
        <path
          d={frontierPath()}
          fill="none"
          stroke={own.color ?? 'oklch(0.72 0.12 85)'}
          stroke-width="1.5"
          opacity="0.9"
        />
        {/* scatter */}
        <For each={own.points}>
          {(p, i) => {
            const efficient = frontier().includes(p)
            return (
              <circle
                cx={px(p.x)}
                cy={py(p.y)}
                r={hover() === i() ? 4.5 : efficient ? 3 : 2}
                fill={efficient ? (own.color ?? 'oklch(0.72 0.12 85)') : 'oklch(0.6 0.03 250)'}
                opacity={hover() === -1 || hover() === i() ? (efficient ? 1 : 0.5) : 0.25}
                stroke={hover() === i() ? 'white' : 'none'}
                stroke-width="1"
              />
            )
          }}
        </For>
      </svg>
    </div>
  )
}

export default ParetoFrontier
