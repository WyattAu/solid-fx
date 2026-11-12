// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/text-animate.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Backfill: ibelick/motion-primitives @120f64f6 ships no text-animate.tsx
// (verified against the components tree; this batch needed 4 more components).
// PORT-NOTE: framer's named-variant orchestration (container staggerChildren +
// item variants + whileInView) maps to per-segment animate() calls whose delay
// is `delay + i * (duration / segments.length)` — identical stagger math. The
// per-value item transitions of each preset are preserved by starting one
// animate() per animated property. AnimatePresence `exit` variants (popLayout)
// have no unmount-animation path in Solid; the `exit` entries are kept in the
// preset data for parity but unused. `variants` accepts static keyframe
// records only (no Variant resolvers), matching the Cursor precedent.
// `memo` is dropped (Solid is fine-grained).

import { animate } from 'motion'
import type { AnimationPlaybackControls, DOMKeyframesDefinition, Transition } from 'motion'
import { createEffect, createMemo, For, onCleanup, onMount, Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

type AnimationType = 'text' | 'word' | 'character' | 'line'
type AnimationVariant =
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

// Upstream: subset of DOMMotionComponents keys (motionElements map).
type MotionElementType =
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

export interface TextAnimateProps {
  /** The text content to animate */
  children: string
  /** The class to be applied to the component */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  /** The class to be applied to each segment */
  segmentClassName?: string
  /** The delay before the animation starts */
  delay?: number
  /** The duration of the animation (drives the stagger window) */
  duration?: number
  /** Custom motion variants for the animation (static keyframes only) */
  variants?: TextAnimateVariants
  /** The element type to render */
  as?: MotionElementType
  /** How to split the text ("text", "word", "character") */
  by?: AnimationType
  /** Whether to start animation when component enters viewport */
  startOnView?: boolean
  /** Whether to animate only once */
  once?: boolean
  /** The animation preset to use */
  animation?: AnimationVariant
  /** Whether to enable accessibility features (default: true) */
  accessible?: boolean
  style?: JSX.CSSProperties
}

export type TextAnimateVariants = {
  hidden?: DOMKeyframesDefinition
  show?: DOMKeyframesDefinition
  /** Accepted for API parity; exit animations are unused (see PORT-NOTE). */
  exit?: DOMKeyframesDefinition
}

// Numeric values that are not CSS lengths (framer adds `px` to lengths).
const UNITLESS_KEYS = new Set(['opacity', 'zIndex', 'fontWeight', 'flexGrow', 'flexShrink'])

/** Applies start-state keyframes synchronously (upstream: `hidden` variant). */
function applyStartStyles(el: HTMLElement, keyframes: DOMKeyframesDefinition) {
  for (const key of Object.keys(keyframes)) {
    const value = (keyframes as Record<string, string | number>)[key]
    if (value === undefined) continue
    const styleValue =
      typeof value === 'number' && !UNITLESS_KEYS.has(key) ? `${value}px` : String(value)
    ;(el.style as unknown as Record<string, string>)[key] = styleValue
  }
}

// Item presets, values identical to upstream (per-value transitions kept).
interface ItemPreset {
  hidden: DOMKeyframesDefinition
  show: DOMKeyframesDefinition
  /** Per-value transition overrides for `show` (upstream: per-key transitions). */
  showTransition?: Record<string, Transition>
}

const defaultItemAnimationVariants: Record<AnimationVariant, ItemPreset> = {
  fadeIn: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    showTransition: { opacity: { duration: 0.3 }, y: { duration: 0.3 } },
  },
  blurIn: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    show: { opacity: 1, filter: 'blur(0px)' },
    showTransition: { opacity: { duration: 0.3 }, filter: { duration: 0.3 } },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
    show: { opacity: 1, filter: 'blur(0px)', y: 0 },
    showTransition: {
      y: { duration: 0.3 },
      opacity: { duration: 0.4 },
      filter: { duration: 0.3 },
    },
  },
  blurInDown: {
    hidden: { opacity: 0, filter: 'blur(10px)', y: -20 },
    show: { opacity: 1, filter: 'blur(0px)', y: 0 },
    showTransition: {
      y: { duration: 0.3 },
      opacity: { duration: 0.4 },
      filter: { duration: 0.3 },
    },
  },
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
    showTransition: { y: { duration: 0.3 }, opacity: { duration: 0.3 } },
  },
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    show: { y: 0, opacity: 1 },
    showTransition: { y: { duration: 0.3 }, opacity: { duration: 0.3 } },
  },
  slideLeft: {
    hidden: { x: 20, opacity: 0 },
    show: { x: 0, opacity: 1 },
    showTransition: { x: { duration: 0.3 }, opacity: { duration: 0.3 } },
  },
  slideRight: {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 },
    showTransition: { x: { duration: 0.3 }, opacity: { duration: 0.3 } },
  },
  scaleUp: {
    hidden: { scale: 0.5, opacity: 0 },
    show: { scale: 1, opacity: 1 },
    showTransition: {
      scale: { type: 'spring', damping: 15, stiffness: 300 },
      opacity: { duration: 0.3 },
    },
  },
  scaleDown: {
    hidden: { scale: 1.5, opacity: 0 },
    show: { scale: 1, opacity: 1 },
    showTransition: {
      scale: { type: 'spring', damping: 15, stiffness: 300 },
      opacity: { duration: 0.3 },
    },
  },
}

export function TextAnimate(props: TextAnimateProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'segmentClassName',
    'delay',
    'duration',
    'variants',
    'as',
    'startOnView',
    'once',
    'by',
    'animation',
    'accessible',
    'style',
  ])

  const delay = () => own.delay ?? 0
  const duration = () => own.duration ?? 0.3
  const startOnView = () => own.startOnView ?? true
  const once = () => own.once ?? false
  const by = () => own.by ?? 'word'
  const accessible = () => own.accessible ?? true

  const segments = createMemo<string[]>(() => {
    const text = own.children ?? ''
    switch (by()) {
      case 'word':
        return text.split(/(\s+)/)
      case 'character':
        return text.split('')
      case 'line':
        return text.split('\n')
      case 'text':
      default:
        return [text]
    }
  })

  // Custom variants mask the container until segments animate in
  // (upstream container hidden {opacity: 0} when `variants` is passed).
  const itemPreset = createMemo<ItemPreset | undefined>(() =>
    own.variants ? undefined : defaultItemAnimationVariants[own.animation ?? 'fadeIn'],
  )
  const itemVariants = createMemo(() => {
    if (own.variants) {
      return {
        hidden: own.variants.hidden ?? { opacity: 0 },
        show: own.variants.show ?? { opacity: 1 },
        showTransition: undefined as Record<string, Transition> | undefined,
      }
    }
    const preset = itemPreset()
    return {
      hidden: preset?.hidden ?? { opacity: 0 },
      show: preset?.show ?? { opacity: 1 },
      showTransition: preset?.showTransition,
    }
  })

  let rootEl!: HTMLElement
  let segEls: HTMLElement[] = []
  const controls: AnimationPlaybackControls[] = []

  const stopAll = () => {
    for (const c of controls) c.stop()
    controls.length = 0
  }

  const liveSegments = () => segEls.slice(0, segments().length)

  const applyHidden = () => {
    const hidden = itemVariants().hidden
    for (const el of liveSegments()) applyStartStyles(el, hidden)
    if (own.variants) rootEl.style.opacity = '0'
  }

  const play = () => {
    stopAll()
    const els = liveSegments()
    const n = Math.max(1, els.length)
    const staggerStep = duration() / n
    if (own.variants) {
      // Container show: opacity {duration: 0.01, delay}.
      controls.push(animate(rootEl, { opacity: 1 }, { duration: 0.01, delay: delay() }))
    }
    els.forEach((el, i) => {
      const segDelay = delay() + i * staggerStep
      const show = itemVariants().show
      const perValue = itemVariants().showTransition
      for (const key of Object.keys(show)) {
        const keyframes = { [key]: (show as Record<string, string | number>)[key] }
        controls.push(
          animate(el, keyframes, {
            ...(perValue?.[key] ?? {}),
            delay: segDelay,
          }),
        )
      }
    })
  }

  const reset = () => {
    stopAll()
    applyHidden()
  }

  // Replay when the text or split mode changes (upstream remounts keyed
  // segments, which animate in again via whileInView). Before mount this
  // must not run: onMount applies the initial hidden state itself.
  let mounted = false
  let isInView = false
  createEffect(() => {
    segments()
    if (!mounted) return
    if (!startOnView() || isInView) play()
    else applyHidden()
  })

  onMount(() => {
    mounted = true
    applyHidden()

    if (!startOnView()) {
      play()
      return
    }

    // Upstream whileInView with viewport={{ once }} (framer "some" amount).
    const io = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          isInView = true
          play()
          if (once()) io.disconnect()
        } else {
          isInView = false
          if (!once()) {
            reset()
          }
        }
      },
      { threshold: 0.1 },
    )
    io.observe(rootEl)
    onCleanup(() => {
      io.disconnect()
      stopAll()
    })
  })

  const segmentClass = () =>
    `${by() === 'line' ? 'block' : 'inline-block whitespace-pre'} ${own.segmentClassName ?? ''}`

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...rest}
      ref={rootEl}
      aria-label={accessible() ? own.children : undefined}
      class={`whitespace-pre-wrap ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <Show when={accessible()}>
        <span class="sr-only">{own.children}</span>
      </Show>
      <For each={segments()}>
        {segment => (
          <span
            ref={(el: HTMLElement) => {
              segEls.push(el)
              onCleanup(() => {
                segEls = segEls.filter(e => e !== el)
              })
            }}
            class={segmentClass()}
            aria-hidden={accessible() ? true : undefined}
          >
            {segment}
          </span>
        )}
      </For>
    </Dynamic>
  )
}

export default TextAnimate
