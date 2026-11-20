// solid-fx Emergent widget — original component (not a port).
// Physarum growth network (research 04 #24): agents deposit trail onto a
// field, the field diffuses and decays, and agents steer toward the
// strongest trail — the slime-mold transport-network loop. The network
// self-organizes from random walkers; fully deterministic per seed (the
// agent jitter is drawn from one seeded stream). Trail simulation runs on
// typed arrays (65k-cell field, sub-millisecond passes) presented via
// ImageData; paused + 120 static generations under reduced motion.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface PhysarumGrowthProps {
  /** Agent count (default 1400). */
  agents?: number
  /** Trail decay per generation, 0–1 (default 0.08). */
  decay?: number
  /** Deposit amount per agent per step (default 12). */
  deposit?: number
  /** Sensor angle in radians (default 0.45). */
  sensorAngle?: number
  /** RNG seed — identical growth across users (default 1). */
  seed?: number
  /** Canvas width in px (default 420). */
  width?: number
  /** Canvas height in px (default 300). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function PhysarumGrowth(props: PhysarumGrowthProps) {
  const [own, rest] = splitProps(props, [
    'agents',
    'decay',
    'deposit',
    'sensorAngle',
    'seed',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 420
  const height = () => own.height ?? 300
  const w = () => width() >> 1
  const h = () => height() >> 1
  const n = () => w() * h()
  const count = () => own.agents ?? 1400

  const [running, setRunning] = createSignal(true)
  const [genLabel, setGenLabel] = createSignal('generation 0')
  let canvas!: HTMLCanvasElement
  let raf = 0

  // simulation state (typed arrays; the whole field is 65k floats)
  let trail: Float32Array
  let next: Float32Array
  let ax: Float32Array
  let ay: Float32Array
  let av: Float32Array // heading angles
  let gen = 0

  let rng = mulberry32((own.seed ?? 1) >>> 0)

  const init = () => {
    trail = new Float32Array(n())
    next = new Float32Array(n())
    ax = new Float32Array(count())
    ay = new Float32Array(count())
    av = new Float32Array(count())
    const cx = w() / 2
    const cy = h() / 2
    for (let i = 0; i < count(); i++) {
      ax[i] = cx + (rng() - 0.5) * 8
      ay[i] = cy + (rng() - 0.5) * 8
      av[i] = rng() * Math.PI * 2
    }
    gen = 0
    setGenLabel('generation 0')
  }

  const sample = (x: number, y: number): number => {
    const xi = Math.min(w() - 1, Math.max(0, Math.floor(x)))
    const yi = Math.min(h() - 1, Math.max(0, Math.floor(y)))
    return trail[yi * w() + xi]
  }

  const step = () => {
    const wv = w()
    const hv = h()
    const sensorDist = 4
    const sensorAngle = own.sensorAngle ?? 0.45
    const deposit = own.deposit ?? 12
    for (let i = 0; i < count(); i++) {
      const a = av[i]
      const sl = sample(
        ax[i] - sensorDist * Math.cos(a - sensorAngle),
        ay[i] - sensorDist * Math.sin(a - sensorAngle),
      )
      const sc = sample(ax[i] + sensorDist * Math.cos(a), ay[i] + sensorDist * Math.sin(a))
      const sr = sample(
        ax[i] + sensorDist * Math.cos(a + sensorAngle),
        ay[i] + sensorDist * Math.sin(a + sensorAngle),
      )
      if (sc > sl && sc > sr) {
        // straight
      } else if (sl > sr) {
        av[i] = a - 0.25
      } else if (sr > sl) {
        av[i] = a + 0.25
      } else {
        av[i] = a + (rng() - 0.5) * 0.2
      }
      ax[i] = Math.min(wv - 1.01, Math.max(0, ax[i] + Math.cos(av[i]) * 1.4))
      ay[i] = Math.min(hv - 1.01, Math.max(0, ay[i] + Math.sin(av[i]) * 1.4))
      trail[Math.floor(ay[i]) * wv + Math.floor(ax[i])] += own.deposit ?? 12
    }
    // 3×3 diffuse + decay
    const decay = 1 - (own.decay ?? 0.08)
    for (let y = 0; y < hv; y++) {
      for (let x = 0; x < wv; x++) {
        const i = y * wv + x
        const l = x > 0 ? trail[i - 1] : trail[i]
        const r = x < wv - 1 ? trail[i + 1] : trail[i]
        const u = y > 0 ? trail[i - wv] : trail[i]
        const d = y < hv - 1 ? trail[i + wv] : trail[i]
        next[i] = ((trail[i] * 4 + l + r + u + d) / 8) * decay
      }
    }
    ;[trail, next] = [next, trail]
    gen += 1
  }

  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(w(), h())
    for (let i = 0; i < n(); i++) {
      const v = Math.min(1, trail[i] / 24)
      img.data[i * 4] = Math.round(20 + v * 210)
      img.data[i * 4 + 1] = Math.round(24 + v * 200)
      img.data[i * 4 + 2] = Math.round(30 + v * 120)
      img.data[i * 4 + 3] = 255
    }
    const tmp = document.createElement('canvas')
    tmp.width = w()
    tmp.height = h()
    tmp.getContext('2d')?.putImageData(img, 0, 0)
    ctx.drawImage(tmp, 0, 0, width(), height())
  }

  const frame = () => {
    step()
    draw()
    if (gen % 20 === 0) setGenLabel(`generation ${gen}`)
  }

  const loop = () => {
    frame()
    raf = requestAnimationFrame(loop)
  }

  onMount(() => {
    init()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      for (let i = 0; i < 120; i++) step()
      draw()
    } else {
      loop()
    }
    onCleanup(() => cancelAnimationFrame(raf))
  })

  const toggle = () => {
    const nextRunning = !running()
    setRunning(nextRunning)
    cancelAnimationFrame(raf)
    if (nextRunning) loop()
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
        class="w-full rounded-lg"
        style={{ 'max-width': `${width()}px` }}
        role="img"
        aria-label={`${own.label ?? 'Physarum growth'} — ${count()} agents at generation ${gen}`}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'Physarum growth'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          {genLabel()}
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

export default PhysarumGrowth
