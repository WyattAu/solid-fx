// Built with tsParticles preset snow (github.com/tsparticles/tsparticles) — MIT.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadSnowPreset } from '@tsparticles/preset-snow'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

interface SnowProps {
  /**
   * Number of snowflakes.
   * @default 100
   */
  count?: number
  /**
   * Fall speed of the snowflakes.
   * @default 2
   */
  speed?: number
  /**
   * Side-to-side wobble that makes flakes drift like real snow.
   * @default true
   */
  wobble?: boolean
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
// singleton, then loadSnowPreset adds the `snow` preset on top — both return a
// single Promise<void> and are idempotent, so guard the chain with a
// module-level promise and every concurrent component instance awaits the
// same load, exactly like Particles.tsx.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles).then(() => loadSnowPreset(tsParticles))
  return enginePromise
}

const Snow = (props: SnowProps) => {
  const [local, rest] = splitProps(props, [
    'count',
    'speed',
    'wobble',
    'background',
    'class',
    'className',
    'style',
  ])
  const count = () => local.count ?? 100
  const speed = () => local.speed ?? 2
  const wobble = () => local.wobble ?? true
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
    // The `snow` preset supplies the snowfall palette, flake size/opacity
    // ranges, downward movement and wobble; overrides here win the merge.
    const options: ISourceOptions = {
      fullScreen: { enable: false },
      detectRetina: true,
      preset: 'snow',
      background: { color: background() },
      particles: {
        number: { value: count() },
        move: {
          // Reduced motion: freeze the fall, flakes stay drawn.
          speed: reduced() ? 0 : speed(),
        },
        wobble: {
          enable: reduced() ? false : wobble(),
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

export default Snow
