import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'

export type CurvedLoopShape = 'arc' | 'wave' | 'circle' | 'line'

export interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  className?: string
  class?: string
  curveAmount?: number
  direction?: 'left' | 'right'
  interactive?: boolean
  pauseOnHover?: boolean
  color?: string
  edgeFade?: number
  shape?: CurvedLoopShape
  fontSize?: number
  fontWeight?: number | string
  letterSpacing?: number
  outline?: boolean
  separator?: string
  separatorColor?: string
  scrollBoost?: number
}

interface DragState {
  active: boolean
  x: number
  time: number
  scale: number
  velocity: number
  ring: boolean
  radius: number
  angle: number
  cx: number
  cy: number
}

interface Geometry {
  d: string
  viewBox: string
  radius: number
  repeats: number
  span: number
}

const VIEW_WIDTH = 1440
const VIEW_HEIGHT = 120
const MAX_FLING = 4000
const WAVE_LENGTH = 960
const RING_RADIUS = 2.2
const TAU = Math.PI * 2

const wrapOffset = (value: number, length: number) =>
  length > 0 ? (((value % length) + length) % length) - length : value

const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle))

const edgeMask = (amount: number, span: number) => {
  const size = Math.min(Math.max(amount, 0), 1) * 50 * span
  if (size <= 0) return undefined
  const start = 50 - span * 50
  const steps = 10
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const alpha = (t * t * t * (t * (t * 6 - 15) + 10)).toFixed(3)
    left.push(`rgba(0, 0, 0, ${alpha}) ${(start + t * size).toFixed(2)}%`)
    right.unshift(`rgba(0, 0, 0, ${alpha}) ${(100 - start - t * size).toFixed(2)}%`)
  }
  return `linear-gradient(to right, ${[...left, ...right].join(', ')})`
}

const wavePath = (amplitude: number, baseline: number) => {
  const from = -100
  const to = VIEW_WIDTH + 100
  const k = TAU / WAVE_LENGTH
  const y = (x: number) => baseline + amplitude * Math.cos(k * (x - VIEW_WIDTH / 2))
  const slope = (x: number) => -amplitude * k * Math.sin(k * (x - VIEW_WIDTH / 2))
  const count = Math.ceil((to - from) / (WAVE_LENGTH / 8))
  const step = (to - from) / count
  const f = (n: number) => n.toFixed(2)
  let d = `M${f(from)},${f(y(from))}`
  for (let i = 0; i < count; i++) {
    const x0 = from + i * step
    const x1 = x0 + step
    d += ` C${f(x0 + step / 3)},${f(y(x0) + (slope(x0) * step) / 3)} ${f(x1 - step / 3)},${f(y(x1) - (slope(x1) * step) / 3)} ${f(x1)},${f(y(x1))}`
  }
  return d
}

const getGeometry = (
  shape: CurvedLoopShape,
  curveAmount: number,
  fontSize: number,
  spacing: number,
): Geometry => {
  if (shape === 'circle') {
    const repeats =
      spacing > 0 ? Math.max(1, Math.round((TAU * fontSize * RING_RADIUS) / spacing)) : 1
    const radius = spacing > 0 ? (repeats * spacing) / TAU : fontSize * RING_RADIUS
    const half = radius + fontSize
    return {
      d: `M${-radius},0 A${radius},${radius} 0 1,1 ${radius},0 A${radius},${radius} 0 1,1 ${-radius},0`,
      viewBox: `${-half} ${-half} ${half * 2} ${half * 2}`,
      radius,
      repeats,
      span: Math.min(1, (fontSize * (RING_RADIUS + 1) * 2) / VIEW_WIDTH),
    }
  }
  const flat = { viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`, radius: 0, repeats: 0, span: 1 }
  const baseline = VIEW_HEIGHT / 2 + fontSize * 0.36
  if (shape === 'line') return { ...flat, d: `M-100,${baseline} L${VIEW_WIDTH + 100},${baseline}` }
  if (shape === 'wave') return { ...flat, d: wavePath(curveAmount * 0.25, baseline) }
  return { ...flat, d: `M-100,40 Q500,${40 + curveAmount} 1540,40` }
}

const CurvedLoop = (props: CurvedLoopProps) => {
  let jacketEl!: HTMLDivElement
  let svgEl!: SVGSVGElement
  let measureEl!: SVGTextElement
  let pathEl!: SVGPathElement
  let textPaths: SVGTextPathElement[] = []

  const [spacing, setSpacing] = createSignal(0)
  const [pathLength, setPathLength] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)

  let spacingNow = 0
  let offset = 0
  let velocity = 0
  let hover = false
  let directionOverride: 'left' | 'right' | null = null
  const effectiveDirection = () => directionOverride ?? props.direction ?? 'left'
  const scrollState = { distance: 0, level: 0 }
  const drag: DragState = {
    active: false,
    x: 0,
    time: 0,
    scale: 1,
    velocity: 0,
    ring: false,
    radius: 0,
    angle: 0,
    cx: 0,
    cy: 0,
  }

  const shape = () => props.shape ?? 'arc'
  const fontSize = () => props.fontSize ?? 96
  const body = createMemo(() => (props.marqueeText ?? '').replace(/\s+$/, ''))
  const mark = () => String(props.separator ?? '').trim()
  const text = () => (mark() ? `${body()}\u00A0${mark()}\u00A0` : `${body()}\u00A0`)
  const pathId = `curve-${createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const ring = () => shape() === 'circle'
  const geometry = createMemo(() =>
    getGeometry(shape(), props.curveAmount ?? 400, fontSize(), spacing()),
  )
  const ready = () => spacing() > 0
  const copies = createMemo(() =>
    ready()
      ? ring()
        ? geometry().repeats + 1
        : Math.ceil((pathLength() || 1800) / spacing()) + 2
      : 1,
  )
  const copyIndexes = createMemo(() => Array.from({ length: copies() }, (_, i) => i))
  const mask = () => edgeMask(props.edgeFade ?? 0, geometry().span)

  const maskId = `${pathId}-outline`
  const accent = () => Boolean(mark() && props.separatorColor)
  const plain = () => text().repeat(copies())
  const textClass = () => `${props.class ?? ''} ${props.className ?? ''}`.trim()

  const applyOffset = () => {
    const value = `${offset}px`
    for (const node of textPaths) node.setAttribute('startOffset', value)
  }

  // Upstream synced directionRef from the direction prop; a fling override
  // yields to the prop whenever it changes.
  createEffect(() => {
    void props.direction
    directionOverride = null
  })

  // Refs are plain closure state now; the loop reads props at tick time (the
  // upstream settingsRef/directionRef pattern collapses away in Solid).
  createEffect(() => {
    spacingNow = spacing()
    if (ready()) offset = wrapOffset(offset, spacing())
  })

  onMount(() => {
    createEffect(() => {
      // Upstream deps: [text, className, fontSize, fontWeight, letterSpacing].
      const deps = [text(), textClass(), fontSize(), props.fontWeight, props.letterSpacing ?? 0]
      void deps
      measureEl.setAttribute('xml:space', 'preserve')
      const measure = () => {
        if (measureEl) setSpacing(measureEl.getComputedTextLength())
      }
      measure()
      let alive = true
      const fonts = document.fonts
      fonts?.ready.then(() => alive && measure()).catch(() => {})
      fonts?.addEventListener?.('loadingdone', measure)
      const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
      if (observer && svgEl) observer.observe(svgEl)
      onCleanup(() => {
        alive = false
        fonts?.removeEventListener?.('loadingdone', measure)
        observer?.disconnect()
      })
    })

    createEffect(() => {
      // Upstream deps: [geometry.d].
      const d = geometry().d
      void d
      if (pathEl) setPathLength(pathEl.getTotalLength())
    })

    createEffect(() => {
      // Upstream re-queried textPaths on every render; re-query whenever the
      // set of nodes can change.
      geometry()
      ready()
      copies()
      if (svgEl) textPaths = Array.from(svgEl.querySelectorAll('textPath'))
      else textPaths = []
      const value = `${offset}px`
      for (const node of textPaths) {
        node.setAttribute('xml:space', 'preserve')
        node.setAttribute('startOffset', value)
      }
    })

    createEffect(() => {
      if (!ready()) return
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      let frame = 0
      let last = 0
      let visible = true

      const tick = (now: number) => {
        frame = 0
        if (!visible) return
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
        last = now
        const scroll = scrollState
        const rate = dt > 0 ? scroll.distance / dt : 0
        scroll.distance = 0
        scroll.level +=
          (rate - scroll.level) * (1 - Math.exp(-dt * (rate > scroll.level ? 10 : 2.4)))
        if (!drag.active) {
          const base = props.speed ?? 2
          const pause = props.pauseOnHover ?? false
          const boost = props.scrollBoost ?? 0
          const sign = effectiveDirection() === 'right' ? 1 : -1
          const halted = reduceMotion || (pause && hover)
          const target = halted ? 0 : sign * base * 60
          const extra = halted ? 0 : sign * scroll.level * boost * 0.3
          velocity += (target - velocity) * (1 - Math.exp(-dt * 3))
          const step = (velocity + extra) * dt
          if (Math.abs(step) > 0.0001) {
            offset = wrapOffset(offset + step, spacingNow)
            for (const node of textPaths) node.setAttribute('startOffset', `${offset}px`)
          }
        }
        frame = requestAnimationFrame(tick)
      }

      const observer =
        typeof IntersectionObserver !== 'undefined'
          ? new IntersectionObserver(([entry]) => {
              visible = entry.isIntersecting
              if (visible && !frame) {
                last = 0
                scrollState.level = 0
                frame = requestAnimationFrame(tick)
              }
            })
          : null
      if (observer && jacketEl) observer.observe(jacketEl)
      frame = requestAnimationFrame(tick)

      onCleanup(() => {
        cancelAnimationFrame(frame)
        observer?.disconnect()
      })
    })
  })

  createEffect(() => {
    if (!props.scrollBoost) return
    const positions = new Map<Window | Element, number>([[window, window.scrollY]])
    const onScroll = (event: Event) => {
      const target = event.target instanceof Element ? event.target : window
      if (target instanceof Element && !target.contains(jacketEl)) return
      const position = target instanceof Element ? target.scrollTop : window.scrollY
      const previous = positions.get(target)
      positions.set(target, position)
      if (previous !== undefined) scrollState.distance += Math.abs(position - previous)
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    onCleanup(() => window.removeEventListener('scroll', onScroll, { capture: true }))
  })

  const onPointerDown = (e: PointerEvent) => {
    if (!(props.interactive ?? true) || !ready()) return
    const rect = svgEl?.getBoundingClientRect()
    const width = rect?.width || VIEW_WIDTH
    const cx = rect ? rect.left + rect.width / 2 : e.clientX
    const cy = rect ? rect.top + rect.height / 2 : e.clientY
    drag.active = true
    drag.x = e.clientX
    drag.time = performance.now()
    drag.scale = VIEW_WIDTH / width
    drag.velocity = 0
    drag.ring = ring()
    drag.radius = geometry().radius
    drag.angle = Math.atan2(e.clientY - cy, e.clientX - cx)
    drag.cx = cx
    drag.cy = cy
    velocity = 0
    setDragging(true)
    ;(e.currentTarget as HTMLDivElement)?.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.active) return
    const now = performance.now()
    let delta = (e.clientX - drag.x) * drag.scale
    if (drag.ring) {
      const angle = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx)
      delta = wrapAngle(angle - drag.angle) * drag.radius
      drag.angle = angle
    }
    const dt = Math.max(now - drag.time, 1) / 1000
    drag.x = e.clientX
    drag.time = now
    drag.velocity = drag.velocity * 0.5 + (delta / dt) * 0.5
    offset = wrapOffset(offset + delta, spacingNow)
    applyOffset()
  }

  const endDrag = () => {
    if (!drag.active) return
    drag.active = false
    setDragging(false)
    const fling =
      performance.now() - drag.time > 100
        ? 0
        : Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.velocity))
    velocity = fling
    if (Math.abs(fling) > 60) {
      // Mirror upstream: a fling flips the marquee direction state.
      directionOverride = fling > 0 ? 'right' : 'left'
    }
  }

  const onPointerLeave = () => {
    hover = false
    endDrag()
  }

  return (
    <div
      ref={jacketEl}
      class="min-h-screen flex items-center justify-center w-full"
      style={{
        visibility: ready() ? 'visible' : 'hidden',
        cursor: (props.interactive ?? true) ? (dragging() ? 'grabbing' : 'grab') : 'auto',
        'touch-action': (props.interactive ?? true) ? 'pan-y' : 'auto',
        'mask-image': mask(),
        '-webkit-mask-image': mask(),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onPointerEnter={() => {
        hover = true
      }}
      onPointerLeave={onPointerLeave}
    >
      <svg
        ref={svgEl}
        class="select-none w-full overflow-visible block aspect-[100/12] uppercase leading-none fill-current"
        viewBox={geometry().viewBox}
        style={{
          'font-size': `${fontSize()}px`,
          'font-weight': props.fontWeight ?? 700,
          'letter-spacing': `${props.letterSpacing ?? 0}px`,
          ...(ring()
            ? { width: `${(geometry().span * 100).toFixed(3)}%`, 'aspect-ratio': '1' }
            : {}),
        }}
        role="img"
        aria-label={props.marqueeText ?? ''}
      >
        <text
          ref={measureEl}
          class={textClass()}
          style={{ visibility: 'hidden', opacity: 0, 'pointer-events': 'none' }}
        >
          {text()}
        </text>
        <defs>
          <path ref={pathEl} id={pathId} d={geometry().d} fill="none" stroke="transparent" />
          <Show when={ready() && (props.outline ?? false)}>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x={-VIEW_WIDTH}
              y={-VIEW_WIDTH}
              width={VIEW_WIDTH * 3}
              height={VIEW_WIDTH * 3}
            >
              <rect
                x={-VIEW_WIDTH}
                y={-VIEW_WIDTH}
                width={VIEW_WIDTH * 3}
                height={VIEW_WIDTH * 3}
                fill="#fff"
              />
              <text class={textClass()} fill="#000">
                <textPath href={`#${pathId}`}>{plain()}</textPath>
              </text>
            </mask>
          </Show>
        </defs>
        <Show when={ready()}>
          <Show
            when={props.outline ?? false}
            fallback={
              <text class={textClass()} fill={props.color ?? 'currentColor'}>
                <textPath href={`#${pathId}`}>
                  <Show when={accent()} fallback={plain()}>
                    <For each={copyIndexes()}>
                      {() => (
                        <>
                          {`${body()}\u00A0`}
                          <tspan fill={props.separatorColor}>{mark()}</tspan>
                          {'\u00A0'}
                        </>
                      )}
                    </For>
                  </Show>
                </textPath>
              </text>
            }
          >
            <text
              class={textClass()}
              fill="none"
              stroke={props.color ?? 'currentColor'}
              stroke-width={fontSize() * 0.05}
              stroke-linejoin="round"
              mask={`url(#${maskId})`}
            >
              <textPath href={`#${pathId}`}>
                <Show when={accent()} fallback={plain()}>
                  <For each={copyIndexes()}>
                    {() => (
                      <>
                        {`${body()}\u00A0`}
                        <tspan stroke="none">{mark()}</tspan>
                        {'\u00A0'}
                      </>
                    )}
                  </For>
                </Show>
              </textPath>
            </text>
            <Show when={accent()}>
              <text class={textClass()} fill="none" >
                <textPath href={`#${pathId}`}>
                  <For each={copyIndexes()}>
                    {() => (
                      <>
                        {`${body()}\u00A0`}
                        <tspan fill={props.separatorColor}>{mark()}</tspan>
                        {'\u00A0'}
                      </>
                    )}
                  </For>
                </textPath>
              </text>
            </Show>
          </Show>
        </Show>
      </svg>
    </div>
  )
}

export default CurvedLoop
