import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export type StrokeTextTrigger = 'mount' | 'hover' | 'scroll' | 'loop'
export type StrokeTextFillMode = 'wipe' | 'fade' | 'none'
export type StrokeTextWipeFrom = 'left' | 'right' | 'top' | 'bottom'
export type StrokeTextStyle = 'solid' | 'dashed' | 'dotted'

export interface StrokeTextProps {
  text?: string
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  drawDuration?: number
  fillDelay?: number
  stagger?: number
  ease?: string
  trigger?: StrokeTextTrigger
  fillMode?: StrokeTextFillMode
  wipeFrom?: StrokeTextWipeFrom
  fontSize?: number
  fontWeight?: number | string
  fontFamily?: string
  letterSpacing?: number
  reverse?: boolean
  strokeStyle?: StrokeTextStyle
  dashLength?: number
  marching?: boolean
  hoverRedraw?: boolean
  shadow?: boolean
  shadowColor?: string
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

interface StrokeTextBox {
  x: number
  y: number
  width: number
  height: number
}

interface DashPattern {
  array: string
  period: number
}

const DEFAULT_TEXT = 'Draw Attention'
const SHADOW_OPACITY = 0.5

const getWipeFrames = (box: StrokeTextBox, wipeFrom: StrokeTextWipeFrom) => {
  const end = { x: box.x, y: box.y, width: box.width, height: box.height }
  if (wipeFrom === 'right') return { start: { ...end, x: box.x + box.width, width: 0 }, end }
  if (wipeFrom === 'top') return { start: { ...end, height: 0 }, end }
  if (wipeFrom === 'bottom') return { start: { ...end, y: box.y + box.height, height: 0 }, end }
  return { start: { ...end, width: 0 }, end }
}

const getDashPattern = (
  strokeStyle: StrokeTextStyle,
  dashLength: number,
  strokeWidth: number,
): DashPattern | null => {
  const width = Math.max(Number(strokeWidth) || 0, 0.1)
  const length = Math.max(Number(dashLength) || 0, 1)
  if (strokeStyle === 'dotted') {
    const gap = Math.max(length, width * 1.8)
    return { array: `0 ${gap}`, period: gap }
  }
  if (strokeStyle === 'dashed') {
    const on = Math.max(length - width, 0.5)
    const off = length * 0.6 + width
    return { array: `${on} ${off}`, period: on + off }
  }
  return null
}

const StrokeText = (props: StrokeTextProps) => {
  let rootEl!: HTMLSpanElement
  let strokeEl: SVGTextElement | undefined
  let wipeEl: SVGRectElement | undefined
  let shadowEl: SVGFEDropShadowElement | undefined

  const [box, setBox] = createSignal<StrokeTextBox | null>(null)

  // React's useId stood in for an SSR-safe unique id; createUniqueId is the
  // Solid equivalent (createSignal-style numeric ids need no sanitizing, but
  // the strip is kept to match upstream's id shape).
  const baseId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '')
  const wipeId = `stroke-text-wipe-${baseId}`
  const revealId = `stroke-text-reveal-${baseId}`
  const erodeId = `stroke-text-erode-${baseId}`
  const shadowId = `stroke-text-shadow-${baseId}`

  const text = () => props.text ?? DEFAULT_TEXT
  const characters = createMemo(() => Array.from(text()))
  const fontSize = () => props.fontSize ?? 128
  const strokeWidth = () => props.strokeWidth ?? 1.4
  const dash = () => Math.max(fontSize() * 7, 200)
  const pattern = () =>
    getDashPattern(props.strokeStyle ?? 'solid', props.dashLength ?? 10, strokeWidth())
  const dashArray = () => pattern()?.array ?? null
  const dashPeriod = () => pattern()?.period ?? 0
  const lift = () => fontSize() * 0.06
  const softness = () => fontSize() * 0.016
  const castShadow = () => (props.shadow ?? false) && props.fillMode !== 'none'

  const fontStyle = createMemo<JSX.CSSProperties>(() => ({
    'font-family': props.fontFamily ?? 'inherit',
    'font-size': `${fontSize()}px`,
    'font-weight': props.fontWeight ?? 800,
    'letter-spacing': `${props.letterSpacing ?? -4}px`,
  }))

  // Upstream layout effect #1: measure the stroked text's bbox.
  createEffect(() => {
    // Upstream deps: [characters, fontFamily, fontSize, fontWeight,
    // letterSpacing, strokeWidth].
    const root = rootEl
    const textNode = strokeEl
    const deps = [characters(), props.fontFamily, props.fontWeight]
    void deps
    if (!root || !textNode) return undefined

    let cancelled = false

    const measure = () => {
      if (cancelled || !strokeEl) return
      let bbox: DOMRect | undefined
      try {
        bbox = strokeEl.getBBox()
      } catch {
        return
      }
      if (!bbox?.width) return

      const pad = Math.max(strokeWidth() || 1, fontSize() * 0.1)
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2,
      }

      setBox(prev =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next,
      )
    }

    measure()
    document.fonts?.ready?.then(measure).catch(() => {})

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(root)

    onCleanup(() => {
      cancelled = true
      observer?.disconnect()
    })
  })

  // Upstream layout effect #2: build/play the draw + fill timelines.
  createEffect(() => {
    // Upstream deps: [box, dash, drawDuration, fillDelay, stagger, ease,
    // trigger, fillMode, wipeFrom, reverse, dashArray, dashPeriod, marching,
    // hoverRedraw, castShadow, lift, fontSize].
    const root = rootEl
    const boxNow = box()
    const dashNow = dash()
    const dashArrayNow = dashArray()
    const dashPeriodNow = dashPeriod()
    const liftNow = lift()
    const shadowOn = castShadow()
    void [
      props.drawDuration,
      props.fillDelay,
      props.stagger,
      props.ease,
      props.trigger,
      props.fillMode,
      props.wipeFrom,
      props.reverse,
      props.marching,
      props.hoverRedraw,
      props.fontSize,
      shadowOn,
    ]
    if (typeof window === 'undefined' || !root || !boxNow) return undefined

    const strokes = gsap.utils.toArray(root.querySelectorAll('[data-stroke-char]'))
    const fills = gsap.utils.toArray(root.querySelectorAll('[data-fill-char]'))
    const wipe = wipeEl
    const outline = strokeEl
    const drop = shadowEl
    if (!strokes.length) return undefined

    const fillEnabled = props.fillMode !== 'none'
    const useWipe = fillEnabled && props.fillMode === 'wipe'
    const drawDuration = props.drawDuration ?? 1.6
    const fillDelay = props.fillDelay ?? 0.2
    const stagger = props.stagger ?? 0.05
    const ease = props.ease ?? 'power2.out'
    const trigger = props.trigger ?? 'mount'
    const fillDuration = Math.max(0.4, drawDuration * 0.5)
    const staggerConfig: number | gsap.StaggerVars = props.reverse
      ? { each: stagger, from: 'end' as const }
      : stagger
    const frames = getWipeFrames(boxNow, props.wipeFrom ?? 'left')
    const lifted = { dx: liftNow, dy: liftNow, 'flood-opacity': SHADOW_OPACITY }
    const grounded = { dx: 0, dy: 0, 'flood-opacity': 0 }
    const targets = [...strokes, ...fills, wipe, drop].filter(Boolean)

    const setStart = () => {
      gsap.killTweensOf(targets)
      gsap.set(strokes, { strokeDasharray: dashNow, strokeDashoffset: dashNow, strokeOpacity: 1 })
      gsap.set(fills, { opacity: useWipe ? 1 : 0 })
      if (wipe) gsap.set(wipe, { attr: frames.start })
      if (drop) gsap.set(drop, { attr: grounded })
    }

    const setEnd = () => {
      gsap.killTweensOf(targets)
      gsap.set(strokes, { strokeDasharray: dashNow, strokeDashoffset: 0, strokeOpacity: 1 })
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 })
      if (wipe) gsap.set(wipe, { attr: fillEnabled ? frames.end : frames.start })
      if (drop) gsap.set(drop, { attr: fillEnabled ? lifted : grounded })
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setEnd()
      onCleanup(() => gsap.killTweensOf(targets))
      return undefined
    }

    const build = () => {
      setStart()
      const looping = trigger === 'loop'
      const tl = gsap.timeline({
        paused: true,
        repeat: looping ? -1 : 0,
        repeatDelay: looping ? 0.9 : 0,
        yoyo: looping,
        defaults: { overwrite: 'auto' },
      })

      tl.to(
        strokes,
        { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig },
        0,
      )

      if (useWipe && wipe) {
        tl.to(
          wipe,
          { attr: frames.end, duration: fillDuration, ease: 'power2.inOut' },
          drawDuration + fillDelay,
        )
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
          drawDuration + fillDelay,
        )
      }

      if (drop && fillEnabled) {
        tl.to(
          drop,
          { attr: lifted, duration: fillDuration * 1.4, ease: 'power3.out' },
          drawDuration + fillDelay + fillDuration * 0.3,
        )
      }

      return tl
    }

    let timeline: gsap.core.Timeline | null = null
    let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null
    let redraw: gsap.core.Timeline | null = null
    const listeners: (() => void)[] = []

    const listen = (handler: () => void) => {
      root.addEventListener('pointerenter', handler)
      listeners.push(handler)
    }

    if (trigger === 'hover') {
      setEnd()
      listen(() => {
        timeline?.kill()
        timeline = build()
        timeline.play(0)
      })
    } else {
      timeline = build()
      if (trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top 82%',
          once: true,
          onEnter: () => timeline?.play(0),
        })
      } else {
        timeline.play(0)
      }

      if ((props.hoverRedraw ?? false) && trigger !== 'loop') {
        listen(() => {
          if (!timeline || timeline.progress() < 1 || redraw?.isActive()) return
          redraw?.kill()
          redraw = gsap
            .timeline()
            .to(strokes, { strokeOpacity: 0, duration: 0.2, ease: 'power1.out' })
            .set(strokes, { strokeDashoffset: dashNow, strokeOpacity: 1 })
            .to(strokes, {
              strokeDashoffset: 0,
              duration: drawDuration * 0.8,
              ease,
              stagger: staggerConfig,
            })
        })
      }
    }

    const march =
      dashArrayNow && (props.marching ?? false) && outline
        ? gsap.fromTo(
            outline,
            { strokeDashoffset: 0 },
            {
              strokeDashoffset: -dashPeriodNow,
              duration: dashPeriodNow / (fontSize() * 0.22),
              ease: 'none',
              repeat: -1,
            },
          )
        : null

    onCleanup(() => {
      listeners.forEach(handler => root.removeEventListener('pointerenter', handler))
      scrollTrigger?.kill()
      timeline?.kill()
      redraw?.kill()
      march?.kill()
      gsap.killTweensOf(targets)
    })
    return undefined
  })

  const viewBox = () => {
    const b = box()
    return b ? `${b.x} ${b.y} ${b.width} ${b.height}` : `0 ${-fontSize()} 600 ${fontSize() * 1.3}`
  }
  const wipeStart = () => {
    const b = box()
    return b ? getWipeFrames(b, props.wipeFrom ?? 'left').start : null
  }
  const region = () => {
    const b = box()
    return b
      ? {
          x: b.x - fontSize(),
          y: b.y - fontSize(),
          width: b.width + fontSize() * 2,
          height: b.height + fontSize() * 2,
        }
      : {}
  }

  const renderOutline = () => (
    <text
      ref={el => {
        strokeEl = el
      }}
      class="select-none"
      x="0"
      y="0"
      fill="none"
      stroke={props.strokeColor ?? '#A78BFA'}
      stroke-width={strokeWidth()}
      stroke-linejoin="round"
      stroke-linecap="round"
      stroke-dasharray={dashArray() || undefined}
      mask={dashArray() ? `url(#${revealId})` : undefined}
      style={fontStyle()}
    >
      <For each={characters()}>
        {char => <tspan data-stroke-char={dashArray() ? undefined : true}>{char}</tspan>}
      </For>
    </text>
  )

  return (
    <span
      ref={rootEl}
      class={`block w-full leading-[0] ${props.trigger === 'hover' ? 'cursor-pointer' : ''} ${props.class ?? ''} ${props.className ?? ''}`.trim()}
      style={props.style}
      role="img"
      aria-label={text()}
    >
      <svg
        class="mx-auto block h-auto w-full overflow-visible"
        viewBox={viewBox()}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{
          'max-width': `${box() ? box()!.width : 600}px`,
          visibility: box() ? undefined : 'hidden',
        }}
      >
        <defs>
          <Show when={props.fillMode === 'wipe' ? wipeStart() : null}>
            {start => (
              <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
                <rect
                  ref={el => {
                    wipeEl = el
                  }}
                  x={start().x}
                  y={start().y}
                  width={start().width}
                  height={start().height}
                />
              </clipPath>
            )}
          </Show>

          <Show when={dashArray()}>
            <filter id={erodeId} filterUnits="userSpaceOnUse" {...region()}>
              <feMorphology operator="erode" radius={(strokeWidth() || 1) / 2 + 0.75} />
            </filter>
          </Show>

          <Show when={dashArray()}>
            <mask id={revealId} maskUnits="userSpaceOnUse" {...region()}>
              <text
                x="0"
                y="0"
                fill="none"
                stroke="#fff"
                stroke-width={(strokeWidth() || 1) + 2}
                stroke-linejoin="round"
                stroke-linecap="round"
                style={fontStyle()}
              >
                <For each={characters()}>
                  {char => <tspan data-stroke-char={true}>{char}</tspan>}
                </For>
              </text>
              <text
                x="0"
                y="0"
                fill="#000"
                stroke="none"
                filter={`url(#${erodeId})`}
                style={fontStyle()}
              >
                <For each={characters()}>{char => <tspan>{char}</tspan>}</For>
              </text>
            </mask>
          </Show>

          <Show when={castShadow()}>
            <filter
              id={shadowId}
              filterUnits="userSpaceOnUse"
              color-interpolation-filters="sRGB"
              {...region()}
            >
              <feDropShadow
                ref={el => {
                  shadowEl = el as SVGFEDropShadowElement
                }}
                dx={lift()}
                dy={lift()}
                stdDeviation={softness()}
                flood-color={props.shadowColor || props.strokeColor || '#A78BFA'}
                flood-opacity={SHADOW_OPACITY}
              />
            </filter>
          </Show>
        </defs>

        <Show when={!dashArray()}>{renderOutline()}</Show>

        <g filter={castShadow() ? `url(#${shadowId})` : undefined}>
          <text
            class="select-none"
            x="0"
            y="0"
            fill={props.fillColor ?? 'currentColor'}
            stroke="none"
            style={fontStyle()}
            clip-path={props.fillMode === 'wipe' && wipeStart() ? `url(#${wipeId})` : undefined}
          >
            <For each={characters()}>{char => <tspan data-fill-char={true}>{char}</tspan>}</For>
          </text>
        </g>

        <Show when={dashArray()}>{renderOutline()}</Show>
      </svg>
    </span>
  )
}

export default StrokeText
