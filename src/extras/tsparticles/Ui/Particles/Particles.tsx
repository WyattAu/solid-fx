// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Concept from EXTRAS-ROADMAP.md P2.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

export type ParticlesInteractiveMode = 'none' | 'hover' | 'click' | 'both'

interface ParticlesProps {
  /**
   * Number of particles. Interpreted per 800×800 px when density scaling is on.
   * @default 100
   */
  count?: number
  /**
   * Particle (and link line) color — any CSS color.
   * @default '#ffffff'
   */
  color?: string
  /**
   * Base drift speed of the particles.
   * @default 1
   */
  speed?: number
  /**
   * Maximum distance (px) at which two particles are joined by a link line.
   * @default 150
   */
  linkDistance?: number
  /**
   * Repulse interaction mode: `hover` pushes particles from the pointer,
   * `click` from each click, `both` enables the two, `none` disables
   * interactivity entirely.
   * @default 'hover'
   */
  interactive?: ParticlesInteractiveMode
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
// singleton and returns a single Promise<void>. Guard it with a module-level
// promise so every concurrent component instance awaits the same load — the
// load must complete exactly once before any container is spawned.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles)
  return enginePromise
}

const Particles = (props: ParticlesProps) => {
  const [local, rest] = splitProps(props, [
    'count',
    'color',
    'speed',
    'linkDistance',
    'interactive',
    'background',
    'class',
    'className',
    'style',
  ])
  const count = () => local.count ?? 100
  const color = () => local.color ?? '#ffffff'
  const speed = () => local.speed ?? 1
  const linkDistance = () => local.linkDistance ?? 150
  const interactive = () => local.interactive ?? 'hover'
  const background = () => local.background ?? 'transparent'
  const hoverEnabled = () => {
    const mode = interactive()
    return mode === 'hover' || mode === 'both'
  }
  const clickEnabled = () => {
    const mode = interactive()
    return mode === 'click' || mode === 'both'
  }

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
        paint: { fill: { color: { value: color() }, enable: true, opacity: 0.4 } },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 3 } },
        links: {
          enable: true,
          distance: linkDistance(),
          color: color(),
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          // Reduced motion: hold the field still, keep the links drawn.
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
          onHover: { enable: hoverEnabled(), mode: 'repulse' },
          onClick: { enable: clickEnabled(), mode: 'repulse' },
        },
        modes: { repulse: { distance: 200, duration: 0.4 } },
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

export default Particles
