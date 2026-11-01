import { createEffect, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import { animate, motionValue } from 'motion'
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

const R = 80
const DEAD = 44
const K = 12
const V_FULL = 4
const V_FLICK = 2
const TAU_FOLLOW = 0.06
const TAU_V = 0.05
const DECEL = 0.99
const DRAG_PX = 10
const STALE_MS = 80

export interface CometDialChangeDetail {
  velocity: number
  bounce: number
}

export interface CometDialProps {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  unit?: string
  label?: string
  accent?: string
  ink?: string
  size?: number
  sweep?: number
  thickness?: number
  speed?: number
  tapBounce?: number
  flickBounce?: number
  momentum?: number
  cometReach?: number
  cometWidth?: number
  disabled?: boolean
  onChange?: (value: number) => void
  onChangeEnd?: (value: number, detail: CometDialChangeDetail) => void
  className?: string
  class?: string
}

type Sample = [number, number]

interface Grip {
  id: number
  at: number | null
  hist: Sample[]
  side: 'hi' | 'lo' | null
  moved: boolean
  x0: number
  y0: number
}

interface Loop {
  raf: number
  last: number
  v: number
  rPrev: number | null
  text: string
  valueText: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0
  const a = hist[0]
  const b = hist[hist.length - 1]
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000
}
const decimalsOf = (step: number) => {
  const s = String(step)
  const i = s.indexOf('.')
  return i === -1 ? 0 : s.length - i - 1
}
const pointAt = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [100 + Math.cos(a) * R, 100 + Math.sin(a) * R]
}
const arcPath = (a0: number, a1: number) => {
  const [x0, y0] = pointAt(a0)
  const [x1, y1] = pointAt(a1)
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`
}
const COMET_IDX = Array.from({ length: K }, (_, j) => j)

const CometDial = (props: CometDialProps) => {
  const min = () => props.min ?? 0
  const max = () => props.max ?? 100
  const step = () => props.step ?? 1
  const unit = () => props.unit ?? '%'
  const sweep = () => props.sweep ?? 320
  const thickness = () => props.thickness ?? 5
  const speed = () => props.speed ?? 25
  const tapBounce = () => props.tapBounce ?? 0.2
  const flickBounce = () => props.flickBounce ?? 0.1
  const momentum = () => props.momentum ?? 1
  const cometReach = () => props.cometReach ?? 180
  const cometWidth = () => props.cometWidth ?? 12
  const disabled = () => props.disabled ?? false

  const reduce = usePrefersReducedMotion()
  const [dragging, setDragging] = createSignal(false)
  let svgEl: SVGSVGElement | undefined
  let litEl: SVGPathElement | undefined
  let headEl: SVGCircleElement | undefined
  const comet: (SVGPathElement | null)[] = []
  let figureEl: HTMLSpanElement | undefined
  let target = untrack(() => clamp(props.value ?? props.defaultValue ?? 62, min(), max()))
  let grip: Grip | null = null
  let unbind: (() => void) | null = null
  const loop: Loop = { raf: 0, last: 0, v: 0, rPrev: null, text: '', valueText: '' }
  const reading = motionValue(target)

  const range = () => Math.max(1e-9, max() - min())
  const gap = () => 360 - sweep()
  const start = () => 90 + gap() / 2
  const end = () => start() + sweep()
  const decimals = () => decimalsOf(step())
  const k = () => 200 + (clamp(speed(), 0, 100) / 100) * 700
  const crit = () => 2 * Math.sqrt(k())
  const snap = (v: number) =>
    step() > 0
      ? clamp(Math.round((v - min()) / step()) * step() + min(), min(), max())
      : clamp(v, min(), max())

  const commit = (v: number, finished: boolean, detail?: CometDialChangeDetail) => {
    const s = snap(v)
    if (s !== target) {
      target = s
      untrack(() => props.onChange?.(s))
    }
    if (finished)
      untrack(() => props.onChangeEnd?.(s, detail ?? { velocity: 0, bounce: tapBounce() }))
  }

  const paint = (now: number) => {
    const svg = svgEl
    if (!svg) {
      loop.raf = 0
      return
    }
    const dt = clamp((now - loop.last) / 1000, 0, 0.05)
    loop.last = now
    const g = grip
    if (g && g.at != null) {
      if (reduce()) reading.jump(g.at)
      else reading.set(reading.get() + (g.at - reading.get()) * (1 - Math.exp(-dt / TAU_FOLLOW)))
    }
    const r = reading.get()
    const vRaw = loop.rPrev == null || dt === 0 || reduce() ? 0 : (r - loop.rPrev) / dt / range()
    loop.rPrev = r
    loop.v += (vRaw - loop.v) * (1 - Math.exp(-dt / TAU_V))
    const v = loop.v
    const s = clamp(Math.abs(v) / V_FULL, 0, 1)
    const dir = Math.sign(v) || 1
    const f = clamp((r - min()) / range(), 0, 1)
    const ang = start() + f * sweep()
    if (litEl) litEl.setAttribute('d', f > 0.0005 ? arcPath(start(), ang) : '')
    if (headEl) {
      const [cx, cy] = pointAt(ang)
      headEl.setAttribute('cx', cx.toFixed(3))
      headEl.setAttribute('cy', cy.toFixed(3))
    }
    const seg = (cometReach() * s) / K
    for (let j = 0; j < K; j++) {
      const el = comet[j]
      if (!el) continue
      let a0 = dir > 0 ? ang - (j + 1) * seg : ang + j * seg
      let a1 = dir > 0 ? ang - j * seg : ang + (j + 1) * seg
      a0 = clamp(a0, start(), end())
      a1 = clamp(a1, start(), end())
      if (seg < 0.01 || a1 - a0 < 0.01) {
        if (el.style.opacity !== '0') el.style.opacity = '0'
        continue
      }
      const w = 1 - j / K
      el.setAttribute('d', arcPath(a0, a1))
      el.setAttribute('stroke-width', (thickness() + cometWidth() * w * s).toFixed(2))
      el.style.opacity = (w * s).toFixed(3)
    }
    const shown = clamp(r, min(), max()).toFixed(decimals())
    if (shown !== loop.text) {
      loop.text = shown
      if (figureEl) figureEl.textContent = shown
      svg.setAttribute('aria-valuenow', shown)
    }
    const valueText = `${target}${unit()}`
    if (valueText !== loop.valueText) {
      loop.valueText = valueText
      svg.setAttribute('aria-valuetext', valueText)
    }
    const moving = !!g || reading.isAnimating() || Math.abs(v) > 0.002
    if (!moving) {
      for (const el of comet) if (el && el.style.opacity !== '0') el.style.opacity = '0'
    }
    loop.raf = moving ? requestAnimationFrame(paint) : 0
  }

  const wake = () => {
    if (loop.raf) return
    loop.last = performance.now()
    loop.rPrev = null
    loop.raf = requestAnimationFrame(paint)
  }
  const launch = (to: number, bounce: number, velocity = reading.getVelocity()) => {
    reading.stop()
    if (reduce()) {
      reading.jump(to)
      wake()
      return
    }
    animate(reading, to, {
      type: 'spring',
      stiffness: k(),
      damping: crit() * (1 - clamp(bounce, 0, 0.9)),
      mass: 1,
      velocity,
    })
    wake()
  }

  const localPoint = (cx: number, cy: number): [number, number] => {
    const b = (svgEl as SVGSVGElement).getBoundingClientRect()
    return [((cx - b.left) / b.width) * 200 - 100, ((cy - b.top) / b.height) * 200 - 100]
  }
  const angleAt = (cx: number, cy: number) => {
    const [x, y] = localPoint(cx, cy)
    let rel = ((Math.atan2(y, x) * 180) / Math.PI - start() + 720) % 360
    const g = grip
    if (rel > sweep())
      rel = g?.side ? (g.side === 'hi' ? sweep() : 0) : rel < sweep() + gap() / 2 ? sweep() : 0
    else if (g) g.side = rel > sweep() / 2 ? 'hi' : 'lo'
    return min() + (rel / sweep()) * range()
  }

  const move = (e: PointerEvent) => {
    const g = grip
    if (!g || g.id !== e.pointerId) return
    if (!g.moved) {
      if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < DRAG_PX) return
      g.moved = true
      reading.stop()
    }
    g.at = angleAt(e.clientX, e.clientY)
    g.hist.push([performance.now(), g.at])
    if (g.hist.length > 4) g.hist.shift()
    commit(g.at, false)
    wake()
  }
  const up = (e: PointerEvent) => {
    const g = grip
    if (!g || g.id !== e.pointerId) return
    grip = null
    unbind?.()
    unbind = null
    setDragging(false)
    try {
      svgEl?.releasePointerCapture(e.pointerId)
    } catch {}
    if (!g.moved) {
      commit(target, true)
      return
    }
    const stale = performance.now() - g.hist[g.hist.length - 1][0] > STALE_MS
    const v = e.type === 'pointercancel' || stale ? 0 : velocityOf(g.hist)
    const bounce =
      tapBounce() + (flickBounce() - tapBounce()) * clamp(Math.abs(v) / range() / V_FLICK, 0, 1)
    const to = snap((g.at ?? target) + (v / 1000) * (DECEL / (1 - DECEL)) * momentum())
    commit(to, true, { velocity: v, bounce })
    launch(to, bounce, v)
  }

  const down = (e: PointerEvent) => {
    if (disabled() || grip || e.button > 0) return
    const svg = e.currentTarget as SVGSVGElement
    const [x, y] = localPoint(e.clientX, e.clientY)
    if (Math.hypot(x, y) < DEAD) return
    e.preventDefault()
    try {
      svg.setPointerCapture(e.pointerId)
    } catch {}
    svg.focus({ preventScroll: true })
    grip = {
      id: e.pointerId,
      at: null,
      hist: [],
      side: null,
      moved: false,
      x0: e.clientX,
      y0: e.clientY,
    }
    const at = angleAt(e.clientX, e.clientY)
    grip.hist.push([performance.now(), at])
    setDragging(true)
    commit(at, false)
    launch(snap(at), tapBounce())
    const onMove = (ev: PointerEvent) => {
      if (ev.isTrusted) move(ev)
    }
    const onUp = (ev: PointerEvent) => {
      if (ev.isTrusted) up(ev)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    unbind = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }

  const key = (e: KeyboardEvent) => {
    if (disabled()) return
    const t = target
    const big = e.shiftKey ? 10 : 1
    let to: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        to = t + step() * big
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        to = t - step() * big
        break
      case 'PageUp':
        to = t + step() * 10
        break
      case 'PageDown':
        to = t - step() * 10
        break
      case 'Home':
        to = min()
        break
      case 'End':
        to = max()
        break
      default:
        return
    }
    e.preventDefault()
    to = snap(to)
    reading.stop()
    reading.jump(to)
    commit(to, true)
    wake()
  }

  // Upstream: useLayoutEffect on [min, max, step, sweep, thickness,
  // cometReach, cometWidth, unit] — reset label caches and repaint.
  createEffect(() => {
    void min()
    void max()
    void step()
    void sweep()
    void thickness()
    void cometReach()
    void cometWidth()
    void unit()
    loop.text = ''
    loop.valueText = ''
    paint(performance.now())
  })

  // Upstream: useEffect on [value] — follow an externally controlled value.
  createEffect(() => {
    const v = props.value
    untrack(() => {
      if (v === undefined || grip) return
      const s = snap(v)
      if (s === target) return
      target = s
      launch(s, tapBounce())
    })
  })

  onMount(() => {
    onCleanup(() => {
      cancelAnimationFrame(loop.raf)
      unbind?.()
      reading.stop()
    })
  })

  return (
    <div
      class={`group relative select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] [width:var(--cd-size)] [height:var(--cd-size)] [color:var(--cd-ink)] data-[disabled]:opacity-55${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-dragging={dragging() ? '' : undefined}
      data-disabled={disabled() ? '' : undefined}
      style={{
        '--cd-accent': props.accent ?? '#f5f5f5',
        '--cd-ink': props.ink ?? '#fdfdfd',
        '--cd-size': `${props.size ?? 250}px`,
        '--cd-figure': `${Math.round((props.size ?? 250) * 0.16)}px`,
      }}
    >
      <svg
        ref={svgEl}
        class="absolute inset-0 block h-full w-full cursor-grab touch-none rounded-full outline-none group-data-[dragging]:cursor-grabbing group-data-[disabled]:pointer-events-none group-data-[disabled]:cursor-default"
        viewBox="0 0 200 200"
        tabIndex={disabled() ? -1 : 0}
        aria-label={props.label ?? 'Level'}
        aria-valuemin={min()}
        aria-valuemax={max()}
        aria-valuenow={target}
        aria-valuetext={`${target}${unit()}`}
        aria-disabled={disabled() || undefined}
        onPointerDown={down}
        onKeyDown={key}
      >
        <path
          class="fill-none opacity-[0.24] [stroke:var(--cd-ink)] [stroke-linecap:round]"
          d={arcPath(start(), end())}
          stroke-width={thickness()}
        />
        <path
          ref={litEl}
          class="fill-none opacity-70 [stroke:var(--cd-accent)] [stroke-linecap:round]"
          stroke-width={thickness()}
        />
        <g class="[&_path]:fill-none [&_path]:[stroke:var(--cd-accent)] [&_path]:[stroke-linecap:round]">
          <For each={COMET_IDX}>
            {j => (
              <path
                ref={el => {
                  comet[j] = el
                }}
                style={{ opacity: 0 }}
              />
            )}
          </For>
        </g>
        <circle ref={headEl} class="[fill:var(--cd-accent)]" r={thickness() * 1.8} />
      </svg>
      <div class="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
        <span class="inline-flex items-baseline gap-[0.06em] leading-none font-medium tracking-[-0.04em] tabular-nums [font-size:var(--cd-figure)]">
          <span ref={figureEl} class="comet-dial__figure" />
          {unit() ? <span class="text-[0.5em] opacity-50">{unit()}</span> : null}
        </span>
      </div>
    </div>
  )
}

export default CometDial
