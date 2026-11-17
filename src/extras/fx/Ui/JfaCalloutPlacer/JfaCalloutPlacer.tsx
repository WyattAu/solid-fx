// solid-fx FX widget — original component (not a port).
// Maximal empty-void placement via Jump Flooding (research 03 #69): obstacle
// boxes seed a jump-flood distance transform (log₂ passes over a 256² grid),
// the farthest empty cell becomes the callout anchor, and a bubble is drawn
// there. The same passes map 1:1 onto a fragment-shader ping-pong when the
// grid outgrows the CPU budget; at 256² the typed-array form runs in a few
// milliseconds and stays deterministic + headless-safe.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface JfaBox {
  label: string
  /** Normalized [0,1] box rect. */
  x: number
  y: number
  w: number
  h: number
}

export interface JfaCalloutPlacerProps {
  /** Obstacle boxes (default: five dashboard panels). */
  boxes?: JfaBox[]
  /** Simulation grid resolution (default 256; pass count = log₂ N). */
  resolution?: number
  /** Canvas width in px (default 480). */
  width?: number
  /** Canvas height in px (default 320). */
  height?: number
  /** Callout text (default "auto-placed callout"). */
  calloutText?: string
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

/** rounded-rect path without the newer roundRect API (older drivers). */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function JfaCalloutPlacer(props: JfaCalloutPlacerProps) {
  const [own, rest] = splitProps(props, [
    'boxes',
    'resolution',
    'width',
    'height',
    'calloutText',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 480
  const height = () => own.height ?? 320

  const defaultBoxes = (): JfaBox[] => {
    const rng = mulberry32(0x1234)
    const labels = ['ticket', 'chart', 'sidebar', 'queue', 'map']
    return labels.map(label => ({
      label,
      x: 0.08 + rng() * 0.55,
      y: 0.1 + rng() * 0.55,
      w: 0.14 + rng() * 0.12,
      h: 0.12 + rng() * 0.14,
    }))
  }

  const [boxes, setBoxes] = createSignal<JfaBox[]>(
    own.boxes ? own.boxes.map(b => ({ ...b })) : defaultBoxes(),
  )
  const [voidInfo, setVoidInfo] = createSignal({ x: 0.5, y: 0.5, r: 0 })
  const [dragging, setDragging] = createSignal<string | null>(null)
  const [computing, setComputing] = createSignal(false)
  let canvas!: HTMLCanvasElement
  let raf = 0

  const res = () => own.resolution ?? 256
  const passCount = () => Math.round(Math.log2(res()))

  // jump-flood distance transform: nearest-seed (occupied cell) coordinates
  // per pixel. nearest arrays hold (x, y) per pixel in two Float32Arrays.
  const computeVoid = (): { x: number; y: number; r: number } => {
    const n = res()
    const near = new Float32Array(n * n * 2)
    // seed: cells covered by an obstacle store their own position
    for (const b of boxes()) {
      const x0 = Math.max(0, Math.floor(b.x * n))
      const x1 = Math.min(n - 1, Math.ceil((b.x + b.w) * n) - 1)
      const y0 = Math.max(0, Math.floor(b.y * n))
      const y1 = Math.min(n - 1, Math.ceil((b.y + b.h) * n) - 1)
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const k = (y * n + x) * 2
          near[k] = x + 0.5
          near[k + 1] = y + 0.5
        }
      }
    }
    const next = new Float32Array(n * n * 2)
    const dist2 = (k: number, px: number, py: number): number => {
      const dx = near[k] - px
      const dy = near[k + 1] - py
      return dx * dx + dy * dy
    }
    let step = n >> 1
    while (step >= 1) {
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const k = (y * n + x) * 2
          const px = x + 0.5
          const py = y + 0.5
          let bestK = k
          let bestD = near[k] > -1e8 ? dist2(k, px, py) : Number.POSITIVE_INFINITY
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              if (ox === 0 && oy === 0) continue
              const qx = x + ox * step
              const qy = y + oy * step
              if (qx < 0 || qy < 0 || qx >= n || qy >= n) continue
              const qk = (qy * n + qx) * 2
              if (near[qk] <= -1e8) continue
              const dx = near[qk] - px
              const dy = near[qk + 1] - py
              const d = dx * dx + dy * dy
              if (d < bestD) {
                bestD = d
                bestK = qk
              }
            }
          }
          next[k] = near[bestK]
          next[k + 1] = near[bestK + 1]
        }
      }
      near.set(next)
      step >>= 1
    }
    // max-distance empty cell inside a small margin
    const margin = Math.round(n * 0.04)
    let bx = n >> 1
    let by = n >> 1
    let bestD = -1
    for (let y = margin; y < n - margin; y++) {
      for (let x = margin; x < n - margin; x++) {
        const k = (y * n + x) * 2
        if (near[k] <= -1e8) continue
        const dx = near[k] - (x + 0.5)
        const dy = near[k + 1] - (y + 0.5)
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > bestD) {
          bestD = d
          bx = x
          by = y
        }
      }
    }
    return { x: (bx + 0.5) / n, y: (by + 0.5) / n, r: bestD / n }
  }

  const recompute = () => {
    setComputing(true)
    // yield one frame so the label updates before the sync compute
    raf = requestAnimationFrame(() => {
      const v = computeVoid()
      setVoidInfo(v)
      setComputing(false)
      draw()
    })
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

    const v = voidInfo()
    // maximal empty void circle
    ctx.strokeStyle = 'oklch(0.6 0.1 160)'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(v.x * width(), v.y * height(), v.r * width(), 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // callout bubble
    const bx = v.x * width()
    const by = v.y * height()
    const bw = Math.min(150, width() * 0.32)
    const bh = 30
    ctx.fillStyle = 'oklch(0.3 0.06 160)'
    roundRectPath(ctx, bx - bw / 2, by - bh / 2, bw, bh, 6)
    ctx.fill()
    ctx.strokeStyle = 'oklch(0.6 0.1 160)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = 'oklch(0.85 0.1 160)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(own.calloutText ?? 'auto callout', bx, by + 3)
    ctx.fillText(`r = ${v.r.toFixed(3)}`, bx, by + 15)
    ctx.textAlign = 'left'

    // obstacle boxes
    for (const b of boxes()) {
      const x = b.x * width()
      const y = b.y * height()
      const w = b.w * width()
      const h = b.h * height()
      ctx.fillStyle = 'oklch(0.28 0.03 250)'
      roundRectPath(ctx, x, y, w, h, 5)
      ctx.fill()
      ctx.strokeStyle = 'oklch(0.5 0.03 250)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = 'oklch(0.7 0.02 250)'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText(b.label, x + 6, y + 14)
    }
  }

  const boxAt = (worldX: number, worldY: number): string | null => {
    // topmost (last) box under the pointer
    const bs = boxes()
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i]
      if (worldX >= b.x && worldX <= b.x + b.w && worldY >= b.y && worldY <= b.y + b.h)
        return b.label
    }
    return null
  }

  const toWorld = (event: PointerEvent): V2 => {
    const rect = canvas.getBoundingClientRect()
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height]
  }

  const onPointerDown = (event: PointerEvent) => {
    const [wx, wy] = toWorld(event)
    const label = boxAt(wx, wy)
    if (label) {
      ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
      setDragging(label)
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const label = dragging()
    if (!label) return
    const [wx, wy] = toWorld(event)
    setBoxes(bs =>
      bs.map(b => {
        if (b.label !== label) return b
        return {
          ...b,
          x: Math.max(0, Math.min(1 - b.w, wx - b.w / 2)),
          y: Math.max(0, Math.min(1 - b.h, wy - b.h / 2)),
        }
      }),
    )
    draw()
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLCanvasElement).releasePointerCapture(event.pointerId)
    setDragging(null)
    recompute()
  }

  // initial compute after mount
  onMount(() => {
    setComputing(true)
    raf = requestAnimationFrame(() => {
      const v = computeVoid()
      setVoidInfo(v)
      setComputing(false)
      draw()
    })
    onCleanup(() => cancelAnimationFrame(raf))
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
        class="w-full cursor-grab touch-none rounded-lg"
        style={{ 'max-width': `${width()}px` }}
        role="img"
        aria-label={`${own.label ?? 'JFA callout placement'} — maximal empty void radius ${voidInfo().r.toFixed(3)}; drag boxes to repack`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'JFA callout placement'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          <span>
            {passCount()} passes · {res()}² grid{computing() ? ' · computing…' : ''}
          </span>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={recompute}
          >
            recompute
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

type V2 = [number, number]

export default JfaCalloutPlacer
