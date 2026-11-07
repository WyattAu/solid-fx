// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import { For, createMemo, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, stagger } from 'animejs'
import type { StaggerParams } from 'animejs'
import { useReducedMotion } from '@/lib/reducedMotion'

// Resting tile color the grid pulses back to each alternate pass.
const REST_COLOR = '#1e293b'

interface StaggerChoreoProps {
  /**
   * Grid shape as [rows, cols].
   * @default [7, 7]
   */
  grid?: [number, number]
  /**
   * Tile size (px).
   * @default 26
   */
  cellSize?: number
  /**
   * Gap between tiles (px).
   * @default 8
   */
  gap?: number
  /**
   * Per-tile tween duration (ms).
   * @default 700
   */
  duration?: number
  /**
   * anime.js ease for each tile tween.
   * @default 'inOutQuad'
   */
  easing?: string
  /**
   * Ripple delay between neighbouring tiles (ms).
   * @default 65
   */
  staggerDelay?: number
  /**
   * Stagger origin: 'center', 'first', 'last', or a tile index.
   * @default 'center'
   */
  from?: StaggerParams['from']
  /**
   * Accent color the tiles pulse toward.
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

export const StaggerChoreo = (
  props: StaggerChoreoProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'>,
) => {
  const [local, rest] = splitProps(props, [
    'grid',
    'cellSize',
    'gap',
    'duration',
    'easing',
    'staggerDelay',
    'from',
    'accent',
    'class',
    'className',
    'style',
  ])
  const grid = () => local.grid ?? ([7, 7] as [number, number])
  const rows = () => grid()[0]
  const cols = () => grid()[1]
  const cellSize = () => local.cellSize ?? 26
  const gap = () => local.gap ?? 8
  const duration = () => local.duration ?? 700
  const easing = () => local.easing ?? 'inOutQuad'
  const staggerDelay = () => local.staggerDelay ?? 65
  const from = () => local.from ?? 'center'
  const accent = () => local.accent ?? '#6366f1'

  const reduced = useReducedMotion()

  const cellCount = createMemo(() => rows() * cols())
  const cells = createMemo(() => Array.from({ length: cellCount() }, (_, i) => i))

  const tileEls: HTMLDivElement[] = []

  onMount(() => {
    if (reduced() || !tileEls.length) return // markup already authors the final state
    const anim = animate(tileEls, {
      scale: [0.3, 1],
      opacity: [0.25, 1],
      backgroundColor: [REST_COLOR, accent()],
      duration: duration(),
      delay: stagger(staggerDelay(), {
        grid: [rows(), cols()],
        from: from(),
        ease: 'inOutQuad',
      }),
      ease: easing(),
      loop: true,
      alternate: true,
    })
    onCleanup(() => anim.revert())
  })

  return (
    <div
      {...rest}
      class={`grid ${local.class ?? ''} ${local.className ?? ''}`}
      style={{
        'grid-template-columns': `repeat(${cols()}, ${cellSize()}px)`,
        'grid-auto-rows': `${cellSize()}px`,
        gap: `${gap()}px`,
        ...local.style,
      }}
    >
      <For each={cells()}>
        {() => (
          <div
            ref={el => tileEls.push(el)}
            class="rounded-md will-change-transform"
            style={{ 'background-color': REST_COLOR }}
          />
        )}
      </For>
    </div>
  )
}

export default StaggerChoreo
