import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import Matter from 'matter-js'
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

const { Bodies, Body, Composite, Engine } = Matter

export type FolderFloatItem = string | { label: string; value: string }
export type FolderFloatTrigger = 'hover' | 'click'

export interface FolderFloatProps {
  items?: FolderFloatItem[]
  label?: string
  sublabel?: string
  trigger?: FolderFloatTrigger
  defaultOpen?: boolean
  closeOnSelect?: boolean
  physics?: boolean
  drift?: number
  onSelect?: (value: string, index: number) => void
  onOpenChange?: (open: boolean) => void
  folderColor?: string
  frontColor?: string
  paperColor?: string
  itemColor?: string
  itemTextColor?: string
  labelColor?: string
  width?: number
  height?: number
  radius?: number
  spread?: number
  lift?: number
  tilt?: number
  flapAngle?: number
  restAngle?: number
  openDuration?: number
  stagger?: number
  bounce?: number
  className?: string
  class?: string
}

type Entry = { label: string; value: string }
type Size = { w: number; h: number }
type Zone = { left: number; right: number; top: number; bottom: number }
type Drag = {
  i: number
  id: number
  dx: number
  dy: number
  sx: number
  sy: number
  moved: boolean
}
interface World {
  engine: Matter.Engine | null
  bodies: Matter.Body[]
  sizes: Size[]
  raf: number
  last: number
  t0: number
  drag: Drag | null
  zone: Zone | null
  live: boolean
}

const DEFAULT_ITEMS: FolderFloatItem[] = [
  'Try a warmer palette',
  'Tighten the spacing',
  'Logo feels small',
  'Love the new hero',
]
const PAD = 28
const CHAR = 6.8
const GAP = 12
const ROW = 52
const DRAG_MIN = 4
const ZONE_PAD = 8

const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

const layout = (
  list: Entry[],
  spread: number,
  lift: number,
  tilt: number,
  sizes: (Size | null)[],
) => {
  const rows: { items: { i: number; pw: number }[]; width: number }[] = []
  let row: { i: number; pw: number }[] = []
  let width = 0
  list.forEach((item, i) => {
    const pw = sizes[i]?.w ?? PAD + item.label.length * CHAR
    if (row.length && width + GAP + pw > spread * 2) {
      rows.push({ items: row, width })
      row = []
      width = 0
    }
    row.push({ i, pw })
    width += (row.length > 1 ? GAP : 0) + pw
  })
  if (row.length) rows.push({ items: row, width })
  const pos: { x: number; y: number; r: number }[] = []
  rows.forEach((r, ri) => {
    let x = -r.width / 2
    const shift = (ri % 2 ? 1 : -1) * Math.min(16, spread * 0.1)
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i)
      pos[i] = {
        x: x + pw / 2 + shift + (j - 0.5) * 6,
        y: -lift - ri * ROW - j * 6,
        r: tilt * (j * 2 - 1),
      }
      x += pw + GAP
    })
  })
  return pos
}

const STYLE = `
@keyframes folder-float-drift { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
@keyframes folder-float-pop { 30% { scale: 1.1; } 100% { scale: 1; } }
`

const FolderFloat = (props: FolderFloatProps) => {
  const trigger = () => props.trigger ?? 'hover'
  const physics = () => props.physics ?? true
  const drift = () => props.drift ?? 0.5
  const spread = () => props.spread ?? 180
  const lift = () => props.lift ?? 26
  const tilt = () => props.tilt ?? 8
  const bounce = () => props.bounce ?? 0.3

  const [open, setOpen] = createSignal(props.defaultOpen ?? false)
  const [popped, setPopped] = createSignal(-1)
  const [live, setLive] = createSignal(false)
  const [sizes, setSizes] = createSignal<Size[]>([])
  const reduce = usePrefersReducedMotion()

  let anchorEl!: HTMLDivElement
  const pills: (HTMLButtonElement | null)[] = []
  const world: World = {
    engine: null,
    bodies: [],
    sizes: [],
    raf: 0,
    last: 0,
    t0: 0,
    drag: null,
    zone: null,
    live: false,
  }
  let popTimer: ReturnType<typeof setTimeout> | undefined
  let liveTimer: ReturnType<typeof setTimeout> | undefined

  const list = createMemo<Entry[]>(() =>
    (props.items ?? DEFAULT_ITEMS).map(item =>
      typeof item === 'string' ? { label: item, value: item } : item,
    ),
  )
  const n = () => list().length
  const sub = () => props.sublabel || `${n()} ${n() === 1 ? 'note' : 'notes'}`
  const pos = createMemo(() => layout(list(), spread(), lift(), tilt(), sizes()))

  // Upstream: layout effect on [n, labelsKey] — measure pill sizes (fonts may shift them).
  createEffect(() => {
    void n()
    void list()
      .map(item => item.label)
      .join('|')
    const measure = () => {
      const count = n()
      const next = pills
        .slice(0, count)
        .map(el => (el ? { w: el.offsetWidth, h: el.offsetHeight } : null))
      if (next.some(s => !s)) return
      const sized = next as Size[]
      setSizes(prev =>
        prev.length === sized.length &&
        prev.every((s, i) => s.w === sized[i].w && s.h === sized[i].h)
          ? prev
          : sized,
      )
    }
    measure()
    document.fonts?.ready.then(measure)
  })

  const stopPhysics = () => {
    const w = world
    clearTimeout(liveTimer)
    cancelAnimationFrame(w.raf)
    w.raf = 0
    if (w.engine) {
      w.bodies.forEach((b, i) => {
        const el = pills[i]
        if (!el) return
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`)
        el.style.setProperty('--y', `${(b.position.y - w.sizes[i].h / 2).toFixed(1)}px`)
      })
      Composite.clear(w.engine.world, false, true)
      Engine.clear(w.engine)
      w.engine = null
    }
    w.bodies = []
    w.drag = null
    w.live = false
    setLive(false)
  }

  const startPhysics = () => {
    const w = world
    if (w.engine) return
    const positions = pos()
    const count = n()
    const els = pills.slice(0, count)
    if (els.some(el => !el)) return
    const engine = Engine.create({ gravity: { x: 0, y: 0 } })
    engine.enableSleeping = false
    w.engine = engine
    w.sizes = (els as HTMLButtonElement[]).map(el => ({ w: el.offsetWidth, h: el.offsetHeight }))
    const ys = positions.map(p => p.y)
    const zone = {
      left: -spread() - ZONE_PAD,
      right: spread() + ZONE_PAD,
      top: Math.min(...ys) - ZONE_PAD,
      bottom: -lift() + Math.max(...w.sizes.map(s => s.h)),
    }
    w.zone = zone
    w.bodies = els.map((_el, i) => {
      const { w: bw, h: bh } = w.sizes[i]
      const b = Bodies.rectangle(positions[i].x, positions[i].y + bh / 2, bw, bh, {
        chamfer: { radius: Math.min(bh / 2 - 1, 16) },
        restitution: 0.55,
        friction: 0,
        frictionAir: 0.08,
        inertia: Infinity,
      })
      ;(b as Matter.Body & { plugin: { phase: number } }).plugin = {
        phase: jitter(i) * Math.PI * 2,
      }
      return b
    })
    const T = 80
    const walls = [
      Bodies.rectangle(
        (zone.left + zone.right) / 2,
        zone.top - T / 2,
        zone.right - zone.left + 2 * T,
        T,
        {
          isStatic: true,
        },
      ),
      Bodies.rectangle(
        (zone.left + zone.right) / 2,
        zone.bottom + T / 2,
        zone.right - zone.left + 2 * T,
        T,
        {
          isStatic: true,
        },
      ),
      Bodies.rectangle(
        zone.left - T / 2,
        (zone.top + zone.bottom) / 2,
        T,
        zone.bottom - zone.top + 2 * T,
        {
          isStatic: true,
        },
      ),
      Bodies.rectangle(
        zone.right + T / 2,
        (zone.top + zone.bottom) / 2,
        T,
        zone.bottom - zone.top + 2 * T,
        {
          isStatic: true,
        },
      ),
    ]
    Composite.add(engine.world, [...w.bodies, ...walls])
    w.live = true
    w.last = 0
    w.t0 = performance.now()
    setLive(true)
    const tick = (now: number) => {
      const s = world
      if (!s.engine) return
      const dt = s.last ? Math.min(32, now - s.last) : 16
      s.last = now
      const t = (now - s.t0) / 1000
      const k = drift() * 0.00005 * Math.min(1, t / 2)
      s.bodies.forEach((b, i) => {
        if (s.drag && s.drag.i === i) return
        const ph = (b as Matter.Body & { plugin: { phase: number } }).plugin.phase
        Body.applyForce(b, b.position, {
          x: Math.sin(t * 0.9 + ph) * k * b.mass,
          y: Math.cos(t * 1.3 + ph * 1.7) * k * b.mass,
        })
      })
      Engine.update(s.engine, dt)
      s.bodies.forEach((b, i) => {
        const el = pills[i]
        if (!el) return
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`)
        el.style.setProperty('--y', `${(b.position.y - s.sizes[i].h / 2).toFixed(1)}px`)
      })
      s.raf = requestAnimationFrame(tick)
    }
    w.raf = requestAnimationFrame(tick)
  }

  const set = (next: boolean) => {
    if (!next) stopPhysics()
    if (open() !== next) {
      setOpen(next)
      untrack(() => props.onOpenChange?.(next))
    }
  }

  // Upstream: effect on [open, physics, ...] — schedule live physics after the open animation.
  createEffect(() => {
    const openNow = open()
    const physicsNow = physics()
    const reducedNow = reduce()
    const openDur = props.openDuration ?? 520
    const stag = props.stagger ?? 45
    const count = n()
    void pos()
    clearTimeout(liveTimer)
    if (!openNow || !physicsNow || reducedNow) {
      if (!openNow || !physicsNow) stopPhysics()
      return
    }
    liveTimer = setTimeout(startPhysics, openDur + (count - 1) * stag + 80)
    onCleanup(() => clearTimeout(liveTimer))
  })

  onMount(() => {
    onCleanup(() => {
      clearTimeout(popTimer)
      stopPhysics()
    })
  })

  const pick = (item: Entry, i: number) => {
    untrack(() => props.onSelect?.(item.value, i))
    clearTimeout(popTimer)
    setPopped(i)
    popTimer = setTimeout(() => setPopped(-1), 320)
    if (props.closeOnSelect ?? true) set(false)
  }

  const pointerAt = (e: PointerEvent) => {
    if (!anchorEl) return { x: 0, y: 0 }
    const r = anchorEl.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: PointerEvent, i: number) => {
    const w = world
    if (!w.live || e.button !== 0) return
    const b = w.bodies[i]
    if (!b) return
    const el = e.currentTarget as HTMLButtonElement
    const p = pointerAt(e)
    w.drag = {
      i,
      id: e.pointerId,
      dx: b.position.x - p.x,
      dy: b.position.y - p.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
  }
  const move = (e: PointerEvent, i: number) => {
    const w = world
    const d = w.drag
    if (!d || d.i !== i || d.id !== e.pointerId) return
    const el = e.currentTarget as HTMLButtonElement
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_MIN) {
      d.moved = true
      el.setAttribute('data-drag', '')
    }
    if (!d.moved) return
    const b = w.bodies[i]
    const { w: bw, h: bh } = w.sizes[i]
    const z = w.zone as Zone
    const p = pointerAt(e)
    const x = Math.min(z.right - bw / 2, Math.max(z.left + bw / 2, p.x + d.dx))
    const y = Math.min(z.bottom - bh / 2, Math.max(z.top + bh / 2, p.y + d.dy))
    Body.setVelocity(b, { x: (x - b.position.x) * 0.6, y: (y - b.position.y) * 0.6 })
    Body.setPosition(b, { x, y })
  }
  const up = (e: PointerEvent, i: number, item: Entry) => {
    const w = world
    const d = w.drag
    if (!d || d.i !== i || d.id !== e.pointerId) return
    w.drag = null
    const el = e.currentTarget as HTMLButtonElement
    el.removeAttribute('data-drag')
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {}
    if (!d.moved && e.type === 'pointerup') pick(item, i)
  }

  const hover = () => trigger() === 'hover'

  return (
    <div
      class={`group relative inline-block text-[13px] leading-none font-medium [width:var(--ff-w)] [padding-top:var(--ff-tab)] [font-family:inherit]${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-open={open() ? '' : undefined}
      data-live={live() ? '' : undefined}
      data-physics={physics() ? '' : undefined}
      data-trigger={trigger()}
      onPointerEnter={hover() ? () => set(true) : undefined}
      onPointerLeave={
        hover()
          ? () => {
              if (!world.drag) set(false)
            }
          : undefined
      }
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Escape' && open()) {
          e.stopPropagation()
          set(false)
        }
      }}
      style={{
        '--ff-w': `${props.width ?? 200}px`,
        '--ff-h': `${props.height ?? 148}px`,
        '--ff-r': `${props.radius ?? 14}px`,
        '--ff-back': props.folderColor ?? '#3f3f46',
        '--ff-front': props.frontColor ?? '#52525b',
        '--ff-paper': props.paperColor ?? '#f5f5f5',
        '--ff-item': props.itemColor ?? '#f5f5f5',
        '--ff-item-ink': props.itemTextColor ?? '#18181b',
        '--ff-label': props.labelColor ?? '#f5f5f5',
        '--ff-spread': `${spread()}px`,
        '--ff-lift': `${lift()}px`,
        '--ff-angle': `${props.flapAngle ?? 34}deg`,
        '--ff-rest': `${props.restAngle ?? 16}deg`,
        '--ff-open': `${props.openDuration ?? 520}ms`,
        '--ff-close': `${Math.round((props.openDuration ?? 520) * 0.6)}ms`,
        '--ff-stagger': `${props.stagger ?? 45}ms`,
        '--ff-n': n(),
        '--ff-tab': '14px',
        '--ff-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        '--ff-spring': `cubic-bezier(0.34, ${(1 + bounce() * 1.9).toFixed(2)}, 0.64, 1)`,
      }}
    >
      <style>{STYLE}</style>
      <div
        ref={anchorEl}
        class="absolute top-[var(--ff-tab)] left-1/2 z-[1] h-0 w-0 group-data-[open]:before:absolute group-data-[open]:before:top-[calc(-1*(var(--ff-lift)+120px))] group-data-[open]:before:left-[calc(-1*(var(--ff-spread)+100px))] group-data-[open]:before:h-[calc(var(--ff-lift)+120px)] group-data-[open]:before:w-[calc(2*var(--ff-spread)+200px)] group-data-[open]:before:content-['']"
      >
        <For each={list()}>
          {(item, i) => {
            const p = () => pos()[i()]
            return (
              <button
                ref={(el: HTMLButtonElement) => {
                  pills[i()] = el
                }}
                type="button"
                class="pointer-events-none absolute top-0 left-1/2 m-0 h-[34px] cursor-pointer rounded-[17px] border-0 px-3.5 whitespace-nowrap opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.14)] outline-none [background:var(--ff-item)] [color:var(--ff-item-ink)] [font:inherit] [transform:translate(-50%,44px)_scale(0.6)] [transform-origin:50%_50%] [-webkit-tap-highlight-color:transparent] [transition:transform_var(--ff-close)_var(--ff-ease-out)_calc((var(--ff-n)-1-var(--i))*var(--ff-stagger)*0.5),opacity_160ms_ease_calc((var(--ff-n)-1-var(--i))*var(--ff-stagger)*0.5+var(--ff-close)*0.45),scale_160ms_var(--ff-ease-out)] group-data-[open]:pointer-events-auto group-data-[open]:opacity-100 group-data-[open]:[transform:translate(calc(-50%+var(--x)),var(--y))_rotate(var(--r))_scale(1)] group-data-[open]:[transition:transform_var(--ff-open)_var(--ff-spring)_calc(var(--i)*var(--ff-stagger)),opacity_160ms_ease_calc(var(--i)*var(--ff-stagger)),scale_160ms_var(--ff-ease-out)] group-data-[live]:cursor-grab group-data-[live]:[transition:scale_160ms_var(--ff-ease-out)] data-[drag]:cursor-grabbing! group-data-[open]:hover:[scale:1.05] group-data-[open]:active:[scale:0.97] data-[pop]:[animation:folder-float-pop_320ms_var(--ff-ease-out)] motion-reduce:[transition:opacity_200ms_ease] motion-reduce:group-data-[open]:[transition:opacity_200ms_ease_calc(var(--i)*var(--ff-stagger))]"
                tabIndex={open() ? 0 : -1}
                aria-hidden={!open()}
                data-pop={popped() === i() ? '' : undefined}
                style={{
                  '--i': i(),
                  '--x': `${p().x.toFixed(1)}px`,
                  '--y': `${p().y.toFixed(1)}px`,
                  '--r': `${p().r.toFixed(2)}deg`,
                }}
                onPointerDown={(e: PointerEvent) => down(e, i())}
                onPointerMove={(e: PointerEvent) => move(e, i())}
                onPointerUp={(e: PointerEvent) => up(e, i(), item)}
                onPointerCancel={(e: PointerEvent) => up(e, i(), item)}
                onClick={(e: MouseEvent) => {
                  if (!world.live || e.detail === 0) pick(item, i())
                }}
              >
                <span class="block [animation:folder-float-drift_3.2s_ease-in-out_infinite] [animation-delay:calc(var(--i)*-0.7s)] [animation-play-state:paused] group-data-[open]:[animation-play-state:running] group-data-[physics]:[animation:none] group-data-[live]:[animation:none] motion-reduce:[animation:none]">
                  {item.label}
                </span>
              </button>
            )
          }}
        </For>
      </div>
      <div class="relative [width:var(--ff-w)] [height:var(--ff-h)]">
        <span
          class="absolute inset-0 z-0 [border-radius:var(--ff-r)] [background:var(--ff-back)] [transform:perspective(600px)_rotateX(8deg)] [transform-origin:50%_100%] before:absolute before:top-[calc(-1*var(--ff-tab))] before:left-0 before:h-[calc(var(--ff-tab)+var(--ff-r))] before:w-[42%] before:[border-radius:var(--ff-r)_var(--ff-r)_0_0] before:[background:inherit] before:content-['']"
          aria-hidden="true"
        />
        <span
          class="absolute top-[10%] right-[8%] left-[8%] z-[1] h-1/2 rounded-md opacity-0 [background:var(--ff-paper)] [transform:translateY(10px)] [transition:transform_var(--ff-close)_var(--ff-ease-out),opacity_var(--ff-close)_ease] group-data-[open]:opacity-100 group-data-[open]:[transform:translateY(0)] group-data-[open]:[transition:transform_var(--ff-open)_var(--ff-ease-out),opacity_200ms_ease] motion-reduce:[transform:none]! motion-reduce:[transition:opacity_200ms_ease]"
          aria-hidden="true"
        />
        <span
          class="absolute right-0 bottom-0 left-0 z-[2] box-border flex h-[76%] flex-col justify-end gap-[5px] px-4 py-3.5 [border-radius:var(--ff-r)] [background:linear-gradient(180deg,color-mix(in_srgb,var(--ff-front)_92%,#fff),var(--ff-front)_60%)] [color:var(--ff-label)] shadow-[0_-10px_24px_rgba(0,0,0,0.28)] [transform:perspective(600px)_rotateX(calc(-1*var(--ff-rest)))] [transform-origin:50%_100%] [transition:transform_var(--ff-open)_var(--ff-ease-out)] group-data-[open]:[transform:perspective(600px)_rotateX(calc(-1*var(--ff-angle)))] motion-reduce:group-data-[open]:[transform:perspective(600px)_rotateX(calc(-1*var(--ff-rest)))] motion-reduce:[transition:opacity_200ms_ease]"
          aria-hidden="true"
        >
          <span class="text-[13px] font-medium">{props.label ?? 'Design feedback'}</span>
          <span class="text-[11px] opacity-55">{sub()}</span>
        </span>
        <button
          type="button"
          class="absolute right-0 bottom-0 left-0 z-[3] m-0 h-[76%] cursor-pointer border-0 bg-transparent p-0 outline-none [border-radius:var(--ff-r)] [-webkit-tap-highlight-color:transparent]"
          aria-expanded={open()}
          aria-label={`${props.label ?? 'Design feedback'}, ${sub()}`}
          onClick={() => set(!open())}
        />
      </div>
    </div>
  )
}

export default FolderFloat
