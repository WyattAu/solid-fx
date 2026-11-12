// Source: github.com/ibelick/motion-primitives components/core/animated-group.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream drives the reveal with declarative variants
// (initial='hidden' animate='visible' + staggerChildren) on motion.create(as)
// wrappers. Vanilla motion has no variant orchestration, so the port renders
// plain Dynamic wrappers, applies the hidden styles synchronously before
// paint, and animates each item with animate(elements, [hidden, visible],
// { ...visible.transition, delay: stagger(staggerChildren) }). Custom
// container/item variants are consumed as keyframe pairs: object values
// (opacity, y, scale, rotate, rotateX, filter, ...) map 1:1; per-item delays
// come from container visible.transition.staggerChildren (framer default is
// 0 when absent). React.Children.map is replaced by wrapping the (array)
// children in item elements.

import type { DOMKeyframesDefinition, Transition, Variants } from 'motion'
import { animate, stagger } from 'motion'
import type { JSX } from 'solid-js'
import { For, onCleanup, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

export type PresetType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'blur'
  | 'blur-slide'
  | 'zoom'
  | 'flip'
  | 'bounce'
  | 'rotate'
  | 'swing'

export type AnimatedGroupProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  variants?: {
    container?: Variants
    item?: Variants
  }
  preset?: PresetType
  as?: keyof JSX.HTMLElementTags
  asChild?: keyof JSX.HTMLElementTags
}

const defaultContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const presetVariants: Record<PresetType, Variants> = {
  fade: {},
  slide: {
    hidden: { y: 20 },
    visible: { y: 0 },
  },
  scale: {
    hidden: { scale: 0.8 },
    visible: { scale: 1 },
  },
  blur: {
    hidden: { filter: 'blur(4px)' },
    visible: { filter: 'blur(0px)' },
  },
  'blur-slide': {
    hidden: { filter: 'blur(4px)', y: 20 },
    visible: { filter: 'blur(0px)', y: 0 },
  },
  zoom: {
    hidden: { scale: 0.5 },
    visible: {
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
  flip: {
    hidden: { rotateX: -90 },
    visible: {
      rotateX: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  },
  bounce: {
    hidden: { y: -50 },
    visible: {
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 10 },
    },
  },
  rotate: {
    hidden: { rotate: -180 },
    visible: {
      rotate: 0,
      transition: { type: 'spring', stiffness: 200, damping: 15 },
    },
  },
  swing: {
    hidden: { rotate: -10 },
    visible: {
      rotate: 0,
      transition: { type: 'spring', stiffness: 300, damping: 8 },
    },
  },
}

const addDefaultVariants = (variants: Variants): Variants => ({
  hidden: { ...defaultItemVariants.hidden, ...variants.hidden },
  visible: { ...defaultItemVariants.visible, ...variants.visible },
})

type VariantStyleMap = Record<string, string | number | undefined>

// Build [hidden, visible] keyframe arrays, extracting visible.transition as
// per-item animation options.
function revealKeyframes(variants: Variants): {
  keyframes: DOMKeyframesDefinition
  transition: Partial<Transition>
} {
  const hidden = variants.hidden as VariantStyleMap | undefined
  const visible = variants.visible as VariantStyleMap | undefined
  const keyframes: Record<string, (string | number)[]> = {}
  const keys = new Set([...Object.keys(hidden ?? {}), ...Object.keys(visible ?? {})])
  keys.forEach(key => {
    if (key === 'transition') return
    const from =
      (hidden?.[key] as string | number | undefined) ?? (visible?.[key] as string | number)
    const to = (visible?.[key] as string | number | undefined) ?? (hidden?.[key] as string | number)
    keyframes[key] = [from, to]
  })
  const transition = (visible?.transition ?? {}) as Partial<Transition>
  return { keyframes, transition }
}

// Initial (hidden) styles applied synchronously before the reveal animation.
function hiddenStyles(variants: Variants): Record<string, string> {
  const hidden = variants.hidden as VariantStyleMap | undefined
  const styles: Record<string, string> = {}
  Object.keys(hidden ?? {}).forEach(key => {
    if (key === 'transition') return
    const value = hidden?.[key]
    if (value !== undefined) styles[key] = String(value)
  })
  return styles
}

export function AnimatedGroup(props: AnimatedGroupProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'variants',
    'preset',
    'as',
    'asChild',
  ])

  const selectedVariants = {
    item: addDefaultVariants(own.preset ? presetVariants[own.preset] : {}),
    container: addDefaultVariants(defaultContainerVariants),
  }
  const containerVariants = own.variants?.container || selectedVariants.container
  const itemVariants = own.variants?.item || selectedVariants.item

  const as = () => own.as ?? 'div'
  const asChild = () => own.asChild ?? 'div'

  let containerEl!: HTMLDivElement

  onMount(() => {
    const items = Array.from(containerEl.children) as HTMLElement[]

    // Upstream: initial='hidden' applies before first paint.
    const containerHidden = hiddenStyles(containerVariants)
    Object.assign(containerEl.style, containerHidden)
    const itemHidden = hiddenStyles(itemVariants)
    items.forEach(el => {
      Object.assign(el.style, itemHidden)
    })

    const { keyframes: itemKeyframes, transition: itemTransition } = revealKeyframes(itemVariants)

    // Upstream: staggerChildren from the container variant orchestrates the
    // item sequence (0.1 by default; 0 when a custom container omits it).
    const containerVisible = containerVariants.visible as
      | { transition?: { staggerChildren?: number } }
      | undefined
    const staggerChildren = containerVisible?.transition?.staggerChildren ?? 0

    const controls = animate(
      containerEl,
      revealKeyframes(containerVariants).keyframes as DOMKeyframesDefinition,
      { duration: 0.3, ease: 'easeOut' },
    )
    const itemControls = animate(items, itemKeyframes, {
      ...itemTransition,
      delay: stagger(staggerChildren),
    } as Parameters<typeof animate>[2])

    onCleanup(() => {
      controls.stop()
      itemControls.stop()
    })
  })

  const childItems = () => {
    const c = own.children
    return (Array.isArray(c) ? c : [c]).filter(Boolean) as JSX.Element[]
  }

  return (
    <Dynamic
      {...rest}
      component={as()}
      ref={containerEl}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      <For each={childItems()}>{child => <Dynamic component={asChild()}>{child}</Dynamic>}</For>
    </Dynamic>
  )
}

export default AnimatedGroup
