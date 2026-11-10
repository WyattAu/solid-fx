// Source: github.com/ibelick/motion-primitives components/core/accordion.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream threads `value`/`expanded` into AccordionTrigger/
// AccordionContent via React.Children.map + cloneElement; the Solid port
// publishes the same values through an accordion-item context instead
// (identical public composition API). MotionConfig is replaced by carrying
// `transition` through an internal motion context (the content panel is the
// only animated child). AnimatePresence has no vanilla-motion equivalent, so
// the collapse is sequenced manually: the exit animation runs, then the
// element unmounts on completion (PORTING.md §5). Upstream's `variants` prop
// accepts Variant resolvers; only static keyframes (DOMKeyframesDefinition)
// are supported here.

import { animate } from 'motion'
import type { AnimationPlaybackControlsWithThen, DOMKeyframesDefinition, Transition } from 'motion'
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  Show,
  splitProps,
  useContext,
} from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

/** React `React.Key` parity. */
export type AccordionKey = string | number

export type AccordionVariants = {
  expanded: DOMKeyframesDefinition
  collapsed: DOMKeyframesDefinition
}

type AccordionContextValue = {
  expandedValue: Accessor<AccordionKey | null>
  toggleItem: (value: AccordionKey) => void
  variants: () => AccordionVariants | undefined
}

type AccordionItemContextValue = {
  value: Accessor<AccordionKey>
  expanded: Accessor<boolean>
}

/** Internal MotionConfig replacement: the Accordion-level transition. */
type AccordionMotionContextValue = {
  transition: () => Transition | undefined
}

const AccordionContext = createContext<AccordionContextValue>()
const AccordionItemContext = createContext<AccordionItemContextValue>()
const AccordionMotionContext = createContext<AccordionMotionContextValue>()

function useAccordion() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('useAccordion must be used within an AccordionProvider')
  }
  return context
}

function useAccordionItem() {
  const context = useContext(AccordionItemContext)
  if (!context) {
    throw new Error('useAccordionItem must be used within an AccordionItem')
  }
  return context
}

export type AccordionProviderProps = {
  children: JSX.Element
  variants?: AccordionVariants
  expandedValue?: AccordionKey | null
  onValueChange?: (value: AccordionKey | null) => void
}

export function AccordionProvider(props: AccordionProviderProps) {
  const [internalExpandedValue, setInternalExpandedValue] = createSignal<AccordionKey | null>(null)

  const expandedValue = () =>
    props.expandedValue !== undefined ? props.expandedValue : internalExpandedValue()

  const toggleItem = (value: AccordionKey) => {
    const newValue = expandedValue() === value ? null : value
    if (props.onValueChange) {
      props.onValueChange(newValue)
    } else {
      setInternalExpandedValue(newValue)
    }
  }

  return (
    <AccordionContext.Provider
      value={{
        expandedValue,
        toggleItem,
        variants: () => props.variants,
      }}
    >
      {props.children}
    </AccordionContext.Provider>
  )
}

export type AccordionProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  transition?: Transition
  variants?: AccordionVariants
  expandedValue?: AccordionKey | null
  onValueChange?: (value: AccordionKey | null) => void
}

export function Accordion(props: AccordionProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'transition',
    'variants',
    'expandedValue',
    'onValueChange',
  ])

  return (
    <AccordionMotionContext.Provider value={{ transition: () => own.transition }}>
      <div
        {...rest}
        class={`relative ${own.class ?? ''} ${own.className ?? ''}`}
        aria-orientation="vertical"
      >
        <AccordionProvider
          variants={own.variants}
          expandedValue={own.expandedValue}
          onValueChange={own.onValueChange}
        >
          {own.children}
        </AccordionProvider>
      </div>
    </AccordionMotionContext.Provider>
  )
}

export type AccordionItemProps = {
  value: AccordionKey
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function AccordionItem(props: AccordionItemProps) {
  const [own, rest] = splitProps(props, ['value', 'children', 'class', 'className'])
  const { expandedValue } = useAccordion()
  const isExpanded = () => own.value === expandedValue()

  return (
    <AccordionItemContext.Provider value={{ value: () => own.value, expanded: isExpanded }}>
      <div
        {...rest}
        class={`overflow-hidden ${own.class ?? ''} ${own.className ?? ''}`}
        data-expanded={isExpanded() ? '' : undefined}
        data-closed={isExpanded() ? undefined : ''}
      >
        {own.children}
      </div>
    </AccordionItemContext.Provider>
  )
}

export type AccordionTriggerProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function AccordionTrigger(props: AccordionTriggerProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  const { toggleItem, expandedValue } = useAccordion()
  const item = useAccordionItem()
  const isExpanded = () => item.expanded()

  return (
    <button
      type="button"
      onClick={() => toggleItem(item.value())}
      aria-expanded={isExpanded() ? 'true' : 'false'}
      class={`group ${own.class ?? ''} ${own.className ?? ''}`}
      data-expanded={isExpanded() ? '' : undefined}
      data-closed={isExpanded() ? undefined : ''}
    >
      {own.children}
    </button>
  )
}

export type AccordionContentProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

// Numeric values that are not CSS lengths (framer adds `px` to lengths).
const UNITLESS_KEYS = new Set(['opacity', 'zIndex', 'fontWeight', 'flexGrow', 'flexShrink'])

const BASE_VARIANTS: AccordionVariants = {
  expanded: { height: 'auto', opacity: 1 },
  collapsed: { height: 0, opacity: 0 },
}

/** Applies start-state keyframes synchronously (upstream: `initial` variant). */
function applyStartStyles(el: HTMLElement, keyframes: DOMKeyframesDefinition) {
  for (const key of Object.keys(keyframes)) {
    const value = (keyframes as Record<string, string | number>)[key]
    if (value === undefined) continue
    const styleValue =
      typeof value === 'number' && !UNITLESS_KEYS.has(key) ? `${value}px` : String(value)
    ;(el.style as unknown as Record<string, string>)[key] = styleValue
  }
}

export function AccordionContent(props: AccordionContentProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  const { expandedValue, variants } = useAccordion()
  const motion = useContext(AccordionMotionContext)
  const item = useAccordionItem()
  const isExpanded = () => item.expanded()

  const combinedVariants = () => ({
    expanded: { ...BASE_VARIANTS.expanded, ...variants()?.expanded },
    collapsed: { ...BASE_VARIANTS.collapsed, ...variants()?.collapsed },
  })

  // AnimatePresence initial={false} parity: content mounted expanded at
  // creation appears at its final state with no enter animation.
  const [present, setPresent] = createSignal(isExpanded())
  let skipFirstEnter = isExpanded()
  let el: HTMLDivElement | undefined
  let controls: AnimationPlaybackControlsWithThen | undefined

  createEffect(() => {
    const expanded = isExpanded()
    if (expanded) {
      if (!present()) setPresent(true)
    } else if (present()) {
      controls?.stop()
      if (el) {
        controls = animate(el, combinedVariants().collapsed, motion?.transition())
        void controls.then(() => {
          if (!isExpanded()) setPresent(false)
        })
      } else {
        setPresent(false)
      }
    }
  })

  const mountRef = (node: HTMLDivElement) => {
    el = node
    onCleanup(() => {
      controls?.stop()
      el = undefined
    })
    if (skipFirstEnter) {
      skipFirstEnter = false
      return
    }
    // Upstream: initial='collapsed' is applied before the enter animation.
    applyStartStyles(node, combinedVariants().collapsed)
    controls?.stop()
    controls = animate(node, combinedVariants().expanded, motion?.transition())
  }

  return (
    <Show when={present()}>
      <div ref={mountRef} class={`${own.class ?? ''} ${own.className ?? ''}`}>
        {own.children}
      </div>
    </Show>
  )
}

export default Accordion
