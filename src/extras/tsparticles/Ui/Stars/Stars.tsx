// Built with tsParticles preset stars (github.com/tsparticles/tsparticles) — MIT.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadStarsPreset } from '@tsparticles/preset-stars'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

interface StarsProps {
  /**
   * Number of stars.
   * @default 100
   */
  count?: number
  /**
   * Slow drift speed of the stars.
   * @default 0.1
   */
  speed?: number
  /**
   * Speed of the opacity twinkle animation.
   * @default 1
   */
  twinkleSpeed?: number
  /**
   * Star color — any CSS color.
   * @default '#ffffff'
   */
  color?: string
  /**
   * Canvas background color (any CSS color).
   * @default '#000000'
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
// singleton, then loadStarsPreset adds the `stars` preset on top — both return
// a single Promise<void> and are idempotent, so guard the chain with a
// module-level promise and every concurrent component instance awaits the
// same load, exactly like Particles.tsx.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles).then(() => loadStarsPreset(tsParticles))
  return enginePromise
}

const Stars = (props: StarsProps) => {
  const [local, rest] = splitProps(props, [
    'count',
    'speed',
    'twinkleSpeed',
    'color',
    'background',
    'class',
    'className',
    'style',
  ])
  const count = () => local.count ?? 100
  const speed = () => local.speed ?? 0.1
  const twinkleSpeed = () => local.twinkleSpeed ?? 1
  const color = () => local.color ?? '#ffffff'
  const background = () => local.background ?? '#000000'

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
    // The `stars` preset supplies the random slow drift, opacity twinkle
    // animation and small size range; overrides here win the merge.
    const options: ISourceOptions = {
      fullScreen: { enable: false },
      detectRetina: true,
      preset: 'stars',
      background: { color: background() },
      particles: {
        number: { value: count() },
        paint: { fill: { color: { value: color() } } },
        move: {
          // Reduced motion: hold the sky still.
          speed: reduced() ? 0 : speed(),
        },
        opacity: {
          animation: {
            // Reduced motion: no flicker — stars hold a steady opacity.
            enable: !reduced(),
            speed: twinkleSpeed(),
          },
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

export default Stars
