// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Concept from EXTRAS-ROADMAP.md P2.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

export type SquaresConnectorHover = 'none' | 'connect' | 'grab'

interface SquaresConnectorProps {
  /**
   * Number of square particles.
   * @default 70
   */
  count?: number
  /**
   * Square (and connector line) color — any CSS color.
   * @default '#ffffff'
   */
  color?: string
  /**
   * Base drift speed of the squares.
   * @default 1.2
   */
  speed?: number
  /**
   * Square edge length (px).
   * @default 5
   */
  size?: number
  /**
   * Maximum distance (px) at which two squares are joined by a proximity line.
   * @default 130
   */
  linkDistance?: number
  /**
   * Opacity of the proximity link lines.
   * @default 0.25
   */
  linkOpacity?: number
  /**
   * Pointer connector mode: `connect` links every square inside `hoverDistance`
   * of the pointer to each other, `grab` links squares to the pointer itself,
   * `none` disables pointer interactivity.
   * @default 'connect'
   */
  hover?: SquaresConnectorHover
  /**
   * Radius (px) of the pointer connector around the pointer.
   * @default 180
   */
  hoverDistance?: number
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

// loadSlim registers the slim plugin set into the shared tsParticles engine
// singleton — including the square shape, the particles-links proximity
// interaction and the external connect/grab modes — and returns a single
// Promise<void>. Guard it with a module-level promise so every concurrent
// component instance awaits the same load, exactly like Particles.tsx.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles)
  return enginePromise
}

const SquaresConnector = (props: SquaresConnectorProps) => {
  const [local, rest] = splitProps(props, [
    'count',
    'color',
    'speed',
    'size',
    'linkDistance',
    'linkOpacity',
    'hover',
    'hoverDistance',
    'background',
    'class',
    'className',
    'style',
  ])
  const count = () => local.count ?? 70
  const color = () => local.color ?? '#ffffff'
  const speed = () => local.speed ?? 1.2
  const size = () => local.size ?? 5
  const linkDistance = () => local.linkDistance ?? 130
  const linkOpacity = () => local.linkOpacity ?? 0.25
  const hover = () => local.hover ?? 'connect'
  const hoverDistance = () => local.hoverDistance ?? 180
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
      particles: {
        number: { value: count(), density: { enable: true, width: 800, height: 800 } },
        paint: { fill: { color: { value: color() }, enable: true, opacity: 0.6 } },
        shape: { type: 'square' },
        size: { value: size() },
        links: {
          enable: true,
          distance: linkDistance(),
          color: color(),
          opacity: linkOpacity(),
          width: 1,
        },
        move: {
          enable: true,
          // Reduced motion: hold the squares still, keep the web drawn.
          speed: reduced() ? 0 : speed(),
          direction: 'none',
          random: false,
          straight: false,
          outModes: { default: 'out' },
        },
      },
      interactivity: {
        // The generated canvas is pointer-events: none — listen on the host div.
        detectsOn: 'parent',
        events: {
          onHover: { enable: hover() !== 'none', mode: hover() === 'grab' ? 'grab' : 'connect' },
        },
        modes: {
          connect: {
            distance: hoverDistance(),
            links: { opacity: Math.min(1, linkOpacity() * 2 + 0.2) },
          },
          grab: { distance: hoverDistance(), links: { opacity: 0.5 } },
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

export default SquaresConnector
