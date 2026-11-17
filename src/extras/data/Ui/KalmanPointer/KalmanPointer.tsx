// solid-fx Data widget — original component (not a port).
// Kalman-stabilized pointer trail: the raw pointer stream (dim) against the
// 1D-per-axis Kalman-filtered stream (bright) — hand tremor vs intent,
// separated live (research 03 #59). Uses the shared Kalman1D kernel.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { Kalman1D } from '@/lib/num'

export interface KalmanPointerProps {
  /** Process noise q (default 0.02 — higher follows faster). */
  processNoise?: number
  /** Measurement noise r (default 2.5 — higher smooths harder). */
  measurementNoise?: number
  /** Canvas width in px (default 420). */
  width?: number
  /** Canvas height in px (default 260). */
  height?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface Pt {
  x: number
  y: number
}

export function KalmanPointer(props: KalmanPointerProps) {
  const [own, rest] = splitProps(props, [
    'processNoise',
    'measurementNoise',
    'width',
    'height',
    'label',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 420
  const height = () => own.height ?? 260

  let canvas!: HTMLCanvasElement
  const raw: Pt[] = []
  const filtered: Pt[] = []
  let kx = new Kalman1D(own.processNoise ?? 0.02, own.measurementNoise ?? 2.5)
  let ky = new Kalman1D(own.processNoise ?? 0.02, own.measurementNoise ?? 2.5)
  const [samples, setSamples] = createSignal(0)
  const [running, setRunning] = createSignal(false)

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

    // raw trail
    ctx.strokeStyle = 'oklch(0.45 0.02 250)'
    ctx.lineWidth = 1
    ctx.beginPath()
    raw.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // filtered trail
    ctx.strokeStyle = 'oklch(0.78 0.12 235)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    filtered.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // latest points
    const lastRaw = raw[raw.length - 1]
    const lastF = filtered[filtered.length - 1]
    if (lastRaw) {
      ctx.fillStyle = 'oklch(0.6 0.02 250)'
      ctx.beginPath()
      ctx.arc(lastRaw.x, lastRaw.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    if (lastF) {
      ctx.fillStyle = 'oklch(0.78 0.12 235)'
      ctx.beginPath()
      ctx.arc(lastF.x, lastF.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const push = (x: number, y: number) => {
    raw.push({ x, y })
    if (raw.length > 400) raw.shift()
    filtered.push({ x: kx.update(x), y: ky.update(y) })
    if (filtered.length > 400) filtered.shift()
    setSamples(samples() + 1)
    draw()
  }

  // slow synthetic sweep when the pointer is idle — keeps the demo alive
  let t = 0
  const idleLoop = () => {
    t += 0.03
    const jitterX = (Math.random() - 0.5) * 6
    const jitterY = (Math.random() - 0.5) * 6
    const x = width() / 2 + Math.sin(t) * (width() / 2 - 30) + jitterX
    const y = height() / 2 + Math.cos(t * 1.7) * (height() / 2 - 30) + jitterY
    if (running()) {
      push(x, y)
      // readPixels-free: present continuously under SwiftShader
      draw()
    }
    idleRaf = requestAnimationFrame(idleLoop)
  }
  let idleRaf = 0

  const toggle = () => {
    const next = !running()
    setRunning(next)
    if (next) {
      kx = new Kalman1D(own.processNoise ?? 0.02, own.measurementNoise ?? 2.5)
      ky = new Kalman1D(own.processNoise ?? 0.02, own.measurementNoise ?? 2.5)
    }
  }

  onMount(() => {
    // headless/demo mode: synthesize the pointer when idle
    setRunning(true)
    idleLoop()
    onCleanup(() => cancelAnimationFrame(idleRaf))
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
        class="w-full touch-none rounded-lg"
        style={{ 'max-width': `${width()}px` }}
        role="img"
        aria-label={`${own.label ?? 'Kalman pointer'} — ${samples()} samples filtered`}
        onPointerMove={e => {
          const rect = canvas.getBoundingClientRect()
          setRunning(false)
          push(e.clientX - rect.left, e.clientY - rect.top)
        }}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'kalman pointer'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          n {samples()}
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={toggle}
          >
            {running() ? 'pause synth' : 'resume synth'}
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

export default KalmanPointer
