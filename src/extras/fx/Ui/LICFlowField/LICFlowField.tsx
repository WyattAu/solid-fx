// solid-fx FX widget — original component (not a port).
// LIC phase-portrait scrubber (research 04 #22): a vector field rendered as
// Line Integral Convolution — white noise advected along streamlines — with
// analytic singularities (vortex, source, saddle) whose phase portrait is
// visible as texture structure. Hover drops a tracer that follows the flow.
// CPU LIC over typed arrays (ImageDeg 300×200 ≈ 60k px × L steps — tens of
// ms), deterministic per seed; recomputes on parameter change only.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface LICFlowFieldProps {
  /** Vortex strength (default 1). */
  vortex?: number
  /** Source strength, positive pushes out (default 0.7). */
  source?: number
  /** Saddle strength (default 0.5). */
  saddle?: number
  /** Streamline integration length in steps (default 24). */
  streamlineLength?: number
  /** RNG seed for the noise input (default 1). */
  seed?: number
  /** Canvas width in px (default 420). */
  width?: number
  /** Canvas height in px (default 280). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

// field in normalized [0,1]² coords: vortex at (0.3, 0.5), source at (0.7, 0.35), saddle at (0.65, 0.7)
function fieldAt(x: number, y: number, s: number, src: number, sd: number): [number, number] {
  let vx = 0
  let vy = 0
  // vortex (counter-clockwise)
  let dx = x - 0.3
  let dy = y - 0.5
  let d2 = dx * dx + dy * dy + 0.004
  vx += (-dy / d2) * s
  vy += (dx / d2) * s
  // source
  dx = x - 0.7
  dy = y - 0.35
  d2 = dx * dx + dy * dy + 0.004
  const inv = 1 / Math.sqrt(d2)
  vx += dx * inv * src
  vy += dy * inv * src
  // saddle: along x compress, along y expand
  dx = x - 0.65
  dy = y - 0.7
  d2 = dx * dx + dy * dy + 0.004
  vx += (-dx / d2) * sd
  vy += (dy / d2) * sd
  return [vx, vy]
}

export function LICFlowField(props: LICFlowFieldProps) {
  const [own, rest] = splitProps(props, [
    'vortex',
    'source',
    'saddle',
    'streamlineLength',
    'seed',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 420
  const height = () => own.height ?? 280
  const L = () => own.streamlineLength ?? 24

  let canvas!: HTMLCanvasElement
  let licCache: HTMLCanvasElement | null = null
  const [genLabel, setGenLabel] = createSignal('')

  // LIC over the texture grid
  const renderLIC = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const gw = width() >> 1 // half-res texture, upscaled on draw
    const gh = height() >> 1
    const n = gw * gh
    const noise = new Float32Array(n)
    const rng = mulberry32((own.seed ?? 1) >>> 0)
    for (let i = 0; i < n; i++) noise[i] = rng()

    const img = ctx.createImageData(gw, gh)
    const { s, src, sd } = params()
    const steps = L()

    for (let py = 0; py < gh; py++) {
      for (let px = 0; px < gw; px++) {
        const x = (px + 0.5) / gw
        const y = (py + 0.5) / gh
        // advect the noise value along the streamline (forward + backward)
        let acc = 0
        let wsum = 0
        let cx = x
        let cy = y
        for (let k = 0; k < steps; k++) {
          const nx = Math.min(0.9999, Math.max(0, cx))
          const ny = Math.min(0.9999, Math.max(0, cy))
          const ni = Math.floor(ny * gh) * gw + Math.floor(nx * gw)
          const w = 1 - k / steps
          acc += noise[ni] * w
          wsum += w
          const [vx, vy] = fieldAt(nx, ny, s, src, sd)
          const mag = Math.hypot(vx, vy) + 1e-6
          cx += (vx / mag) * (1.5 / gw)
          cy += (vy / mag) * (1.5 / gh)
        }
        cx = x
        cy = y
        for (let k = 1; k < steps; k++) {
          const [vx, vy] = fieldAt(cx, cy, s, src, sd)
          const mag = Math.hypot(vx, vy) + 1e-6
          cx += (vx / mag) * (1.5 / gw) * -1
          cy += (vy / mag) * (1.5 / gh) * -1
          const nx = Math.min(0.9999, Math.max(0, cx))
          const ny = Math.min(0.9999, Math.max(0, cy))
          const w = 1 - k / steps
          acc += noise[Math.floor(ny * gh) * gw + Math.floor(nx * gw)] * w
          wsum += w
        }
        const v = acc / (wsum || 1)
        // map to a cool slate ramp with contrast
        const idx = (py * gw + px) * 4
        const shade = 38 + (v > 0.5 ? 1 : v < 0.45 ? -1 : 0) * 22 + (v - 0.5) * 30
        img.data[idx] = Math.max(10, Math.min(90, shade + 8))
        img.data[idx + 1] = Math.max(12, Math.min(96, shade + 12))
        img.data[idx + 2] = Math.max(16, Math.min(110, shade + 22))
        img.data[idx + 3] = 255
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.imageSmoothingEnabled = true
    const tmp = document.createElement('canvas')
    tmp.width = gw
    tmp.height = gh
    tmp.getContext('2d')?.putImageData(img, 0, 0)
    licCache = tmp
    ctx.drawImage(tmp, 0, 0, width(), height())
    setGenLabel(`${(steps * 2).toFixed(0)}-step LIC · seed ${own.seed ?? 1}`)
  }

  const [params, setParams] = createSignal({
    s: own.vortex ?? 1,
    src: own.source ?? 0.7,
    sd: own.saddle ?? 0.5,
  })

  const onHover = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const [vx, vy] = fieldAt(x, y, params().s, params().src, params().sd)
    setGenLabel(`probe (${x.toFixed(2)}, ${y.toFixed(2)}) → v (${vx.toFixed(2)}, ${vy.toFixed(2)})`)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (licCache) {
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(licCache, 0, 0, width(), height())
    }
    const sx = x * width()
    const sy = y * height()
    ctx.fillStyle = 'oklch(0.95 0.15 85)'
    ctx.beginPath()
    ctx.arc(sx, sy, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  onMount(() => {
    renderLIC()
  })

  const onChange = (key: 'vortex' | 'source' | 'saddle', v: number) => {
    setParams(p => ({ ...p, [key]: v }))
    renderLIC()
  }

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
        class="w-full cursor-crosshair rounded-lg"
        style={{ 'max-width': `${width()}px` }}
        onPointerMove={onHover}
        role="img"
        aria-label={`${own.label ?? 'LIC flow field'} — vortex/source/saddle phase portrait as line-integral convolution`}
      />
      <figcaption class="mt-1.5 flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-400">
        <span>{own.label ?? 'LIC flow field'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          <label class="flex items-center gap-1">
            vortex
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={params().s}
              onInput={e => onChange('vortex', Number(e.currentTarget.value))}
              class="h-1 w-16 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
              aria-label="vortex strength"
            />
          </label>
          <label class="flex items-center gap-1">
            source
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={params().src}
              onInput={e => onChange('source', Number(e.currentTarget.value))}
              class="h-1 w-16 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
              aria-label="source strength"
            />
          </label>
          <label class="flex items-center gap-1">
            saddle
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={params().sd}
              onInput={e => onChange('saddle', Number(e.currentTarget.value))}
              class="h-1 w-16 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
              aria-label="saddle strength"
            />
          </label>
          <span aria-live="polite">{genLabel()}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export default LICFlowField
