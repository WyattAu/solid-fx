// solid-fx Data widget — original component (not a port).
// Rolling-window timeline brush: drag the window across history, and mouse-
// wheel over it dilates/contracts symmetrically around the midpoint
// (research 02 #114). Live stats read out for the selection.
import type { JSX } from 'solid-js'
import { createSignal, onMount, splitProps } from 'solid-js'
import { createWelford, standardError } from '@/lib/num'

export interface RollingWindowBrushProps {
  /** Series values (time-ordered). */
  data: number[]
  /** Initial window width as a fraction of the series (default 0.15). */
  initialWidth?: number
  /** Canvas width in px (default 420). */
  width?: number
  /** Canvas height in px (default 120). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function RollingWindowBrush(props: RollingWindowBrushProps) {
  const [own, rest] = splitProps(props, ['data', 'initialWidth', 'width', 'height', 'label', 'class', 'className', 'style'])

  const width = () => own.width ?? 420
  const height = () => own.height ?? 120
  const n = () => props.data.length

  const [winW, setWinW] = createSignal(own.initialWidth ?? 0.15)
  const [winStart, setWinStart] = createSignal(0.85 - (own.initialWidth ?? 0.15)) // right-anchored start
  const [stats, setStats] = createSignal('—')
  let canvas!: HTMLCanvasElement
  let mode: 'move' | 'left' | 'right' | null = null
  let lastX = 0

  const bounds = () => {
    const w = Math.min(1, Math.max(0.02, winW()))
    const start = Math.min(1 - w, Math.max(0, winStart()))
    return { start, end: start + w, w }
  }

  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (canvas.width !== width() * dpr) {
      canvas.width = width() * dpr
      canvas.height = height() * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = 'oklch(0.18 0.02 250)'
    ctx.fillRect(0, 0, width(), height())

    const data = props.data
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (const v of data) {
      if (v < min) min = v
      if (v > max) max = v
    }
    const span = max - min || 1
    const py = (v: number) => height() - 8 - ((v - min) / span) * (height() - 16)

    // full series, dim
    ctx.strokeStyle = 'oklch(0.4 0.03 250)'
    ctx.lineWidth = 1
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * width()
      if (i === 0) ctx.moveTo(x, py(v))
      else ctx.lineTo(x, py(v))
    })
    ctx.stroke()

    // selection window
    const { start, end } = bounds()
    const x0 = start * width()
    const x1 = end * width()
    ctx.fillStyle = 'oklch(0.55 0.1 85)'
    ctx.globalAlpha = 0.12
    ctx.fillRect(x0, 0, x1 - x0, height())
    ctx.globalAlpha = 1
    ctx.strokeStyle = 'oklch(0.72 0.12 85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x0, 0)
    ctx.lineTo(x0, height())
    ctx.moveTo(x1, 0)
    ctx.lineTo(x1, height())
    ctx.stroke()

    // windowed series, bright
    const lo = Math.floor(start * (data.length - 1))
    const hi = Math.ceil(end * (data.length - 1))
    ctx.strokeStyle = 'oklch(0.85 0.1 85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = lo; i <= hi; i++) {
      const x = (i / (data.length - 1)) * width()
      const y = py(data[i])
      if (i === lo) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const readStats = () => {
    const { start, end } = bounds()
    const lo = Math.floor(start * (n() - 1))
    const hi = Math.ceil(end * (n() - 1))
    const w = createWelford()
    let mn = Number.POSITIVE_INFINITY
    let mx = Number.NEGATIVE_INFINITY
    for (let i = lo; i <= hi && i < n(); i++) {
      const v = props.data[i]
      w.push(v)
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    setStats(
      w.n === 0
        ? '—'
        : `μ ${w.mean.toFixed(2)} ± ${standardError(w).toFixed(2)} · [${mn.toFixed(2)}, ${mx.toFixed(2)}] · n ${w.n}`,
    )
    draw()
  }

  const onPointerDown = (event: PointerEvent) => {
    ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
    const rect = canvas.getBoundingClientRect()
    const fx = (event.clientX - rect.left) / rect.width
    const { start, end } = bounds()
    // pick the nearest edge within 2%, else move the whole window
    if (Math.abs(fx - start) < 0.02) mode = 'left'
    else if (Math.abs(fx - end) < 0.02) mode = 'right'
    else mode = 'move'
    lastX = event.clientX
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!mode) return
    const dx = (event.clientX - lastX) / width()
    lastX = event.clientX
    const { w } = bounds()
    if (mode === 'left') setWinStart(Math.min(1 - w, Math.max(0, winStart() + dx)))
    else if (mode === 'right') {
      const newStart = Math.min(1, Math.max(0, winStart() + dx))
      setWinW(Math.max(0.02, newStart + w - winStart()))
      setWinStart(Math.min(1 - Math.max(0.02, winW()), newStart))
    } else {
      setWinStart(Math.min(1 - w, Math.max(0, winStart() + dx)))
    }
    readStats()
  }

  const onPointerUp = (event: PointerEvent) => {
    mode = null
    ;(event.currentTarget as HTMLCanvasElement).releasePointerCapture(event.pointerId)
  }

  // wheel dilates/contracts the window around its midpoint
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const { start, w } = bounds()
    const mid = start + w / 2
    const factor = event.deltaY > 0 ? 1.15 : 1 / 1.15
    const newW = Math.min(1, Math.max(0.02, w * factor))
    setWinW(newW)
    setWinStart(Math.min(1 - newW, Math.max(0, mid - newW / 2)))
    readStats()
  }

  onMount(() => {
    draw()
    readStats()
  })

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <canvas
        ref={canvas}
        width={width()}
        height={height()}
        class="w-full cursor-ew-resize touch-none rounded-lg"
        role="slider"
        aria-label={own.label ?? 'rolling window brush'}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={Math.round(bounds().start * 100) / 100}
        aria-valuetext={stats()}
        tabindex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'rolling window'}</span>
        <span class="font-mono text-[10px] text-gray-500" aria-live="polite">
          {stats()} · wheel dilates
        </span>
      </figcaption>
    </figure>
  )
}

export default RollingWindowBrush
