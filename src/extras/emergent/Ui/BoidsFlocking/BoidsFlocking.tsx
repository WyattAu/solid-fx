// solid-fx Emergent widget — original component (not a port).
// Boids flocking search results: results self-organize via the classic
// separation/alignment/cohesion rules while the pointer acts as a query
// attractor herding relevant items inward (research 04 #28). Deterministic
// per seed; paused under prefers-reduced-motion (static scatter shown).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface BoidsFlockingProps {
  /** Boid count (default 120). */
  count?: number
  /** RNG seed — identical flocks across users (default 1). */
  seed?: number
  /** Query-attractor strength (default 0.6; 0 = pure flocking). */
  attractor?: number
  /** Canvas width in px (default 420). */
  width?: number
  /** Canvas height in px (default 300). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface Boid {
  x: number
  y: number
  vx: number
  vy: number
  label: string
}

export function BoidsFlocking(props: BoidsFlockingProps) {
  const [own, rest] = splitProps(props, [
    'count',
    'seed',
    'attractor',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 420
  const height = () => own.height ?? 300
  const count = () => own.count ?? 120
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const flock: Boid[] = []
  const rng = mulberry32((own.seed ?? 1) >>> 0)
  const WORDS = ['result', 'match', 'doc', 'item', 'hit', 'node', 'card', 'entry']
  for (let i = 0; i < count(); i++) {
    flock.push({
      x: rng() * width(),
      y: rng() * height(),
      vx: (rng() - 0.5) * 40,
      vy: (rng() - 0.5) * 40,
      label: `${WORDS[i % WORDS.length]}-${String(i).padStart(3, '0')}`,
    })
  }

  const [running, setRunning] = createSignal(!reduced)
  const [hoverLabel, setHoverLabel] = createSignal('—')
  let canvas!: HTMLCanvasElement
  let raf = 0
  let pointer: { x: number; y: number } | null = null

  const step = () => {
    const ar = own.attractor ?? 0.6
    for (const b of flock) {
      let ax = 0
      let ay = 0
      let cx = 0
      let cy = 0
      let vx = 0
      let vy = 0
      let n = 0
      for (const o of flock) {
        if (o === b) continue
        const dx = o.x - b.x
        const dy = o.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 > 3600) continue // neighbor radius 60px
        n += 1
        cx += o.x
        cy += o.y
        vx += o.vx
        vy += o.vy
        if (d2 < 400) {
          // separation: strong short-range repulsion
          ax -= dx / d2
          ay -= dy / d2
        }
      }
      if (n > 0) {
        // cohesion toward the local center + alignment with local velocity
        ax += (cx / n - b.x) * 0.004
        ay += (cy / n - b.y) * 0.004
        ax += (vx / n - b.vx) * 0.05
        ay += (vy / n - b.vy) * 0.05
      }
      // query attractor
      if (pointer && ar > 0) {
        ax += (pointer.x - b.x) * 0.00012 * ar * 100
        ay += (pointer.y - b.y) * 0.00012 * ar * 100
      }
      b.vx += ax
      b.vy += ay
      // clamp speed
      const sp = Math.hypot(b.vx, b.vy)
      const max = 90
      if (sp > max) {
        b.vx = (b.vx / sp) * max
        b.vy = (b.vy / sp) * max
      }
      if (sp < 18) {
        b.vx = (b.vx / (sp || 1)) * 18
        b.vy = (b.vy / (sp || 1)) * 18
      }
      b.x += b.vx * 0.016
      b.y += b.vy * 0.016
      // wrap
      if (b.x < 0) b.x += width()
      if (b.x > width()) b.x -= width()
      if (b.y < 0) b.y += height()
      if (b.y > height()) b.y -= height()
    }
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
    if (pointer) {
      ctx.strokeStyle = 'oklch(0.5 0.08 85)'
      ctx.beginPath()
      ctx.arc(pointer.x, pointer.y, 14, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (const b of flock) {
      ctx.fillStyle = 'oklch(0.72 0.12 235)'
      ctx.beginPath()
      ctx.arc(b.x, b.y, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
    // nearest boid label (readout for the hover label signal)
    if (pointer) {
      let best: Boid | null = null
      let bestD = Number.POSITIVE_INFINITY
      for (const b of flock) {
        const d = Math.hypot(b.x - pointer.x, b.y - pointer.y)
        if (d < bestD) {
          bestD = d
          best = b
        }
      }
      if (best && bestD < 60) {
        ctx.fillStyle = 'oklch(0.95 0.15 85)'
        ctx.beginPath()
        ctx.arc(best.x, best.y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '10px ui-monospace, monospace'
        ctx.fillText(best.label, best.x + 6, best.y - 6)
        setHoverLabel(best.label)
      }
    }
  }

  const loop = () => {
    step()
    draw()
    raf = requestAnimationFrame(loop)
  }

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const onPointerLeave = () => {
    pointer = null
    setHoverLabel('—')
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
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <canvas
        ref={canvas}
        width={width()}
        height={height()}
        class="w-full cursor-crosshair touch-none rounded-lg"
        style={{ 'max-width': `${width()}px` }}
        aria-label={`${own.label ?? 'boids flocking'} — ${count()} items; pointer attracts the flock`}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'flocking search'}</span>
        <span class="font-mono text-[10px] text-gray-500" aria-live="polite">
          {hoverLabel()} · {count()} items{running() ? '' : ' · paused'}
        </span>
      </figcaption>
      <button
        type="button"
        class="mt-1 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
        onClick={toggle}
      >
        {running() ? 'pause' : 'run'}
      </button>
    </figure>
  )
}

export default BoidsFlocking
