// Source: github.com/ibelick/motion-primitives components/core/transition-panel.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream wraps the panel in AnimatePresence mode='popLayout' keyed
// by activeIndex. The vanilla `motion` package has no AnimatePresence, so the
// swap is sequenced manually: the outgoing panel is absolutely positioned at
// its last rect (popLayout behaviour) and animated through the `exit` variant,
// then parked back into a hidden stash on completion; the incoming panel is
// moved from the stash into the flow and animated through enter → center.
// Upstream spreads the remaining MotionProps onto the animated div; there is no
// declarative motion layer here, so `rest` carries standard HTML attributes.

import { createEffect, onCleanup, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls, DOMKeyframesDefinition, Transition } from 'motion'

export type TransitionPanelVariants = {
  enter: DOMKeyframesDefinition
  center: DOMKeyframesDefinition
  exit: DOMKeyframesDefinition
}

export type TransitionPanelProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  transition?: Transition
  activeIndex: number
  variants?: TransitionPanelVariants
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class'>

export function TransitionPanel(props: TransitionPanelProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'class',
    'className',
    'transition',
    'activeIndex',
    'variants',
  ])

  let rootEl!: HTMLDivElement
  let stageEl!: HTMLDivElement
  let stashEl!: HTMLDivElement

  let enterControls: AnimationPlaybackControls | undefined
  // Exits in flight; settled before the next swap so fast activeIndex changes
  // never leave a panel trapped in a ghost.
  let pending: Array<{
    ghost: HTMLDivElement
    controls?: AnimationPlaybackControls
    node: Element
  }> = []

  const settlePending = () => {
    for (const p of pending) {
      p.controls?.stop()
      if (p.ghost.contains(p.node)) stashEl.appendChild(p.node)
      p.ghost.remove()
    }
    pending = []
  }

  const spawnGhost = (node: Element) => {
    const variants = own.variants
    if (!variants) {
      // Upstream: no `exit` variant defined → AnimatePresence removes it with
      // no exit animation.
      stashEl.appendChild(node)
      return
    }
    const rr = rootEl.getBoundingClientRect()
    const nr = node.getBoundingClientRect()
    const ghost = document.createElement('div')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.style.position = 'absolute'
    ghost.style.left = `${nr.left - rr.left}px`
    ghost.style.top = `${nr.top - rr.top}px`
    ghost.style.width = `${nr.width}px`
    ghost.style.height = `${nr.height}px`
    ghost.style.pointerEvents = 'none'
    ghost.appendChild(node)
    rootEl.appendChild(ghost)
    const controls = animate(node, variants.exit, own.transition)
    const entry = { ghost, controls, node }
    pending.push(entry)
    void controls.then(() => {
      const i = pending.indexOf(entry)
      if (i !== -1) {
        pending.splice(i, 1)
        stashEl.appendChild(node)
        ghost.remove()
      }
    })
  }

  // Upstream: AnimatePresence initial={false} — the first mounted panel does
  // not play the enter animation.
  let firstSwap = true

  createEffect(() => {
    const idx = own.activeIndex
    const incoming = stashEl.children[idx]
    const outgoing = stageEl.firstElementChild

    if (firstSwap) {
      firstSwap = false
      if (incoming) stageEl.appendChild(incoming)
      return
    }

    if (outgoing === incoming) return
    settlePending()

    if (outgoing) spawnGhost(outgoing)
    if (incoming) {
      stageEl.appendChild(incoming)
      if (own.variants) {
        enterControls?.stop()
        enterControls = animate(incoming, [own.variants.enter, own.variants.center], own.transition)
      }
    }
  })

  onCleanup(() => {
    enterControls?.stop()
    settlePending()
  })

  return (
    <div ref={rootEl} class={`relative ${own.class ?? ''} ${own.className ?? ''}`}>
      <div ref={stageEl} {...(rest as JSX.HTMLAttributes<HTMLDivElement>)} />
      {/* PORT-NOTE: all panels are mounted here (hidden) instead of only the
          active one — Solid renders children eagerly; only the panel in the
          stage above is visible, matching upstream's rendered output. */}
      <div ref={stashEl} style={{ display: 'none' }} aria-hidden="true">
        {own.children}
      </div>
    </div>
  )
}

export default TransitionPanel
