// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import { For, createMemo, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, createTimer, stagger } from 'animejs'
import type { JSAnimation, StaggerParams } from 'animejs'
import { useReducedMotion } from '@/lib/reducedMotion'

// Resting dot color the pulse flashes back to each cycle.
const REST_COLOR = '#1e293b'

interface LoopPulseProps {
  /**
   * Grid shape as [rows, cols].
   * @default [6, 6]
   */
  grid?: [number, number]
  /**
   * Dot diameter (px).
   * @default 10
   */
  dotSize?: number
  /**
   * Gap between dots (px).
   * @default 14
   */
  gap?: number
  /**
   * Interval (ms) between pulse starts — the master timer's loop duration.
   * @default 2600
   */
  cycleMs?: number
  /**
   * Per-dot pulse duration (ms).
   * @default 700
   */
  duration?: number
  /**
   * Ripple delay between neighbouring dots (ms).
   * @default 45
   */
  staggerDelay?: number
  /**
   * Stagger origin: 'center', 'first', 'last', or a dot index.
   * @default 'center'
   */
  from?: StaggerParams['from']
  /**
   * anime.js ease for each dot pulse.
   * @default 'inOutQuad'
   */
  easing?: string
  /**
   * Accent color the dots flash toward.
   * @default '#6366f1'
   */
  accent?: string
  /**
   * The class of the grid container.
   */
  class?: string
  /**
   * React-style class alias, merged alongside `class`.
   */
  className?: string
  /**
   * The style of the grid container.
   */
  style?: JSX.CSSProperties
}

export const LoopPulse = (
  props: LoopPulseProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'>,
) => {
  const [local, rest] = splitProps(props, [
    'grid',
    'dotSize',
    'gap',
    'cycleMs',
    'duration',
    'staggerDelay',
    'from',
    'easing',
    'accent',
    'class',
    'className',
    'style',
  ])
  const grid = () => local.grid ?? ([6, 6] as [number, number])
  const rows = () => grid()[0]
  const cols = () => grid()[1]
  const dotSize = () => local.dotSize ?? 10
  const gap = () => local.gap ?? 14
  const cycleMs = () => local.cycleMs ?? 2600
  const duration = () => local.duration ?? 700
  const staggerDelay = () => local.staggerDelay ?? 45
  const from = () => local.from ?? 'center'
  const easing = () => local.easing ?? 'inOutQuad'
  const accent = () => local.accent ?? '#6366f1'

  const reduced = useReducedMotion()

  const cellCount = createMemo(() => rows() * cols())
  const cells = createMemo(() => Array.from({ length: cellCount() }, (_, i) => i))

  const dotEls: HTMLDivElement[] = []

  onMount(() => {
    if (reduced() || !dotEls.length) return // markup already authors the final state
    const inFlight: JSAnimation[] = []
    // One pulse: scale + color keyframes rippling center-out via grid stagger.
    const fire = () => {
      inFlight.push(
        animate(dotEls, {
          scale: [1, 1.55, 1],
          backgroundColor: [REST_COLOR, accent(), REST_COLOR],
          duration: duration(),
          delay: stagger(staggerDelay(), {
            grid: [rows(), cols()],
            from: from(),
            ease: 'inOutQuad',
          }),
          ease: easing(),
        }),
      )
    }
    // Master clock: pulse once on begin, then on every cycleMs loop boundary.
    // Pulses shorter than the cycle stay self-contained; keep only recent
    // animations around so the cleanup list stays bounded.
    const timer = createTimer({
      duration: cycleMs(),
      loop: true,
      onBegin: fire,
      onLoop: fire,
    })
    onCleanup(() => {
      timer.revert()
      inFlight.forEach(a => {
        if (!a.completed) a.cancel()
      })
    })
  })

  return (
    <div
      {...rest}
      class={`grid ${local.class ?? ''} ${local.className ?? ''}`}
      style={{
        'grid-template-columns': `repeat(${cols()}, ${dotSize()}px)`,
        'grid-auto-rows': `${dotSize()}px`,
        gap: `${gap()}px`,
        ...local.style,
      }}
    >
      <For each={cells()}>
        {() => (
          <div
            ref={el => dotEls.push(el)}
            class="rounded-full will-change-transform"
            style={{ 'background-color': REST_COLOR }}
          />
        )}
      </For>
    </div>
  )
}

export default LoopPulse
