// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Concept from EXTRAS-ROADMAP.md P2.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadPolygonMaskPlugin } from '@tsparticles/plugin-polygon-mask'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

export type PolygonMaskArea = 'inside' | 'outside' | 'inline'

interface PolygonMaskProps {
  /**
   * Number of corners of the regular polygon mask.
   * @default 6
   */
  sides?: number
  /**
   * Radius (px, SVG space) of the circle the polygon is inscribed in.
   * The engine scales and centers this shape on the mask position.
   * @default 130
   */
  radius?: number
  /**
   * Extra scale factor the engine applies to the mask path.
   * @default 1
   */
  scale?: number
  /**
   * Horizontal mask center, % of canvas width.
   * @default 50
   */
  x?: number
  /**
   * Vertical mask center, % of canvas height.
   * @default 50
   */
  y?: number
  /**
   * Where particles live: `inside` the polygon, `outside` it (polygon is a
   * hole), or `inline` riding along its edge.
   * @default 'inside'
   */
  area?: PolygonMaskArea
  /**
   * Number of particles.
   * @default 120
   */
  count?: number
  /**
   * Particle color — any CSS color.
   * @default '#ffffff'
   */
  color?: string
  /**
   * Drift speed of the particles inside/around the mask.
   * @default 1.5
   */
  speed?: number
  /**
   * Draw the polygon outline onto the canvas.
   * @default true
   */
  drawOutline?: boolean
  /**
   * Outline stroke color — any CSS color.
   * @default '#818cf8'
   */
  strokeColor?: string
  /**
   * Outline stroke width (px).
   * @default 2
   */
  strokeWidth?: number
  /**
   * Canvas background color (any CSS color, `transparent` keeps it clear).
   * @default 'transparent'
   */
  background?: string
  /**
   * The class of the field container (gets `relative h-full w-full overflow-hidden`).
   */
  class?: string
  /**
   * React-style class alias, merged alongside `class`.
   */
  className?: string
  /**
   * The style of the field container.
   */
  style?: JSX.CSSProperties
}

// Regular polygon serialized as the inline SVG the polygon-mask plugin parses
// (DOMParser + <path> extraction). viewBox space is 2·radius square with the
// shape centered, so `position` lands the mask exactly where asked.
function polygonSvg(sides: number, radius: number): string {
  const n = Math.max(3, Math.round(sides))
  const points: string[] = []
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    points.push(
      `${(radius + Math.cos(angle) * radius).toFixed(2)} ${(radius + Math.sin(angle) * radius).toFixed(2)}`,
    )
  }
  const size = radius * 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<path d="M${points.join(' L')} Z" fill="none" stroke="none" />` +
    '</svg>'
  )
}

// Same slim-bundle pattern as Particles.tsx, plus the polygon-mask plugin
// layered on top (it is NOT part of the slim bundle). Both loads are
// idempotent engine registrations; one shared module-level promise guards the
// chain so it completes exactly once before any container is spawned.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles).then(() => loadPolygonMaskPlugin(tsParticles))
  return enginePromise
}

const PolygonMask = (props: PolygonMaskProps) => {
  const [local, rest] = splitProps(props, [
    'sides',
    'radius',
    'scale',
    'x',
    'y',
    'area',
    'count',
    'color',
    'speed',
    'drawOutline',
    'strokeColor',
    'strokeWidth',
    'background',
    'class',
    'className',
    'style',
  ])
  const sides = () => local.sides ?? 6
  const radius = () => local.radius ?? 130
  const scale = () => local.scale ?? 1
  const x = () => local.x ?? 50
  const y = () => local.y ?? 50
  const area = () => local.area ?? 'inside'
  const count = () => local.count ?? 120
  const color = () => local.color ?? '#ffffff'
  const speed = () => local.speed ?? 1.5
  const drawOutline = () => local.drawOutline ?? true
  const strokeColor = () => local.strokeColor ?? '#818cf8'
  const strokeWidth = () => local.strokeWidth ?? 2
  const background = () => local.background ?? 'transparent'

  const reduced = useReducedMotion()

  let hostEl!: HTMLDivElement

  onMount(() => {
    let disposed = false
    let container: Container | undefined
    onCleanup(() => {
      disposed = true
      container?.destroy()
    })

    // PORT-NOTE: engine options are snapshotted at mount — live prop updates
    // would need container.options.load(); tsParticles has no reactive options.
    const options: ISourceOptions = {
      fullScreen: { enable: false },
      detectRetina: true,
      background: { color: background() },
      polygon: {
        enable: true,
        type: area(),
        position: { x: x(), y: y() },
        scale: scale(),
        data: polygonSvg(sides(), radius()),
        draw: {
          enable: drawOutline(),
          stroke: { color: strokeColor(), width: strokeWidth(), opacity: 1 },
        },
        move: { radius: 10, type: 'path' },
      },
      particles: {
        number: { value: count() },
        paint: { fill: { color: { value: color() }, enable: true, opacity: 0.5 } },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 3 } },
        move: {
          enable: true,
          // Reduced motion: hold the field still, keep the outline drawn.
          speed: reduced() ? 0 : speed(),
          direction: 'none',
          random: false,
          straight: false,
          outModes: { default: 'bounce' },
        },
      },
    }

    void ensureEngine().then(async () => {
      if (disposed) return
      container = await tsParticles.load({ element: hostEl, options })
      // Unmounted while the engine was still loading — destroy immediately.
      if (disposed) container?.destroy()
    })
  })

  return (
    <div
      {...rest}
      ref={hostEl}
      class={`relative h-full w-full overflow-hidden [&>canvas]:block ${local.class ?? ''} ${local.className ?? ''}`}
      style={local.style}
    />
  )
}

export default PolygonMask
