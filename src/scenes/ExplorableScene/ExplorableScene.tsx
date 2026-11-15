// solid-fx scenes layer — composition, not a port.
// ExplorableScene: Bret-Victor-style inline reactivity inside a strict
// typographic column. Parameters scrub directly inside the prose sentences;
// the sticky figure recomputes live; margin notes carry the derivations.
// Canvas2D only — no framework reactivity tricks beyond Solid signals.
import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup } from 'solid-js'

export interface ExplorableSceneProps {
  /** Damping ratio zeta (default 0.15). */
  damping?: number
  /** Undamped frequency omega in rad/s (default 6). */
  frequency?: number
  /** Figure width in px (default 480). */
  width?: number
  class?: string
  style?: JSX.CSSProperties
}

export function ExplorableScene(props: ExplorableSceneProps) {
  const [zeta, setZeta] = createSignal(props.damping ?? 0.15)
  const [omega, setOmega] = createSignal(props.frequency ?? 6)
  const width = () => props.width ?? 480
  const height = 260

  let canvas!: HTMLCanvasElement

  // damped harmonic solution: x(t) = e^(-zeta*omega*t) * cos(sqrt(1-z^2)*omega*t)
  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = width()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (canvas.width !== w * dpr) {
      canvas.width = w * dpr
      canvas.height = height * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = 'oklch(0.18 0.02 250)'
    ctx.fillRect(0, 0, w, height)

    const z = zeta()
    const om = omega()
    const tMax = 12 / om / Math.max(0.25, 1 - z) // keep a few periods in view
    const mid = height / 2
    const amp = (height / 2 - 18) * (0.4 + 0.6 * z)

    // grid
    ctx.strokeStyle = 'oklch(0.26 0.02 250)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= w; gx += w / 12) {
      ctx.beginPath()
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, height)
      ctx.stroke()
    }
    // zero line + envelope
    ctx.strokeStyle = 'oklch(0.4 0.02 250)'
    ctx.beginPath()
    ctx.moveTo(0, mid)
    ctx.lineTo(w, mid)
    ctx.stroke()
    ctx.strokeStyle = 'oklch(0.5 0.1 85)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let px = 0; px <= w; px += 2) {
      const t = (px / w) * tMax
      const env = Math.exp(-z * om * t) * amp
      const y = mid - env
      if (px === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    }
    ctx.stroke()
    ctx.beginPath()
    for (let px = 0; px <= w; px += 2) {
      const t = (px / w) * tMax
      const env = Math.exp(-z * om * t) * amp
      const y = mid + env
      if (px === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // solution
    ctx.strokeStyle = 'oklch(0.78 0.12 235)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let px = 0; px <= w; px += 1) {
      const t = (px / w) * tMax
      const under = Math.sqrt(Math.max(0, 1 - z * z))
      const y = mid - Math.exp(-z * om * t) * amp * Math.cos(under * om * t)
      if (px === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    }
    ctx.stroke()
  }

  createEffect(draw)
  onCleanup(() => {})

  const slider = (
    label: string,
    value: () => number,
    set: (v: number) => void,
    min: number,
    max: number,
    step: number,
    format: (v: number) => string,
  ): JSX.Element => (
    <label class="inline-flex items-baseline gap-1.5">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value()}
        onInput={e => set(Number(e.currentTarget.value))}
        class="h-1 w-32 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
      />
      <span class="font-mono text-sky-300">{format(value())}</span>
    </label>
  )

  return (
    <div
      class={`grid w-full justify-items-center gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,30rem)] lg:items-start ${props.class ?? ''}`}
      style={props.style}
    >
      <article class="space-y-4 text-[15px] leading-7 text-gray-300">
        <p>
          A pendulum settles because it loses energy at a rate set by its damping ratio{' '}
          {slider('ζ', zeta, setZeta, 0, 0.6, 0.01, v => v.toFixed(2))}. At zero the swing never
          dies; past roughly 0.3 the return is so gentle that the system creeps home without
          overshooting — the critically damped feel every good UI transition imitates.
        </p>
        <p>
          The undamped frequency{' '}
          {slider('ω', omega, setOmega, 2, 12, 0.5, v => `${v.toFixed(1)} rad/s`)} sets the tempo.
          Watch the dashed envelope: it is pure exponent decay, e^(−ζωt), and the oscillation inside
          it always fits an integer-ish number of beats — which is why the same ζ feels slower at
          low ω.
        </p>
        <p class="text-gray-400">
          Drag either value inside the sentence. The figure is not a video — it is the live solution
          of x(t) = e^(−ζωt)·cos(√(1−ζ²)·ωt), recomputed per scrub. That is the explorable grammar:
          parameters live where the claims are.
        </p>
      </article>
      <figure class="lg:sticky lg:top-8">
        <canvas
          ref={canvas}
          style={{ width: `${width()}px`, height: `${height}px` }}
          class="w-full rounded-lg"
          role="img"
          aria-label={`damped oscillation with zeta ${zeta()} and omega ${omega()}`}
        />
        <figcaption class="mt-1.5 text-xs text-gray-500">
          sticky figure — re-solves live while the prose scrubs
        </figcaption>
      </figure>
    </div>
  )
}

export default ExplorableScene
