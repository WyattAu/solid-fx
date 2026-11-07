// Built with anime.js v4 (github.com/juliangarnier/anime) — MIT. Demo concept from EXTRAS-ROADMAP.md P1.
import { Show, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, stagger } from 'animejs'
import { createDrawable } from 'animejs/svg'
import { useReducedMotion } from '@/lib/reducedMotion'

// Default stroke-based mark: ring + bolt + baseline. Geometry only, so every
// element responds to animejs/svg `draw`.
const DefaultMark = () => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="h-28 w-28"
    aria-hidden="true"
  >
    <circle cx="60" cy="54" r="38" />
    <path d="M66 34 L48 58 L60 58 L54 74 L72 50 L60 50 Z" />
    <line x1="30" y1="102" x2="90" y2="102" />
  </svg>
)

interface SvgLineDrawLogoProps {
  /**
   * Custom stroke-based SVG artwork; falls back to the built-in mark.
   * Every SVGGeometryElement child (path, circle, line, …) is drawn on.
   */
  children?: JSX.Element
  /**
   * Draw duration of each stroke (ms).
   * @default 900
   */
  duration?: number
  /**
   * anime.js ease for the draw (e.g. 'outExpo', 'inOutQuart').
   * @default 'outExpo'
   */
  easing?: string
  /**
   * Stagger between the starts of consecutive strokes (ms).
   * @default 220
   */
  strokeDelay?: number
  /**
   * Redraw forever.
   * @default true
   */
  loop?: boolean
  /**
   * Hold at the fully-drawn state between redraws (ms).
   * @default 1600
   */
  loopDelay?: number
  /**
   * The class of the logo container.
   */
  class?: string
  /**
   * React-style class alias, merged alongside `class`.
   */
  className?: string
  /**
   * The style of the logo container.
   */
  style?: JSX.CSSProperties
}

export const SvgLineDrawLogo = (
  props: SvgLineDrawLogoProps & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'>,
) => {
  const [local, rest] = splitProps(props, [
    'children',
    'duration',
    'easing',
    'strokeDelay',
    'loop',
    'loopDelay',
    'class',
    'className',
    'style',
  ])
  const duration = () => local.duration ?? 900
  const easing = () => local.easing ?? 'outExpo'
  const strokeDelay = () => local.strokeDelay ?? 220
  const loop = () => local.loop ?? true
  const loopDelay = () => local.loopDelay ?? 1600

  const reduced = useReducedMotion()

  let rootEl!: HTMLDivElement

  onMount(() => {
    // Children may be arbitrary SVG, so query geometry inside the wrapper.
    const geoms = rootEl.querySelectorAll<SVGGeometryElement>(
      'path, circle, ellipse, line, polyline, polygon, rect',
    )
    if (!geoms.length || reduced()) return // no drawables → SVG renders as authored
    const drawables = createDrawable(geoms)
    const anim = animate(drawables, {
      draw: '0 1',
      duration: duration(),
      delay: stagger(strokeDelay(), { from: 'first' }),
      ease: easing(),
      ...(loop() ? { loop: true, loopDelay: loopDelay() } : {}),
    })
    onCleanup(() => anim.revert())
  })

  return (
    <div
      {...rest}
      ref={rootEl}
      class={`inline-block ${local.class ?? ''} ${local.className ?? ''}`}
      style={local.style}
    >
      <Show when={local.children} fallback={<DefaultMark />}>
        {local.children}
      </Show>
    </div>
  )
}

export default SvgLineDrawLogo
