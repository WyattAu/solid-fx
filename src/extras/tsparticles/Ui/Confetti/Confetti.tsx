// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Concept from EXTRAS-ROADMAP.md P2.

import type { ConfettiOptions } from '@tsparticles/confetti'
import { confetti } from '@tsparticles/confetti'
import type { Container } from '@tsparticles/engine'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

export interface ConfettiHandle {
  /**
   * Fire one burst into the component canvas; `overrides` merge over the
   * component's option props.
   */
  fire: (overrides?: ConfettiOptions) => Promise<Container | undefined>
  /** Destroy the underlying particle container (clears the canvas). */
  destroy: () => void
}

interface ConfettiProps {
  /**
   * Particles per burst.
   * @default 50
   */
  particleCount?: number
  /**
   * Spread angle of the burst in degrees (360 = all directions).
   * @default 45
   */
  spread?: number
  /**
   * Initial burst velocity.
   * @default 45
   */
  startVelocity?: number
  /**
   * Burst origin angle in degrees (90 = straight up).
   * @default 90
   */
  angle?: number
  /**
   * How quickly particles slow down (lower = slower decay).
   * @default 0.9
   */
  decay?: number
  /**
   * Gravity pulling particles down.
   * @default 1
   */
  gravity?: number
  /**
   * Horizontal drift of the particles.
   * @default 0
   */
  drift?: number
  /**
   * Particle scale factor.
   * @default 1
   */
  scalar?: number
  /**
   * Particle lifetime in frames (~120 fps) before fading out.
   * @default 200
   */
  ticks?: number
  /**
   * Flatten particles into confetti-paper mode (no spin/tilt/wobble).
   * @default false
   */
  flat?: boolean
  /**
   * Burst colors.
   * @default ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
   */
  colors?: string[]
  /**
   * Particle shapes — any of `square`, `circle`, `star`, plus the shapes the
   * confetti bundle registers (heart, emoji, polygon, …).
   * @default ['square', 'circle']
   */
  shapes?: string[]
  /**
   * Fire one burst automatically after mount (skipped for reduced-motion users).
   * @default true
   */
  auto?: boolean
  /**
   * Delay before the auto burst (ms).
   * @default 150
   */
  delay?: number
  /**
   * Callback ref receiving a {@link ConfettiHandle} for manual bursts.
   */
  ref?: (handle: ConfettiHandle) => void
  /**
   * The class of the canvas wrapper (gets `relative h-full w-full overflow-hidden`).
   */
  class?: string
  /**
   * React-style class alias, merged alongside `class`.
   */
  className?: string
  /**
   * The style of the canvas wrapper.
   */
  style?: JSX.CSSProperties
}

// Each instance needs a unique canvas id: @tsparticles/confetti keys its
// container registry by canvas id, so id-less canvases would all claim
// "confetti" and bursts would land in whichever container mounted first.
let canvasSeq = 0

const Confetti = (props: ConfettiProps) => {
  const [local, rest] = splitProps(props, [
    'particleCount',
    'spread',
    'startVelocity',
    'angle',
    'decay',
    'gravity',
    'drift',
    'scalar',
    'ticks',
    'flat',
    'colors',
    'shapes',
    'auto',
    'delay',
    'ref',
    'class',
    'className',
    'style',
  ])

  const reduced = useReducedMotion()

  const options = (): ConfettiOptions => ({
    particleCount: local.particleCount ?? 50,
    spread: local.spread ?? 45,
    startVelocity: local.startVelocity ?? 45,
    angle: local.angle ?? 90,
    decay: local.decay ?? 0.9,
    gravity: local.gravity ?? 1,
    drift: local.drift ?? 0,
    scalar: local.scalar ?? 1,
    ticks: local.ticks ?? 200,
    flat: local.flat ?? false,
    colors: local.colors ?? [
      '#26ccff',
      '#a25afd',
      '#ff5e7e',
      '#88ff5a',
      '#fcff42',
      '#ffa62d',
      '#ff36ff',
    ],
    shapes: local.shapes ?? ['square', 'circle'],
    disableForReducedMotion: true,
  })

  let hostEl!: HTMLDivElement
  let canvasEl!: HTMLCanvasElement

  onMount(() => {
    let disposed = false
    let container: Container | undefined
    let burstTimer: ReturnType<typeof setTimeout> | undefined
    // PORT-NOTE: confetti.create's returned fire function falls back to bundle
    // defaults when called without options — always pass explicit options.
    let fireFn: ((opts: ConfettiOptions) => Promise<Container | undefined>) | undefined

    const fire = async (overrides?: ConfettiOptions): Promise<Container | undefined> => {
      if (!fireFn) return undefined
      const next = await fireFn({ ...options(), ...overrides })
      if (next) container = next
      return next
    }

    onCleanup(() => {
      disposed = true
      if (burstTimer !== undefined) clearTimeout(burstTimer)
      container?.destroy()
      fireFn = undefined
    })

    canvasEl.id = `solid-fx-confetti-${++canvasSeq}`

    // confetti initializes its own engine plugins (shapes + updaters) behind an
    // idempotent internal promise — no loadSlim needed on this component.
    void confetti.create(canvasEl, { disableForReducedMotion: true }).then(created => {
      if (disposed) return
      fireFn = created
      local.ref?.({ fire, destroy: () => container?.destroy() })
      if (local.auto ?? true) {
        burstTimer = setTimeout(() => {
          burstTimer = undefined
          if (!reduced()) void fire()
        }, local.delay ?? 150)
      }
    })
  })

  return (
    <div
      {...rest}
      ref={hostEl}
      class={`relative h-full w-full overflow-hidden ${local.class ?? ''} ${local.className ?? ''}`}
      style={local.style}
    >
      <canvas ref={canvasEl} class="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  )
}

export default Confetti
