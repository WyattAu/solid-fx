// Source: github.com/magicuidesign/magicui apps/www/registry/magicui/scroll-based-velocity.tsx@fbddfb8bdaa054138bdaae73a4247631d97a1c23. License: MIT.
// Backfill: ibelick/motion-primitives @120f64f6 ships no
// scroll-based-velocity.tsx (verified against the components tree; this batch
// needed 4 more components).
// PORT-NOTE: motion/react useVelocity has no vanilla equivalent, so the scroll
// velocity is a hand-rolled rAF derivative of a window-scrollY motionValue,
// smoothed by a re-anchored spring animate() ({damping: 50, stiffness: 400}
// as upstream) — PORTING.md §5. useAnimationFrame maps to a rAF loop cancelled
// in onCleanup. React context maps to Solid createContext/useContext; the
// Impl/Local row split is merged into one component (same context-or-local
// behavior). Upstream renders N copies of {children} — a Solid JSX node
// cannot be mounted twice, so copies 1..N are static DOM cloneNodes of copy 0
// (InfiniteSlider precedent): reactive updates or event listeners inside
// `children` do not propagate to the duplicates. A `default` export is added
// (ScrollVelocityRow) per tree convention; upstream exports are all named.

import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControlsWithThen, MotionValue } from 'motion'
import {
  createContext,
  createSignal,
  Index,
  onCleanup,
  onMount,
  splitProps,
  useContext,
} from 'solid-js'
import type { JSX } from 'solid-js'

export const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

const ScrollVelocityContext = createContext<MotionValue<number> | null>(null)

/**
 * Upstream: useVelocity(scrollY) → useSpring({damping: 50, stiffness: 400}) →
 * useTransform(v => sign * min(5, |v| / 1000 * 5)). The derivative is sampled
 * per frame from the source motionValue, then spring-smoothed.
 */
function createVelocityFactor(scrollY: MotionValue<number>): MotionValue<number> {
  const smooth = motionValue(0)
  const factor = motionValue(0)
  let lastY = scrollY.get()
  let lastT = performance.now()
  let controls: AnimationPlaybackControlsWithThen | undefined
  let rafId = 0

  const offs = [
    smooth.on('change', v => {
      const sign = v < 0 ? -1 : 1
      const magnitude = Math.min(5, (Math.abs(v) / 1000) * 5)
      factor.set(sign * magnitude)
    }),
  ]

  const loop = () => {
    const now = performance.now()
    const dt = (now - lastT) / 1000
    const y = scrollY.get()
    const v = dt > 0 ? (y - lastY) / dt : 0
    lastY = y
    lastT = now
    controls?.stop()
    controls = animate(smooth, v, { damping: 50, stiffness: 400 })
    rafId = requestAnimationFrame(loop)
  }

  onMount(() => {
    rafId = requestAnimationFrame(loop)
    onCleanup(() => {
      cancelAnimationFrame(rafId)
      controls?.stop()
      offs.forEach(off => off())
    })
  })

  return factor
}

interface ScrollVelocityContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** React parity alias; merges with `class`. */
  className?: string
}

export function ScrollVelocityContainer(props: ScrollVelocityContainerProps) {
  const [own, rest] = splitProps(props, ['class', 'className', 'children'])

  const scrollY = motionValue(typeof window !== 'undefined' ? window.scrollY : 0)
  onMount(() => {
    const onScroll = () => scrollY.set(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => window.removeEventListener('scroll', onScroll))
  })

  const velocityFactor = createVelocityFactor(scrollY)

  return (
    <ScrollVelocityContext.Provider value={velocityFactor}>
      <div {...rest} class={`relative w-full ${own.class ?? ''} ${own.className ?? ''}`}>
        {own.children}
      </div>
    </ScrollVelocityContext.Provider>
  )
}

interface ScrollVelocityRowProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element
  baseVelocity?: number
  direction?: 1 | -1
  scrollReactivity?: boolean
  /** React parity alias; merges with `class`. */
  className?: string
}

export function ScrollVelocityRow(props: ScrollVelocityRowProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'baseVelocity',
    'direction',
    'scrollReactivity',
    'class',
    'className',
  ])

  const baseVelocity = () => own.baseVelocity ?? 5
  const scrollReactivity = () => own.scrollReactivity ?? true

  // Upstream: shared context factor when nested in a container, else a local
  // one (ScrollVelocityRowLocal path).
  const shared = useContext(ScrollVelocityContext)
  let localFactor: MotionValue<number> | undefined
  if (!shared) {
    const scrollY = motionValue(typeof window !== 'undefined' ? window.scrollY : 0)
    onMount(() => {
      const onScroll = () => scrollY.set(window.scrollY)
      window.addEventListener('scroll', onScroll, { passive: true })
      onCleanup(() => window.removeEventListener('scroll', onScroll))
    })
    localFactor = createVelocityFactor(scrollY)
  }
  const velocityFactor = () => shared ?? localFactor!

  let containerEl!: HTMLDivElement
  let trackEl!: HTMLDivElement
  let blockEl: HTMLDivElement | undefined

  const [numCopies, setNumCopies] = createSignal(1)

  const baseX = motionValue(0)
  const unitWidth = motionValue(0)
  // useRef inits — one-shot, like upstream.
  const baseDirection = (own.direction ?? 1) >= 0 ? 1 : -1
  let currentDirection = (own.direction ?? 1) >= 0 ? 1 : -1

  let isInView = true
  let isPageVisible = true
  let prefersReducedMotion = false

  const applyX = () => {
    const width = unitWidth.get() || 1
    const offset = baseX.get()
    trackEl.style.transform = `translate3d(${-wrap(0, width, offset)}px, 0, 0)`
  }
  const xOffs = [baseX.on('change', applyX), unitWidth.on('change', applyX)]

  onMount(() => {
    let ro: ResizeObserver | null = null
    let io: IntersectionObserver | null = null
    let mq: MediaQueryList | null = null

    const handleVisibility = () => {
      isPageVisible = document.visibilityState === 'visible'
    }
    const handlePRM = () => {
      if (mq) prefersReducedMotion = mq.matches
    }

    const updateSizes = () => {
      const cw = containerEl.offsetWidth || 0
      const bw = blockEl?.scrollWidth || 0
      unitWidth.set(bw)
      const nextCopies = bw > 0 ? Math.max(3, Math.ceil(cw / bw) + 2) : 1
      setNumCopies(prev => (prev === nextCopies ? prev : nextCopies))
    }

    updateSizes()

    ro = new ResizeObserver(updateSizes)
    ro.observe(containerEl)
    if (blockEl) ro.observe(blockEl)

    io = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting
    })
    io.observe(containerEl)

    document.addEventListener('visibilitychange', handleVisibility, {
      passive: true,
    })
    handleVisibility()

    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', handlePRM)
    handlePRM()

    onCleanup(() => {
      ro?.disconnect()
      io?.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      mq?.removeEventListener('change', handlePRM)
      xOffs.forEach(off => off())
    })
  })

  // Upstream useAnimationFrame((_, delta) => ...).
  let rafId = 0
  let lastT = 0
  onMount(() => {
    const loop = (ts: number) => {
      const delta = lastT === 0 ? 0 : ts - lastT
      lastT = ts

      if (isInView && isPageVisible) {
        const dt = delta / 1000
        const vf = scrollReactivity() ? velocityFactor().get() : 0
        const absVf = Math.min(5, Math.abs(vf))
        const speedMultiplier = prefersReducedMotion ? 1 : 1 + absVf

        if (absVf > 0.1) {
          const scrollDirection = vf >= 0 ? 1 : -1
          currentDirection = baseDirection * scrollDirection
        }

        const bw = unitWidth.get() || 0
        if (bw > 0) {
          const pixelsPerSecond = (bw * baseVelocity()) / 100
          const moveBy = currentDirection * pixelsPerSecond * speedMultiplier * dt
          baseX.set(baseX.get() + moveBy)
        }
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(rafId))
  })

  return (
    <div
      {...(rest as JSX.HTMLAttributes<HTMLDivElement>)}
      ref={containerEl}
      class={`w-full overflow-hidden whitespace-nowrap ${own.class ?? ''} ${own.className ?? ''}`}
    >
      <div
        class="inline-flex transform-gpu items-center will-change-transform select-none"
        ref={trackEl}
      >
        <Index each={Array.from({ length: numCopies() })}>
          {(_, i) => (
            <div
              ref={el => {
                if (i === 0) {
                  blockEl = el
                } else if (blockEl) {
                  // Static clone of copy 0 (see PORT-NOTE).
                  for (const node of Array.from(blockEl.childNodes)) {
                    el.append(node.cloneNode(true))
                  }
                }
              }}
              aria-hidden={i !== 0}
              class="inline-flex shrink-0 items-center"
            >
              {i === 0 ? own.children : null}
            </div>
          )}
        </Index>
      </div>
    </div>
  )
}

export default ScrollVelocityRow
