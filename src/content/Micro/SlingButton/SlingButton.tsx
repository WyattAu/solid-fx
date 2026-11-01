import { createEffect, createSignal, createUniqueId, For, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls } from 'motion'
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import { ArrowUp02Icon } from '@hugeicons/core-free-icons'

export type SlingAxis = 'any' | 'horizontal' | 'vertical'

export interface SlingButtonProps {
  children?: JSX.Element
  onSend?: () => void
  padColor?: string
  iconColor?: string
  accentColor?: string
  wellColor?: string
  bandColor?: string
  size?: number
  strokeWidth?: number
  armAt?: number
  maxPull?: number
  launchSpeed?: number
  recoil?: number
  flight?: number
  particles?: number
  spread?: number
  axis?: SlingAxis
  tapSends?: boolean
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

interface Sample {
  x: number
  y: number
  t: number
}

interface Grip {
  id: number
  startX: number
  startY: number
  scale: number
  moved: boolean
  hist: Sample[]
  rawOrigin: { x: number; y: number }
  slop: number
}

const GAP = 4
const SLOP = { fine: 4, coarse: 8 }
const FINGER_MAX = 3000
const HAND_MAX = 6000
const CANCEL = 0.5
const POWER_CAP = 1.5
const DOT_MS = 300
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rubberband = (o: number, dim: number, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o))

const SlingButton = (props: SlingButtonProps) => {
  const reduce = usePrefersReducedMotion()
  const size = () => props.size ?? 56
  const strokeWidth = () => props.strokeWidth ?? 3
  const maxPull = () => props.maxPull ?? 160
  const axis = () => props.axis ?? 'any'
  const R = () => maxPull()
  const ARM = () => Math.min(props.armAt ?? 48, 0.8 * R())
  const wellR = () => size() / 2 + GAP + strokeWidth()
  const padR = () => size() / 2 - strokeWidth() / 2
  const arcR = () => wellR()
  const H = () => wellR() + strokeWidth() + 2
  const DOT = () => Math.max(6, Math.round(size() / 7))
  const count = () => Math.max(0, Math.round(props.particles ?? 14))
  const dotIdx = () => Array.from({ length: count() }, (_, i) => i)
  const [held, setHeld] = createSignal(false)
  const [armed, setArmed] = createSignal(false)
  const [sent, setSent] = createSignal(false)
  let rootEl!: HTMLSpanElement
  let padEl!: HTMLButtonElement
  let padWrapEl!: HTMLSpanElement
  let fxEI!: SVGGElement
  let bandEl!: SVGPathElement
  let hotEl!: SVGPathElement
  let arcEl!: SVGCircleElement
  let iconEl!: HTMLSpanElement
  const dotEls: (HTMLSpanElement | null)[] = []
  let power = 0
  let grip: Grip | null = null
  let dir = { ux: 0, uy: -1 }
  let animX: AnimationPlaybackControls | null = null
  let animY: AnimationPlaybackControls | null = null
  let armedRef = false
  let dotPending = false
  let dotTimer: ReturnType<typeof setTimeout> | undefined
  let paintQueued = false
  let paintRaf = 0
  let sentTimer: ReturnType<typeof setTimeout> | undefined
  let skipClick = false
  const hintId = createUniqueId()

  const px = motionValue(0)
  const py = motionValue(0)

  const launchDot = () => {
    dotPending = false
    clearTimeout(dotTimer)
    const { ux, uy } = dir
    relaxIcon()
    const base = Math.atan2(-uy, -ux)
    const cone = ((props.spread ?? 60) * Math.PI) / 180
    const push = 0.85 + 0.35 * power
    dotEls.forEach((dot, i) => {
      if (!dot) return
      const lead = i === 0
      const angle = base + (lead ? 0 : (Math.random() + Math.random() - 1) * (cone / 2))
      const cx = Math.cos(angle)
      const cy = Math.sin(angle)
      const flight = props.flight ?? 120
      const reach = (lead ? flight : flight * (0.3 + Math.random())) * push
      const drift = lead ? 0 : (Math.random() - 0.5) * flight * 0.4
      const scale = lead ? 1 : 0.3 + Math.random() * 0.6
      const shrink = lead ? 0.6 : scale * (0.2 + Math.random() * 0.4)
      const duration = lead ? DOT_MS : DOT_MS * (0.7 + Math.random())
      const delay = lead ? 0 : Math.random() * 70
      const to = wellR() + reach
      dot.animate(
        [
          { transform: `translate(${cx * wellR()}px, ${cy * wellR()}px) scale(${scale})` },
          {
            transform: `translate(${cx * to - cy * drift}px, ${cy * to + cx * drift}px) scale(${shrink})`,
          },
        ],
        { duration, delay, easing: EASE_OUT, fill: 'none' },
      )
      dot.animate(
        [
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.55 },
          { opacity: 0, offset: 1 },
        ],
        { duration, delay, easing: 'linear', fill: 'none' },
      )
    })
  }

  const aimIcon = (ux: number, uy: number, dist: number) => {
    const icon = iconEl
    if (!icon) return
    const angle = (Math.atan2(-uy, -ux) * 180) / Math.PI + 90
    icon.style.transition = 'none'
    icon.style.transform = `rotate(${angle * clamp(dist / 12, 0, 1)}deg)`
  }
  const relaxIcon = () => {
    const icon = iconEl
    if (!icon) return
    icon.style.transition = reduce() ? 'none' : 'transform 360ms cubic-bezier(0.23, 1, 0.32, 1)'
    icon.style.transform = 'rotate(0deg)'
  }

  const paint = () => {
    paintQueued = false
    const band = bandEl
    const hot = hotEl
    const arc = arcEl
    const fx = fxEI
    if (!band || !hot || !arc || !fx) return
    const x = px.get()
    const y = py.get()
    const { ux, uy } = dir
    const proj = x * ux + y * uy
    const p = clamp(proj / ARM(), 0, 1)
    const dist = Math.hypot(x, y)
    let d = ''
    if (dist > 0.5) {
      const a = Math.atan2(y, x)
      const b = Math.acos(clamp((wellR() - padR()) / dist, -1, 1))
      d = [a + b, a - b]
        .map(t => {
          const cx = Math.cos(t)
          const cy = Math.sin(t)
          return `M${(wellR() * cx).toFixed(2)},${(wellR() * cy).toFixed(2)}L${(x + padR() * cx).toFixed(2)},${(y + padR() * cy).toFixed(2)}`
        })
        .join('')
    }
    band.setAttribute('d', d)
    hot.setAttribute('d', d)
    hot.style.opacity = String(p)
    fx.style.opacity = String(clamp(proj / 6, 0, 1))
    arc.setAttribute('stroke-dasharray', `${p} ${1 - p}`)
    arc.setAttribute('stroke-dashoffset', String(p / 2))
    arc.style.opacity = p > 0.01 ? '1' : '0'
    if (grip) aimIcon(ux, uy, dist)
    arc.setAttribute('transform', `rotate(${(Math.atan2(-uy, -ux) * 180) / Math.PI})`)
    if (dotPending && proj <= size() / 4) launchDot()
  }
  const schedulePaint = () => {
    if (paintQueued) return
    paintQueued = true
    paintRaf = requestAnimationFrame(paint)
  }
  const padPaint = () => {
    padWrapEl.style.transform = `translate(${px.get()}px, ${py.get()}px)`
  }

  onMount(() => {
    const offX = px.on('change', () => {
      schedulePaint()
      padPaint()
    })
    const offY = py.on('change', () => {
      schedulePaint()
      padPaint()
    })
    paint()
    padPaint()
    onCleanup(() => {
      offX()
      offY()
      cancelAnimationFrame(paintRaf)
    })
  })

  createEffect(() => {
    // Upstream deps: [size, strokeWidth, armAt, maxPull, axis]
    size()
    strokeWidth()
    props.armAt
    maxPull()
    axis()
    animX?.stop()
    animY?.stop()
    px.jump(0)
    py.jump(0)
    paint()
    padPaint()
  })

  const settle = (v0: { x: number; y: number }) => {
    if (reduce()) {
      const fx = fxEI
      if (fx) {
        fx.style.transition = 'opacity 200ms ease'
        fx.style.opacity = '0'
      }
      setTimeout(() => {
        px.jump(0)
        py.jump(0)
        if (fx) fx.style.transition = ''
      }, 200)
      return
    }
    const recoil = props.recoil ?? 0.2
    animX = animate(px, 0, { type: 'spring', duration: 0.4, bounce: recoil, velocity: v0.x })
    animY = animate(py, 0, { type: 'spring', duration: 0.4, bounce: recoil, velocity: v0.y })
  }

  const onPointerDown = (e: PointerEvent) => {
    if (props.disabled || grip || e.button !== 0) return
    const el = rootEl
    if (!el) return
    const rect = el.getBoundingClientRect()
    const scale = rect.width / (el.offsetWidth || rect.width) || 1
    animX?.stop()
    animY?.stop()
    const x = px.get()
    const y = py.get()
    const dNow = Math.hypot(x, y)
    const dClamped = Math.min(dNow, 0.95 * R())
    const rawNow = dNow > 0.5 ? (R() * dClamped) / (R() - dClamped) : 0
    grip = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scale,
      moved: false,
      hist: [],
      rawOrigin: dNow > 0.5 ? { x: (rawNow * x) / dNow, y: (rawNow * y) / dNow } : { x: 0, y: 0 },
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine,
    }
    try {
      ;(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
    } catch {}
    setHeld(true)
  }
  const onPointerMove = (e: PointerEvent) => {
    const g = grip
    if (!g || g.id !== e.pointerId) return
    const dx = (e.clientX - g.startX) / g.scale
    const dy = (e.clientY - g.startY) / g.scale
    let rx = g.rawOrigin.x + dx
    let ry = g.rawOrigin.y + dy
    if (axis() === 'horizontal') ry = rubberband(ry, size() / 4)
    else if (axis() === 'vertical') rx = rubberband(rx, size() / 4)
    if (!g.moved && Math.hypot(dx, dy) > g.slop) g.moved = true
    const raw = Math.hypot(rx, ry)
    if (raw < 0.01) return
    const d = (R() * raw) / (R() + raw)
    const ux = rx / raw
    const uy = ry / raw
    dir = { ux, uy }
    px.set(d * ux)
    py.set(d * uy)
    const t = performance.now()
    g.hist.push({ x: d * ux, y: d * uy, t })
    while (g.hist.length > 4 || t - g.hist[0].t > 80) g.hist.shift()
    const isArmed = d >= ARM()
    if (isArmed !== armedRef) {
      armedRef = isArmed
      setArmed(isArmed)
    }
  }
  const release = (pointerId: number, cancelled: boolean) => {
    const g = grip
    if (!g || g.id !== pointerId) return
    grip = null
    skipClick = true
    try {
      padEl?.releasePointerCapture(pointerId)
    } catch {}
    const d = Math.hypot(px.get(), py.get())
    const p = d / ARM()
    const { ux, uy } = dir
    let vx = 0
    let vy = 0
    if (!cancelled && g.hist.length > 1) {
      const a = g.hist[0]
      const b = g.hist[g.hist.length - 1]
      const dt = b.t - a.t
      if (dt > 0 && performance.now() - b.t < 50) {
        vx = ((b.x - a.x) / dt) * 1000
        vy = ((b.y - a.y) / dt) * 1000
      }
    }
    const fm = Math.hypot(vx, vy)
    if (fm > FINGER_MAX) {
      vx *= FINGER_MAX / fm
      vy *= FINGER_MAX / fm
    }
    if (!g.moved) {
      relaxIcon()
      if (props.tapSends !== false && !cancelled) props.onSend?.()
    } else {
      const launchSpeed = props.launchSpeed ?? 2600
      const fire = armedRef && !cancelled
      const launch = fire
        ? launchSpeed * Math.min(p, POWER_CAP)
        : CANCEL * launchSpeed * Math.min(p, 1)
      let v0x = vx - ux * launch
      let v0y = vy - uy * launch
      const m = Math.hypot(v0x, v0y)
      if (m > HAND_MAX) {
        v0x *= HAND_MAX / m
        v0y *= HAND_MAX / m
      }
      if (!fire) relaxIcon()
      if (fire) {
        props.onSend?.()
        if (reduce()) {
          setSent(true)
          sentTimer = setTimeout(() => setSent(false), 200)
        } else {
          power = clamp((Math.min(p, POWER_CAP) - 1) / (POWER_CAP - 1), 0, 1)
          dotPending = true
          dotTimer = setTimeout(launchDot, 150)
        }
      }
      settle({ x: v0x, y: v0y })
    }
    armedRef = false
    setHeld(false)
    setArmed(false)
  }
  onCleanup(() => {
    animX?.stop()
    animY?.stop()
    clearTimeout(dotTimer)
    clearTimeout(sentTimer)
  })

  return (
    <span
      ref={rootEl}
      class={`group/root relative inline-block [width:var(--sl-size)] [height:var(--sl-size)]${props.className ? ` ${props.className}` : ''}`}
      data-armed={armed() ? '' : undefined}
      data-sent={sent() ? '' : undefined}
      style={
        {
          '--sl-size': `${size()}px`,
          '--sl-svg': `${2 * H()}px`,
          '--sl-pad': props.padColor ?? '#f5f5f5',
          '--sl-icon': props.iconColor ?? '#18181b',
          '--sl-accent': props.accentColor ?? '#f5f5f5',
          '--sl-well': props.wellColor ?? '#27272a',
          '--sl-band': props.bandColor ?? '#52525b',
          '--sl-stroke': `${strokeWidth()}px`,
          '--sl-dot': `${DOT()}px`,
        } as JSX.CSSProperties
      }
    >
      <svg
        class="pointer-events-none absolute top-1/2 left-1/2 overflow-visible [width:var(--sl-svg)] [height:var(--sl-svg)] [margin:calc(var(--sl-svg)/-2)_0_0_calc(var(--sl-svg)/-2)] [shape-rendering:geometricPrecision]"
        viewBox={`${-H()} ${-H()} ${2 * H()} ${2 * H()}`}
        aria-hidden="true"
      >
        <g ref={fxEI} class="sling-button__tension" style={{ opacity: 0 }}>
          <path
            ref={bandEl}
            class="fill-none [stroke:var(--sl-band)] [stroke-linecap:round] [stroke-width:var(--sl-stroke)] [transition:stroke-width_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[armed]/root:[stroke-width:calc(var(--sl-stroke)*1.5)]"
          />
          <path
            ref={hotEl}
            class="fill-none [stroke:var(--sl-accent)] [stroke-linecap:round] [stroke-width:var(--sl-stroke)] [transition:stroke-width_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[armed]/root:[stroke-width:calc(var(--sl-stroke)*1.5)]"
          />
        </g>
        <circle
          class="[fill:var(--sl-well)] [transition:fill_200ms_ease] group-data-[sent]/root:[fill:var(--sl-accent)]"
          r={wellR()}
        />
        <circle
          ref={arcEl}
          class="fill-none [stroke:var(--sl-accent)] [stroke-width:var(--sl-stroke)] [stroke-linecap:butt] [transition:stroke-width_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[armed]/root:[stroke-width:calc(var(--sl-stroke)*1.5)]"
          r={arcR()}
          pathLength="1"
          stroke-dasharray="0 1"
          style={{ opacity: 0 }}
        />
      </svg>
      <For each={dotIdx()}>
        {(_, i) => (
          <span
            ref={el => {
              dotEls[i()] = el
            }}
            class="pointer-events-none absolute top-1/2 left-1/2 rounded-full opacity-0 [width:var(--sl-dot)] [height:var(--sl-dot)] [margin:calc(var(--sl-dot)/-2)_0_0_calc(var(--sl-dot)/-2)] [background:var(--sl-accent)]"
            aria-hidden="true"
          />
        )}
      </For>
      <span ref={padWrapEl} class="absolute inset-0">
        <button
          ref={padEl}
          type="button"
          class="group/pad relative m-0 block h-full w-full cursor-grab touch-none rounded-full border-0 bg-transparent p-0 outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] after:absolute after:-inset-1.5 after:rounded-full after:content-[''] data-[held]:cursor-grabbing aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-label={props.ariaLabel ?? 'Send'}
          aria-describedby={hintId}
          aria-disabled={props.disabled || undefined}
          data-held={held() ? '' : undefined}
          data-armed={armed() ? '' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={e => release(e.pointerId, false)}
          onPointerCancel={e => release(e.pointerId, true)}
          onLostPointerCapture={e => release(e.pointerId, true)}
          onKeyDown={e => {
            if (e.key === 'Escape' && grip) release(grip.id, true)
          }}
          onClick={() => {
            if (skipClick) {
              skipClick = false
              return
            }
            if (!props.disabled) props.onSend?.()
          }}
        >
          <span class="flex h-full w-full items-center justify-center rounded-full [background:var(--sl-pad)] [color:var(--sl-icon)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[held]/pad:scale-[0.97] group-data-[armed]/pad:scale-[1.04] [@media(hover:hover)_and_(pointer:fine)]:group-hover/pad:group-not-data-[held]/pad:group-not-aria-disabled/pad:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none!">
            <span ref={iconEl} class="inline-flex will-change-transform">
              {props.children ?? (
                <HugeiconsIcon
                  icon={ArrowUp02Icon}
                  size={Math.round(size() * 0.4)}
                  strokeWidth={2.2}
                />
              )}
            </span>
          </span>
        </button>
      </span>
      <span id={hintId} class="sr-only">
        Press Enter to send, or drag away and release.
      </span>
    </span>
  )
}
export default SlingButton
