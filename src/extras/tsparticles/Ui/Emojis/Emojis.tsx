// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Concept from EXTRAS-ROADMAP.md P2.

import type { Container, ISourceOptions } from '@tsparticles/engine'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import type { JSX } from 'solid-js'
import { onCleanup, onMount, splitProps } from 'solid-js'
import { useReducedMotion } from '@/lib/reducedMotion'

interface EmojisProps {
  /**
   * Emoji characters rendered as particles.
   * @default ['😀', '🎉', '✨', '🚀', '💜', '🌟']
   */
  emojis?: string[]
  /**
   * Number of emoji particles.
   * @default 40
   */
  count?: number
  /**
   * Emoji render size (px).
   * @default 18
   */
  size?: number
  /**
   * Drift speed of the emoji particles.
   * @default 2
   */
  speed?: number
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
// singleton — including the emoji shape drawer — and returns a single
// Promise<void>. Guard it with a module-level promise so every concurrent
// component instance awaits the same load, exactly like Particles.tsx.
let enginePromise: Promise<void> | undefined

function ensureEngine(): Promise<void> {
  enginePromise ??= loadSlim(tsParticles)
  return enginePromise
}

const DEFAULT_EMOJIS = ['😀', '🎉', '✨', '🚀', '💜', '🌟']

const Emojis = (props: EmojisProps) => {
  const [local, rest] = splitProps(props, [
    'emojis',
    'count',
    'size',
    'speed',
    'background',
    'class',
    'className',
    'style',
  ])
  const emojis = () => local.emojis ?? DEFAULT_EMOJIS
  const count = () => local.count ?? 40
  const size = () => local.size ?? 18
  const speed = () => local.speed ?? 2
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
        number: { value: count() },
        shape: {
          type: 'emoji',
          // The engine types shape options as ShapeData (option objects), so
          // raw strings are wrapped as `{ value }` — identical drawer behavior.
          options: { emoji: emojis().map(value => ({ value })) },
        },
        size: { value: size() },
        move: {
          enable: true,
          // Reduced motion: hold the field still, emojis keep drawn.
          speed: reduced() ? 0 : speed(),
          direction: 'none',
          random: true,
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

export default Emojis
