// solid-fx Instruments widget — original component (not a port).
// Langevin stochastic scrubber: the value follows overdamped Langevin
// dynamics dx = −V'(x)·dt + √(2T)·dW on a rough potential, so a temperature
// dial turns the same control from a deterministic scrub (T → 0) into a
// stochastic explorer that escapes local minima (research 04 #15).
// Deterministic per seed (mulberry32 Box-Muller, shared kernel).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface LangevinScrubberProps {
  /** Potential samples over [0, 1] (x⁻ direction: left = 0). Default: double well. */
  potential?: number[]
  /** Initial position in [0, 1] (default 0.15). */
  initial?: number
  /** Temperature (default 0.02; 0 = deterministic scrub). */
  temperature?: number
  /** Simulation step per frame (default 240). */
  dt?: number
  /** RNG seed — same seed ⇒ identical trajectory (default 1). */
  seed?: number
  /** Track width in px (default 360). */
  width?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function LangevinScrubber(props: LangevinScrubberProps) {
  const [own, rest] = splitProps(props, [
    'potential',
    'initial',
    'temperature',
    'dt',
    'seed',
    'width',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 360
  const potential = () => own.potential ?? defaultDoubleWell()
  const dt = () => own.dt ?? 240
  const temperature = () => own.temperature ?? 0.02
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // V over [0,1]: gradient by central differences on the sample array
  const grad = (x: number): number => {
    const p = potential()
    const n = p.length - 1
    const f = Math.min(n - 1, Math.max(0, Math.round(x * n)))
    const l = p[Math.max(0, f - 1)]
    const r = p[Math.min(n, f + 1)]
    return (r - l) / (2 / n)
  }

  function defaultDoubleWell(): number[] {
    const out: number[] = []
    for (let i = 0; i <= 64; i++) {
      const x = (i / 64) * 4 - 2
      out.push((x * x - 1) * (x * x - 1) * 0.25)
    }
    return out
  }

  let x = own.initial ?? 0.15
  const [pos, setPos] = createSignal(x)
  const [temp, setTemp] = createSignal(own.temperature ?? 0.02)
  const [running, setRunning] = createSignal(!reduced)
  let canvas!: HTMLCanvasElement
  let raf = 0
  const rng = mulberry32(own.seed ?? 7)
  const randn = (): number => {
    // Box-Muller from the seeded uniform stream
    const u = Math.max(1e-12, rng())
    const v = rng()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const height = 64

  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (canvas.width !== width() * dpr) {
      canvas.width = width() * dpr
      canvas.height = height * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = 'oklch(0.18 0.02 250)'
    ctx.fillRect(0, 0, width(), height)
    // potential curve (inverted: low V at bottom)
    const p = potential()
    ctx.strokeStyle = 'oklch(0.5 0.03 250)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    p.forEach((v, i) => {
      const sx = (i / (p.length - 1)) * width()
      const sy = height - 6 - v * (height - 14)
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    })
    ctx.stroke()
    // the particle
    const sx = x * width()
    const v = potential()[Math.min(p.length - 1, Math.round(x * (p.length - 1)))]
    const sy = height - 6 - v * (height - 14)
    ctx.fillStyle = 'oklch(0.95 0.15 85)'
    ctx.beginPath()
    ctx.arc(sx, sy - 3, 4, 0, Math.PI * 2)
    ctx.fill()
    // position marker on the track baseline
    ctx.fillStyle = 'oklch(0.72 0.12 235)'
    ctx.fillRect(sx - 1, height - 4, 2, 3)
  }

  const step = () => {
    // overdamped Langevin: x += −V'(x)·dt + sqrt(2T)·√dt·N(0,1)
    const drift = -grad(x) * 0.4
    const noise = Math.sqrt(2 * temperature() * 0.0004) * randn()
    x = Math.min(1, Math.max(0, x + drift + noise))
    setPos(x)
    draw()
  }

  const loop = () => {
    for (let i = 0; i < dt(); i++) step()
    raf = requestAnimationFrame(loop)
  }

  const onTrackPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setPos(x)
    draw()
  }

  onMount(() => {
    draw()
    if (running()) loop()
    onCleanup(() => cancelAnimationFrame(raf))
  })

  const toggle = () => {
    const next = !running()
    setRunning(next)
    cancelAnimationFrame(raf)
    if (next) loop()
  }

  return (
    <figure
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <canvas
        ref={canvas}
        style={{ width: `${width()}px`, height: `${height}px` }}
        class="w-full cursor-ew-resize touch-none rounded-lg"
        aria-label={`${own.label ?? 'Langevin scrubber'} — position ${pos().toFixed(3)}, temperature ${temp().toFixed(3)}. Click to reposition.`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={Math.round(pos() * 1000) / 1000}
        tabindex={0}
        onPointerDown={onTrackPointer}
        onPointerMove={(e: PointerEvent) => {
          if (e.buttons > 0) onTrackPointer(e)
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft') x = Math.max(0, x - 0.02)
          if (e.key === 'ArrowRight') x = Math.min(1, x + 0.02)
          if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault()
            setPos(x)
            draw()
          }
        }}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-gray-400">
        <span>{own.label ?? 'Langevin scrubber'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          x = {pos().toFixed(3)}
          <label class="flex items-center gap-1">
            T
            <input
              type="range"
              min={0}
              max={0.2}
              step={0.005}
              value={temp()}
              onInput={e => setTemp(Number(e.currentTarget.value))}
              class="h-1 w-20 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
              aria-label="temperature"
            />
          </label>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={toggle}
          >
            {running() ? 'pause' : 'run'}
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

export default LangevinScrubber
