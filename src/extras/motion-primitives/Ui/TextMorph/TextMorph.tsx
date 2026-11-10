// Source: github.com/ibelick/motion-primitives components/core/text-morph.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: upstream animates each character through AnimatePresence
// mode='popLayout' with a shared layoutId per character id, so persisted
// characters slide to their new position with a spring while new characters
// fade in and removed characters fade out of the flow. The vanilla `motion`
// package has no layoutId, so the port reimplements the three behaviours:
// persisted chars FLIP-slide from their previous rect (spring), new chars
// animate initial → animate (spring), and removed chars are re-created as
// absolutely-positioned ghosts at their last rect that fade out through the
// `exit` variant before disposal. The container is position:relative so the
// ghosts anchor to it (upstream popLayout achieves the same via layout
// projection).

import { createMemo, createUniqueId, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { animate } from 'motion'
import type { AnimationPlaybackControls, DOMKeyframesDefinition, Transition } from 'motion'
import { Dynamic } from 'solid-js/web'

export type TextMorphVariants = {
  initial?: DOMKeyframesDefinition
  animate?: DOMKeyframesDefinition
  exit?: DOMKeyframesDefinition
}

export type TextMorphProps = {
  children: string
  /** Upstream polymorphic `as` — Solid renders it through <Dynamic>. */
  as?: keyof JSX.IntrinsicElements
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  style?: JSX.CSSProperties
  variants?: TextMorphVariants
  transition?: Transition
}

type MorphChar = { id: string; label: string }

const defaultVariants: TextMorphVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 18,
  mass: 0.3,
}

export function TextMorph(props: TextMorphProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'as',
    'class',
    'className',
    'style',
    'variants',
    'transition',
  ])

  const uniqueId = createUniqueId()

  // Upstream useMemo([children, uniqueId]) — ids stay stable for a given
  // character occurrence across text changes, which is what lets persisted
  // characters be recognised.
  const characters = createMemo<MorphChar[]>(() => {
    const charCounts: Record<string, number> = {}

    return (own.children ?? '').split('').map(char => {
      const lowerChar = char.toLowerCase()
      charCounts[lowerChar] = (charCounts[lowerChar] || 0) + 1

      return {
        id: `${uniqueId}-${lowerChar}${charCounts[lowerChar]}`,
        label: char === ' ' ? '\u00A0' : char,
      }
    })
  })

  let rootEl!: HTMLElement
  // Last known label + rect per char id — presence doubles as "existed in the
  // previous render" (AnimatePresence initial={false}: first render never
  // animates).
  const prevChars = new Map<string, { label: string; rect: DOMRect }>()
  const controls: AnimationPlaybackControls[] = []
  let mounted = false

  onMount(() => {
    mounted = true
  })

  onCleanup(() => {
    for (const c of controls) c.stop()
    controls.length = 0
  })

  const spring = () => own.transition ?? defaultTransition
  const variants = () => own.variants ?? defaultVariants
  const incomingIds = () => new Set(characters().map(c => c.id))

  const mountChar = (el: HTMLSpanElement, id: string) => {
    const prev = prevChars.get(id)
    prevChars.set(id, { label: el.textContent ?? '', rect: el.getBoundingClientRect() })
    if (!mounted) return // AnimatePresence initial={false}

    if (!prev) {
      // New character: initial → animate variant.
      const anim = variants().animate ?? { opacity: 1 }
      const init = variants().initial ?? {}
      const keyframes: Record<string, unknown> = {}
      for (const key of Object.keys(anim)) {
        keyframes[key] = [
          (init as Record<string, unknown>)[key],
          (anim as Record<string, unknown>)[key],
        ]
      }
      controls.push(animate(el, keyframes as DOMKeyframesDefinition, spring()))
      return
    }

    // Persisted character: FLIP-slide from its previous position (the port of
    // upstream's shared layoutId).
    const next = el.getBoundingClientRect()
    const dx = prev.rect.left - next.left
    const dy = prev.rect.top - next.top
    if (dx !== 0 || dy !== 0) {
      controls.push(animate(el, { x: [dx, 0], y: [dy, 0] }, spring()))
    }
  }

  const ghostIfRemoved = (id: string) => {
    if (!mounted) return
    if (incomingIds().has(id)) return // persisted — it remounts in place
    const prev = prevChars.get(id)
    prevChars.delete(id)
    if (!prev || !rootEl) return

    const rr = rootEl.getBoundingClientRect()
    const ghost = document.createElement('span')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.textContent = prev.label
    ghost.style.position = 'absolute'
    ghost.style.left = `${prev.rect.left - rr.left}px`
    ghost.style.top = `${prev.rect.top - rr.top}px`
    ghost.style.width = `${prev.rect.width}px`
    ghost.style.height = `${prev.rect.height}px`
    ghost.style.pointerEvents = 'none'
    rootEl.appendChild(ghost)

    const exitKf = variants().exit ?? { opacity: 0 }
    const controlsRef = animate(ghost, exitKf, spring())
    controls.push(controlsRef)
    void controlsRef.then(() => ghost.remove())
  }

  return (
    <Dynamic
      component={own.as ?? 'p'}
      {...(rest as unknown as JSX.HTMLAttributes<HTMLElement>)}
      ref={rootEl}
      aria-label={own.children}
      // PORT-NOTE: `relative` anchors the exiting-character ghosts (upstream
      // popLayout positions them against the nearest positioned ancestor).
      class={`relative ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <For each={characters()}>
        {character => {
          onCleanup(() => ghostIfRemoved(character.id))
          return (
            <span
              ref={(el: HTMLSpanElement) => mountChar(el, character.id)}
              class="inline-block"
              aria-hidden="true"
            >
              {character.label}
            </span>
          )
        }}
      </For>
    </Dynamic>
  )
}

export default TextMorph
