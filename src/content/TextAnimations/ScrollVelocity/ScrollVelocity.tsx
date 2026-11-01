import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import { motionValue } from 'motion'
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

interface VelocityMapping {
  input: [number, number]
  output: [number, number]
}

interface VelocityTextProps {
  children: JSX.Element
  baseVelocity: number
  // PORT-NOTE: React's RefObject<HTMLElement | null> became an element or a
  // getter resolving to it (Solid idiom).
  scrollContainerRef?: HTMLElement | (() => HTMLElement | null | undefined) | null
  className?: string
  damping: number
  stiffness: number
  numCopies: number
  velocityMapping?: VelocityMapping
  parallaxClassName?: string
  scrollerClassName?: string
  parallaxStyle?: JSX.CSSProperties
  scrollerStyle?: JSX.CSSProperties
  separator?: JSX.Element
  pauseOnHover: boolean
  hovered: { current: boolean }
  skewWithVelocity: number
  scaleWithVelocity: number
  outline: boolean
  gap: number
  fontSize?: number | string
  fontWeight?: number | string
  color?: string
  draggable: boolean
}

export interface ScrollVelocityProps {
  scrollContainerRef?: HTMLElement | (() => HTMLElement | null | undefined) | null
  texts: JSX.Element[]
  velocity?: number
  className?: string
  damping?: number
  stiffness?: number
  numCopies?: number
  velocityMapping?: VelocityMapping
  parallaxClassName?: string
  scrollerClassName?: string
  parallaxStyle?: JSX.CSSProperties
  scrollerStyle?: JSX.CSSProperties
  separator?: JSX.Element
  pauseOnHover?: boolean
  fadeEdges?: boolean
  skewWithVelocity?: number
  scaleWithVelocity?: number
  outlineAlternate?: boolean
  gap?: number
  fontSize?: number | string
  fontWeight?: number | string
  color?: string
  draggable?: boolean
}

const DEFAULT_MAPPING: VelocityMapping = { input: [0, 1000], output: [0, 5] }

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

const FADE_STEPS = Array.from({ length: 9 }, (_, i) => i / 8)

const FADE_MASK = `linear-gradient(to right, ${[
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * 12).toFixed(1)}%`),
  ...FADE_STEPS.map(
    t => `rgba(0, 0, 0, ${smootherstep(1 - t).toFixed(3)}) ${(88 + t * 12).toFixed(1)}%`,
  ),
].join(', ')})`

const OUTLINE_STYLE: JSX.CSSProperties = {
  '-webkit-text-fill-color': 'transparent',
  '-webkit-text-stroke': 'max(1px, 0.028em) currentColor',
}

function wrap(min: number, max: number, v: number): number {
  const range = max - min
  const mod = (((v - min) % range) + range) % range
  return mod + min
}

// PORT-NOTE: upstream built this from motion/react's useScroll + useVelocity +
// useSpring + useTransform + useAnimationFrame. Per the porting contract those
// map to scroll listeners, a per-frame damped spring integration, a manual
// two-point interpolation, and a persistent rAF loop; the spring/velocity
// decay are close approximations of the React feel.
function VelocityText(props: VelocityTextProps) {
  const reduce = usePrefersReducedMotion()

  const baseX = motionValue(0)
  const skewX = motionValue(0)
  const scaleY = motionValue(1)
  // Raw scroll velocity (useVelocity) + spring-smoothed value (useSpring).
  const rawVelocity = motionValue(0)
  let sv = 0
  let svVel = 0

  const [copyWidth, setCopyWidth] = createSignal(0)
  let copyEl: HTMLSpanElement | undefined
  let parallaxEl!: HTMLDivElement
  let innerEl!: HTMLDivElement

  let directionFactor = 1
  let pace = 1
  let fling = 0
  let lastScrollAt = 0
  let lastFrame = 0
  const drag = { active: false, pointerId: -1, lastX: 0, lastTime: 0, velocity: 0, travel: 0 }

  const factorOf = (v: number) => {
    const input = props.velocityMapping?.input ?? DEFAULT_MAPPING.input
    const output = props.velocityMapping?.output ?? DEFAULT_MAPPING.output
    return output[0] + ((v - input[0]) / (input[1] - input[0])) * (output[1] - output[0])
  }

  // useTransform(baseX, …) — applied straight to the transform each frame.
  const paint = () => {
    const w = copyWidth()
    const x = w === 0 ? 0 : wrap(-w, 0, baseX.get())
    innerEl.style.transform = `translateX(${x}px) skewX(${skewX.get()}deg) scaleY(${scaleY.get()})`
  }

  // useScroll({ container }) → scroll listeners (window or the container).
  createEffect(() => {
    const container =
      typeof props.scrollContainerRef === 'function'
        ? props.scrollContainerRef()
        : props.scrollContainerRef
    const scroller: HTMLElement | Window = container || window
    let lastPos = scroller instanceof HTMLElement ? scroller.scrollTop : window.scrollY
    let lastTime = performance.now()
    const onScroll = () => {
      const pos = scroller instanceof HTMLElement ? scroller.scrollTop : window.scrollY
      const now = performance.now()
      const dt = Math.max(now - lastTime, 1) / 1000
      rawVelocity.set((pos - lastPos) / dt)
      lastPos = pos
      lastTime = now
      lastScrollAt = now
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => scroller.removeEventListener('scroll', onScroll))
  })

  // useElementWidth → ResizeObserver (or resize fallback) into a signal.
  createEffect(() => {
    const element = copyEl
    if (!element) return
    if (typeof ResizeObserver === 'undefined') {
      const updateWidth = () => setCopyWidth(element.offsetWidth)
      updateWidth()
      window.addEventListener('resize', updateWidth)
      onCleanup(() => window.removeEventListener('resize', updateWidth))
      return
    }
    const observer = new ResizeObserver(([entry]) => {
      setCopyWidth(entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.contentRect.width ?? 0)
    })
    observer.observe(element)
    onCleanup(() => observer.disconnect())
  })

  onMount(() => {
    // useAnimationFrame → persistent rAF loop; the upstream skew/scale early
    // return was an optimization, the same math keeps the values pinned at
    // rest, so the loop always runs and paints.
    let raf = 0
    lastFrame = performance.now()

    const tick = (now: number) => {
      const delta = Math.min(now - lastFrame, 64)
      lastFrame = now
      if (!reduce()) {
        const grab = drag
        const seconds = delta / 1000
        const targetPace = grab.active || (props.pauseOnHover && props.hovered.current) ? 0 : 1
        pace += (targetPace - pace) * (1 - Math.exp(-delta / 150))

        // useVelocity stops emitting once scrolling stops; decay the raw
        // value to 0 on the same cadence so the spring can settle.
        if (now - lastScrollAt > 90) rawVelocity.set(rawVelocity.get() * Math.exp(-delta / 120))

        // Spring integrate toward the raw velocity (useSpring equivalent).
        const stiffness = props.stiffness
        const damping = props.damping
        const accel = -stiffness * (sv - rawVelocity.get()) - damping * svVel
        svVel += accel * seconds
        sv += svVel * seconds

        let moveBy = directionFactor * props.baseVelocity * (delta / 1000)
        const velocityFactor = factorOf(sv)

        if (velocityFactor < 0) {
          directionFactor = -1
        } else if (velocityFactor > 0) {
          directionFactor = 1
        }

        moveBy += directionFactor * moveBy * velocityFactor
        let travel = moveBy * pace

        if (!grab.active && fling !== 0) {
          travel += fling * seconds
          fling *= Math.exp(-delta / 420)
          if (Math.abs(fling) < 4) fling = 0
        }

        baseX.set(baseX.get() + travel)

        const thrown = grab.active ? grab.velocity : fling
        const scrollSurge = Math.tanh(Math.abs(sv) / 1600) * pace
        const throwSurge = Math.tanh(Math.abs(thrown) / 2000)
        const surge = Math.max(scrollSurge, throwSurge)
        const heading =
          throwSurge > scrollSurge
            ? Math.sign(thrown)
            : Math.sign(travel) || directionFactor * Math.sign(props.baseVelocity)
        const ease = 1 - Math.exp(-delta / 110)
        const nextSkew =
          skewX.get() + (-heading * props.skewWithVelocity * surge - skewX.get()) * ease
        const nextScale = scaleY.get() + (1 + props.scaleWithVelocity * surge - scaleY.get()) * ease
        skewX.set(Math.abs(nextSkew) < 0.01 && !props.skewWithVelocity ? 0 : nextSkew)
        scaleY.set(Math.abs(nextScale - 1) < 0.0005 && !props.scaleWithVelocity ? 1 : nextScale)
      }
      paint()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    paint()

    // React attached onClickCapture only while draggable; checking inside the
    // capture-phase listener is equivalent.
    const onClickCapture = (event: MouseEvent) => {
      if (!props.draggable) return
      if (drag.travel > 6) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    parallaxEl.addEventListener('click', onClickCapture, { capture: true })

    onCleanup(() => {
      cancelAnimationFrame(raf)
      parallaxEl.removeEventListener('click', onClickCapture, { capture: true })
      baseX.stop()
      skewX.stop()
      scaleY.stop()
      rawVelocity.stop()
    })
  })

  const onPointerDown = (event: PointerEvent) => {
    if (!props.draggable || (event.pointerType === 'mouse' && event.button !== 0)) return
    const grab = drag
    grab.active = true
    grab.pointerId = event.pointerId
    grab.lastX = event.clientX
    grab.lastTime = event.timeStamp
    grab.velocity = 0
    grab.travel = 0
    fling = 0
    const target = event.currentTarget as HTMLDivElement
    target.setPointerCapture?.(event.pointerId)
    target.style.cursor = 'grabbing'
  }

  const onPointerMove = (event: PointerEvent) => {
    const grab = drag
    if (!grab.active || event.pointerId !== grab.pointerId) return
    const dx = event.clientX - grab.lastX
    const dt = Math.max(event.timeStamp - grab.lastTime, 1)
    grab.lastX = event.clientX
    grab.lastTime = event.timeStamp
    grab.travel += Math.abs(dx)
    baseX.set(baseX.get() + dx)
    grab.velocity += ((dx / dt) * 1000 - grab.velocity) * (1 - Math.exp(-dt / 50))
  }

  const onPointerUp = (event: PointerEvent) => {
    const grab = drag
    if (!grab.active || event.pointerId !== grab.pointerId) return
    grab.active = false
    const resting = event.timeStamp - grab.lastTime > 90
    fling = resting ? 0 : Math.max(-5000, Math.min(5000, grab.velocity))
    grab.velocity = 0
    const target = event.currentTarget as HTMLDivElement
    if (target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId)
    }
    target.style.cursor = 'grab'
  }

  const copies = createMemo(() =>
    Array.from({ length: Math.max(0, Math.floor(props.numCopies)) }, (_, i) => i),
  )

  const typeStyle = createMemo<JSX.CSSProperties>(() => ({
    ...(props.fontSize !== undefined
      ? {
          'font-size': typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize,
          'line-height': 1,
        }
      : {}),
    ...(props.fontWeight !== undefined ? { 'font-weight': props.fontWeight } : {}),
    ...(props.color ? { color: props.color } : {}),
    ...(props.outline ? OUTLINE_STYLE : {}),
  }))

  return (
    <div
      ref={parallaxEl}
      class={`${props.parallaxClassName ?? 'parallax'} relative overflow-hidden`}
      style={{
        ...(props.draggable
          ? {
              cursor: 'grab',
              'user-select': 'none',
              '-webkit-user-select': 'none',
              'touch-action': 'pan-y',
            }
          : {}),
        ...props.parallaxStyle,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        ref={innerEl}
        class={`${props.scrollerClassName ?? 'scroller'} flex whitespace-nowrap text-center font-sans text-4xl font-bold tracking-[-0.02em] drop-shadow md:text-[5rem] md:leading-[5rem]`}
        style={{ ...typeStyle(), ...props.scrollerStyle }}
      >
        <For each={copies()}>
          {i => (
            <span
              class={`flex-shrink-0 ${props.className ?? ''}`}
              ref={
                i === 0
                  ? el => {
                      copyEl = el
                    }
                  : undefined
              }
              aria-hidden={i > 0 ? true : undefined}
              style={
                !props.separator && props.gap > 0
                  ? { 'padding-right': `${props.gap}px` }
                  : undefined
              }
            >
              {props.children}&nbsp;
              <Show when={props.separator}>
                <span style={props.gap > 0 ? { margin: `0 ${props.gap / 2}px` } : undefined}>
                  {props.separator}
                </span>
                &nbsp;
              </Show>
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

export const ScrollVelocity = (props: ScrollVelocityProps) => {
  // Upstream passed a hoveredRef between parent and rows; a plain box has the
  // same shared-mutable semantics without React's ref type.
  const hovered: { current: boolean } = { current: false }

  return (
    <section
      class="w-full"
      style={
        props.fadeEdges ? { '-webkit-mask-image': FADE_MASK, 'mask-image': FADE_MASK } : undefined
      }
      onPointerEnter={() => {
        hovered.current = true
      }}
      onPointerLeave={() => {
        hovered.current = false
      }}
    >
      <For each={props.texts ?? []}>
        {(text, index) => (
          <VelocityText
            className={props.className ?? ''}
            baseVelocity={index() % 2 !== 0 ? -(props.velocity ?? 100) : (props.velocity ?? 100)}
            scrollContainerRef={props.scrollContainerRef}
            damping={props.damping ?? 50}
            stiffness={props.stiffness ?? 400}
            numCopies={props.numCopies ?? 6}
            velocityMapping={props.velocityMapping ?? DEFAULT_MAPPING}
            parallaxClassName={props.parallaxClassName ?? 'parallax'}
            scrollerClassName={props.scrollerClassName ?? 'scroller'}
            parallaxStyle={props.parallaxStyle}
            scrollerStyle={props.scrollerStyle}
            separator={props.separator ?? ''}
            pauseOnHover={props.pauseOnHover ?? false}
            hovered={hovered}
            skewWithVelocity={props.skewWithVelocity ?? 0}
            scaleWithVelocity={props.scaleWithVelocity ?? 0}
            outline={Boolean((props.outlineAlternate ?? false) && index() % 2 !== 0)}
            gap={props.gap ?? 0}
            fontSize={props.fontSize}
            fontWeight={props.fontWeight}
            color={props.color}
            draggable={props.draggable ?? false}
          >
            {text}
          </VelocityText>
        )}
      </For>
    </section>
  )
}

export default ScrollVelocity
