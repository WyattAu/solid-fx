import { createEffect, createMemo, For, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'

export type GradualBlurPosition = 'top' | 'bottom' | 'left' | 'right'
export type GradualBlurCurve = 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'

/** Structural stand-in for React's RefObject (a plain `{ current }` box). */
export interface GradualBlurContainerRef {
  current: Element | null
}

export interface GradualBlurProps {
  position?: GradualBlurPosition
  target?: 'parent' | 'page'
  height?: string | number
  width?: string | number
  strength?: number
  layers?: number
  curve?: GradualBlurCurve
  exponential?: boolean
  opacity?: number
  saturation?: number
  tint?: string
  autoHide?: boolean
  container?: Element | string | GradualBlurContainerRef | null
  hoverIntensity?: number
  duration?: number | string
  easing?: string
  zIndex?: number
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

const CURVES: Record<string, (t: number) => number> = {
  linear: t => t,
  bezier: t => t * t * (3 - 2 * t),
  'ease-in': t => t * t,
  'ease-out': t => 1 - (1 - t) * (1 - t),
  'ease-in-out': t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
}

const DIRECTIONS: Record<string, string> = {
  top: 'to top',
  bottom: 'to bottom',
  left: 'to left',
  right: 'to right',
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

const toLength = (value: string | number) => (typeof value === 'number' ? `${value}px` : value)

const toTime = (value: string | number) => (typeof value === 'number' ? `${value}s` : value)

const findScroller = (
  container: GradualBlurProps['container'],
  root: HTMLElement,
  target: string,
  vertical: boolean,
): Element | Window | null => {
  if (container) {
    if (typeof container === 'string') return document.querySelector(container)
    return 'current' in container ? container.current : container
  }
  if (target === 'page') return window
  const parent = root.parentElement
  if (!parent) return null
  const scrolls = (node: Element) => {
    const style = getComputedStyle(node)
    return /(auto|scroll|overlay)/.test(vertical ? style.overflowY : style.overflowX)
  }
  const sibling = Array.from(parent.children).find(child => child !== root && scrolls(child))
  return sibling || (scrolls(parent) ? parent : null)
}

const GradualBlur = (props: GradualBlurProps) => {
  let root!: HTMLDivElement
  const edge = () => {
    const position = props.position ?? 'bottom'
    return DIRECTIONS[position] ? position : 'bottom'
  }
  const vertical = () => {
    const current = edge()
    return current === 'top' || current === 'bottom'
  }

  const stack = createMemo(() => {
    const count = Math.min(Math.max(Math.round(props.layers ?? 8) || 1, 1), 16)
    const shape = CURVES[props.curve ?? 'linear'] || CURVES.linear
    const maxBlur = Math.max(props.strength ?? 2, 0) * 12
    const level = (u: number) => {
      const t = shape(clamp01(u))
      return maxBlur * ((props.exponential ?? true) ? (2 ** (4 * t) - 1) / 15 : t)
    }
    const boost = Math.max(props.saturation ?? 1, 0) ** (1 / count)
    const fade = `${toTime(props.duration ?? 0.3)} ${props.easing ?? 'ease-out'}`
    const direction = DIRECTIONS[edge()]
    const steps: JSX.CSSProperties[] = []
    for (let i = 0; i < count; i++) {
      const from = level(i / count)
      const to = level((i + 1) / count)
      const radius = Math.sqrt(Math.max(to * to - from * from, 0))
      const filter = [
        `blur(calc(${radius.toFixed(3)}px * var(--gradual-blur-reveal, 1) * var(--gradual-blur-hover, 1)))`,
        boost !== 1
          ? `saturate(calc(1 + ${(boost - 1).toFixed(4)} * var(--gradual-blur-reveal, 1)))`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
      const mask = `linear-gradient(${direction}, transparent ${((i / count) * 100).toFixed(2)}%, #000 ${(((i + 1) / count) * 100).toFixed(2)}%)`
      steps.push({
        position: 'absolute',
        inset: 0,
        'border-radius': 'inherit',
        'backdrop-filter': filter,
        '-webkit-backdrop-filter': filter,
        'mask-image': mask,
        '-webkit-mask-image': mask,
        opacity: props.opacity ?? 1,
        transition: `backdrop-filter ${fade}, -webkit-backdrop-filter ${fade}`,
      })
    }
    const stops = Array.from({ length: 9 }, (_, k) => {
      const u = k / 8
      const t = shape(u)
      const alpha = t * t * t * (t * (t * 6 - 15) + 10)
      return `rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(u * 100).toFixed(1)}%`
    }).join(', ')
    const tintMask = `linear-gradient(${direction}, ${stops})`
    const tint = props.tint ?? 'transparent'
    const wash: JSX.CSSProperties | null =
      tint && tint !== 'transparent'
        ? {
            position: 'absolute',
            inset: 0,
            'border-radius': 'inherit',
            background: tint,
            'mask-image': tintMask,
            '-webkit-mask-image': tintMask,
            opacity: 'calc(var(--gradual-blur-reveal, 1) * min(var(--gradual-blur-hover, 1), 1))',
            transition: `opacity ${fade}`,
          }
        : null
    return { steps, wash }
  })

  createEffect(() => {
    const rootEl = root
    if (!rootEl) return
    const autoHide = props.autoHide ?? false
    const container = props.container
    const target = props.target ?? 'parent'
    const currentEdge = edge()
    const isVertical = vertical()
    if (!autoHide) {
      rootEl.style.removeProperty('--gradual-blur-reveal')
      return
    }
    const scroller = findScroller(container, rootEl, target, isVertical)
    if (!scroller) return
    const element = scroller instanceof Element ? scroller : null
    const start = currentEdge === 'top' || currentEdge === 'left'

    const update = () => {
      const page = document.documentElement
      const offset = element
        ? isVertical
          ? element.scrollTop
          : element.scrollLeft
        : isVertical
          ? window.scrollY
          : window.scrollX
      const limit = element
        ? isVertical
          ? element.scrollHeight - element.clientHeight
          : element.scrollWidth - element.clientWidth
        : isVertical
          ? page.scrollHeight - window.innerHeight
          : page.scrollWidth - window.innerWidth
      const box = rootEl.getBoundingClientRect()
      const reach = Math.max(isVertical ? box.height : box.width, 1)
      const room = start ? offset : limit - offset
      rootEl.style.setProperty('--gradual-blur-reveal', clamp01(room / reach).toFixed(3))
    }

    update()
    const source = element ?? window
    source.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer =
      element && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (observer && element) {
      observer.observe(element)
      if (element.firstElementChild) observer.observe(element.firstElementChild)
    }
    onCleanup(() => {
      source.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer?.disconnect()
    })
  })

  createEffect(() => {
    const rootEl = root
    const hoverIntensity = props.hoverIntensity ?? 1
    if (!rootEl || hoverIntensity === 1) return
    let frame = 0
    let inside = false
    let point: { x: number; y: number } | null = null

    const check = () => {
      frame = 0
      if (!point) return
      const box = rootEl.getBoundingClientRect()
      const now =
        point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom
      if (now === inside) return
      inside = now
      rootEl.style.setProperty(
        '--gradual-blur-hover',
        inside ? String(Math.max(hoverIntensity, 0)) : '1',
      )
    }

    const onMove = (event: PointerEvent) => {
      point = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(check)
    }

    const onLeave = () => {
      point = null
      inside = false
      rootEl.style.setProperty('--gradual-blur-hover', '1')
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    onCleanup(() => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      rootEl.style.removeProperty('--gradual-blur-hover')
    })
  })

  const rootStyle = (): JSX.CSSProperties => {
    const currentEdge = edge()
    const isVertical = vertical()
    const depth = toLength(
      isVertical ? (props.height ?? '6rem') : (props.width ?? props.height ?? '6rem'),
    )
    const span = isVertical && props.width != null ? toLength(props.width) : null
    const rounded = (props.target ?? 'parent') !== 'page' && !span
    const corner = (a: string, b: string) =>
      rounded && (currentEdge === a || currentEdge === b) ? 'inherit' : undefined
    return {
      position: (props.target ?? 'parent') === 'page' ? 'fixed' : 'absolute',
      'z-index': props.zIndex ?? 1000,
      'border-top-left-radius': corner('top', 'left'),
      'border-top-right-radius': corner('top', 'right'),
      'border-bottom-left-radius': corner('bottom', 'left'),
      'border-bottom-right-radius': corner('bottom', 'right'),
      top: currentEdge === 'bottom' ? undefined : 0,
      bottom: currentEdge === 'top' ? undefined : 0,
      left: currentEdge === 'right' ? undefined : 0,
      right: currentEdge === 'left' ? undefined : 0,
      height: isVertical ? depth : undefined,
      width: isVertical ? (span ?? undefined) : depth,
      'margin-inline': span ? 'auto' : undefined,
      ...props.style,
    }
  }

  return (
    <div
      ref={root}
      class={['pointer-events-none', props.class, props.className].filter(Boolean).join(' ')}
      style={rootStyle()}
      aria-hidden="true"
    >
      <For each={stack().steps}>{layer => <div style={layer} />}</For>
      {stack().wash && <div style={stack().wash as JSX.CSSProperties} />}
    </div>
  )
}

export default GradualBlur
