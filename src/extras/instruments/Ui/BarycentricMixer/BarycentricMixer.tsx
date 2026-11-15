// solid-fx Instruments widget — original component (not a port).
// Barycentric simplex mixer: one puck on an equilateral triangle outputs
// exact weights (λ₁+λ₂+λ₃ = 1, all ≥ 0) for any three-way normalized
// allocation — risk/yield/liquidity, compute/RAM/I/O. Impossible states are
// unreachable: the projection clamps onto the triangle.
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface BarycentricMixerProps {
  /** Vertex labels [top, bottom-left, bottom-right]. */
  axes: [string, string, string]
  /** Initial weights; renormalized to sum 1. */
  initial?: [number, number, number]
  /** Triangle size in px (default 240). */
  size?: number
  /** Continuous updates while the puck moves. */
  onInput?: (weights: [number, number, number]) => void
  /** Fired on release (and after keyboard moves). */
  onChange?: (weights: [number, number, number]) => void
  /** Accent colors for [top, left, right] vertices. */
  colors?: [string, string, string]
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

type V = [number, number]

export function BarycentricMixer(props: BarycentricMixerProps) {
  const [own, rest] = splitProps(props, [
    'axes',
    'initial',
    'size',
    'onInput',
    'onChange',
    'colors',
    'class',
    'className',
    'style',
  ])

  const size = () => own.size ?? 240
  const pad = 18
  const colors = () =>
    own.colors ?? ['oklch(0.72 0.14 30)', 'oklch(0.72 0.12 160)', 'oklch(0.72 0.12 235)']

  // vertices in svg coords (y down)
  const A: V = [size() / 2, pad]
  const B: V = [pad, size() - pad]
  const C: V = [size() - pad, size() - pad]

  const normalize = (w: [number, number, number]): [number, number, number] => {
    const clamped = w.map(v => Math.max(0, v)) as [number, number, number]
    const sum = clamped[0] + clamped[1] + clamped[2]
    if (sum <= 0) return [1 / 3, 1 / 3, 1 / 3]
    return clamped.map(v => v / sum) as [number, number, number]
  }

  const [weights, setWeights] = createSignal<[number, number, number]>(
    normalize(own.initial ?? [1, 1, 1]),
  )
  const [dragging, setDragging] = createSignal(false)
  let surface!: HTMLDivElement
  let canvas!: SVGSVGElement

  const toCartesian = (w: [number, number, number]): V => [
    w[0] * A[0] + w[1] * B[0] + w[2] * C[0],
    w[0] * A[1] + w[1] * B[1] + w[2] * C[1],
  ]

  const barycentric = (p: V): [number, number, number] => {
    const det = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1])
    const l0 = ((B[1] - C[1]) * (p[0] - C[0]) + (C[0] - B[0]) * (p[1] - C[1])) / det
    const l1 = ((C[1] - A[1]) * (p[0] - C[0]) + (A[0] - C[0]) * (p[1] - C[1])) / det
    return [l0, l1, 1 - l0 - l1]
  }

  const applyWeights = (w: [number, number, number]) => {
    const next = normalize(w)
    setWeights(next)
    own.onInput?.(next)
  }

  const pointerToWeights = (event: PointerEvent) => {
    const rect = surface.getBoundingClientRect()
    const scale = size() / rect.width
    const p: V = [(event.clientX - rect.left) * scale, (event.clientY - rect.top) * scale]
    applyWeights(barycentric(p))
  }

  const onPointerDown = (event: PointerEvent) => {
    event.preventDefault()
    ;(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId)
    setDragging(true)
    pointerToWeights(event)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (dragging()) pointerToWeights(event)
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId)
    setDragging(false)
    own.onChange?.(weights())
  }

  // keyboard: arrows move toward/away from a chosen vertex, borrowing from
  // the other two proportionally
  const nudge = (vertex: 0 | 1 | 2, delta: number) => {
    const w = weights()
    const others = ([0, 1, 2] as const).filter(k => k !== vertex)
    const otherSum = w[others[0]] + w[others[1]]
    const next = [0, 0, 0] as [number, number, number]
    next[vertex] = Math.max(0, Math.min(1, w[vertex] + delta))
    if (otherSum <= 0) {
      next[others[0]] = (1 - next[vertex]) / 2
      next[others[1]] = next[others[0]]
    } else {
      const borrow = 1 - next[vertex]
      next[others[0]] = (w[others[0]] / otherSum) * borrow
      next[others[1]] = (w[others[1]] / otherSum) * borrow
    }
    applyWeights(next)
    own.onChange?.(weights())
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const step = 0.03
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        nudge(0, step)
        break
      case 'ArrowDown':
        event.preventDefault()
        nudge(0, -step)
        break
      case 'ArrowRight':
        event.preventDefault()
        nudge(1, step)
        break
      case 'ArrowLeft':
        event.preventDefault()
        nudge(1, -step)
        break
      case 'PageUp':
        event.preventDefault()
        nudge(2, step)
        break
      case 'PageDown':
        event.preventDefault()
        nudge(2, -step)
        break
    }
  }

  const puck = () => toCartesian(weights())
  const fmt = (v: number) => `${Math.round(v * 100)}%`

  const levelLines = () => {
    const lerp = (p: V, q: V, t: number): V => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
    const paths: string[] = []
    for (const t of [0.25, 0.5, 0.75]) {
      const ab = lerp(A, B, t)
      const ac = lerp(A, C, t)
      const bc = lerp(B, C, t)
      paths.push(`M${ab[0]},${ab[1]} L${ac[0]},${ac[1]}`)
      paths.push(`M${ab[0]},${ab[1]} L${bc[0]},${bc[1]}`)
      paths.push(`M${ac[0]},${ac[1]} L${bc[0]},${bc[1]}`)
    }
    return paths
  }

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {/* biome-ignore lint/a11y/useFocusableInteractive: 2-DOF mixer —
          arrow keys/PageUp/PageDown move toward each vertex via nudge() */}
      <div
        ref={surface}
        role="slider"
        tabindex={0}
        aria-label={`${own.axes.join(' / ')} allocation mixer`}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={weights()[0]}
        aria-valuetext={`${own.axes[0]} ${fmt(weights()[0])}, ${own.axes[1]} ${fmt(weights()[1])}, ${own.axes[2]} ${fmt(weights()[2])}`}
        class="inline-block cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
          class="block rounded-lg bg-gray-900"
          aria-hidden="true"
        >
          {/* triangle */}
          <path
            d={`M${A[0]},${A[1]} L${B[0]},${B[1]} L${C[0]},${C[1]} Z`}
            fill="none"
            stroke="oklch(0.45 0.02 250)"
            stroke-width="1.5"
          />
          {/* level lines at 25/50/75% from each vertex */}
          <g stroke="oklch(0.3 0.02 250)" stroke-width="0.5" opacity="0.6">
            {levelLines().map(d => (
              <path d={d} fill="none" />
            ))}
          </g>
          {/* vertex dots + labels */}
          <circle cx={A[0]} cy={A[1]} r="3" fill={colors()[0]} />
          <circle cx={B[0]} cy={B[1]} r="3" fill={colors()[1]} />
          <circle cx={C[0]} cy={C[1]} r="3" fill={colors()[2]} />
          <text x={A[0]} y={A[1] - 6} text-anchor="middle" class="fill-gray-300 text-[11px]">
            {own.axes[0]}
          </text>
          <text x={B[0] - 4} y={B[1] + 14} text-anchor="start" class="fill-gray-300 text-[11px]">
            {own.axes[1]}
          </text>
          <text x={C[0] + 4} y={C[1] + 14} text-anchor="end" class="fill-gray-300 text-[11px]">
            {own.axes[2]}
          </text>
          {/* puck */}
          <circle
            cx={puck()[0]}
            cy={puck()[1]}
            r={dragging() ? 9 : 7}
            fill="oklch(0.85 0.05 250)"
            stroke="oklch(0.3 0.02 250)"
            stroke-width="1.5"
          />
        </svg>
      </div>
      <div class="mt-2 flex gap-2 font-mono text-xs">
        {([0, 1, 2] as const).map(k => (
          <span
            class="rounded px-1.5 py-0.5"
            style={{ background: colors()[k], color: 'oklch(0.15 0.01 250)', opacity: 0.9 }}
          >
            {own.axes[k]} {fmt(weights()[k])}
          </span>
        ))}
      </div>
    </div>
  )
}

export default BarycentricMixer
