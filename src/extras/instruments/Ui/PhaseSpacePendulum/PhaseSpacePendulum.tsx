// solid-fx Instruments widget — original component (not a port).
// Hamiltonian/symplectic coupled control: drag in (θ, ω) phase space and the
// pendulum state moves along the iso-energy contour H = ½ω² + (g/L)(1−cosθ).
// Invalid states are unreachable by construction — energy is conserved along
// the drag path (research 04 #8).
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface PhaseSpacePendulumProps {
  /** Pendulum length factor g/L (default 1). */
  gravity?: number
  /** Initial angle in radians (default 0.6). */
  theta?: number
  /** Initial angular velocity in rad/s (default 0). */
  omega?: number
  /** Plot width in px (default 360). */
  width?: number
  /** Plot height in px (default 260). */
  height?: number
  /** Integrate the orbit live (default true; forced off under reduced motion). */
  animate?: boolean
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const THETA_MAX = Math.PI * 1.25 // phase-space half-width in radians
const OMEGA_MAX = 4.5 // phase-space half-height in rad/s

export function PhaseSpacePendulum(props: PhaseSpacePendulumProps) {
  const [own, rest] = splitProps(props, [
    'gravity',
    'theta',
    'omega',
    'width',
    'height',
    'animate',
    'label',
    'class',
    'className',
    'style',
  ])

  const g = () => own.gravity ?? 1
  const width = () => own.width ?? 360
  const height = () => own.height ?? 260
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const animating = () => (own.animate ?? true) && !reduced

  // state
  let theta = own.theta ?? 0.6
  let omega = own.omega ?? 0
  const [energy, setEnergy] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)
  let canvas!: HTMLCanvasElement
  let raf = 0

  const H = (th: number, om: number) => 0.5 * om * om + g() * (1 - Math.cos(th))

  const toScreen = (th: number, om: number): [number, number] => [
    ((th + THETA_MAX) / (2 * THETA_MAX)) * width(),
    ((OMEGA_MAX - om) / (2 * OMEGA_MAX)) * height(),
  ]
  const fromScreen = (sx: number, sy: number): [number, number] => [
    (sx / width()) * 2 * THETA_MAX - THETA_MAX,
    OMEGA_MAX - (sy / height()) * 2 * OMEGA_MAX,
  ]

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

    // axes
    ctx.strokeStyle = 'oklch(0.32 0.02 250)'
    ctx.lineWidth = 1
    const [ax, ay] = toScreen(0, 0)
    ctx.beginPath()
    ctx.moveTo(0, ay)
    ctx.lineTo(width(), ay)
    ctx.moveTo(ax, 0)
    ctx.lineTo(ax, height())
    ctx.stroke()
    ctx.fillStyle = 'oklch(0.55 0.02 250)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillText('θ', width() - 12, ay - 4)
    ctx.fillText('ω', ax + 4, 12)

    // separatrix H = 2g: the orbit separating libration from rotation
    // ω² = 2(H − V) with H = 2g, V = g(1 − cosθ) ⇒ ω² = 2g(1 + cosθ)
    ctx.strokeStyle = 'oklch(0.4 0.03 85)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    let sepFirst = true
    for (let px = 0; px <= width(); px += 2) {
      const th = fromScreen(px, 0)[0]
      const om = Math.sqrt(Math.max(0, 2 * g() * (1 + Math.cos(th))))
      const [sx, syTop] = toScreen(th, om)
      const [, syBot] = toScreen(th, -om)
      if (sepFirst) {
        ctx.moveTo(sx, syTop)
        sepFirst = false
      } else ctx.lineTo(sx, syTop)
      ctx.lineTo(sx, syBot)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // the iso-energy contour through the current state
    const H0 = H(theta, omega)
    ctx.strokeStyle = 'oklch(0.62 0.12 235)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    let first = true
    for (let px = 0; px <= width(); px += 2) {
      const th = fromScreen(px, 0)[0]
      const om2 = 2 * (H0 - g() * (1 - Math.cos(th)))
      if (om2 < 0) {
        first = true
        continue
      }
      const [sx, sy] = toScreen(th, Math.sqrt(om2))
      if (first) {
        ctx.moveTo(sx, sy)
        first = false
      } else ctx.lineTo(sx, sy)
    }
    ctx.stroke()
    ctx.beginPath()
    first = true
    for (let px = 0; px <= width(); px += 2) {
      const th = fromScreen(px, 0)[0]
      const om2 = 2 * (H0 - g() * (1 - Math.cos(th)))
      if (om2 < 0) {
        first = true
        continue
      }
      const [sx, sy] = toScreen(th, -Math.sqrt(om2))
      if (first) {
        ctx.moveTo(sx, sy)
        first = false
      } else ctx.lineTo(sx, sy)
    }
    ctx.stroke()

    // state dot
    const [dx, dy] = toScreen(theta, omega)
    ctx.fillStyle = 'oklch(0.95 0.78 0.42)'
    ctx.beginPath()
    ctx.arc(dx, dy, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // symplectic (semi-implicit) Euler: H drifts only at O(dt)
  const integrate = (steps: number) => {
    const dt = 0.016 / steps
    for (let i = 0; i < steps; i++) {
      omega += -g() * Math.sin(theta) * dt
      theta += omega * dt
    }
    // wrap θ into the plotted window
    while (theta > THETA_MAX) theta -= 2 * Math.PI
    while (theta < -THETA_MAX) theta += 2 * Math.PI
  }

  const loop = () => {
    integrate(4)
    draw()
    setEnergy(H(theta, omega))
    raf = requestAnimationFrame(loop)
  }

  const onPointerDown = (event: PointerEvent) => {
    ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
    setDragging(true)
    const rect = canvas.getBoundingClientRect()
    const [th, om] = fromScreen(event.clientX - rect.left, event.clientY - rect.top)
    theta = Math.max(-THETA_MAX, Math.min(THETA_MAX, th))
    omega = Math.max(-OMEGA_MAX, Math.min(OMEGA_MAX, om))
    setEnergy(H(theta, omega))
    draw()
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging()) return
    const rect = canvas.getBoundingClientRect()
    const [th, om] = fromScreen(event.clientX - rect.left, event.clientY - rect.top)
    theta = Math.max(-THETA_MAX, Math.min(THETA_MAX, th))
    omega = Math.max(-OMEGA_MAX, Math.min(OMEGA_MAX, om))
    setEnergy(H(theta, omega))
    draw()
  }

  const onPointerUp = (event: PointerEvent) => {
    setDragging(false)
    ;(event.currentTarget as HTMLCanvasElement).releasePointerCapture(event.pointerId)
  }

  onMount(() => {
    setEnergy(H(theta, omega))
    draw()
    if (animating()) loop()
    onCleanup(() => cancelAnimationFrame(raf))
  })

  return (
    <figure
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {/* biome-ignore lint/a11y/useFocusableInteractive: phase-plane
          control — drag + pointer capture; keyboard arrows nudge θ */}
      <canvas
        ref={canvas}
        style={{ width: `${width()}px`, height: `${height()}px` }}
        class="w-full cursor-crosshair touch-none rounded-lg"
        role="slider"
        aria-label={own.label ?? 'pendulum phase space'}
        aria-valuemin={-THETA_MAX}
        aria-valuemax={THETA_MAX}
        aria-valuenow={Math.round(theta * 100) / 100}
        aria-valuetext={`θ ${theta.toFixed(2)} rad, ω ${omega.toFixed(2)} rad/s, H ${energy().toFixed(3)}`}
        tabindex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft') theta -= 0.1
          if (e.key === 'ArrowRight') theta += 0.1
          if (e.key === 'ArrowUp') omega += 0.2
          if (e.key === 'ArrowDown') omega -= 0.2
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault()
            setEnergy(H(theta, omega))
            draw()
          }
        }}
      />
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'pendulum phase space'}</span>
        <span class="font-mono text-[10px] text-gray-500">
          H = {energy().toFixed(3)} · dashed = separatrix (H = 2g)
        </span>
      </figcaption>
    </figure>
  )
}

export default PhaseSpacePendulum
