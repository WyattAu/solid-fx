// Source: github.com/ibelick/motion-primitives components/core/carousel.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: framer's `drag="x"` has no vanilla-motion equivalent; it is
// hand-rolled with pointer events (PORTING.md §5). Framer composites the drag
// offset (style `x`) and the slide position (animate `translateX`) into one
// transform string; the port splits them onto nested wrapper (drag layer) and
// track (slide layer) divs — same visual result. Constraint snap-back on
// release is approximated with a short spring. lucide-react icons are inlined
// as identical SVGs (ShiningButton precedent).

import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls, Transition } from 'motion'
import {
  children,
  createContext,
  createEffect,
  createSignal,
  For,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

function ChevronLeftIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `ChevronLeft` (24×24, stroke 2).
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon(props: { class?: string }) {
  return (
    // Inline of lucide-react `ChevronRight` (24×24, stroke 2).
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export type CarouselContextType = {
  index: Accessor<number>
  setIndex: (newIndex: number) => void
  itemsCount: Accessor<number>
  setItemsCount: (newItemsCount: number) => void
  disableDrag: Accessor<boolean>
}

const CarouselContext = createContext<CarouselContextType>()

function useCarousel() {
  const context = useContext(CarouselContext)
  if (!context) {
    throw new Error('useCarousel must be used within an CarouselProvider')
  }
  return context
}

export type CarouselProviderProps = {
  children: JSX.Element
  initialIndex?: number
  onIndexChange?: (newIndex: number) => void
  disableDrag?: boolean
}

export function CarouselProvider(props: CarouselProviderProps) {
  const [index, setIndex] = createSignal<number>(props.initialIndex ?? 0)
  const [itemsCount, setItemsCount] = createSignal<number>(0)

  const handleSetIndex = (newIndex: number) => {
    setIndex(newIndex)
    props.onIndexChange?.(newIndex)
  }

  // upstream useEffect([initialIndex]) sync.
  createEffect(() => {
    setIndex(props.initialIndex ?? 0)
  })

  return (
    <CarouselContext.Provider
      value={{
        index,
        setIndex: handleSetIndex,
        itemsCount,
        setItemsCount,
        disableDrag: () => props.disableDrag ?? false,
      }}
    >
      {props.children}
    </CarouselContext.Provider>
  )
}

export type CarouselProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  initialIndex?: number
  index?: number
  onIndexChange?: (newIndex: number) => void
  disableDrag?: boolean
}

export function Carousel(props: CarouselProps) {
  const [own] = splitProps(props, [
    'children',
    'class',
    'className',
    'initialIndex',
    'index',
    'onIndexChange',
    'disableDrag',
  ])
  const [internalIndex, setInternalIndex] = createSignal<number>(own.initialIndex ?? 0)
  const currentIndex = () => (own.index !== undefined ? own.index : internalIndex())

  const handleIndexChange = (newIndex: number) => {
    if (own.index === undefined) {
      setInternalIndex(newIndex)
    }
    own.onIndexChange?.(newIndex)
  }

  return (
    <CarouselProvider
      initialIndex={currentIndex()}
      onIndexChange={handleIndexChange}
      disableDrag={own.disableDrag}
    >
      <div class={`group/hover relative ${own.class ?? ''} ${own.className ?? ''}`}>
        <div class="overflow-hidden">{own.children}</div>
      </div>
    </CarouselProvider>
  )
}

export type CarouselNavigationProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  classButton?: string
  /** React parity alias; merges with `classButton`. */
  classNameButton?: string
  alwaysShow?: boolean
}

export function CarouselNavigation(props: CarouselNavigationProps) {
  const { index, setIndex, itemsCount } = useCarousel()

  return (
    <div
      class={`pointer-events-none absolute left-[-12.5%] top-1/2 flex w-[125%] -translate-y-1/2 justify-between px-2 ${props.class ?? ''} ${props.className ?? ''}`}
    >
      <button
        type="button"
        aria-label="Previous slide"
        class={`pointer-events-auto h-fit w-fit rounded-full bg-zinc-50 p-2 transition-opacity duration-300 dark:bg-zinc-950 ${
          props.alwaysShow ? 'opacity-100' : 'opacity-0 group-hover/hover:opacity-100'
        } ${
          props.alwaysShow ? 'disabled:opacity-40' : 'group-hover/hover:disabled:opacity-40'
        } ${props.classButton ?? ''} ${props.classNameButton ?? ''}`}
        disabled={index() === 0}
        onClick={() => {
          if (index() > 0) {
            setIndex(index() - 1)
          }
        }}
      >
        <ChevronLeftIcon class="h-4 w-4 stroke-zinc-600 dark:stroke-zinc-50" />
      </button>
      <button
        type="button"
        class={`pointer-events-auto h-fit w-fit rounded-full bg-zinc-50 p-2 transition-opacity duration-300 dark:bg-zinc-950 ${
          props.alwaysShow ? 'opacity-100' : 'opacity-0 group-hover/hover:opacity-100'
        } ${
          props.alwaysShow ? 'disabled:opacity-40' : 'group-hover/hover:disabled:opacity-40'
        } ${props.classButton ?? ''} ${props.classNameButton ?? ''}`}
        aria-label="Next slide"
        disabled={index() + 1 === itemsCount()}
        onClick={() => {
          if (index() < itemsCount() - 1) {
            setIndex(index() + 1)
          }
        }}
      >
        <ChevronRightIcon class="h-4 w-4 stroke-zinc-600 dark:stroke-zinc-50" />
      </button>
    </div>
  )
}

export type CarouselIndicatorProps = {
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  classButton?: string
  /** React parity alias; merges with `classButton`. */
  classNameButton?: string
}

export function CarouselIndicator(props: CarouselIndicatorProps) {
  const { index, itemsCount, setIndex } = useCarousel()

  return (
    <div
      class={`absolute bottom-0 z-10 flex w-full items-center justify-center ${props.class ?? ''} ${props.className ?? ''}`}
    >
      <div class="flex space-x-2">
        <For each={Array.from({ length: itemsCount() }, (_, i) => i)}>
          {i => (
            <button
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              class={`h-2 w-2 rounded-full transition-opacity duration-300 ${
                index() === i ? 'bg-zinc-950 dark:bg-zinc-50' : 'bg-zinc-900/50 dark:bg-zinc-100/50'
              } ${props.classButton ?? ''} ${props.classNameButton ?? ''}`}
            />
          )}
        </For>
      </div>
    </div>
  )
}

export type CarouselContentProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  transition?: Transition
}

export function CarouselContent(props: CarouselContentProps) {
  const [own] = splitProps(props, ['children', 'class', 'className', 'transition'])
  const { index, setIndex, setItemsCount, disableDrag } = useCarousel()
  const [visibleItemsCount, setVisibleItemsCount] = createSignal(1)
  const dragX = motionValue(0)
  const resolved = children(() => own.children)
  const itemsLength = () => {
    const value = resolved()
    return Array.isArray(value) ? value.length : value != null ? 1 : 0
  }

  let dragEl: HTMLDivElement | undefined
  let trackEl: HTMLDivElement | undefined
  let slideControls: AnimationPlaybackControls | undefined
  let snapControls: AnimationPlaybackControls | undefined
  let dragging = false
  let dragStartX = 0
  let mounted = false

  const slideTransition = (): Transition =>
    own.transition ?? {
      damping: 18,
      stiffness: 90,
      type: 'spring',
      duration: 0.2,
    }

  // Fallback snap-back for the {left: 0, right: 0} dragConstraints +
  // dragMomentum={false} release (approximated feel).
  const SNAP_BACK_TRANSITION: Transition = { type: 'spring', stiffness: 400, damping: 40 }

  // upstream useEffect([children, setItemsCount]): observe items for
  // half-visibility against the carousel viewport.
  createEffect(() => {
    const track = trackEl
    if (!track) {
      return
    }
    void itemsLength() // re-observe when the item list changes
    const observer = new IntersectionObserver(
      entries => {
        const visibleCount = entries.filter(entry => entry.isIntersecting).length
        setVisibleItemsCount(visibleCount)
      },
      { root: dragEl ?? null, threshold: 0.5 },
    )
    for (const child of Array.from(track.children)) {
      observer.observe(child)
    }
    onCleanup(() => observer.disconnect())
  })

  createEffect(() => {
    if (!itemsLength()) {
      return
    }
    setItemsCount(itemsLength())
  })

  // Slide the track to the snapped position (upstream `animate` +
  // `initial={false}` — no animation on first mount).
  createEffect(() => {
    const track = trackEl
    if (!track) {
      return
    }
    const target = `-${index() * (100 / Math.max(visibleItemsCount(), 1))}%`
    if (!mounted) {
      mounted = true
      track.style.transform = `translateX(${target})`
      return
    }
    slideControls?.stop()
    slideControls = animate(track, { x: target }, slideTransition())
  })

  const endDrag = () => {
    const x = dragX.get()
    snapControls?.stop()
    snapControls = animate(dragX, 0, SNAP_BACK_TRANSITION)
    if (x <= -10 && index() < itemsLength() - 1) {
      setIndex(index() + 1)
    } else if (x >= 10 && index() > 0) {
      setIndex(index() - 1)
    }
  }

  const dragRef = (node: HTMLDivElement) => {
    dragEl = node
    const unsubscribe = dragX.on('change', value => {
      node.style.transform = `translateX(${value}px)`
    })
    onCleanup(() => {
      unsubscribe()
      snapControls?.stop()
      dragEl = undefined
    })
  }

  const trackRef = (node: HTMLDivElement) => {
    trackEl = node
    onCleanup(() => {
      slideControls?.stop()
      trackEl = undefined
    })
  }

  return (
    <div
      ref={dragRef}
      class={disableDrag() ? '' : 'cursor-grab touch-pan-y select-none active:cursor-grabbing'}
      onPointerDown={(e: PointerEvent) => {
        if (disableDrag()) {
          return
        }
        dragging = true
        dragStartX = e.clientX
        dragX.set(0)
        slideControls?.stop()
        ;(e.currentTarget as HTMLDivElement | null)?.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e: PointerEvent) => {
        if (!dragging) {
          return
        }
        dragX.set(e.clientX - dragStartX)
      }}
      onPointerUp={() => {
        if (!dragging) {
          return
        }
        dragging = false
        endDrag()
      }}
      onPointerCancel={() => {
        if (!dragging) {
          return
        }
        dragging = false
        endDrag()
      }}
    >
      <div ref={trackRef} class={`flex items-center ${own.class ?? ''} ${own.className ?? ''}`}>
        {own.children}
      </div>
    </div>
  )
}

export type CarouselItemProps = {
  children: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

// upstream renders a motion.div with no animated props — a plain div is the
// equivalent.
export function CarouselItem(props: CarouselItemProps) {
  const [own] = splitProps(props, ['children', 'class', 'className'])
  return (
    <div
      class={`w-full min-w-0 shrink-0 grow-0 overflow-hidden ${own.class ?? ''} ${own.className ?? ''}`}
    >
      {own.children}
    </div>
  )
}

// upstream exports are named only (no default export).
