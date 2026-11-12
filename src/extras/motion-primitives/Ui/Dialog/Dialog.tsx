// Source: github.com/ibelick/motion-primitives components/core/dialog.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream cn (tailwind-merge) is a plain template merge here,
// matching the other ports. AnimatePresence is sequenced manually: the exit
// animation (from variants.exit; the upstream defaults define no exit values,
// so the default close is instant, as upstream) runs, then dialog.close()
// fires on completion and the portal unmounts. The centering
// -translate-x-1/2 -translate-y-1/2 classes are replaced by x/y percentages
// in the enter keyframes (vanilla motion writes transform, which would
// double-compose with Tailwind v4's separate translate property). The
// upstream @/hooks/usePreventScroll (react-spectrum iOS logic) is inlined
// below, rewired from useLayoutEffect to a tracked createEffect.

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
  untrack,
  useContext,
} from 'solid-js'
import { Portal } from 'solid-js/web'

const defaultVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
}

const defaultTransition: Transition = {
  ease: 'easeOut',
  duration: 0.2,
}

type VariantStyleMap = Record<string, string | number | undefined>

type DialogContextValue = {
  isOpen: () => boolean
  present: () => boolean
  setIsOpen: (open: boolean) => void
  dialogRef: () => HTMLDialogElement | undefined
  setDialogRef: (el: HTMLDialogElement | undefined) => void
  variants: () => Variants
  transition: () => Transition
  ids: {
    dialog: string
    title: string
    description: string
  }
  handleTrigger: () => void
}

const DialogContext = createContext<DialogContextValue>()

function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('Dialog parts must be used within Dialog')
  return context
}

// Build enter keyframes [initialValue, animateValue] from a variants pair.
function enterKeyframes(variants: Variants): {
  keyframes: DOMKeyframesDefinition
  centered: boolean
} {
  const initial = variants.initial as VariantStyleMap | undefined
  const target = variants.animate as VariantStyleMap | undefined
  const keyframes: Record<string, (string | number)[]> = {}
  const keys = new Set([...Object.keys(initial ?? {}), ...Object.keys(target ?? {})])
  let centered = false
  keys.forEach(key => {
    if (key === 'x' || key === 'y') {
      centered = true
      return
    }
    const from =
      (initial?.[key] as string | number | undefined) ?? (target?.[key] as string | number)
    const to = (target?.[key] as string | number | undefined) ?? (initial?.[key] as string | number)
    keyframes[key] = [from, to]
  })
  if (!centered) {
    // Keep the dialog centered through the animation (see header PORT-NOTE).
    keyframes.x = ['-50%', '-50%']
    keyframes.y = ['-50%', '-50%']
  }
  return { keyframes, centered }
}

// ---------------------------------------------------------------------------
// Inlined upstream @/hooks/usePreventScroll (react-spectrum derived).
// ---------------------------------------------------------------------------

function isMac(): boolean | undefined {
  return testPlatform(/^Mac/)
}

function isIPhone(): boolean | undefined {
  return testPlatform(/^iPhone/)
}

function isIPad(): boolean | undefined {
  return (
    testPlatform(/^iPad/) ||
    // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    (isMac() && navigator.maxTouchPoints > 1)
  )
}

function isIOS(): boolean | undefined {
  return isIPhone() || isIPad()
}

function testPlatform(re: RegExp): boolean | undefined {
  return typeof window !== 'undefined' && window.navigator != null
    ? re.test(window.navigator.platform)
    : undefined
}

const KEYBOARD_BUFFER = 24

function chain(...callbacks: Array<(...args: unknown[]) => void>): () => void {
  return (...args: unknown[]) => {
    for (const callback of callbacks) {
      if (typeof callback === 'function') {
        callback(...args)
      }
    }
  }
}

const visualViewport: VisualViewport | null =
  typeof document !== 'undefined' ? window.visualViewport : null

export function isScrollable(node: Element): boolean {
  const style = window.getComputedStyle(node)
  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY)
}

export function getScrollParent(node: Element): Element {
  if (isScrollable(node)) {
    node = node.parentElement as HTMLElement
  }

  while (node && !isScrollable(node)) {
    node = node.parentElement as HTMLElement
  }

  return node || document.scrollingElement || document.documentElement
}

// HTML input types that do not cause the software keyboard to appear.
const nonTextInputTypes = new Set([
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'button',
  'submit',
  'reset',
])

// The number of active prevent-scroll locks; the last one to release restores
// the original page style/scroll position.
let preventScrollCount = 0
let restore: (() => void) | undefined

/**
 * Prevents scrolling on the document body while active, and restores it when
 * disabled (upstream usePreventScroll hook).
 */
function usePreventScroll(options: { isDisabled: () => boolean }) {
  createEffect(() => {
    if (options.isDisabled()) {
      return
    }

    preventScrollCount++
    if (preventScrollCount === 1) {
      if (isIOS()) {
        restore = preventScrollMobileSafari()
      }
    }

    onCleanup(() => {
      preventScrollCount--
      if (preventScrollCount === 0) {
        restore?.()
        restore = undefined
      }
    })
  })
}

// Mobile Safari is a whole different beast. Even with overflow: hidden, it
// still scrolls the page in many situations (collapsed toolbar, keyboard
// viewport, input centering). Logic kept as upstream.
function preventScrollMobileSafari() {
  let scrollable: Element
  let lastY = 0
  const onTouchStart = (e: TouchEvent) => {
    // Store the nearest scrollable parent element from the touched element.
    scrollable = getScrollParent(e.target as Element)
    if (scrollable === document.documentElement && scrollable === document.body) {
      return
    }

    lastY = e.changedTouches[0].pageY
  }

  const onTouchMove = (e: TouchEvent) => {
    // Prevent scrolling the window.
    if (!scrollable || scrollable === document.documentElement || scrollable === document.body) {
      e.preventDefault()
      return
    }

    // Prevent scrolling up when at the top and scrolling down when at the
    // bottom of a nested scrollable area, otherwise mobile Safari will start
    // scrolling the window instead. Unfortunately, this disables bounce
    // scrolling when at the top but it's the best we can do.
    const y = e.changedTouches[0].pageY
    const scrollTop = scrollable.scrollTop
    const bottom = scrollable.scrollHeight - scrollable.clientHeight

    if (bottom === 0) {
      return
    }

    if ((scrollTop <= 0 && y > lastY) || (scrollTop >= bottom && y < lastY)) {
      e.preventDefault()
    }

    lastY = y
  }

  const onTouchEnd = (e: TouchEvent) => {
    const target = e.target as HTMLElement

    // Apply this change if we're not already focused on the target element
    if (isInput(target) && target !== document.activeElement) {
      e.preventDefault()

      // Apply a transform to trick Safari into thinking the input is at the
      // top of the page so it doesn't try to scroll it into view.
      target.style.transform = 'translateY(-2000px)'
      target.focus()
      requestAnimationFrame(() => {
        target.style.transform = ''
      })
    }
  }

  const onFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement
    if (isInput(target)) {
      target.style.transform = 'translateY(-2000px)'
      requestAnimationFrame(() => {
        target.style.transform = ''

        if (visualViewport) {
          if (visualViewport.height < window.innerHeight) {
            // If the keyboard is already visible, do this after one additional frame.
            requestAnimationFrame(() => {
              scrollIntoView(target)
            })
          } else {
            // Wait for the visual viewport to resize before scrolling.
            visualViewport.addEventListener('resize', () => scrollIntoView(target), {
              once: true,
            })
          }
        }
      })
    }
  }

  const onWindowScroll = () => {
    // Last resort. If the window scrolled, scroll it back to the top.
    window.scrollTo(0, 0)
  }

  // Record the original scroll position so we can restore it.
  const scrollX = window.pageXOffset
  const scrollY = window.pageYOffset

  const restoreStyles = chain(
    setStyle(
      document.documentElement,
      'paddingRight',
      `${window.innerWidth - document.documentElement.clientWidth}px`,
    ),
  )

  window.scrollTo(0, 0)

  const removeEvents = chain(
    addEvent(document, 'touchstart', onTouchStart, { passive: false, capture: true }),
    addEvent(document, 'touchmove', onTouchMove, { passive: false, capture: true }),
    addEvent(document, 'touchend', onTouchEnd, { passive: false, capture: true }),
    addEvent(document, 'focus', onFocus, true),
    addEvent(window, 'scroll', onWindowScroll),
  )

  return () => {
    // Restore styles and scroll the page back to where it was.
    restoreStyles()
    removeEvents()
    window.scrollTo(scrollX, scrollY)
  }
}

// Sets a CSS property on an element, and returns a function to revert it.
function setStyle(element: HTMLElement, style: string, value: string) {
  const cur = element.style.getPropertyValue(style)
  element.style.setProperty(style, value)

  return () => {
    element.style.setProperty(style, cur)
  }
}

// Adds an event listener to an element, and returns a function to remove it.
function addEvent<K extends keyof DocumentEventMap>(
  target: EventTarget,
  event: K,
  handler: (ev: DocumentEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions,
) {
  target.addEventListener(event, handler as EventListener, options)

  return () => {
    target.removeEventListener(event, handler as EventListener, options)
  }
}

function scrollIntoView(target: Element) {
  const root = document.scrollingElement || document.documentElement
  let node: Element | null = target
  while (node && node !== root) {
    // Find the parent scrollable element and adjust the scroll position if
    // the target is not already in view.
    const scrollable = getScrollParent(node)
    if (
      scrollable !== document.documentElement &&
      scrollable !== document.body &&
      scrollable !== node
    ) {
      const scrollableTop = scrollable.getBoundingClientRect().top
      const targetTop = node.getBoundingClientRect().top
      const targetBottom = node.getBoundingClientRect().bottom
      // Buffer is needed for some edge cases
      const keyboardHeight = scrollable.getBoundingClientRect().bottom + KEYBOARD_BUFFER

      if (targetBottom > keyboardHeight) {
        scrollable.scrollTop += targetTop - scrollableTop
      }
    }

    node = (scrollable as HTMLElement).parentElement
  }
}

export function isInput(target: Element): boolean {
  return (
    (target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type)) ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

// ---------------------------------------------------------------------------
// Dialog compound
// ---------------------------------------------------------------------------

export type DialogProps = {
  children: JSX.Element
  variants?: Variants
  transition?: Transition
  class?: string
  /** React parity alias; merges with `class` where applied. */
  className?: string
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function Dialog(props: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(props.defaultOpen || false)
  const [dialogEl, setDialogEl] = createSignal<HTMLDialogElement | undefined>(undefined)
  // Presence signal for the portal (AnimatePresence equivalent): stays true
  // while the exit animation runs.
  const [present, setPresent] = createSignal(
    props.open !== undefined ? props.open : uncontrolledOpen(),
  )

  const isOpen = () => (props.open !== undefined ? props.open : uncontrolledOpen())

  createEffect(() => {
    if (isOpen()) setPresent(true)
  })

  // prevent scroll when dialog is open on iOS
  usePreventScroll({ isDisabled: () => !isOpen() })

  const setIsOpen = (value: boolean) => {
    setUncontrolledOpen(value)
    props.onOpenChange?.(value)
  }

  let exitControls: ReturnType<typeof animate> | undefined

  createEffect(() => {
    const dialog = dialogEl()
    if (!dialog) return
    const open = isOpen()

    document.body.classList.toggle('overflow-hidden', open)

    if (open) {
      if (!dialog.open) dialog.showModal()
      return
    }

    // Upstream: AnimatePresence exit -> onAnimationComplete('exit') -> close().
    // The default variants define no exit values, so the default close is
    // instant. When the caller supplies variants.exit, animate it first.
    untrack(() => {
      const exit = props.variants?.exit as VariantStyleMap | undefined
      if (exit && Object.keys(exit).length > 0) {
        exitControls?.stop()
        exitControls = animate(
          dialog,
          exit as DOMKeyframesDefinition,
          props.transition ?? defaultTransition,
        )
        void exitControls.then(() => {
          if (!isOpen()) {
            dialog.close()
            setPresent(false)
          }
        })
      } else {
        dialog.close()
        setPresent(false)
      }
    })

    onCleanup(() => {
      document.body.classList.remove('overflow-hidden')
    })
  })

  const handleTrigger = () => {
    setIsOpen(true)
  }

  const baseId = createUniqueId()
  const ids = {
    dialog: `motion-ui-dialog-${baseId}`,
    title: `motion-ui-dialog-title-${baseId}`,
    description: `motion-ui-dialog-description-${baseId}`,
  }

  return (
    <DialogContext.Provider
      value={{
        isOpen,
        present,
        setIsOpen,
        dialogRef: dialogEl,
        setDialogRef: setDialogEl,
        variants: () => props.variants ?? defaultVariants,
        transition: () => props.transition ?? defaultTransition,
        ids,
        handleTrigger,
      }}
    >
      {props.children}
    </DialogContext.Provider>
  )
}

export type DialogTriggerProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function DialogTrigger(props: DialogTriggerProps) {
  const context = useDialog()

  return (
    <button
      onClick={() => context.handleTrigger()}
      class={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${props.class ?? ''} ${props.className ?? ''}`}
    >
      {props.children}
    </button>
  )
}

export type DialogPortalProps = {
  children: JSX.Element
  container?: HTMLElement | null
}

export function DialogPortal(props: DialogPortalProps) {
  return <Portal mount={props.container ?? document.body}>{props.children}</Portal>
}

export type DialogContentProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  container?: HTMLElement
}

export function DialogContent(props: DialogContentProps) {
  const context = useDialog()

  // Upstream: motion.dialog initial='initial' -> animate='animate', plus the
  // native dialog cancel event (Escape) routed through setIsOpen.
  const dialogRef = (el: HTMLDialogElement) => {
    context.setDialogRef(el)
    onCleanup(() => context.setDialogRef(undefined))

    const handleCancel = (e: Event) => {
      e.preventDefault()
      if (context.isOpen()) {
        context.setIsOpen(false)
      }
    }
    el.addEventListener('cancel', handleCancel)
    onCleanup(() => el.removeEventListener('cancel', handleCancel))

    if (!context.isOpen()) return
    const { keyframes } = enterKeyframes(context.variants())
    animate(el, keyframes, context.transition() as Parameters<typeof animate>[2])
  }

  return (
    <DialogPortal container={props.container}>
      <Show when={context.present()}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: upstream parity —
            click-outside close; keyboard users close via Escape (the native
            dialog cancel event). */}
        <dialog
          ref={dialogRef}
          id={context.ids.dialog}
          aria-labelledby={context.ids.title}
          aria-describedby={context.ids.description}
          aria-modal="true"
          onClick={(e: MouseEvent) => {
            if (e.target === context.dialogRef()) {
              context.setIsOpen(false)
            }
          }}
          class={`fixed top-1/2 left-1/2 rounded-lg border border-zinc-200 p-0 shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-xs open:flex open:flex-col ${props.class ?? ''} ${props.className ?? ''}`}
        >
          <div class="w-full">{props.children}</div>
        </dialog>
      </Show>
    </DialogPortal>
  )
}

export type DialogHeaderProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function DialogHeader(props: DialogHeaderProps) {
  return (
    <div class={`flex flex-col space-y-1.5 ${props.class ?? ''} ${props.className ?? ''}`}>
      {props.children}
    </div>
  )
}

export type DialogTitleProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function DialogTitle(props: DialogTitleProps) {
  const context = useDialog()

  return (
    <h2
      id={context.ids.title}
      class={`text-base font-medium ${props.class ?? ''} ${props.className ?? ''}`}
    >
      {props.children}
    </h2>
  )
}

export type DialogDescriptionProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export function DialogDescription(props: DialogDescriptionProps) {
  const context = useDialog()

  return (
    <p
      id={context.ids.description}
      class={`text-base text-zinc-500 ${props.class ?? ''} ${props.className ?? ''}`}
    >
      {props.children}
    </p>
  )
}

export type DialogCloseProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  children?: JSX.Element
  disabled?: boolean
}

export function DialogClose(props: DialogCloseProps) {
  const context = useDialog()

  return (
    <button
      onClick={() => context.setIsOpen(false)}
      type="button"
      aria-label="Close dialog"
      class={`absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-hidden focus:ring-zinc-500 focus:ring-offset-2 disabled:pointer-events-none ${props.class ?? ''} ${props.className ?? ''}`}
      disabled={props.disabled}
    >
      {props.children || <XIcon class="h-4 w-4" />}
      <span class="sr-only">Close</span>
    </button>
  )
}

// Upstream: X from lucide-react. Identical 24x24 stroke SVG inlined
// (Dock/AccordionDemo precedent).
function XIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export default Dialog
