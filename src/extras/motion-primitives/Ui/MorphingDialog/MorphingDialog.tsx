// Source: github.com/ibelick/motion-primitives components/core/morphing-dialog.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream morphs trigger -> dialog with framer-motion layoutId
// shared-layout transitions (projection engine), which vanilla motion does
// not have. The port hand-rolls the FLIP: trigger-side and dialog-side
// elements register themselves under their layoutId key (the same component
// is rendered in both places, as upstream); at orchestration time each
// registered element is classified as source (inside the trigger) or target
// (inside the dialog content) by DOM containment. On open the content box
// and each paired target are fixed at their source rects, then animated
// (left/top/width/height/borderRadius) to their natural rects; inline
// geometry is released afterwards so normal flow resumes. On close the same
// elements animate back into the trigger's rects before the portal unmounts.
// Children reflow during the morph instead of framer's scale+counter-scale
// projection, and target-only elements (close button, or a description with
// disableLayoutAnimation) fade/slide in staged instead of cross-morphing.
// The trigger is visibility:hidden while open (framer hides the layoutId
// "follow" element). Upstream cn is a template merge; the default transition
// matches the docs demo spring. PORT-NOTE: upstream MorphingDialogTitle
// omits the id its Content aria-labelledby references, and Content omits the
// id its Trigger aria-controls references; the port renders both.

import type { DOMKeyframesDefinition, Transition } from 'motion'
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
import { Portal } from 'solid-js/web'

// Matches the upstream docs demo transition; also used when no transition
// prop is passed (framer's layout default is a comparable spring).
const TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.5,
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

// Pin an element to a viewport rect (fixed positioning) for FLIP morphing.
function setFixedRect(el: HTMLElement, rect: Rect) {
  el.style.position = 'fixed'
  el.style.left = `${rect.left}px`
  el.style.top = `${rect.top}px`
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  el.style.borderRadius = `${rect.radius}px`
  el.style.margin = '0'
}

// Release FLIP geometry back to normal flow.
function releaseRect(el: HTMLElement) {
  el.style.position = ''
  el.style.left = ''
  el.style.top = ''
  el.style.width = ''
  el.style.height = ''
  el.style.borderRadius = ''
  el.style.margin = ''
}

function rectCss(rect: Rect): Record<string, number> {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    borderRadius: rect.radius,
  }
}

function cssName(key: string): string {
  return key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
}

function styleKeysOf(variants?: DialogVariants): string[] {
  if (!variants) return []
  const keys = new Set([
    ...Object.keys(variants.initial ?? {}),
    ...Object.keys(variants.animate ?? {}),
  ])
  keys.delete('transition')
  keys.delete('x')
  keys.delete('y')
  return Array.from(keys)
}

type VariantStyleMap = Record<string, string | number | undefined>

type DialogVariants = {
  initial?: VariantStyleMap
  animate?: VariantStyleMap
  exit?: VariantStyleMap
}

type SharedEntry = {
  variants?: DialogVariants
  els: HTMLElement[]
}

type MorphingDialogContextValue = {
  isOpen: () => boolean
  setIsOpen: (open: boolean) => void
  uniqueId: string
  transition: () => Transition
  shared: Map<string, SharedEntry>
  registerShared: (key: string, el: HTMLElement, variants?: DialogVariants) => void
  reveals: Array<{ el: HTMLElement; variants?: DialogVariants }>
  registerReveal: (el: HTMLElement, variants?: DialogVariants) => void
  triggerEl: () => HTMLElement | undefined
  setTriggerEl: (el: HTMLElement | undefined) => void
  contentEl: () => HTMLElement | undefined
  setContentEl: (el: HTMLElement | undefined) => void
  backdropEl: () => HTMLElement | undefined
  setBackdropEl: (el: HTMLElement | undefined) => void
  orchestrateEnter: () => void
}

const MorphingDialogContext = createContext<MorphingDialogContextValue>()

function useMorphingDialog() {
  const context = useContext(MorphingDialogContext)
  if (!context) {
    throw new Error('useMorphingDialog must be used within a MorphingDialog')
  }
  return context
}

export type MorphingDialogProps = {
  children: JSX.Element
  transition?: Transition
}

export function MorphingDialog(props: MorphingDialogProps) {
  const [isOpen, setIsOpen] = createSignal(false)
  const uniqueId = createUniqueId()

  const [triggerEl, setTriggerEl] = createSignal<HTMLElement | undefined>(undefined)
  const [contentEl, setContentEl] = createSignal<HTMLElement | undefined>(undefined)
  const [backdropEl, setBackdropEl] = createSignal<HTMLElement | undefined>(undefined)

  const shared = new Map<string, SharedEntry>()
  const reveals: Array<{ el: HTMLElement; variants?: DialogVariants }> = []

  const registerShared = (key: string, el: HTMLElement, variants?: DialogVariants) => {
    const entry: SharedEntry = shared.get(key) ?? { els: [] }
    if (!entry.els.includes(el)) entry.els.push(el)
    if (variants) entry.variants = variants
    shared.set(key, entry)
    onCleanup(() => {
      const cur = shared.get(key)
      if (cur) {
        cur.els = cur.els.filter(e => e !== el)
        if (cur.els.length === 0) shared.delete(key)
      }
    })
  }

  const registerReveal = (el: HTMLElement, variants?: DialogVariants) => {
    const entry = { el, variants }
    reveals.push(entry)
    onCleanup(() => {
      const i = reveals.indexOf(entry)
      if (i >= 0) reveals.splice(i, 1)
    })
  }

  const transition = () => props.transition ?? TRANSITION

  // Presence signal: the portal stays mounted until the closing morph
  // completes.
  const [present, setPresent] = createSignal(false)
  createEffect(() => {
    if (isOpen()) setPresent(true)
  })

  let morphControls: Array<ReturnType<typeof animate>> = []
  let phase: 'idle' | 'entering' | 'open' | 'closing' = 'idle'
  let focusables: HTMLElement[] = []

  const stopMorphs = () => {
    morphControls.forEach(c => {
      c.stop()
    })
    morphControls = []
  }

  type Pair = { target: HTMLElement; source?: HTMLElement; variants?: DialogVariants }

  // Classify registered elements by containment at orchestration time.
  const classify = (): { pairs: Pair[]; lone: Pair[] } => {
    const content = contentEl()
    const trigger = triggerEl()
    const pairs: Pair[] = []
    const lone: Pair[] = []
    if (!content) return { pairs, lone }
    shared.forEach(entry => {
      const target = entry.els.find(el => content.contains(el))
      if (!target) return
      const source = trigger ? entry.els.find(el => trigger.contains(el)) : undefined
      const pair = { target, source, variants: entry.variants }
      if (source) pairs.push(pair)
      else lone.push(pair)
    })
    return { pairs, lone }
  }

  const orchestrateEnter = () => {
    const content = contentEl()
    const trigger = triggerEl()
    const backdrop = backdropEl()
    if (!content || !trigger) return
    phase = 'entering'
    stopMorphs()

    const source = rectOf(trigger)
    const natural = rectOf(content)
    setFixedRect(content, source)

    const { pairs, lone } = classify()

    if (backdrop) {
      backdrop.style.opacity = '0'
      morphControls.push(animate(backdrop, { opacity: 1 }, { duration: 0.3 }))
    }

    // Paired targets morph from their trigger-side rects.
    pairs.forEach(pair => {
      const from = rectOf(pair.source!)
      const to = rectOf(pair.target)
      setFixedRect(pair.target, from)
      const toCss: Record<string, string | number> = rectCss(to)
      styleKeysOf(pair.variants).forEach(k => {
        const fromV = pair.variants?.initial?.[k]
        const toV = (pair.variants?.animate?.[k] ?? fromV) as string | number
        if (fromV !== undefined) {
          pair.target.style.setProperty(cssName(k), String(fromV))
          toCss[k] = toV
        }
      })
      morphControls.push(
        animate(
          pair.target,
          toCss as DOMKeyframesDefinition,
          transition() as Parameters<typeof animate>[2],
        ),
      )
    })

    // Target-only elements fade/slide in staged.
    const loneEls: Array<{ el: HTMLElement; variants?: DialogVariants }> = lone.map(pair => ({
      el: pair.target,
      variants: pair.variants,
    }))
    reveals.forEach(entry => {
      loneEls.push(entry)
    })

    loneEls.forEach((entry, i) => {
      const initial = entry.variants?.initial ?? {}
      const animateTo = entry.variants?.animate ?? {}
      const keyframes: Record<string, (string | number)[]> = {
        opacity: [
          (initial.opacity as number | undefined) ?? 0,
          (animateTo.opacity as number | undefined) ?? 1,
        ],
      }
      if (initial.y !== undefined || animateTo.y !== undefined) {
        keyframes.y = [
          (initial.y as number | undefined) ?? 8,
          (animateTo.y as number | undefined) ?? 0,
        ]
      }
      if (initial.filter !== undefined || animateTo.filter !== undefined) {
        keyframes.filter = [
          (initial.filter as string | undefined) ?? 'blur(0px)',
          (animateTo.filter as string | undefined) ?? 'blur(0px)',
        ]
      }
      entry.el.style.opacity = '0'
      morphControls.push(
        animate(
          entry.el,
          keyframes as DOMKeyframesDefinition,
          { duration: 0.25, delay: 0.15 + i * 0.05, ease: 'easeOut' } as Parameters<
            typeof animate
          >[2],
        ),
      )
    })

    morphControls.push(
      animate(
        content,
        rectCss(natural) as DOMKeyframesDefinition,
        transition() as Parameters<typeof animate>[2],
      ),
    )

    const lead = morphControls[morphControls.length - 1]
    void lead.then(() => {
      if (!isOpen() || phase !== 'entering') return
      phase = 'open'
      // Release FLIP geometry; natural flow equals the measured rects.
      releaseRect(content)
      pairs.forEach(pair => {
        releaseRect(pair.target)
      })
      loneEls.forEach(entry => {
        entry.el.style.opacity = ''
      })
      const nodes = content.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusables = Array.from(nodes) as HTMLElement[]
      focusables[0]?.focus()
    })
  }

  const orchestrateClose = () => {
    const content = contentEl()
    const trigger = triggerEl()
    const backdrop = backdropEl()
    if (!content || !trigger) {
      setPresent(false)
      return
    }
    phase = 'closing'
    stopMorphs()

    const source = rectOf(trigger)
    // Pin current rects before switching to fixed (no visual jump).
    setFixedRect(content, rectOf(content))

    const { pairs, lone } = classify()

    pairs.forEach(pair => {
      const current = rectOf(pair.target)
      setFixedRect(pair.target, current)
      const toCss: Record<string, string | number> = rectCss(rectOf(pair.source!))
      // Exit variants fade the element out alongside the morph.
      styleKeysOf(pair.variants).forEach(k => {
        if (pair.variants?.exit?.[k] !== undefined) {
          toCss[k] = pair.variants.exit[k] as string | number
        }
      })
      morphControls.push(
        animate(
          pair.target,
          toCss as DOMKeyframesDefinition,
          transition() as Parameters<typeof animate>[2],
        ),
      )
    })

    lone.forEach(pair => {
      morphControls.push(
        animate(
          pair.target,
          {
            opacity: (pair.variants?.exit?.opacity as number | undefined) ?? 0,
          } as DOMKeyframesDefinition,
          { duration: 0.2, ease: 'easeOut' } as Parameters<typeof animate>[2],
        ),
      )
    })
    reveals.forEach(entry => {
      morphControls.push(
        animate(
          entry.el,
          {
            opacity: (entry.variants?.exit?.opacity as number | undefined) ?? 0,
          } as DOMKeyframesDefinition,
          { duration: 0.2, ease: 'easeOut' } as Parameters<typeof animate>[2],
        ),
      )
    })

    if (backdrop) {
      morphControls.push(animate(backdrop, { opacity: 0 }, { duration: 0.3 }))
    }

    const lead = animate(
      content,
      rectCss(source) as DOMKeyframesDefinition,
      transition() as Parameters<typeof animate>[2],
    )
    morphControls.push(lead)
    void lead.then(() => {
      if (isOpen()) return
      phase = 'idle'
      setPresent(false)
      trigger.focus()
    })
  }

  // Close orchestration runs when isOpen flips false while present.
  createEffect(() => {
    const open = isOpen()
    document.body.classList.toggle('overflow-hidden', open)

    if (!open) {
      untrack(() => {
        if (present() && (phase === 'open' || phase === 'entering')) {
          orchestrateClose()
        }
      })
    }

    onCleanup(() => {
      document.body.classList.remove('overflow-hidden')
    })
  })

  // Escape + focus trap while open.
  createEffect(() => {
    if (!isOpen()) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
      if (event.key === 'Tab' && focusables.length > 0) {
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown))
  })

  onCleanup(() => {
    stopMorphs()
  })

  return (
    <MorphingDialogContext.Provider
      value={{
        isOpen,
        setIsOpen,
        uniqueId,
        transition,
        shared,
        registerShared,
        reveals,
        registerReveal,
        triggerEl,
        setTriggerEl,
        contentEl,
        setContentEl,
        backdropEl,
        setBackdropEl,
        orchestrateEnter,
      }}
    >
      {props.children}
    </MorphingDialogContext.Provider>
  )
}

export type MorphingDialogTriggerProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
}

export function MorphingDialogTrigger(props: MorphingDialogTriggerProps) {
  const [own, rest] = splitProps(props, ['children', 'class', 'className', 'style'])
  const context = useMorphingDialog()

  const handleClick = () => {
    context.setIsOpen(!context.isOpen())
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      context.setIsOpen(!context.isOpen())
    }
  }

  const triggerRef = (el: HTMLButtonElement) => {
    context.setTriggerEl(el)
    onCleanup(() => context.setTriggerEl(undefined))

    // The trigger is the layoutId "follow" element while open: hidden.
    createEffect(() => {
      el.style.visibility = context.isOpen() ? 'hidden' : 'visible'
    })
  }

  return (
    <button
      {...rest}
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={own.style}
      class={`relative cursor-pointer ${own.class ?? ''} ${own.className ?? ''}`}
      aria-haspopup="dialog"
      aria-expanded={context.isOpen()}
      aria-controls={`motion-ui-morphing-dialog-content-${context.uniqueId}`}
      aria-label={`Open dialog ${context.uniqueId}`}
    >
      {own.children}
    </button>
  )
}

export type MorphingDialogContentProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
}

export function MorphingDialogContent(props: MorphingDialogContentProps) {
  const [own, rest] = splitProps(props, ['children', 'class', 'className', 'style'])
  const context = useMorphingDialog()

  const contentRef = (el: HTMLDivElement) => {
    context.setContentEl(el)
    onCleanup(() => context.setContentEl(undefined))

    // Inlined upstream useClickOutside (mousedown + touchstart): clicks on
    // the backdrop (outside the content box) close the dialog.
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (el.contains(event.target as Node)) return
      if (context.isOpen()) context.setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    })

    // All descendant refs (backdrop, paired targets) have run by now: the
    // enter morph starts here, at mount, when opening.
    if (context.isOpen()) {
      context.orchestrateEnter()
    }
  }

  return (
    <div
      {...rest}
      ref={contentRef}
      id={`motion-ui-morphing-dialog-content-${context.uniqueId}`}
      class={`overflow-hidden ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`motion-ui-morphing-dialog-title-${context.uniqueId}`}
      aria-describedby={`motion-ui-morphing-dialog-description-${context.uniqueId}`}
    >
      {own.children}
    </div>
  )
}

export type MorphingDialogContainerProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
}

export function MorphingDialogContainer(props: MorphingDialogContainerProps) {
  const [own] = splitProps(props, ['children', 'class', 'className', 'style'])
  const context = useMorphingDialog()

  const backdropRef = (el: HTMLDivElement) => {
    context.setBackdropEl(el)
    onCleanup(() => context.setBackdropEl(undefined))
  }

  return (
    <Show when={context.isOpen()}>
      <Portal mount={document.body}>
        <div
          ref={backdropRef}
          class="fixed inset-0 z-40 h-full w-full bg-white/40 backdrop-blur-xs dark:bg-black/40"
        />
        <div
          class={`fixed inset-0 z-50 flex items-center justify-center ${own.class ?? ''} ${own.className ?? ''}`}
          style={own.style}
        >
          {own.children}
        </div>
      </Portal>
    </Show>
  )
}

export type MorphingDialogTitleProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
}

export function MorphingDialogTitle(props: MorphingDialogTitleProps) {
  const [own] = splitProps(props, ['children', 'class', 'className', 'style'])
  const context = useMorphingDialog()

  const ref = (el: HTMLDivElement) => {
    context.registerShared(`dialog-title-container-${context.uniqueId}`, el)
  }

  return (
    <div
      ref={ref}
      id={`motion-ui-morphing-dialog-title-${context.uniqueId}`}
      class={own.class}
      style={own.style}
    >
      {own.children}
    </div>
  )
}

export type MorphingDialogSubtitleProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
}

export function MorphingDialogSubtitle(props: MorphingDialogSubtitleProps) {
  const [own] = splitProps(props, ['children', 'class', 'className', 'style'])
  const context = useMorphingDialog()

  const ref = (el: HTMLDivElement) => {
    context.registerShared(`dialog-subtitle-container-${context.uniqueId}`, el)
  }

  return (
    <div ref={ref} class={own.class} style={own.style}>
      {own.children}
    </div>
  )
}

export type MorphingDialogDescriptionProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  disableLayoutAnimation?: boolean
  variants?: DialogVariants
}

export function MorphingDialogDescription(props: MorphingDialogDescriptionProps) {
  const [own] = splitProps(props, ['children', 'class', 'disableLayoutAnimation', 'variants'])
  const context = useMorphingDialog()

  const ref = (el: HTMLDivElement) => {
    if (own.disableLayoutAnimation) {
      context.registerReveal(el, own.variants)
    } else {
      context.registerShared(`dialog-description-content-${context.uniqueId}`, el, own.variants)
    }
  }

  return (
    <div
      ref={ref}
      id={`motion-ui-morphing-dialog-description-${context.uniqueId}`}
      class={own.class}
    >
      {own.children}
    </div>
  )
}

export type MorphingDialogImageProps = {
  src: string
  alt: string
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
}

export function MorphingDialogImage(props: MorphingDialogImageProps) {
  const [own, rest] = splitProps(props, ['src', 'alt', 'class', 'className', 'style'])
  const context = useMorphingDialog()

  const ref = (el: HTMLImageElement) => {
    context.registerShared(`dialog-img-${context.uniqueId}`, el)
  }

  return (
    <img
      {...rest}
      ref={ref}
      src={own.src}
      alt={own.alt}
      class={`${own.class ?? ''} ${own.className ?? ''}` || undefined}
      style={own.style}
    />
  )
}

export type MorphingDialogCloseProps = {
  children?: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  variants?: DialogVariants
}

export function MorphingDialogClose(props: MorphingDialogCloseProps) {
  const [own] = splitProps(props, ['children', 'class', 'className', 'variants'])
  const context = useMorphingDialog()

  const ref = (el: HTMLButtonElement) => {
    context.registerReveal(el, own.variants)
  }

  return (
    <button
      ref={ref}
      onClick={() => context.setIsOpen(false)}
      type="button"
      aria-label="Close dialog"
      class={`absolute top-6 right-6 ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children || <XIcon size={24} />}
    </button>
  )
}

// Upstream: XIcon from lucide-react. Identical 24x24 stroke SVG inlined
// (Dock/AccordionDemo precedent).
function XIcon(props: { size?: number; class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
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

export default MorphingDialog
