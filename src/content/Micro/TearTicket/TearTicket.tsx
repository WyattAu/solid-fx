import {
  createEffect,
  createMemo,
  createSignal,
  Index,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { motionValue, springValue } from 'motion'
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

export type TearTicketOrientation = 'horizontal' | 'vertical'

export interface TearTicketProps {
  children?: JSX.Element
  stub?: JSX.Element
  image?: string
  imageAlt?: string
  scrim?: boolean
  imageRadius?: number
  orientation?: TearTicketOrientation
  torn?: boolean
  defaultTorn?: boolean
  onTear?: () => void
  width?: number
  height?: number
  stubSize?: number
  radius?: number
  holes?: number
  holeSize?: number
  notch?: number
  roughness?: number
  tearAngle?: number
  stretch?: number
  resistance?: number
  rotate?: number
  tilt?: boolean
  tiltMax?: number
  tiltReach?: number
  parallax?: number
  perspective?: number
  background?: string
  color?: string
  border?: boolean
  borderColor?: string
  borderWidth?: number
  stubBackground?: string
  recenter?: boolean
  disabled?: boolean
  ariaLabel?: string
  className?: string
  class?: string
}

interface Point {
  x: number
  y: number
}

interface Bridge extends Point {
  y0: number
  y1: number
  mid: number
  pts: number[][]
}

interface End extends Point {
  v: number
}

interface Geometry {
  vertical: boolean
  cross: number
  body: string
  stub: string
  bridges: Bridge[]
  ends: End[]
  bodyOutline: string
  stubOutline: string
}

type Phase = 'idle' | 'held' | 'free' | 'drop' | 'return'

interface Sim {
  raf: number
  last: number
  phase: Phase
  id: number | null
  sign: number
  hinge: Point
  hingeV: number
  grab: Point
  start: Point
  point: Point
  a0: number
  theta: number
  thetaV: number
  sx: number
  sy: number
  vx: number
  vy: number
  spin: number
  pvx: number
  pvy: number
  pt: number
  fade: number
  age: number
  bx: number
  bv: number
  snapped: boolean[]
  snapAt: number[]
  span: number[]
}

const TILT_SPRING = { stiffness: 220, damping: 24, mass: 0.6 }
const GRAVITY = 2400
const ART_INSET = 8
const ART_SPAN = 0.78
const RETRACT = 0.17

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rad = (deg: number) => (deg * Math.PI) / 180
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const noise = (seed: number) => {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const f = (n: number) => n.toFixed(2)

const buildGeometry = (
  W: number,
  H: number,
  S: number,
  R: number,
  holes: number,
  hole: number,
  notch: number,
  rough: number,
  vertical: boolean,
): Geometry => {
  const main = vertical ? H : W
  const cross = vertical ? W : H
  const x = main - S
  const hr = hole / 2
  const n = Math.max(1, Math.round(holes))
  const span = cross - 2 * notch
  const bridge = Math.max(2, (span - n * hole) / (n + 1))
  const random = noise(n * 7919 + Math.round(cross))
  const at = (u: number, v: number): Point => (vertical ? { x: v, y: u } : { x: u, y: v })
  const pt = (u: number, v: number) => (vertical ? `${f(v)},${f(u)}` : `${f(u)},${f(v)}`)
  const arc = (r: number, sweep: number, u: number, v: number) =>
    `A${f(r)},${f(r)} 0 0 ${vertical ? 1 - sweep : sweep} ${pt(u, v)}`
  const bridges: Bridge[] = []
  for (let i = 0; i <= n; i += 1) {
    const y0 = notch + i * (bridge + hole)
    const y1 = y0 + bridge
    const steps = Math.max(2, Math.round(bridge / 2.2))
    const pts: number[][] = []
    for (let k = 1; k < steps; k += 1)
      pts.push([x + (random() - 0.5) * 2 * rough, y0 + (bridge * k) / steps])
    bridges.push({ y0, y1, mid: (y0 + y1) / 2, pts, ...at(x, (y0 + y1) / 2) })
  }
  let body = `M${pt(R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`
  bridges.forEach((b, i) => {
    b.pts.forEach(p => {
      body += `L${pt(p[0], p[1])}`
    })
    body += `L${pt(x, b.y1)}`
    if (i < n) body += arc(hr, 0, x, b.y1 + hole)
  })
  body += `${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}Z`
  let stub = `M${pt(x + notch, 0)}L${pt(main - R, 0)}${arc(R, 1, main, R)}L${pt(main, cross - R)}${arc(R, 1, main - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`
  for (let i = n; i >= 0; i -= 1) {
    const b = bridges[i]
    for (let k = b.pts.length - 1; k >= 0; k -= 1) stub += `L${pt(b.pts[k][0], b.pts[k][1])}`
    stub += `L${pt(x, b.y0)}`
    if (i > 0) stub += arc(hr, 0, x, b.y0 - hole)
  }
  stub += `${arc(notch, 0, x + notch, 0)}Z`
  const ends = [
    { ...at(x, notch), v: notch },
    { ...at(x, cross - notch), v: cross - notch },
  ]
  const bodyOutline = `M${pt(x, cross - notch)}${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`
  const stubOutline = `M${pt(x, notch)}${arc(notch, 0, x + notch, 0)}L${pt(main - R, 0)}${arc(R, 1, main, R)}L${pt(main, cross - R)}${arc(R, 1, main - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`
  return { vertical, cross, body, stub, bridges, ends, bodyOutline, stubOutline }
}

const TearTicket = (props: TearTicketProps) => {
  const reduce = usePrefersReducedMotion()
  const width = () => props.width ?? 460
  const height = () => props.height ?? 250
  const stubSize = () => props.stubSize ?? 150
  const vertical = () => props.orientation === 'vertical'
  const controlled = () => props.torn !== undefined
  const [inner, setInner] = createSignal(props.defaultTorn ?? false)
  const used = () => (controlled() ? props.torn : inner())
  const [grabbing, setGrabbing] = createSignal(false)
  const [instant, setInstant] = createSignal(used())
  const [_fit, setFit] = createSignal(1)

  let rootEl: HTMLDivElement | null = null
  let stageEl: HTMLDivElement | null = null
  let bodyEl: HTMLDivElement | null = null
  let stubEl: HTMLDivElement | null = null
  let planeEl: HTMLDivElement | null = null
  let artEl: HTMLImageElement | null = null
  let inkEl: HTMLDivElement | null = null
  const fibres: (SVGPathElement | null)[] = []

  const geo = createMemo(() =>
    buildGeometry(
      width(),
      height(),
      stubSize(),
      props.radius ?? 16,
      props.holes ?? 12,
      props.holeSize ?? 6,
      props.notch ?? 3,
      props.roughness ?? 0,
      vertical(),
    ),
  )

  const sim: Sim = {
    raf: 0,
    last: 0,
    phase: 'idle',
    id: null,
    sign: 1,
    hinge: { x: 0, y: 0 },
    hingeV: 0,
    grab: { x: 0, y: 0 },
    start: { x: 0, y: 0 },
    point: { x: 0, y: 0 },
    a0: 0,
    theta: 0,
    thetaV: 0,
    sx: 0,
    sy: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    pvx: 0,
    pvy: 0,
    pt: 0,
    fade: 1,
    age: 0,
    bx: 0,
    bv: 0,
    snapped: [],
    snapAt: [],
    span: [],
  }

  // Upstream held mutable config in a ref (cfg.current); the same values are read
  // through accessors here — paint/step run inside rAF, an untracked context.
  const tearAngle = () => props.tearAngle ?? 30
  const stretch = () => props.stretch ?? 30
  const resistance = () => props.resistance ?? 0.45

  // PORT-NOTE: upstream tilt springs (useSpring + useMotionTemplate) are mapped
  // to vanilla springValue() following source motion values; the plane/art/ink
  // transforms are written imperatively from their `.on('change')` events.
  const tiltSrcX = motionValue(0)
  const tiltSrcY = motionValue(0)
  const tiltX = springValue(tiltSrcX, TILT_SPRING)
  const tiltY = springValue(tiltSrcY, TILT_SPRING)
  const depth = () => ((props.tiltMax ?? 9) > 0 ? (props.parallax ?? 6) / (props.tiltMax ?? 9) : 0)

  const writeTilt = () => {
    const planeNode = planeEl
    if (!planeNode) return
    const tx = tiltX.get()
    const ty = tiltY.get()
    planeNode.style.transform = `perspective(${props.perspective ?? 1000}px) rotate(${props.rotate ?? 4}deg) rotateX(${tx}deg) rotateY(${ty}deg)`
    if (reduce()) return
    const d = depth()
    if (artEl) artEl.style.transform = `translate(${-ty * d}px, ${tx * d}px)`
    if (inkEl) inkEl.style.transform = `translate(${ty * d * 0.22}px, ${-tx * d * 0.22}px)`
  }

  createEffect(() => {
    // Keep the static part of the plane transform (perspective/rotate) current.
    void props.perspective
    void props.rotate
    void props.parallax
    void props.tiltMax
    void reduce()
    writeTilt()
  })

  onMount(() => {
    const offs = [tiltX.on('change', writeTilt), tiltY.on('change', writeTilt)]
    onCleanup(() => {
      offs.forEach(off => off())
      tiltSrcX.stop()
      tiltSrcY.stop()
      tiltX.stop()
      tiltY.stop()
    })
  })

  createEffect(() => {
    // Upstream fit measure ran on [width].
    const w = width()
    const el = rootEl
    if (!el) return
    const measure = () => setFit(Math.min(1, el.clientWidth / w) || 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    onCleanup(() => ro.disconnect())
  })

  const paint = (now: number): boolean => {
    const s = sim
    const stubNode = stubEl
    const bodyNode = bodyEl
    if (stubNode) {
      stubNode.style.transform = `translate(${s.sx.toFixed(2)}px, ${s.sy.toFixed(2)}px) rotate(${((s.theta * s.sign * 180) / Math.PI).toFixed(3)}deg)`
      stubNode.style.opacity = s.fade.toFixed(3)
    }
    const up = geo().vertical
    if (bodyNode) bodyNode.style.transform = `translate${up ? 'Y' : 'X'}(${s.bx.toFixed(2)}px)`
    const cos = Math.cos(s.theta * s.sign)
    const sin = Math.sin(s.theta * s.sign)
    const lx = up ? 1.6 : 0
    const ly = up ? 0 : 1.6
    let busy = false
    geo().bridges.forEach((b, i) => {
      const dx = b.x - s.hinge.x
      const dy = b.y - s.hinge.y
      const tx = s.hinge.x + dx * cos - dy * sin + s.sx
      const ty = s.hinge.y + dx * sin + dy * cos + s.sy
      const ox = b.x + (up ? 0 : s.bx)
      const oy = b.y + (up ? s.bx : 0)
      const gx = tx - ox
      const gy = ty - oy
      const gap = Math.hypot(gx, gy)
      const near = fibres[i * 2]
      const far = fibres[i * 2 + 1]
      if (!near || !far) return
      const live = s.phase !== 'idle' && !reduce()
      if (!s.snapped[i]) {
        if (!live || gap < 0.35) {
          near.style.opacity = '0'
          far.style.opacity = '0'
          return
        }
        const k = clamp(gap / stretch(), 0, 1)
        const sag = gap * 0.18
        const w = (1.7 - 1.15 * k).toFixed(2)
        const sx = (up ? sag : 0) + gx / 2
        const sy = (up ? 0 : sag) + gy / 2
        near.setAttribute(
          'd',
          `M${f(ox - lx)},${f(oy - ly)}Q${f(ox - lx + sx)},${f(oy - ly + sy)} ${f(tx - lx)},${f(ty - ly)}`,
        )
        far.setAttribute(
          'd',
          `M${f(ox + lx)},${f(oy + ly)}Q${f(ox + lx + gx - sx)},${f(oy + ly + gy - sy)} ${f(tx + lx)},${f(ty + ly)}`,
        )
        near.style.strokeWidth = w
        far.style.strokeWidth = w
        near.style.opacity = '1'
        far.style.opacity = '1'
        s.span[i] = gap
        return
      }
      const t = (now - s.snapAt[i]) / 1000 / RETRACT
      if (!live || t >= 1 || !s.snapAt[i]) {
        near.style.opacity = '0'
        far.style.opacity = '0'
        return
      }
      busy = true
      const left = (1 - t) * (1 - t)
      const len = (s.span[i] || stretch()) * 0.5 * left
      const ux = gap > 0.01 ? gx / gap : 1
      const uy = gap > 0.01 ? gy / gap : 0
      near.setAttribute('d', `M${f(ox)},${f(oy)}L${f(ox + ux * len)},${f(oy + uy * len)}`)
      far.setAttribute('d', `M${f(tx)},${f(ty)}L${f(tx - ux * len)},${f(ty - uy * len)}`)
      near.style.strokeWidth = '0.9'
      far.style.strokeWidth = '0.9'
      near.style.opacity = left.toFixed(2)
      far.style.opacity = left.toFixed(2)
    })
    return busy
  }

  const finish = () => {
    if (stubEl) stubEl.style.visibility = 'hidden'
    if (!controlled()) setInner(true)
    props.onTear?.()
  }

  const step = (now: number) => {
    const s = sim
    const dt = clamp((now - s.last) / 1000, 0.001, 0.034)
    s.last = now
    const limit = rad(tearAngle())
    if (s.phase === 'held') {
      const count = geo().bridges.length
      let intact = 0
      for (let i = 0; i < count; i += 1) if (!s.snapped[i]) intact += 1
      const hold = count ? intact / count : 0
      const follow = 0.92 * (1 - clamp(resistance(), 0, 0.95) * hold)
      const a = Math.atan2(s.point.y - s.hinge.y, s.point.x - s.hinge.x)
      const want = clamp(wrap(a - s.a0) * s.sign * follow, 0, limit + 0.1)
      s.theta += (want - s.theta) * (1 - Math.exp(-dt / 0.035))
      const up = geo().vertical
      const away = clamp(((up ? s.point.y - s.start.y : s.point.x - s.start.x) || 0) * 0.05, -2, 4)
      const side = clamp(((up ? s.point.x - s.start.x : s.point.y - s.start.y) || 0) * 0.05, -3, 3)
      const px = up ? side : away
      const py = up ? away : side
      s.sx += (px - s.sx) * (1 - Math.exp(-dt / 0.05))
      s.sy += (py - s.sy) * (1 - Math.exp(-dt / 0.05))
      const slack = Math.hypot(s.sx, s.sy)
      let left = 0
      geo().bridges.forEach((b, i) => {
        if (s.snapped[i]) return
        const d = Math.abs(b.mid - s.hingeV)
        if (2 * d * Math.sin(s.theta / 2) + slack > stretch() || s.theta >= limit) {
          s.snapped[i] = true
          s.snapAt[i] = now
          s.bv -= 560 / geo().bridges.length
        } else left += 1
      })
      if (left === 0) {
        s.phase = 'free'
        s.bv -= 150
      }
    } else if (s.phase === 'free') {
      const cos = Math.cos(s.theta * s.sign)
      const sin = Math.sin(s.theta * s.sign)
      const gx = s.grab.x - s.hinge.x
      const gy = s.grab.y - s.hinge.y
      const wx = s.point.x - s.hinge.x - (gx * cos - gy * sin)
      const wy = s.point.y - s.hinge.y - (gx * sin + gy * cos)
      s.sx += (wx - s.sx) * (1 - Math.exp(-dt / 0.045))
      s.sy += (wy - s.sy) * (1 - Math.exp(-dt / 0.045))
      const hang = limit * 0.55 + clamp(s.pvx * 0.0009 * s.sign, -0.3, 0.3)
      s.theta += (hang - s.theta) * (1 - Math.exp(-dt / 0.12))
    } else if (s.phase === 'drop') {
      s.age += dt
      s.vy += GRAVITY * dt
      s.sx += s.vx * dt
      s.sy += s.vy * dt
      s.theta += s.spin * dt
      if (s.age > 0.16) s.fade = clamp(1 - (s.age - 0.16) / 0.42, 0, 1)
      if (s.fade <= 0) {
        s.phase = 'idle'
        finish()
      }
    } else if (s.phase === 'return') {
      s.thetaV += (-300 * s.theta - 24 * s.thetaV) * dt
      s.theta += s.thetaV * dt
      s.sx += (0 - s.sx) * (1 - Math.exp(-dt / 0.07))
      s.sy += (0 - s.sy) * (1 - Math.exp(-dt / 0.07))
      if (
        Math.abs(s.theta) < 0.0008 &&
        Math.abs(s.thetaV) < 0.01 &&
        Math.hypot(s.sx, s.sy) < 0.05
      ) {
        s.theta = 0
        s.thetaV = 0
        s.sx = 0
        s.sy = 0
        s.phase = 'idle'
      }
    }
    s.bv += (-520 * s.bx - 30 * s.bv) * dt
    s.bx += s.bv * dt
    const busy = paint(now)
    const moving = Math.abs(s.bx) > 0.02 || Math.abs(s.bv) > 0.5
    if (s.phase !== 'idle' || moving || busy) s.raf = requestAnimationFrame(step)
    else {
      s.bx = 0
      s.bv = 0
      paint(now)
      s.raf = 0
    }
  }
  const run = () => {
    const s = sim
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(step)
  }

  const reset = () => {
    const s = sim
    cancelAnimationFrame(s.raf)
    Object.assign(s, {
      raf: 0,
      phase: 'idle',
      id: null,
      theta: 0,
      thetaV: 0,
      sx: 0,
      sy: 0,
      fade: 1,
      age: 0,
      bx: 0,
      bv: 0,
    })
    s.snapped = []
    s.snapAt = []
    s.span = []
    if (stubEl) stubEl.style.visibility = ''
    paint(performance.now())
  }

  createEffect(() => {
    const isUsed = used()
    untrack(() => {
      if (isUsed) {
        if (sim.phase === 'idle' && stubEl) stubEl.style.visibility = 'hidden'
        return
      }
      setInstant(false)
      reset()
    })
  })
  createEffect(() => {
    geo()
    untrack(reset)
  })
  onCleanup(() => cancelAnimationFrame(sim.raf))

  const local = (e: PointerEvent): Point => {
    const stage = stageEl
    if (!stage) return { x: 0, y: 0 }
    const r = stage.getBoundingClientRect()
    const k = r.width / width() || 1
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }
  }
  const tearNow = () => {
    const s = sim
    cancelAnimationFrame(s.raf)
    s.raf = 0
    s.phase = 'idle'
    setInstant(true)
    finish()
  }
  const onStubDown = (e: PointerEvent) => {
    const s = sim
    const g = geo()
    if (
      (props.disabled ?? false) ||
      used() ||
      e.button !== 0 ||
      s.id !== null ||
      s.phase === 'drop'
    )
      return
    try {
      ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    } catch {}
    const p = local(e)
    s.id = e.pointerId
    s.start = p
    s.point = p
    s.pt = performance.now()
    s.pvx = 0
    s.pvy = 0
    if (s.theta < 0.01) {
      const far = (g.vertical ? p.x : p.y) < g.cross / 2
      const end = g.ends[far ? 1 : 0]
      s.sign = (far ? 1 : -1) * (g.vertical ? -1 : 1)
      s.hinge = { x: end.x, y: end.y }
      s.hingeV = end.v
      if (stubEl) stubEl.style.transformOrigin = `${s.hinge.x}px ${s.hinge.y}px`
    }
    const cos = Math.cos(-s.theta * s.sign)
    const sin = Math.sin(-s.theta * s.sign)
    const ux = p.x - s.sx - s.hinge.x
    const uy = p.y - s.sy - s.hinge.y
    s.grab = { x: s.hinge.x + ux * cos - uy * sin, y: s.hinge.y + ux * sin + uy * cos }
    s.a0 = Math.atan2(s.grab.y - s.hinge.y, s.grab.x - s.hinge.x) - (s.theta * s.sign) / 0.92
    s.phase = 'held'
    s.thetaV = 0
    tiltSrcX.jump(0)
    tiltSrcY.jump(0)
    tiltX.jump(0)
    tiltY.jump(0)
    setGrabbing(true)
    run()
  }
  const onStubMove = (e: PointerEvent) => {
    const s = sim
    if (s.id !== e.pointerId) return
    const p = local(e)
    const now = performance.now()
    const dt = Math.max(0.004, (now - s.pt) / 1000)
    s.pvx += ((p.x - s.point.x) / dt - s.pvx) * 0.35
    s.pvy += ((p.y - s.point.y) / dt - s.pvy) * 0.35
    s.pt = now
    s.point = p
    if (reduce() && Math.hypot(p.x - s.start.x, p.y - s.start.y) > 28) {
      s.id = null
      setGrabbing(false)
      tearNow()
    }
  }
  const onStubUp = (e: PointerEvent) => {
    const s = sim
    if (s.id !== e.pointerId) return
    s.id = null
    try {
      if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId))
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
    } catch {}
    setGrabbing(false)
    if (s.phase === 'free') {
      const still = performance.now() - s.pt > 80
      s.vx = still ? 0 : clamp(s.pvx, -1600, 1600)
      s.vy = still ? 0 : clamp(s.pvy, -1600, 1200)
      s.spin = clamp(s.vx * 0.004, -6, 6) + 1.2 * s.sign
      s.age = 0
      s.phase = 'drop'
    } else if (s.phase === 'held') {
      s.phase = 'return'
    }
    run()
  }
  const onStubKey = (e: KeyboardEvent) => {
    if ((props.disabled ?? false) || used() || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    if (!e.repeat) tearNow()
  }

  createEffect(() => {
    if (!((props.tilt ?? true) && !reduce() && !(props.disabled ?? false))) return
    const tiltMax = props.tiltMax ?? 9
    const tiltReach = props.tiltReach ?? 260
    const move = (e: PointerEvent) => {
      const el = rootEl
      if (!el || e.pointerType === 'touch' || sim.id !== null) return
      const r = el.getBoundingClientRect()
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2 + tiltReach), -1, 1)
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2 + tiltReach), -1, 1)
      tiltSrcY.set(nx * tiltMax)
      tiltSrcX.set(-ny * tiltMax)
    }
    window.addEventListener('pointermove', move)
    onCleanup(() => window.removeEventListener('pointermove', move))
  })

  return (
    <div
      ref={el => {
        rootEl = el
      }}
      class={`group relative select-none [width:min(var(--tt-w),100%)] [color:var(--tt-ink)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[disabled]:opacity-60${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-used={used() ? '' : undefined}
      data-orientation={props.orientation ?? 'horizontal'}
      data-shift={used() && (props.recenter ?? true) ? (vertical() ? 'y' : 'x') : undefined}
      data-instant={instant() ? '' : undefined}
      data-grabbing={grabbing() ? '' : undefined}
      data-disabled={(props.disabled ?? false) ? '' : undefined}
      style={{
        '--tt-w': `${width()}px`,
        '--tt-h': `${height()}px`,
        '--tt-stub': `${stubSize()}px`,
        '--tt-bg': props.background ?? '#27272a',
        '--tt-stub-bg': props.stubBackground || (props.background ?? '#27272a'),
        '--tt-ink': props.color ?? '#f5f5f5',
        '--tt-edge':
          props.borderColor || `color-mix(in srgb, ${props.color ?? '#f5f5f5'} 16%, transparent)`,
        '--tt-edge-w': props.borderWidth ?? 1,
        '--tt-parallax': `${props.parallax ?? 6}px`,
        '--tt-body-w': `${vertical() ? width() : width() - stubSize()}px`,
        '--tt-body-h': `${vertical() ? height() - stubSize() : height()}px`,
        '--tt-inset': `${ART_INSET}px`,
        '--tt-span': ART_SPAN,
        '--tt-art-radius': `${props.imageRadius ?? 8}px`,
        '--tt-fit': _fit(),
        height: `${height() * _fit()}px`,
      }}
    >
      <div
        ref={el => {
          stageEl = el
        }}
        class="absolute top-0 left-0 origin-top-left [width:var(--tt-w)] [height:var(--tt-h)] [transform:scale(var(--tt-fit))] [transition:transform_650ms_cubic-bezier(0.22,1,0.36,1)] group-data-[shift=x]:[transform:translateX(calc(var(--tt-stub)*var(--tt-fit)/2))_scale(var(--tt-fit))] group-data-[shift=y]:[transform:translateY(calc(var(--tt-stub)*var(--tt-fit)/2))_scale(var(--tt-fit))] group-data-[instant]:[transition-duration:0ms] motion-reduce:[transition:none]"
      >
        <div
          ref={el => {
            planeEl = el
          }}
          class="absolute inset-0"
        >
          <div
            ref={el => {
              bodyEl = el
            }}
            class="pointer-events-none absolute inset-0"
          >
            {(props.border ?? true) ? (
              <svg
                class="pointer-events-none absolute inset-0 h-full w-full overflow-visible [&>path]:fill-none [&>path]:[stroke:var(--tt-edge)] [&>path]:[stroke-width:var(--tt-edge-w)]"
                viewBox={`0 0 ${width()} ${height()}`}
                aria-hidden="true"
              >
                <path d={geo().bodyOutline} />
              </svg>
            ) : null}
            <div
              class="pointer-events-auto absolute inset-0 [background:var(--tt-bg)]"
              style={{ 'clip-path': `path('${geo().body}')` }}
            >
              {props.image ? (
                <div class="absolute overflow-hidden [top:var(--tt-inset)] [left:var(--tt-inset)] [width:calc(var(--tt-body-w)_-_var(--tt-inset)*2)] [height:calc(var(--tt-body-h)*var(--tt-span)_-_var(--tt-inset)*2)] [border-radius:var(--tt-art-radius)]">
                  <img
                    ref={el => {
                      artEl = el
                    }}
                    class="absolute max-w-none object-cover [top:calc(var(--tt-parallax)*-1)] [left:calc(var(--tt-parallax)*-1)] [width:calc(100%_+_var(--tt-parallax)*2)] [height:calc(100%_+_var(--tt-parallax)*2)] [-webkit-user-drag:none] [transition:filter_700ms_ease] group-data-[used]:[filter:grayscale(1)_brightness(0.75)] group-data-[instant]:[transition-duration:0ms]"
                    src={props.image}
                    alt={props.imageAlt ?? ''}
                    draggable={false}
                  />
                  {(props.scrim ?? true) ? (
                    <div class="absolute inset-0 [background:linear-gradient(to_top,var(--tt-bg)_0%,color-mix(in_srgb,var(--tt-bg)_72%,transparent)_30%,color-mix(in_srgb,var(--tt-bg)_18%,transparent)_58%,transparent_80%)]" />
                  ) : null}
                </div>
              ) : null}
              <div
                ref={el => {
                  inkEl = el
                }}
                class="absolute inset-y-0 left-0 [width:calc(var(--tt-w)_-_var(--tt-stub))] [transition:opacity_500ms_ease] group-data-[used]:opacity-55 group-data-[instant]:[transition-duration:0ms] group-data-[orientation=vertical]:bottom-auto group-data-[orientation=vertical]:w-full group-data-[orientation=vertical]:[height:calc(var(--tt-h)_-_var(--tt-stub))]"
              >
                {props.children}
              </div>
            </div>
          </div>
          <svg
            class="pointer-events-none absolute inset-0 h-full w-full overflow-visible [&_path]:fill-none [&_path]:opacity-0 [&_path]:[stroke:var(--tt-bg)] [&_path]:[stroke-linecap:round]"
            aria-hidden="true"
          >
            <Index each={geo().bridges}>
              {(_, i) => (
                <g>
                  <path
                    ref={el => {
                      fibres[i * 2] = el
                    }}
                  />
                  <path
                    ref={el => {
                      fibres[i * 2 + 1] = el
                    }}
                  />
                </g>
              )}
            </Index>
          </svg>
          <div
            ref={el => {
              stubEl = el
            }}
            class="pointer-events-none absolute inset-0 outline-none will-change-transform"
            role="button"
            tabIndex={(props.disabled ?? false) || used() ? -1 : 0}
            aria-label={props.ariaLabel ?? 'Tear off the stub'}
            aria-hidden={used() || undefined}
            aria-disabled={(props.disabled ?? false) || undefined}
            onPointerDown={onStubDown}
            onPointerMove={onStubMove}
            onPointerUp={onStubUp}
            onPointerCancel={onStubUp}
            onLostPointerCapture={onStubUp}
            onKeyDown={onStubKey}
            onDragStart={(e: DragEvent) => e.preventDefault()}
          >
            {(props.border ?? true) ? (
              <svg
                class="pointer-events-none absolute inset-0 h-full w-full overflow-visible [&>path]:fill-none [&>path]:[stroke:var(--tt-edge)] [&>path]:[stroke-width:var(--tt-edge-w)]"
                viewBox={`0 0 ${width()} ${height()}`}
                aria-hidden="true"
              >
                <path d={geo().stubOutline} />
              </svg>
            ) : null}
            <div
              class="pointer-events-auto absolute inset-0 cursor-grab touch-none [background:var(--tt-stub-bg)] group-data-[grabbing]:cursor-grabbing group-data-[disabled]:cursor-default"
              style={{ 'clip-path': `path('${geo().stub}')` }}
            >
              <div class="absolute inset-y-0 right-0 [width:var(--tt-stub)] group-data-[orientation=vertical]:top-auto group-data-[orientation=vertical]:left-0 group-data-[orientation=vertical]:w-auto group-data-[orientation=vertical]:[height:var(--tt-stub)]">
                {props.stub}
              </div>
            </div>
          </div>
        </div>
      </div>
      <span
        class="absolute h-px w-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]"
        role="status"
      >
        {used() ? 'Used' : ''}
      </span>
    </div>
  )
}

export default TearTicket
