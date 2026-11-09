// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/text-animate.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// PORT-NOTE: the motion-primitives batch queues "Text Generate"
// (word-by-word blur reveal), but ibelick/motion-primitives @120f64f6 ships no
// text-generate-effect.tsx (verified against the full repo tree, the complete
// commit history, and Wayback captures of the docs site), and the better-known
// Aceternity equivalent is license-blocked per LICENSE-SOURCES.md. Magic UI's
// TextAnimate provides the same word-by-word blur-stagger behavior under an
// MIT license, so it is ported from there. Two documented deviations: the
// default animation preset is narrowed from 'fadeIn' to 'blurIn' to match the
// targeted Text Generate behavior, and custom framer `variants` plus the
// exit/popLayout path are dropped (no 1:1 vanilla mapping, PORTING.md §5).
// Framer's per-item transition { delayChildren: delay, staggerChildren:
// duration / segments.length } maps to motion's stagger(interval,
// { startDelay: delay }) per PORTING.md §5.

import { createSignal, For, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, stagger } from 'motion'
import type { AnimationOptions, AnimationPlaybackControls, DOMKeyframesDefinition } from 'motion'
import { Dynamic } from 'solid-js/web'

export type TextGenerateBy = 'text' | 'word' | 'character' | 'line'

export type TextGenerateAnimation =
  | 'fadeIn'
  | 'blurIn'
  | 'blurInUp'
  | 'blurInDown'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleUp'
  | 'scaleDown'

/** Upstream polymorphic `as` — the motionElements subset, via <Dynamic>. */
export type TextGenerateAs =
  | 'article'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'li'
  | 'p'
  | 'section'
  | 'span'

export type TextGenerateProps = {
  /** The text content to animate. */
  children: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  /** The class name to be applied to each segment. */
  segmentClassName?: string
  /** The delay before the animation starts. */
  delay?: number
  /**
   * Controls the stagger pace (upstream semantics: staggerChildren =
   * duration / segments.length), not the per-item duration.
   */
  duration?: number
  /** How to split the text. */
  by?: TextGenerateBy
  /** The animation preset to use. */
  animation?: TextGenerateAnimation
  /** The element type to render. */
  as?: TextGenerateAs
  /** Whether to start the animation when the component enters the viewport. */
  startOnView?: boolean
  /** Whether to animate only once. */
  once?: boolean
  /** Whether to enable accessibility features (default: true). */
  accessible?: boolean
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'class'>

type PresetSpec = {
  keyframes: [unknown, unknown]
  transition: AnimationOptions
}

const D = (duration: number): AnimationOptions => ({ duration })

// Upstream defaultItemAnimationVariants — hidden/show keyframes per preset,
// including the per-property durations of the blurInUp/blurInDown variants
// (y 0.3, opacity 0.4, filter 0.3) and the scale spring (damping 15,
// stiffness 300).
const PRESETS: Record<TextGenerateAnimation, Record<string, PresetSpec>> = {
  fadeIn: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    y: { keyframes: [20, 0], transition: D(0.3) },
  },
  blurIn: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    filter: { keyframes: ['blur(10px)', 'blur(0px)'], transition: D(0.3) },
  },
  blurInUp: {
    opacity: { keyframes: [0, 1], transition: D(0.4) },
    filter: { keyframes: ['blur(10px)', 'blur(0px)'], transition: D(0.3) },
    y: { keyframes: [20, 0], transition: D(0.3) },
  },
  blurInDown: {
    opacity: { keyframes: [0, 1], transition: D(0.4) },
    filter: { keyframes: ['blur(10px)', 'blur(0px)'], transition: D(0.3) },
    y: { keyframes: [-20, 0], transition: D(0.3) },
  },
  slideUp: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    y: { keyframes: [20, 0], transition: D(0.3) },
  },
  slideDown: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    y: { keyframes: [-20, 0], transition: D(0.3) },
  },
  slideLeft: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    x: { keyframes: [20, 0], transition: D(0.3) },
  },
  slideRight: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    x: { keyframes: [-20, 0], transition: D(0.3) },
  },
  scaleUp: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    scale: {
      keyframes: [0.5, 1],
      transition: { type: 'spring', damping: 15, stiffness: 300 },
    },
  },
  scaleDown: {
    opacity: { keyframes: [0, 1], transition: D(0.3) },
    scale: {
      keyframes: [1.5, 1],
      transition: { type: 'spring', damping: 15, stiffness: 300 },
    },
  },
}

export function TextGenerate(props: TextGenerateProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'segmentClassName',
    'delay',
    'duration',
    'by',
    'animation',
    'as',
    'startOnView',
    'once',
    'accessible',
  ])

  const delay = () => own.delay ?? 0
  const duration = () => own.duration ?? 0.3
  const by = () => own.by ?? 'word'
  const animation = () => own.animation ?? 'blurIn'
  const startOnView = () => own.startOnView ?? true
  const once = () => own.once ?? false
  const accessible = () => own.accessible ?? true

  // Upstream segmentation switch.
  const segments = () => {
    switch (by()) {
      case 'word':
        return own.children.split(/(\s+)/)
      case 'character':
        return own.children.split('')
      case 'line':
        return own.children.split('\n')
      case 'text':
      default:
        return [own.children]
    }
  }

  let rootEl!: HTMLElement
  let segEls: HTMLSpanElement[] = []
  const controls: AnimationPlaybackControls[] = []

  const spans = () => segEls.slice(0, segments().length).filter(Boolean)

  // Pre-animation hidden state, applied before paint so nothing flashes
  // while waiting for the viewport trigger. transform shorthands (x/y/scale)
  // have no CSS property equivalent — composed into `transform` manually.
  const applyHidden = () => {
    const preset = PRESETS[animation()]
    const x = preset.x?.keyframes[0]
    const y = preset.y?.keyframes[0]
    const scale = preset.scale?.keyframes[0]
    const parts: string[] = []
    if (x !== undefined) parts.push(`translateX(${x}px)`)
    if (y !== undefined) parts.push(`translateY(${y}px)`)
    if (scale !== undefined) parts.push(`scale(${scale})`)
    const hiddenFilter = preset.filter?.keyframes[0]
    for (const el of spans()) {
      el.style.opacity = String(preset.opacity?.keyframes[0] ?? 0)
      el.style.transform = parts.length > 0 ? parts.join(' ') : 'none'
      if (hiddenFilter !== undefined) el.style.filter = String(hiddenFilter)
    }
  }

  const play = () => {
    controls.forEach(c => c.stop())
    const targets = spans()
    if (targets.length === 0) return []
    const preset = PRESETS[animation()]
    // Upstream container show transition: staggerChildren = duration /
    // segments.length, delayChildren = delay.
    const interval = duration() / segments().length
    const staggered = stagger(interval, { startDelay: delay() })
    return Object.entries(preset).map(([prop, spec]) =>
      animate(targets, { [prop]: spec.keyframes } as DOMKeyframesDefinition, {
        ...spec.transition,
        delay: staggered,
      }),
    )
  }

  onMount(() => {
    applyHidden()
    if (startOnView()) {
      // Upstream: whileInView="show" with viewport={{ once }}.
      const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            controls = play()
            if (once()) observer.disconnect()
          }
        }
      })
      observer.observe(rootEl)
      onCleanup(() => observer.disconnect())
    } else {
      // Upstream: animate="show" immediately.
      controls = play()
    }
    onCleanup(() => controls.forEach(c => c.stop()))
  })

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      ref={rootEl}
      aria-label={accessible() ? own.children : undefined}
      class={`whitespace-pre-wrap ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {accessible() && <span class="sr-only">{own.children}</span>}
      <For each={segments()}>
        {(segment, i) => (
          <span
            ref={el => {
              segEls[i()] = el
            }}
            aria-hidden={accessible() ? 'true' : undefined}
            class={`${by() === 'line' ? 'block' : 'inline-block whitespace-pre'} ${own.segmentClassName ?? ''}`}
          >
            {segment}
          </span>
        )}
      </For>
    </Dynamic>
  )
}

export default TextGenerate
