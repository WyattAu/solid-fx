// solid-fx Instruments widget — original component (not a port).
// Continuous polar micrometer dial for periodic inputs (azimuth, phase,
// seasonality): multi-turn rings via atan2 with winding-number accumulation,
// so dragging across 0°/360° never snaps or jumps. `turns` > 1 extends the
// range (e.g. 3 turns = 0..1080°).
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface PolarDialProps {
  /** Initial angle in degrees (default 0). */
  value?: number
  /** Full turns allowed on the ring (default 1 → 0..360°). */
  turns?: number
  /** Keyboard step in degrees (default 5). */
  step?: number
  /** Dial diameter in px (default 160). */
  size?: number
  label?: string
  /** Continuous updates while dragging. */
  onInput?: (degrees: number) => void
  /** Fired on release (and after keyboard moves). */
  onChange?: (degrees: number) => void
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const TAU = Math.PI * 2

export function PolarDial(props: PolarDialProps) {
  const [own, rest] = splitProps(props, [
    'value',
    'turns',
    'step',
    'size',
    'label',
    'onInput',
    'onChange',
    'class',
    'className',
    'style',
  ])

  const turns = () => own.turns ?? 1
  const step = () => own.step ?? 5
  const size = () => own.size ?? 160
  const max = () => 360 * turns()

  const [angle, setAngle] = createSignal(own.value ?? 0)
  const [dragging, setDragging] = createSignal(false)
  let surface!: HTMLDivElement
  let canvas!: SVGSVGElement
  let lastPointerAngle = 0

  const clamp = (v: number) => Math.min(max(), Math.max(0, v))

  const pointerAngle = (event: PointerEvent): number => {
    const rect = surface.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return Math.atan2(event.clientY - cy, event.clientX - cx)
  }

  const applyDelta = (deltaRad: number) => {
    let deltaDeg = (deltaRad * 180) / Math.PI
    if (deltaDeg > 180) deltaDeg -= 360 // crossed the branch cut: unwrapped
    if (deltaDeg < -180) deltaDeg += 360
    const next = clamp(angle() + deltaDeg)
    setAngle(next)
    own.onInput?.(next)
  }

  const onPointerDown = (event: PointerEvent) => {
    event.preventDefault()
    ;(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId)
    setDragging(true)
    lastPointerAngle = pointerAngle(event)
    // jump-free: start dragging from the current value, no snap to pointer
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging()) return
    const a = pointerAngle(event)
    let delta = a - lastPointerAngle
    if (delta > Math.PI) delta -= TAU
    if (delta < -Math.PI) delta += TAU
    lastPointerAngle = a
    applyDelta(delta)
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId)
    setDragging(false)
    own.onChange?.(angle())
  }

  const onKeyDown = (event: KeyboardEvent) => {
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = clamp(angle() + step())
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = clamp(angle() - step())
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = max()
    if (next === null) return
    event.preventDefault()
    setAngle(next)
    own.onChange?.(next)
  }

  const c = size() / 2
  const r = c - 10
  const needleAngleRad = () => ((angle() % 360) * Math.PI) / 180
  const needleEnd = () => [
    c + (r - 14) * Math.cos(needleAngleRad()),
    c + (r - 14) * Math.sin(needleAngleRad()),
  ]

  const ticks = () => {
    const out: Array<{ x1: number; y1: number; x2: number; y2: number; major: boolean }> = []
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180
      const major = deg % 90 === 0
      const inner = major ? r - 10 : r - 5
      out.push({
        x1: c + inner * Math.cos(rad),
        y1: c + inner * Math.sin(rad),
        x2: c + r * Math.cos(rad),
        y2: c + r * Math.sin(rad),
        major,
      })
    }
    return out
  }

  return (
    <div
      {...rest}
      class={`inline-flex select-none flex-col items-center ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {/* biome-ignore lint/a11y/useFocusableInteractive: rotary dial —
          arrow keys step, Home/End reset, in onKeyDown */}
      <div
        ref={surface}
        role="slider"
        tabindex={0}
        aria-label={own.label ?? 'polar dial'}
        aria-valuemin={0}
        aria-valuemax={max()}
        aria-valuenow={Math.round(angle() * 10) / 10}
        aria-valuetext={`${Math.round(angle())} degrees`}
        class="inline-block cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <svg
          ref={canvas}
          width={size()}
          height={size()}
          viewBox={`0 0 ${size()} ${size()}`}
          class="block rounded-full bg-gray-900"
          aria-hidden="true"
        >
          <circle cx={c} cy={c} r={r} fill="none" stroke="oklch(0.4 0.02 250)" stroke-width="1.5" />
          {ticks().map(t => (
            <line
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.major ? 'oklch(0.65 0.02 250)' : 'oklch(0.4 0.02 250)'}
              stroke-width={t.major ? 1.5 : 0.8}
            />
          ))}
          {/* progress arc */}
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="oklch(0.72 0.13 85)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray={`${((angle() / max()) * (r * TAU)).toFixed(1)} ${r * TAU}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
          {/* needle */}
          <line
            x1={c}
            y1={c}
            x2={needleEnd()[0]}
            y2={needleEnd()[1]}
            stroke="oklch(0.8 0.05 250)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx={c} cy={c} r="4" fill="oklch(0.8 0.05 250)" />
          <text
            x={c}
            y={c + r / 2 + 4}
            text-anchor="middle"
            class="fill-gray-300 font-mono text-xs"
          >
            {Math.round(angle())}°
          </text>
          {turns() > 1 && (
            <text
              x={c}
              y={c + r / 2 + 18}
              text-anchor="middle"
              class="fill-gray-500 font-mono text-[10px]"
            >
              of {max()}° · {turns()} turns
            </text>
          )}
        </svg>
      </div>
      {own.label !== undefined && <span class="mt-1 text-xs text-gray-400">{own.label}</span>}
    </div>
  )
}

export default PolarDial
