// Source: github.com/ibelick/motion-primitives components/core/text-effect.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream drives the stagger through framer variant propagation —
// the container declares `hidden`/`visible`/`exit` variants and children
// motion.spans inherit them with staggerChildren orchestration. The vanilla
// `motion` package has no variant propagation, so the port schedules each
// segment's animate() call manually: delay = delayChildren + index ×
// staggerChildren (exit runs the same schedule reversed). onAnimationStart
// fires when the reveal begins; onAnimationComplete fires when the LAST
// segment settles (upstream fires when the container's own opacity settles,
// which lands mid-reveal — the segment-complete reading is the one its docs
// imply). When `trigger` is false before ever revealing, segments are jumped
// to the hidden state instantly (upstream renders nothing in that case);
// after a reveal, trigger=false plays the exit schedule and the segments stay
// at their exit values (upstream unmounts the subtree — visually identical).

import { createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { For, Index, Show } from 'solid-js'
import { animate } from 'motion'
import type {
  AnimationPlaybackControls,
  DOMKeyframesDefinition,
  TargetAndTransition,
  Transition,
  Variant,
  Variants,
} from 'motion'
import { Dynamic } from 'solid-js/web'

export type PresetType = 'blur' | 'fade-in-blur' | 'scale' | 'fade' | 'slide'

export type PerType = 'word' | 'char' | 'line'

/** Orchestration keys accepted on variant transitions (framer parity). */
type OrchestrationTransition = Transition & {
  staggerChildren?: number
  delayChildren?: number
  staggerDirection?: number
}

type VariantRecord = Record<'hidden' | 'visible' | 'exit', TargetAndTransition | undefined>

export type TextEffectProps = {
  children: string
  per?: PerType
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
  variants?: {
    container?: Variants
    item?: Variants
  }
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  preset?: PresetType
  delay?: number
  speedReveal?: number
  speedSegment?: number
  trigger?: boolean
  onAnimationComplete?: () => void
  onAnimationStart?: () => void
  segmentWrapperClassName?: string
  containerTransition?: Transition
  segmentTransition?: Transition
  style?: JSX.CSSProperties
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'>

const defaultStaggerTimes: Record<PerType, number> = {
  char: 0.03,
  word: 0.05,
  line: 0.1,
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
}

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
  exit: { opacity: 0 },
}

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(12px)' },
    },
  },
  'fade-in-blur': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
      exit: { opacity: 0, y: 20, filter: 'blur(12px)' },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  },
}

const splitText = (text: string, per: PerType) => {
  if (per === 'line') return text.split('\n')
  return text.split(/(\s+)/)
}

const hasTransition = (
  variant?: Variant,
): variant is TargetAndTransition & { transition?: Transition } => {
  if (!variant) return false
  return typeof variant === 'object' && 'transition' in variant
}

const createVariantsWithTransition = (
  baseVariants: Variants,
  transition?: Transition & { exit?: Transition },
): Variants => {
  if (!transition) return baseVariants

  const { exit: _, ...mainTransition } = transition

  return {
    ...baseVariants,
    visible: {
      ...baseVariants.visible,
      transition: {
        ...(hasTransition(baseVariants.visible) ? baseVariants.visible.transition : {}),
        ...mainTransition,
      },
    },
    exit: {
      ...baseVariants.exit,
      transition: {
        ...(hasTransition(baseVariants.exit) ? baseVariants.exit.transition : {}),
        ...mainTransition,
        staggerDirection: -1,
      },
    },
  }
}

/** Builds `[from, to]` keyframes from a variant's hidden/visible values. */
const keyframesFrom = (
  from: TargetAndTransition | undefined,
  to: TargetAndTransition | undefined,
): DOMKeyframesDefinition => {
  const keyframes: Record<string, unknown> = {}
  if (!to) return keyframes as DOMKeyframesDefinition
  const toRecord = to as Record<string, unknown>
  const fromRecord = (from ?? {}) as Record<string, unknown>
  for (const key of Object.keys(toRecord)) {
    if (key === 'transition') continue
    keyframes[key] = [fromRecord[key], toRecord[key]]
  }
  return keyframes as DOMKeyframesDefinition
}

/** Strips variant metadata, keeping only the animatable values. */
const valueKeyframes = (variant: TargetAndTransition | undefined): DOMKeyframesDefinition => {
  const keyframes: Record<string, unknown> = {}
  if (!variant) return keyframes as DOMKeyframesDefinition
  for (const key of Object.keys(variant)) {
    if (key === 'transition') continue
    keyframes[key] = (variant as Record<string, unknown>)[key]
  }
  return keyframes as DOMKeyframesDefinition
}

export function TextEffect(props: TextEffectProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'per',
    'as',
    'variants',
    'class',
    'className',
    'preset',
    'delay',
    'speedReveal',
    'speedSegment',
    'trigger',
    'onAnimationComplete',
    'onAnimationStart',
    'segmentWrapperClassName',
    'containerTransition',
    'segmentTransition',
    'style',
  ])

  const per = () => own.per ?? 'word'
  const preset = () => own.preset ?? 'fade'
  const delay = () => own.delay ?? 0
  const speedReveal = () => own.speedReveal ?? 1
  const speedSegment = () => own.speedSegment ?? 1
  const trigger = () => own.trigger ?? true

  const segments = createMemo(() => splitText(own.children ?? '', per()))

  const computedVariants = createMemo(() => {
    const base = preset()
      ? presetVariants[preset()]
      : { container: defaultContainerVariants, item: defaultItemVariants }

    const stagger = defaultStaggerTimes[per()] / speedReveal()

    const baseDuration = 0.3 / speedSegment()

    const containerVariants = own.variants?.container
    const visibleTransition = hasTransition(containerVariants?.visible)
      ? containerVariants.visible.transition
      : undefined

    const customStagger = hasTransition(containerVariants?.visible)
      ? visibleTransition?.staggerChildren
      : undefined

    const customDelay = hasTransition(containerVariants?.visible)
      ? visibleTransition?.delayChildren
      : undefined

    return {
      container: createVariantsWithTransition(containerVariants || base.container, {
        staggerChildren: customStagger ?? stagger,
        delayChildren: customDelay ?? delay(),
        ...own.containerTransition,
        exit: {
          staggerChildren: customStagger ?? stagger,
          staggerDirection: -1,
        },
      } as Transition & { exit?: Transition }),
      item: createVariantsWithTransition(own.variants?.item || base.item, {
        duration: baseDuration,
        ...own.segmentTransition,
      } as Transition & { exit?: Transition }),
    }
  })

  let el!: HTMLElement
  let containerControls: AnimationPlaybackControls | undefined
  const itemControls: AnimationPlaybackControls[] = []
  let pendingCount = 0
  let everPlayed = false

  const stopAll = () => {
    containerControls?.stop()
    containerControls = undefined
    for (const control of itemControls) control.stop()
    itemControls.length = 0
    pendingCount = 0
  }

  onCleanup(stopAll)

  const items = () => (el ? Array.from(el.querySelectorAll<HTMLElement>('[data-mp-item]')) : [])

  const playReveal = () => {
    stopAll()
    if (!el) return
    const variants = computedVariants()
    const container = variants.container as unknown as VariantRecord
    const item = variants.item as unknown as VariantRecord

    containerControls = animate(
      el,
      keyframesFrom(container.hidden, container.visible),
      (container.visible?.transition ?? {}) as Transition,
    )

    const schedule = (container.visible?.transition ?? {}) as OrchestrationTransition
    const stagger = schedule.staggerChildren ?? defaultStaggerTimes[per()] / speedReveal()
    const delayChildren = schedule.delayChildren ?? delay()
    const itemTransition = (item.visible?.transition ?? {}) as Transition
    const itemKeyframes = keyframesFrom(item.hidden, item.visible)

    const targets = items()
    pendingCount = targets.length
    untrack(() => own.onAnimationStart?.())
    targets.forEach((target, index) => {
      const control = animate(target, itemKeyframes, {
        ...itemTransition,
        delay: delayChildren + index * stagger,
      })
      itemControls.push(control)
      void control.then(() => {
        pendingCount--
        if (pendingCount === 0) untrack(() => own.onAnimationComplete?.())
      })
    })
  }

  const playExit = () => {
    stopAll()
    if (!el) return
    const variants = computedVariants()
    const container = variants.container as unknown as VariantRecord
    const item = variants.item as unknown as VariantRecord

    const schedule = (container.exit?.transition ?? {}) as OrchestrationTransition
    const stagger = schedule.staggerChildren ?? defaultStaggerTimes[per()] / speedReveal()
    // Each segment exits on its own merged transition (duration +
    // segmentTransition); the container's exit schedule only orders them.
    const itemExitTransition = (item.exit?.transition ?? {}) as Transition
    const exitKeyframes = valueKeyframes(item.exit)

    const targets = items()
    targets.forEach((target, index) => {
      itemControls.push(
        animate(target, exitKeyframes, {
          ...itemExitTransition,
          delay: (targets.length - 1 - index) * stagger,
        }),
      )
    })
  }

  const jumpToHidden = () => {
    stopAll()
    if (!el) return
    const variants = computedVariants()
    const container = variants.container as unknown as VariantRecord
    const item = variants.item as unknown as VariantRecord
    containerControls = animate(el, valueKeyframes(container.hidden), { duration: 0 })
    for (const target of items()) {
      itemControls.push(animate(target, valueKeyframes(item.hidden), { duration: 0 }))
    }
  }

  // Upstream: initial='hidden' animate='visible' while `trigger` is true, and
  // the subtree (with its exit variant) unmounts through AnimatePresence when
  // it flips false. Any variant/children change remounts the React tree and
  // replays; here the same inputs are tracked and the schedule replays.
  createEffect(() => {
    const run = trigger()
    void computedVariants()
    void segments()

    if (!run) {
      if (everPlayed) playExit()
      else jumpToHidden()
      return
    }
    everPlayed = true
    playReveal()
  })

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      ref={el}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <Show when={per() !== 'line'}>
        <span class="sr-only">{own.children}</span>
      </Show>
      <Index each={segments()}>
        {segment => {
          const content = (
            <>
              <Show when={per() === 'line'}>
                <span data-mp-item class="block">
                  {segment()}
                </span>
              </Show>
              <Show when={per() === 'word'}>
                <span data-mp-item aria-hidden="true" class="inline-block whitespace-pre">
                  {segment()}
                </span>
              </Show>
              <Show when={per() === 'char'}>
                <span class="inline-block whitespace-pre">
                  <For each={segment().split('')}>
                    {char => (
                      <span data-mp-item aria-hidden="true" class="inline-block whitespace-pre">
                        {char}
                      </span>
                    )}
                  </For>
                </span>
              </Show>
            </>
          )

          // Upstream AnimationComponent: optional wrapper around the segment.
          return (
            <Show when={own.segmentWrapperClassName} fallback={content}>
              {wrapperClass => (
                <span class={`${per() === 'line' ? 'block' : 'inline-block'} ${wrapperClass()}`}>
                  {content}
                </span>
              )}
            </Show>
          )
        }}
      </Index>
    </Dynamic>
  )
}

export default TextEffect
