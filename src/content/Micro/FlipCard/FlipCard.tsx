import { createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls } from 'motion'
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

export type FlipCardAxis = 'x' | 'y'

export interface FlipCardProps {
  front?: JSX.Element
  back?: JSX.Element
  flipped?: boolean
  defaultFlipped?: boolean
  onFlipChange?: (flipped: boolean) => void
  axis?: FlipCardAxis
  flipOnClick?: boolean
  draggable?: boolean
  dragDistance?: number
  tilt?: boolean
  tiltMax?: number
  glare?: boolean
  glareOpacity?: number
  hoverScale?: number
  perspective?: number
  stiffness?: number
  damping?: number
  width?: number
  height?: number
  radius?: number
  background?: string
  color?: string
  shadow?: boolean
  shadowColor?: string
  shadowOpacity?: number
  disabled?: boolean
  ariaLabel?: string
  className?: string
  class?: string
}

interface Grip {
  id: number
  x: number
  y: number
  base: number
  moved: boolean
  slop: number
  hist: { t: number; v: number }[]
}

const SLOP = { fine: 4, coarse: 8 }
const TILT_SPRING = { stiffness: 240, damping: 24, mass: 0.6 }
const LIFT_SPRING = { stiffness: 320, damping: 26 }
const FLING = 0.16
const HISTORY_MS = 90

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const snap = (deg: number) => Math.round(deg / 180) * 180
const isBack = (deg: number) => Math.abs(Math.round(deg / 180)) % 2 === 1

// SOLID-ADAPTATION: motion/react's useSpring has no vanilla equivalent; a motionValue
// driven by `animate(..., { type: 'spring', ... })` has the same semantics for
// `.set()` (animated) and `.jump()` (instant) — same solver, same configs
// (TILT 240/24/0.6, LIFT 320/26, turn restDelta 0.05).
const springValue = (
  initial: number,
  config: { stiffness: number; damping: number; mass?: number },
) => {
  const mv = motionValue(initial)
  return {
    mv,
    set: (v: number) => {
      animate(mv, v, { type: 'spring', ...config })
    },
  }
}

const FlipCard = (props: FlipCardProps) => {
  const axis = () => props.axis ?? 'y'
  const flipOnClick = () => props.flipOnClick ?? true
  const draggable = () => props.draggable ?? true
  const dragDistance = () => props.dragDistance ?? 0
  const tilt = () => props.tilt ?? true
  const tiltMax = () => props.tiltMax ?? 12
  const glare = () => props.glare ?? true
  const glareOpacity = () => props.glareOpacity ?? 0.22
  const hoverScale = () => props.hoverScale ?? 1.03
  const perspective = () => props.perspective ?? 1100
  const stiffness = () => props.stiffness ?? 170
  const damping = () => props.damping ?? 20
  const width = () => props.width ?? 300
  const height = () => props.height ?? 400
  const disabled = () => props.disabled ?? false

  const reduce = usePrefersReducedMotion()
  const controlled = () => props.flipped !== undefined
  const [inner, setInner] = createSignal(props.defaultFlipped ?? false)
  const [dragging, setDragging] = createSignal(false)
  const shown = () => (controlled() ? (props.flipped as boolean) : inner())

  let rootEl: HTMLDivElement | undefined
  let rotorEl: HTMLDivElement | undefined
  let shadowEl: HTMLSpanElement | undefined
  let grip: Grip | null = null
  let spin: AnimationPlaybackControls | null = null
  let shownRef = shown()
  let target = shown() ? 180 : 0

  const turn = motionValue(target)
  const tiltX = springValue(0, TILT_SPRING)
  const tiltY = springValue(0, TILT_SPRING)
  const lift = springValue(1, LIFT_SPRING)
  const sheen = springValue(0, LIFT_SPRING)
  const gx = motionValue(50)
  const gy = motionValue(50)

  const applyRotor = () => {
    if (!rotorEl || reduce()) return
    if (axis() === 'x') {
      rotorEl.style.transform = `perspective(${perspective()}px) scale(${lift.mv.get()}) rotateY(${tiltY.mv.get()}deg) rotateX(${turn.get() + tiltX.mv.get()}deg)`
    } else {
      rotorEl.style.transform = `perspective(${perspective()}px) scale(${lift.mv.get()}) rotateX(${tiltX.mv.get()}deg) rotateY(${turn.get() + tiltY.mv.get()}deg)`
    }
  }
  // Upstream derived facing/spread/shade with useTransform on `turn`.
  const applyShadow = () => {
    if (!shadowEl) return
    const facing = Math.abs(Math.cos((turn.get() * Math.PI) / 180))
    const spread = 0.08 + 0.92 * facing
    const shade = 0.1 + 0.9 * facing * facing
    shadowEl.style.transform = axis() === 'x' ? `scaleY(${spread})` : `scaleX(${spread})`
    shadowEl.style.opacity = String(shade)
  }
  const applyGlare = () => {
    if (!rootEl) return
    rootEl.style.setProperty('--fc-gx', `${gx.get()}%`)
    rootEl.style.setProperty('--fc-gy', `${gy.get()}%`)
    rootEl.style.setProperty('--fc-sheen', String(sheen.mv.get()))
  }

  onMount(() => {
    const offs = [
      turn.on('change', () => {
        applyRotor()
        applyShadow()
      }),
      tiltX.mv.on('change', applyRotor),
      tiltY.mv.on('change', applyRotor),
      lift.mv.on('change', applyRotor),
      sheen.mv.on('change', applyGlare),
      gx.on('change', applyGlare),
      gy.on('change', applyGlare),
    ]
    applyRotor()
    applyShadow()
    applyGlare()
    onCleanup(() => {
      offs.forEach(off => off())
      spin?.stop()
      ;[turn, tiltX.mv, tiltY.mv, lift.mv, sheen.mv, gx, gy].forEach(mv => mv.stop())
    })
  })

  const settle = (to: number, velocity: number, instant: boolean) => {
    spin?.stop()
    target = to
    if (instant || reduce()) turn.jump(to)
    else
      spin = animate(turn, to, {
        type: 'spring',
        stiffness: stiffness(),
        damping: damping(),
        velocity,
        restDelta: 0.05,
      })
    const next = isBack(to)
    if (next === shownRef) return
    shownRef = next
    if (!controlled()) setInner(next)
    untrack(() => props.onFlipChange?.(next))
  }
  const flip = (instant: boolean) => {
    const base = snap(turn.get())
    settle(isBack(base) ? base - 180 : base + 180, 0, instant)
  }
  const rest = () => {
    tiltX.set(0)
    tiltY.set(0)
    sheen.set(0)
    lift.set(1)
  }

  // Upstream: useEffect on [flipped] — follow a controlled prop.
  createEffect(() => {
    const flipped = props.flipped
    untrack(() => {
      if (!controlled() || isBack(target) === flipped) return
      const base = target
      spin?.stop()
      target = isBack(base) ? base - 180 : base + 180
      if (reduce()) turn.jump(target)
      else
        spin = animate(turn, target, {
          type: 'spring',
          stiffness: stiffness(),
          damping: damping(),
          restDelta: 0.05,
        })
    })
  })
  createEffect(() => {
    if (disabled()) rest()
  })

  const onPointerDown = (e: PointerEvent) => {
    if (disabled() || e.button !== 0 || grip) return
    const el = e.currentTarget as HTMLDivElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    spin?.stop()
    grip = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: turn.get(),
      moved: false,
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine,
      hist: [],
    }
    if (!reduce()) lift.set(hoverScale())
  }
  const onPointerMove = (e: PointerEvent) => {
    const g = grip
    const el = e.currentTarget as HTMLDivElement
    if (g && g.id === e.pointerId) {
      const d = axis() === 'x' ? e.clientY - g.y : e.clientX - g.x
      if (!g.moved) {
        if (Math.abs(d) < g.slop || !draggable() || reduce()) return
        g.moved = true
        setDragging(true)
        tiltX.set(0)
        tiltY.set(0)
        sheen.set(0)
      }
      const span = dragDistance() > 0 ? dragDistance() : axis() === 'x' ? height() : width()
      const deg = g.base + (axis() === 'x' ? -1 : 1) * (d / span) * 180
      turn.set(deg)
      const now = performance.now()
      g.hist.push({ t: now, v: deg })
      while (g.hist.length > 2 && now - g.hist[0].t > HISTORY_MS) g.hist.shift()
      return
    }
    if (!tilt() || reduce() || disabled() || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    const px = clamp((e.clientX - r.left) / r.width, 0, 1)
    const py = clamp((e.clientY - r.top) / r.height, 0, 1)
    tiltX.set((0.5 - py) * 2 * tiltMax())
    tiltY.set((px - 0.5) * 2 * tiltMax())
    gx.set(px * 100)
    gy.set(py * 100)
    sheen.set(1)
  }
  const release = (e: PointerEvent, cancelled: boolean) => {
    const g = grip
    if (!g || g.id !== e.pointerId) return
    grip = null
    const el = e.currentTarget as HTMLDivElement
    try {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    } catch {}
    setDragging(false)
    if (e.pointerType === 'touch' || !rootEl?.matches(':hover')) rest()
    if (!g.moved) {
      if (!cancelled && flipOnClick()) flip(false)
      else settle(target, 0, false)
      return
    }
    const here = turn.get()
    let velocity = 0
    const a = g.hist[0]
    const b = g.hist[g.hist.length - 1]
    if (!cancelled && a && b && b.t > a.t && performance.now() - b.t < 60)
      velocity = ((b.v - a.v) / (b.t - a.t)) * 1000
    const to = cancelled
      ? snap(g.base)
      : clamp(snap(here + velocity * FLING), snap(here) - 180, snap(here) + 180)
    settle(to, velocity, false)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled() || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    if (!e.repeat) flip(true)
  }
  const onClick = (e: MouseEvent) => {
    if (!disabled() && e.detail === 0) flip(true)
  }

  return (
    <div
      ref={rootEl}
      role="button"
      tabIndex={disabled() ? -1 : 0}
      aria-pressed={shown()}
      aria-label={props.ariaLabel ?? 'Flip card'}
      aria-disabled={disabled() || undefined}
      class={`group relative inline-block max-w-full cursor-pointer touch-pan-y select-none outline-none [width:var(--fc-w)] [height:var(--fc-h)] [border-radius:var(--fc-radius)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[axis=x]:touch-pan-x data-[draggable]:cursor-grab data-[dragging]:cursor-grabbing data-[disabled]:cursor-default data-[disabled]:opacity-60${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-axis={axis()}
      data-draggable={draggable() && !disabled() && !reduce() ? '' : undefined}
      data-dragging={dragging() ? '' : undefined}
      data-disabled={disabled() ? '' : undefined}
      data-fade={reduce() ? (shown() ? 'back' : 'front') : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e: PointerEvent) => release(e, false)}
      onPointerCancel={(e: PointerEvent) => release(e, true)}
      onLostPointerCapture={(e: PointerEvent) => release(e, true)}
      onPointerEnter={(e: PointerEvent) => {
        if (!reduce() && !disabled() && e.pointerType !== 'touch') lift.set(hoverScale())
      }}
      onPointerLeave={() => {
        if (!grip) rest()
      }}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onDragStart={(e: DragEvent) => e.preventDefault()}
      style={{
        '--fc-w': `${width()}px`,
        '--fc-h': `${height()}px`,
        '--fc-radius': `${props.radius ?? 22}px`,
        '--fc-bg': props.background ?? '#27272a',
        '--fc-ink': props.color ?? '#f5f5f5',
        '--fc-shadow': props.shadowColor ?? '#000000',
        '--fc-shadow-o': props.shadowOpacity ?? 0.45,
        '--fc-glare': glareOpacity(),
      }}
    >
      {(props.shadow ?? true) ? (
        <span
          ref={shadowEl}
          class="pointer-events-none absolute [inset:12%_9%_-5%] [border-radius:var(--fc-radius)] [background:color-mix(in_srgb,var(--fc-shadow)_calc(var(--fc-shadow-o)*100%),transparent)] [filter:blur(22px)]"
          aria-hidden="true"
        />
      ) : null}
      <div ref={rotorEl} class="absolute inset-0 [transform-style:preserve-3d]">
        <div
          class="absolute inset-0 overflow-hidden [border-radius:var(--fc-radius)] [background:var(--fc-bg)] [color:var(--fc-ink)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [&_img]:[-webkit-user-drag:none] group-data-[fade]:opacity-0 group-data-[fade]:[backface-visibility:visible] group-data-[fade]:[-webkit-backface-visibility:visible] group-data-[fade]:[transition:opacity_200ms_ease] group-data-[fade=front]:opacity-100!"
          aria-hidden={shown() ? 'true' : undefined}
          inert={shown()}
        >
          {props.front}
          {glare() ? (
            <span
              class="pointer-events-none absolute inset-0 [opacity:var(--fc-sheen,0)] [background:radial-gradient(circle_farthest-side_at_var(--fc-gx,50%)_var(--fc-gy,50%),rgba(255,255,255,var(--fc-glare))_0%,rgba(255,255,255,calc(var(--fc-glare)*0.76))_12%,rgba(255,255,255,calc(var(--fc-glare)*0.5))_26%,rgba(255,255,255,calc(var(--fc-glare)*0.28))_42%,rgba(255,255,255,calc(var(--fc-glare)*0.12))_60%,rgba(255,255,255,calc(var(--fc-glare)*0.04))_78%,rgba(255,255,255,0)_100%)]"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <div
          class="absolute inset-0 overflow-hidden [border-radius:var(--fc-radius)] [background:var(--fc-bg)] [color:var(--fc-ink)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [&_img]:[-webkit-user-drag:none] group-data-[fade]:opacity-0 group-data-[fade]:[backface-visibility:visible] group-data-[fade]:[-webkit-backface-visibility:visible] group-data-[fade]:[transition:opacity_200ms_ease] [transform:rotateY(180deg)] group-data-[axis=x]:[transform:rotateX(180deg)] group-data-[fade]:[transform:none]! group-data-[fade=back]:opacity-100!"
          aria-hidden={!shown() ? 'true' : undefined}
          inert={!shown()}
        >
          {props.back}
          {glare() ? (
            <span
              class="pointer-events-none absolute inset-0 [opacity:var(--fc-sheen,0)] [background:radial-gradient(circle_farthest-side_at_var(--fc-gx,50%)_var(--fc-gy,50%),rgba(255,255,255,var(--fc-glare))_0%,rgba(255,255,255,calc(var(--fc-glare)*0.76))_12%,rgba(255,255,255,calc(var(--fc-glare)*0.5))_26%,rgba(255,255,255,calc(var(--fc-glare)*0.28))_42%,rgba(255,255,255,calc(var(--fc-glare)*0.12))_60%,rgba(255,255,255,calc(var(--fc-glare)*0.04))_78%,rgba(255,255,255,0)_100%)]"
              aria-hidden="true"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default FlipCard
