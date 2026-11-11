// Source: github.com/ibelick/motion-primitives components/core/disclosure.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: MotionConfig is replaced by carrying `transition` through an
// internal motion context (the content panel is the only animated child).
// AnimatePresence has no vanilla-motion equivalent, so the collapse is
// sequenced manually: the exit animation runs, then the element unmounts on
// completion (PORTING.md §5). Upstream's `variants` prop accepts Variant
// resolvers; only static keyframes (DOMKeyframesDefinition) are supported
// here. DisclosureTrigger clones its child element in React to attach
// onClick/role/aria/tabIndex/onKeyDown; Solid cannot clone a mounted node, so
// the port wraps the child in a span carrying those props — clicks and
// keyboard events bubble from the child, and the child keeps its own classes
// (identical composition and behavior, one extra span in the DOM). Upstream
// renders exactly children[0] and children[1]; the port renders all provided
// children, which is identical for the documented two-part composition.

import { animate } from 'motion'
import type { AnimationPlaybackControlsWithThen, DOMKeyframesDefinition, Transition } from 'motion'
import {
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  splitProps,
  useContext,
  Show,
} from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

export type DisclosureVariants = {
  expanded: DOMKeyframesDefinition
  collapsed: DOMKeyframesDefinition
}

export type DisclosureContextType = {
  open: Accessor<boolean>
  toggle: () => void
  variants: () => DisclosureVariants | undefined
}

/** Internal MotionConfig replacement: the Disclosure-level transition. */
type DisclosureMotionContextValue = {
  transition: () => Transition | undefined
}

const DisclosureContext = createContext<DisclosureContextType>()
const DisclosureMotionContext = createContext<DisclosureMotionContextValue>()

export type DisclosureProviderProps = {
  children: JSX.Element
  open: boolean
  onOpenChange?: (open: boolean) => void
  variants?: DisclosureVariants
}

export function DisclosureProvider(props: DisclosureProviderProps) {
  const [internalOpenValue, setInternalOpenValue] = createSignal<boolean>(props.open)

  // upstream useEffect([openProp]) sync.
  createEffect(() => {
    setInternalOpenValue(props.open)
  })

  const toggle = () => {
    const newOpen = !internalOpenValue()
    setInternalOpenValue(newOpen)
    if (props.onOpenChange) {
      props.onOpenChange(newOpen)
    }
  }

  return (
    <DisclosureContext.Provider
      value={{
        open: internalOpenValue,
        toggle,
        variants: () => props.variants,
      }}
    >
      {props.children}
    </DisclosureContext.Provider>
  )
}

function useDisclosure() {
  const context = useContext(DisclosureContext)
  if (!context) {
    throw new Error('useDisclosure must be used within a DisclosureProvider')
  }
  return context
}

export type DisclosureProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  variants?: DisclosureVariants
  transition?: Transition
}

export function Disclosure(props: DisclosureProps) {
  const [own] = splitProps(props, [
    'open',
    'onOpenChange',
    'children',
    'class',
    'className',
    'transition',
    'variants',
  ])

  return (
    <DisclosureMotionContext.Provider value={{ transition: () => own.transition }}>
      <div class={`${own.class ?? ''} ${own.className ?? ''}`}>
        <DisclosureProvider
          open={own.open ?? false}
          onOpenChange={own.onOpenChange}
          variants={own.variants}
        >
          {own.children}
        </DisclosureProvider>
      </div>
    </DisclosureMotionContext.Provider>
  )
}

export type DisclosureTriggerProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function DisclosureTrigger(props: DisclosureTriggerProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  const { toggle, open } = useDisclosure()

  // upstream: React.cloneElement(child, { onClick, role, 'aria-expanded',
  // tabIndex, onKeyDown, className }) — see the PORT-NOTE above.
  return (
    <span
      role="button"
      tabIndex={0}
      aria-expanded={open() ? 'true' : 'false'}
      onClick={() => toggle()}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
      class={`${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children}
    </span>
  )
}

// Numeric values that are not CSS lengths (motion adds `px` to lengths).
const UNITLESS_KEYS = new Set(['opacity', 'zIndex', 'fontWeight', 'flexGrow', 'flexShrink'])

const BASE_VARIANTS: DisclosureVariants = {
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

export type DisclosureContentProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function DisclosureContent(props: DisclosureContentProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  const { open, variants } = useDisclosure()
  const motion = useContext(DisclosureMotionContext)
  const uniqueId = createUniqueId()

  const combinedVariants = () => ({
    expanded: { ...BASE_VARIANTS.expanded, ...variants()?.expanded },
    collapsed: { ...BASE_VARIANTS.collapsed, ...variants()?.collapsed },
  })

  // AnimatePresence initial={false} parity: content mounted expanded at
  // creation appears at its final state with no enter animation.
  const [present, setPresent] = createSignal(open())
  let skipFirstEnter = open()
  let el: HTMLDivElement | undefined
  let controls: AnimationPlaybackControlsWithThen | undefined

  createEffect(() => {
    const isOpen = open()
    if (isOpen) {
      if (!present()) setPresent(true)
    } else if (present()) {
      controls?.stop()
      if (el) {
        controls = animate(el, combinedVariants().collapsed, motion?.transition())
        void controls.then(() => {
          if (!open()) setPresent(false)
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
    <div class={`overflow-hidden ${own.class ?? ''} ${own.className ?? ''}`}>
      <Show when={present()}>
        <div id={uniqueId} ref={mountRef}>
          {own.children}
        </div>
      </Show>
    </div>
  )
}

export default {
  Disclosure,
  DisclosureProvider,
  DisclosureTrigger,
  DisclosureContent,
}
