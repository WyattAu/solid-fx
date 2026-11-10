// Source: github.com/ibelick/motion-primitives components/core/animated-background.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream uses Children.map + cloneElement to wrap every child in
// a 'relative inline-flex' box containing a shared-layoutId background div and
// a 'z-10' wrapper around the child's own content. Solid cannot introspect or
// clone children props, so the port enhances each direct element child in the
// DOM instead (data-id is read from the attribute — the documented upstream
// API) and keeps ONE persistent background element that is moved between the
// active children. The layoutId slide is reproduced with a FLIP animation
// (translate + scale from the previous rect, top-left origin); upstream's
// framer default layout spring is approximated with stiffness 350 / damping 30.
// The component root is a display:contents wrapper so children keep the exact
// layout they would have as direct siblings.

import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { DOMKeyframesDefinition, Transition } from 'motion'

// PORT-NOTE: framer's default layout transition (no `transition` prop) is a
// spring; approximated here.
const defaultLayoutTransition: Transition = { type: 'spring', stiffness: 350, damping: 30 }

export type AnimatedBackgroundProps = {
  children: JSX.Element
  defaultValue?: string
  onValueChange?: (newActiveId: string | null) => void
  /** Styles the background layer (upstream `className`). */
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  transition?: Transition
  enableHover?: boolean
}

export function AnimatedBackground(props: AnimatedBackgroundProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'defaultValue',
    'onValueChange',
    'class',
    'className',
    'transition',
    'enableHover',
  ])

  const [activeId, setActiveId] = createSignal<string | null>(null)
  const uniqueId = createUniqueId()

  let hostEl!: HTMLDivElement
  let bgEl: HTMLDivElement | undefined
  const itemMap = new Map<string, HTMLElement>()
  let controls: ReturnType<typeof animate> | undefined

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id)
    untrack(() => own.onValueChange?.(id))
  }

  // Upstream useEffect([defaultValue]) — external value drives the state.
  createEffect(() => {
    const defaultValue = own.defaultValue
    if (defaultValue !== undefined) setActiveId(defaultValue)
  })

  const bgClass = () => `absolute inset-0 ${own.class ?? ''} ${own.className ?? ''}`

  const ensureBg = () => {
    if (!bgEl) {
      bgEl = document.createElement('div')
      bgEl.setAttribute('aria-hidden', 'true')
    }
    return bgEl
  }

  createEffect(() => {
    const bg = ensureBg()
    bg.className = bgClass()
  })

  const place = (target: HTMLElement | undefined) => {
    const bg = ensureBg()
    const transition = own.transition ?? defaultLayoutTransition
    const prev = bg.isConnected ? bg.getBoundingClientRect() : null

    if (!target) {
      // Upstream AnimatePresence exit: fade out, then detach.
      if (bg.isConnected) {
        controls?.stop()
        controls = animate(bg, { opacity: 0 }, transition)
        void controls.then(() => {
          if (bg.isConnected && activeId() === null) bg.remove()
        })
      }
      return
    }

    bg.remove()
    target.insertBefore(bg, target.firstChild)
    const next = bg.getBoundingClientRect()

    const keyframes: DOMKeyframesDefinition = {}
    // Upstream initial={{ opacity: defaultValue ? 1 : 0 }} animate={{ opacity: 1 }}:
    // without a defaultValue every activation fades in; with one it appears
    // at full opacity and only slides.
    if (own.defaultValue === undefined) keyframes.opacity = [0, 1]
    if (prev) {
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      const sx = prev.width / (next.width || 1)
      const sy = prev.height / (next.height || 1)
      if (dx !== 0 || dy !== 0 || sx !== 1 || sy !== 1) {
        bg.style.transformOrigin = 'top left'
        keyframes.x = [dx, 0]
        keyframes.y = [dy, 0]
        keyframes.scaleX = [sx, 1]
        keyframes.scaleY = [sy, 1]
      }
    }
    if (Object.keys(keyframes).length > 0) {
      controls?.stop()
      controls = animate(bg, keyframes, transition)
    }
  }

  const currentTarget = () => {
    const id = activeId()
    return id !== null ? itemMap.get(id) : undefined
  }

  // Upstream Children.map/cloneElement, done in the DOM (idempotent): adds the
  // positioning classes, wraps the child's content in a 'z-10' div and wires
  // the click/hover handlers.
  const enhance = () => {
    itemMap.clear()
    for (const node of Array.from(hostEl.children)) {
      if (!(node instanceof HTMLElement)) continue
      const id = node.getAttribute('data-id')
      if (id === null) continue
      itemMap.set(id, node)
      if (node.dataset.mpAnimatedBg === uniqueId) continue
      node.dataset.mpAnimatedBg = uniqueId
      node.classList.add('relative', 'inline-flex')
      const wrapper = document.createElement('div')
      wrapper.className = 'z-10'
      while (node.firstChild) wrapper.appendChild(node.firstChild)
      node.appendChild(wrapper)
      if (own.enableHover) {
        node.addEventListener('mouseenter', () => handleSetActiveId(id))
        node.addEventListener('mouseleave', () => handleSetActiveId(null))
      } else {
        node.addEventListener('click', () => handleSetActiveId(id))
      }
      node.setAttribute('data-checked', activeId() === id ? 'true' : 'false')
    }
  }

  onMount(() => {
    enhance()
    const observer = new MutationObserver(() => {
      enhance()
      place(currentTarget())
    })
    observer.observe(hostEl, { childList: true })
    onCleanup(() => observer.disconnect())
  })

  // Upstream 'data-checked' reflects the active id on every child.
  createEffect(() => {
    const current = activeId()
    for (const [id, el] of itemMap) {
      el.setAttribute('data-checked', current === id ? 'true' : 'false')
    }
  })

  createEffect(() => {
    place(currentTarget())
  })

  onCleanup(() => {
    controls?.stop()
  })

  return (
    <div
      ref={hostEl}
      style={{ display: 'contents' }}
      {...(rest as JSX.HTMLAttributes<HTMLDivElement>)}
    >
      {own.children}
    </div>
  )
}

export default AnimatedBackground
