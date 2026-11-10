// Source: github.com/ibelick/motion-primitives components/core/glow-effect.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream's declarative `animate={animations[mode]}` maps to a
// tracked createEffect that stops and restarts one vanilla motion animate()
// whenever mode/colors/transition/scale/duration change (PORTING.md §5).
// 'static' mode has no transition upstream — framer applies it instantly, so
// the port writes the background style directly. Numeric `blur` renders an
// inline `filter: blur(Npx)` instead of upstream's dynamic `blur-[${n}px]`
// class, which Tailwind cannot generate at runtime.

import { createEffect, onCleanup, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls, Transition } from 'motion'

export type GlowEffectProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
  colors?: string[]
  mode?:
    | 'rotate'
    | 'pulse'
    | 'breathe'
    | 'colorShift'
    | 'flowHorizontal'
    | 'static'
  blur?:
    | number
    | 'softest'
    | 'soft'
    | 'medium'
    | 'strong'
    | 'stronger'
    | 'strongest'
    | 'none'
  transition?: Transition
  scale?: number
  duration?: number
}

type GlowKeyframes = {
  background?: string | string[]
  scale?: number[]
  opacity?: number[]
}

type BlurPreset = Exclude<GlowEffectProps['blur'], number | undefined>

const BLUR_PRESETS: Record<BlurPreset, string> = {
  softest: 'blur-xs',
  soft: 'blur-sm',
  medium: 'blur-md',
  strong: 'blur-lg',
  stronger: 'blur-xl',
  strongest: 'blur-xl',
  none: 'blur-none',
}

export function GlowEffect(props: GlowEffectProps) {
  const [own, rest] = splitProps(props, [
    'class',
    'className',
    'style',
    'colors',
    'mode',
    'blur',
    'transition',
    'scale',
    'duration',
  ])

  let el!: HTMLDivElement
  let controls: AnimationPlaybackControls | undefined

  // Upstream BASE_TRANSITION.
  const baseTransition = (): Transition => ({
    repeat: Infinity,
    duration: own.duration ?? 5,
    ease: 'linear',
  })

  // Upstream animations map, resolved for the current mode. Reads every
  // reactive input so the effect below restarts on change.
  const keyframes = (): GlowKeyframes => {
    const colors = own.colors ?? ['#FF5733', '#33FF57', '#3357FF', '#F1C40F']
    const mode = own.mode ?? 'rotate'
    const scale = own.scale ?? 1

    switch (mode) {
      case 'pulse':
        return {
          background: colors.map(
            color => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
          ),
          scale: [1 * scale, 1.1 * scale, 1 * scale],
          opacity: [0.5, 0.8, 0.5],
        }
      case 'breathe':
        return {
          background: colors.map(
            color => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`,
          ),
          scale: [1 * scale, 1.05 * scale, 1 * scale],
        }
      case 'colorShift':
        return {
          background: colors.map((color, index) => {
            const nextColor = colors[(index + 1) % colors.length]
            return `conic-gradient(from 0deg at 50% 50%, ${color} 0%, ${nextColor} 50%, ${color} 100%)`
          }),
        }
      case 'flowHorizontal':
        return {
          background: colors.map(color => {
            const nextColor = colors[(colors.indexOf(color) + 1) % colors.length]
            return `linear-gradient(to right, ${color}, ${nextColor})`
          }),
        }
      case 'static':
        return { background: `linear-gradient(to right, ${colors.join(', ')})` }
      case 'rotate':
      default:
        return {
          background: [
            `conic-gradient(from 0deg at 50% 50%, ${colors.join(', ')})`,
            `conic-gradient(from 360deg at 50% 50%, ${colors.join(', ')})`,
          ],
        }
    }
  }

  // Upstream per-mode transition: rotate falls back to BASE_TRANSITION, the
  // other animated modes fall back to BASE + mirror.
  const transitionFor = (): Transition | undefined => {
    const mode = own.mode ?? 'rotate'
    if (mode === 'static') return undefined
    if (own.transition) return own.transition
    if (mode === 'rotate') return baseTransition()
    return { ...baseTransition(), repeatType: 'mirror' }
  }

  createEffect(() => {
    const mode = own.mode ?? 'rotate'
    const target = keyframes()
    const transition = transitionFor()

    controls?.stop()
    if (mode === 'static') {
      el.style.background =
        typeof target.background === 'string' ? target.background : ''
      controls = undefined
      return
    }
    controls = animate(el, target, transition)
  })

  onCleanup(() => controls?.stop())

  const blurClass = (): string => {
    const blur = own.blur ?? 'medium'
    if (typeof blur === 'number') return ''
    return BLUR_PRESETS[blur]
  }

  return (
    <div
      {...(rest as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
      ref={el}
      class={
        `pointer-events-none absolute inset-0 h-full w-full ` +
        `scale-[var(--scale)] transform-gpu ${blurClass()} ` +
        `${own.class ?? ''} ${own.className ?? ''}`
      }
      style={
        {
          ...(own.blur != null && typeof own.blur === 'number'
            ? { filter: `blur(${own.blur}px)` }
            : {}),
          ...own.style,
          '--scale': `${own.scale ?? 1}`,
          'will-change': 'transform',
          'backface-visibility': 'hidden',
        } as JSX.CSSProperties
      }
    />
  )
}

export default GlowEffect
