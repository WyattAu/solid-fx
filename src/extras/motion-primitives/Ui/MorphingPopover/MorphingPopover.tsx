// Source: github.com/ibelick/motion-primitives components/core/morphing-popover.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream morphs the content into the trigger with framer-motion
// layoutId shared-layout transitions (MotionConfig + AnimatePresence). Vanilla
// motion has no layout projection engine, so the port hand-rolls the FLIP:
// the trigger wrapper registers its element, the content is mounted at its
// natural absolute position, measured, then animated left/top/width/height/
// borderRadius from the trigger rect (inline styles are cleared after the
// enter animation so auto layout resumes). Exit reverses into the trigger's
// rect, then the content unmounts. Children reflow during the morph instead
// of framer's scale+counter-scale projection (visually equivalent for this
// box size); the trigger element is visibility:hidden while open (framer
// hides the layoutId "follow" element). Upstream `cn` is a template merge.
// The `variants` prop is consumed as plain keyframes merged into the morph.

import type { DOMKeyframesDefinition, Transition, Variants } from 'motion'
import { animate } from 'motion'
import type { JSX } from 'solid-js'
import {
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  Show,
  splitProps,
  untrack,
  useContext,
} from 'solid-js'

const TRANSITION: Transition = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.4,
}

type Rect = {
  left: number
  top: number
  width: number
  height: number
  radius: number
}

function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    radius,
  }
}

type VariantStyleMap = Record<string, string | number | undefined>

type MorphingPopoverContextValue = {
  isOpen: () => boolean
  open: () => void
  close: () => void
  uniqueId: string
  variants: () => Variants | undefined
  transition: () => Transition
  triggerEl: () => HTMLElement | undefined
  setTriggerEl: (el: HTMLElement | undefined) => void
}

const MorphingPopoverContext = createContext<MorphingPopoverContextValue>()

function usePopoverLogic(options: {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const uniqueId = createUniqueId()
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(options.defaultOpen ?? false)

  const isOpen = () => (options.open !== undefined ? options.open : uncontrolledOpen())

  const open = () => {
    if (options.open === undefined) {
      setUncontrolledOpen(true)
    }
    options.onOpenChange?.(true)
  }

  const close = () => {
    if (options.open === undefined) {
      setUncontrolledOpen(false)
    }
    options.onOpenChange?.(false)
  }

  return { isOpen, open, close, uniqueId }
}

function usePopover() {
  const context = useContext(MorphingPopoverContext)
  if (!context) {
    throw new Error('MorphingPopover parts must be used within MorphingPopover')
  }
  return context
}

export type MorphingPopoverProps = {
  children: JSX.Element
  transition?: Transition
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variants?: Variants
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
} & Record<string, unknown>

export function MorphingPopover(props: MorphingPopoverProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'transition',
    'defaultOpen',
    'open',
    'onOpenChange',
    'variants',
    'class',
    'className',
  ])

  const popoverLogic = usePopoverLogic({
    defaultOpen: own.defaultOpen,
    open: own.open,
    onOpenChange: own.onOpenChange,
  })

  const [triggerEl, setTriggerEl] = createSignal<HTMLElement | undefined>(undefined)

  return (
    <MorphingPopoverContext.Provider
      value={{
        isOpen: popoverLogic.isOpen,
        open: popoverLogic.open,
        close: popoverLogic.close,
        uniqueId: popoverLogic.uniqueId,
        variants: () => own.variants,
        transition: () => own.transition ?? TRANSITION,
        triggerEl,
        setTriggerEl,
      }}
    >
      <div
        {...rest}
        class={`relative flex items-center justify-center ${own.class ?? ''} ${own.className ?? ''}`}
      >
        {own.children}
      </div>
    </MorphingPopoverContext.Provider>
  )
}

export type MorphingPopoverTriggerProps = {
  asChild?: boolean
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
} & Record<string, unknown>

export function MorphingPopoverTrigger(props: MorphingPopoverTriggerProps) {
  const [own, rest] = splitProps(props, ['asChild', 'children', 'class', 'className'])
  const context = usePopover()

  // PORT-NOTE: upstream asChild clones the child element as a motion
  // component (React cloneElement); Solid cannot merge props into an already
  // created element, so asChild=true renders the children inside the same
  // wrapper (public markup differs, behavior/aria identical).
  const wrapperRef = (el: HTMLElement) => {
    context.setTriggerEl(el)
    onCleanup(() => context.setTriggerEl(undefined))

    // Framer hides the layoutId "follow" element (the trigger) while the
    // content owns the shared layout.
    createEffect(() => {
      el.style.visibility = context.isOpen() ? 'hidden' : 'visible'
    })
  }

  return (
    <div ref={wrapperRef}>
      <button
        {...rest}
        type="button"
        onClick={() => context.open()}
        class={`${own.class ?? ''} ${own.className ?? ''}`}
        aria-expanded={context.isOpen()}
        aria-controls={`popover-content-${context.uniqueId}`}
      >
        {own.children}
      </button>
    </div>
  )
}

export type MorphingPopoverContentProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
} & Record<string, unknown>

export function MorphingPopoverContent(props: MorphingPopoverContentProps) {
  const [own, rest] = splitProps(props, ['children', 'class', 'className'])
  const context = usePopover()

  const [present, setPresent] = createSignal(false)
  let el: HTMLDivElement | undefined
  let controls: ReturnType<typeof animate> | undefined

  createEffect(() => {
    if (context.isOpen()) {
      controls?.stop()
      setPresent(true)
    } else if (present()) {
      untrack(() => {
        const node = el
        if (!node) {
          setPresent(false)
          return
        }
        // Reverse the FLIP into the trigger's current rect, then unmount.
        const trigger = context.triggerEl()
        if (!trigger) {
          setPresent(false)
          return
        }
        const source = rectOf(trigger)
        const container = node.offsetParent as HTMLElement | null
        const containerRect = container ? rectOf(container) : { left: 0, top: 0 }
        controls?.stop()
        controls = animate(
          node,
          {
            left: source.left - containerRect.left,
            top: source.top - containerRect.top,
            width: source.width,
            height: source.height,
            borderRadius: source.radius,
          },
          context.transition() as Parameters<typeof animate>[2],
        )
        void controls.then(() => {
          if (!context.isOpen()) setPresent(false)
        })
      })
    }
  })

  // Enter FLIP: mount at the natural absolute position, measure it and the
  // trigger, then animate the box from the trigger rect. Inline geometry is
  // cleared afterwards so auto layout resumes.
  const contentRef = (node: HTMLDivElement) => {
    el = node
    onCleanup(() => {
      controls?.stop()
      el = undefined
    })

    const trigger = context.triggerEl()
    if (!trigger) return

    const natural = rectOf(node)
    const source = rectOf(trigger)
    const container = node.offsetParent as HTMLElement | null
    const containerRect = container ? rectOf(container) : { left: 0, top: 0 }

    const variants = context.variants() as
      | { initial?: VariantStyleMap; animate?: VariantStyleMap }
      | undefined
    const initial = variants?.initial ?? {}
    const animateTo = variants?.animate ?? {}
    const styleKeys = Object.keys(initial).filter(k => k !== 'transition' && k !== 'x' && k !== 'y')

    const start: Record<string, string | number> = {
      left: source.left - containerRect.left,
      top: source.top - containerRect.top,
      width: source.width,
      height: source.height,
      borderRadius: source.radius,
    }
    const end: Record<string, string | number> = {
      left: natural.left - containerRect.left,
      top: natural.top - containerRect.top,
      width: natural.width,
      height: natural.height,
      borderRadius: natural.radius,
    }
    styleKeys.forEach(k => {
      const from = initial[k]
      const to = animateTo[k] ?? from
      if (from !== undefined) {
        start[k] = from
        end[k] = to as string | number
      }
    })
    Object.assign(node.style, {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      'border-radius': `${start.borderRadius}px`,
    })
    styleKeys.forEach(k => {
      node.style.setProperty(
        k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`),
        String(start[k]),
      )
    })

    // Start values are already applied inline; animate current -> end.
    controls = animate(
      node,
      end as DOMKeyframesDefinition,
      context.transition() as Parameters<typeof animate>[2],
    )
    void controls.then(() => {
      if (!context.isOpen()) return
      // Release inline geometry; natural layout equals the measured rect.
      node.style.left = ''
      node.style.top = ''
      node.style.width = ''
      node.style.height = ''
      node.style.borderRadius = ''
    })

    // Inlined upstream useClickOutside (mousedown + touchstart).
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (node.contains(event.target as Node)) return
      context.close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    })

    // Upstream: Escape closes while open.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') context.close()
    }
    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown))
  }

  return (
    <Show when={present()}>
      <div
        {...rest}
        ref={contentRef}
        id={`popover-content-${context.uniqueId}`}
        role="dialog"
        aria-modal="true"
        class={`absolute overflow-hidden rounded-md border border-zinc-950/10 bg-white p-2 text-zinc-950 shadow-md dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50 ${own.class ?? ''} ${own.className ?? ''}`}
      >
        {own.children}
      </div>
    </Show>
  )
}

export default MorphingPopover
