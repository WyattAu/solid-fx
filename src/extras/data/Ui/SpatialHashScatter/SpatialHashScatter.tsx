// solid-fx Data widget — original component (not a port).
// 50k-point scatter with O(1) hover: all points rasterized once into an
// ImageData buffer, nearest-point lookup via the flat CSR spatial hash
// (zero per-query allocation, no SVG DOM). Hover highlights the nearest
// point and reads out its coordinates.
import type { JSX } from 'solid-js'
import { createMemo, createSignal, onMount, splitProps } from 'solid-js'
import { buildSpatialHash, type XYPoint } from '@/lib/num'

export interface SpatialHashScatterProps {
  points: XYPoint[]
  /** Canvas width in px (default 360). */
  width?: number
  /** Canvas height in px (default 240). */
  height?: number
  /** Spatial-hash cell size in px (default 24). */
  cell?: number
  labels?: [string, string]
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function SpatialHashScatter(props: SpatialHashScatterProps) {
  const [own, rest] = splitProps(props, [
    'points',
    'width',
    'height',
    'cell',
    'labels',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 360
  const height = () => own.height ?? 240
  const labels = () => own.labels ?? ['x', 'y']

  const extent = createMemo(() => {
    const ps = own.points
    if (ps.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    const xs = ps.map(p => p.x)
    const ys = ps.map(p => p.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  })

  const toScreen = createMemo(() => {
    const e = extent()
    const sx = Float64Array.from(
      own.points,
      p => ((p.x - e.minX) / (e.maxX - e.minX || 1)) * (width() - 8) + 4,
    )
    const sy = Float64Array.from(
      own.points,
      p => height() - 4 - ((p.y - e.minY) / (e.maxY - e.minY || 1)) * (height() - 8),
    )
    return { sx, sy }
  })

  const hash = createMemo(() => {
    const { sx, sy } = toScreen()
    return buildSpatialHash(sx, sy, own.cell ?? 24)
  })

  const [hover, setHover] = createSignal(-1)

  // static base raster: draw once whenever points/size change
  let canvas!: HTMLCanvasElement
  const baseRaster = createMemo(() => {
    const { sx, sy } = toScreen()
    const off = document.createElement('canvas')
    off.width = width()
    off.height = height()
    const ctx = off.getContext('2d')
    if (!ctx) return off
    ctx.fillStyle = 'oklch(0.18 0.02 250)'
    ctx.fillRect(0, 0, width(), height())
    ctx.fillStyle = 'rgba(125, 211, 252, 0.55)'
    for (let i = 0; i < sx.length; i++) ctx.fillRect(sx[i], sy[i], 1.4, 1.4)
    return off
  })

  const redraw = (idx: number, q: [number, number] | null) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(baseRaster(), 0, 0)
    if (q) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.moveTo(q[0] - 8, q[1])
      ctx.lineTo(q[0] + 8, q[1])
      ctx.moveTo(q[0], q[1] - 8)
      ctx.lineTo(q[0], q[1] + 8)
      ctx.stroke()
    }
    if (idx >= 0) {
      const { sx, sy } = toScreen()
      ctx.strokeStyle = 'oklch(0.8 0.15 85)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(sx[idx], sy[idx], 5, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scale = width() / rect.width
    const qx = (event.clientX - rect.left) * scale
    const qy = (event.clientY - rect.top) * scale
    const { sx, sy } = toScreen()
    const idx = hash().queryNearest(qx, qy, sx, sy)
    setHover(idx)
    redraw(idx, [qx, qy])
  }

  const onPointerLeave = () => {
    setHover(-1)
    redraw(-1, null)
  }

  // initial raster paint once the canvas ref exists
  onMount(() => redraw(-1, null))

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? `${own.points.length.toLocaleString()} points`}</span>
        <span class="font-mono" aria-live="polite">
          {hover() >= 0 && own.points[hover()]
            ? `${labels()[0]} ${fmt(own.points[hover()].x)} · ${labels()[1]} ${fmt(own.points[hover()].y)}`
            : `${width()}×${height()} canvas · cell ${own.cell ?? 24}px`}
        </span>
      </div>
      <canvas
        ref={canvas}
        width={width()}
        height={height()}
        role="img"
        aria-label={`${own.label ?? 'scatter'} — ${own.points.length.toLocaleString()} points, nearest highlighted on hover`}
        class="w-full cursor-crosshair rounded-md"
        style={{ 'max-width': `${width()}px` }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />
    </div>
  )
}

export default SpatialHashScatter
