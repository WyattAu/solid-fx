// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/animated-list.tsx@6f7b531e77659855d4bc1bec8e20fdb0c8199b20. License: MIT.

import type { JSX } from 'solid-js'
import type { AnimationPlaybackControls } from 'motion'
import { animate } from 'motion'
import { createEffect, createSignal, For, onCleanup, splitProps, untrack } from 'solid-js'

interface AnimatedListItemProps {
  children: JSX.Element
  /**
   * PORT-NOTE: internal escape hatch so AnimatedList can hold item refs for
   * its AnimatePresence-equivalent exit choreography.
   */
  elementRef?: (element: HTMLDivElement) => void
}

// Upstream `transition: { type: "spring", stiffness: 350, damping: 40 }`.
const SPRING = { type: 'spring', stiffness: 350, damping: 40 } as const

const playEnter = (el: HTMLDivElement): AnimationPlaybackControls =>
  // Upstream: initial { scale: 0, opacity: 0 } → animate { scale: 1, opacity: 1 }.
  animate(el, { scale: [0, 1], opacity: [0, 1] }, SPRING)

export const AnimatedListItem = (props: AnimatedListItemProps) => {
  return (
    <div
      ref={el => {
        const controls = playEnter(el)
        onCleanup(() => controls.stop())
        props.elementRef?.(el)
      }}
      class={`mx-auto w-full origin-top`}
    >
      {props.children}
    </div>
  )
}

export interface AnimatedListProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element
  delay?: number
  /**
   * Solid class alias, merged alongside `className`.
   */
  class?: string
  className?: string
}

export const AnimatedList = (props: AnimatedListProps) => {
  const [own, rest] = splitProps(props, ['children', 'delay', 'class', 'className'])

  const delay = () => own.delay ?? 1000

  // Upstream: React.Children.toArray(children). PORT-NOTE: Solid children are
  // stable DOM nodes — array children pass through, a lone child is wrapped.
  const childrenArray = (): JSX.Element[] => {
    const children = own.children
    return Array.isArray(children) ? children : [children]
  }

  const [index, setIndex] = createSignal(0)
  const [shown, setShown] = createSignal<JSX.Element[]>([])

  // Refs to the rendered wrappers, keyed by child — used for the exit pass.
  const wrappers = new Map<JSX.Element, HTMLDivElement>()

  // Upstream useEffect on [index, delay, childrenArray.length]: step the
  // visible window one child at a time. (The modulo never fires upstream
  // either — the `index < len - 1` guard stops the cycle at a full list.)
  createEffect(() => {
    const current = index()
    const count = childrenArray().length
    const step = delay()
    if (current < count - 1) {
      const timeout = setTimeout(() => {
        setIndex(prevIndex => (prevIndex + 1) % count)
      }, step)
      onCleanup(() => clearTimeout(timeout))
    }
  })

  // Upstream itemsToShow = childrenArray.slice(0, index + 1).reverse().
  // PORT-NOTE: AnimatePresence exit is restructured — children leaving the
  // window (only possible when the window resets on children/delay change)
  // spring out first, then the shown list commits after the spring settles.
  createEffect(() => {
    const next = childrenArray().slice(0, index() + 1).reverse()
    const removed = untrack(shown).filter(item => !next.includes(item))

    if (removed.length === 0) {
      setShown(next)
      return
    }

    for (const item of removed) {
      const el = wrappers.get(item)
      if (el) {
        // Upstream exit: { scale: 0, opacity: 0 } with the same spring.
        animate(el, { scale: 0, opacity: 0 }, SPRING)
      }
    }
    const timeout = setTimeout(() => setShown(next), 450)
    onCleanup(() => clearTimeout(timeout))
  })

  return (
    <div
      {...rest}
      class={`flex flex-col items-center gap-4 ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <For each={shown()}>
        {item => (
          <AnimatedListItem
            elementRef={el => {
              wrappers.set(item, el)
              onCleanup(() => wrappers.delete(item))
            }}
          >
            {item}
          </AnimatedListItem>
        )}
      </For>
    </div>
  )
}

export default AnimatedList
