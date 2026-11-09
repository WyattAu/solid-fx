// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Concept from EXTRAS-ROADMAP.md P2.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

interface ParallaxProps {
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
   * Base drift speed of the particles.
   * @default 0.8
   */
  speed?: number
  /**
   * Smallest particle size (px) — the near end of the depth range.
   * @default 1
   */
  minSize?: number
  /**
   * Largest particle size (px) — the far end of the depth range.
   * @default 6
   */
  maxSize?: number
  /**
   * Parallax force: higher values push particles further from the pointer.
   * Offset per particle scales with its radius over this force.
   * @default 60
   */
  force?: number
  /**
   * Parallax smoothing divisor — higher values ease the offset in more slowly.
   * @default 10
   */
  smooth?: number
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
// singleton — including the external parallax interaction — and returns a
// single Promise<void>. Guard it with a module-level promise so every
// concurrent component instance awaits the same load, exactly like Particles.tsx.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles)
  return enginePromise
}

const Parallax = (props: ParallaxProps) => {
  const [local, rest] = splitProps(props, [
    'count',
    'color',
    'speed',
    'minSize',
    'maxSize',
    'force',
    'smooth',
    'background',
    'class',
    'className',
    'style',
  ])
  const count = () => local.count ?? 120
  const color = () => local.color ?? '#ffffff'
  const speed = () => local.speed ?? 0.8
  const minSize = () => local.minSize ?? 1
  const maxSize = () => local.maxSize ?? 6
  const force = () => local.force ?? 60
  const smooth = () => local.smooth ?? 10
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
    // PORT-NOTE: v4's parallax derives each particle's depth from its radius
    // (v3 used zIndex), so the size range is what creates the layered depth.
    const options: ISourceOptions = {
      fullScreen: { enable: false },
      detectRetina: true,
      background: { color: background() },
      particles: {
        number: { value: count(), density: { enable: true, width: 800, height: 800 } },
        paint: { fill: { color: { value: color() }, enable: true, opacity: 0.55 } },
        shape: { type: 'circle' },
        size: { value: { min: minSize(), max: maxSize() } },
        move: {
          enable: true,
          // Reduced motion: hold the field still and drop pointer parallax too.
          speed: reduced() ? 0 : speed(),
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'out' },
        },
      },
      interactivity: {
        // The generated canvas is pointer-events: none — listen on the host div.
        detectsOn: 'parent',
        events: {
          onHover: { enable: !reduced(), mode: 'parallax' },
        },
        modes: { parallax: { force: force(), smooth: smooth() } },
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

export default Parallax
