import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'

export interface PixelSwapProps {
  firstContent?: JSX.Element
  secondContent?: JSX.Element
  pattern?:
    | 'pointer'
    | 'random'
    | 'center'
    | 'edges'
    | 'left-to-right'
    | 'right-to-left'
    | 'top-to-bottom'
    | 'bottom-to-top'
    | 'diagonal'
    | 'spiral'
  pixelSize?: number
  gap?: number
  pixelRadius?: number
  pixelScale?: number
  pixelSpin?: number
  duration?: number
  pixelDuration?: number
  randomness?: number
  bounce?: number
  trigger?: 'hover' | 'click' | 'none'
  intro?: boolean
  initialActive?: boolean
  active?: boolean
  onActiveChange?: (active: boolean) => void
  onComplete?: (active: boolean) => void
  aspectRatio?: string
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

interface Point {
  x: number
  y: number
}

interface Grid {
  count: number
  size: number
  stride: number
  gap: number
  width: number
  height: number
  cx: Float32Array
  cy: Float32Array
  gx: Float32Array
  gy: Float32Array
}

interface Engine {
  mode: 'intro' | 'swap'
  grid: Grid
  value: Float32Array
  velocity: Float32Array
  flipAt: Float64Array
  target: Uint8Array
  desired: number
  last: number
  running: boolean
  raf: number
}

interface Settings {
  pattern: string
  pixelSize: number
  gap: number
  pixelRadius: number
  pixelScale: number
  pixelSpin: number
  duration: number
  pixelDuration: number
  randomness: number
  bounce: number
  onComplete?: (active: boolean) => void
}

const MAX_PIXELS = 600
const STEP = 1 / 240
const PATTERNS = [
  'pointer',
  'random',
  'center',
  'edges',
  'left-to-right',
  'right-to-left',
  'top-to-bottom',
  'bottom-to-top',
  'diagonal',
  'spiral',
]

const ROOT =
  'relative isolate w-full overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-current'
const LAYER = 'absolute inset-0 h-full w-full data-[visible=false]:invisible'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const hash = (index: number) => {
  let h = Math.imul(index + 1, 0x27d4eb2d)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const round = (value: number) => Math.round(value * 10) / 10

const buildGrid = (width: number, height: number, pixelSize: number, gap: number): Grid => {
  let size = pixelSize
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)))
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)))
  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS))
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)))
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)))
  }
  const stride = size + gap
  const startX = (width - (columns * stride - gap)) / 2
  const startY = (height - (rows * stride - gap)) / 2
  const count = columns * rows
  const cx = new Float32Array(count)
  const cy = new Float32Array(count)
  const gx = new Float32Array(count)
  const gy = new Float32Array(count)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column
      cx[index] = startX + column * stride + size / 2
      cy[index] = startY + row * stride + size / 2
      gx[index] = columns > 1 ? column / (columns - 1) : 0.5
      gy[index] = rows > 1 ? row / (rows - 1) : 0.5
    }
  }
  return { count, size, stride, gap, width, height, cx, cy, gx, gy }
}

const orderOf = (grid: Grid, index: number, pattern: string, point: Point | null) => {
  const x = grid.gx[index]
  const y = grid.gy[index]
  if (pattern === 'random') return hash(index + 11)
  if (pattern === 'center') return Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2
  if (pattern === 'edges') return 1 - Math.min(x, 1 - x, y, 1 - y) * 2
  if (pattern === 'left-to-right') return x
  if (pattern === 'right-to-left') return 1 - x
  if (pattern === 'top-to-bottom') return y
  if (pattern === 'bottom-to-top') return 1 - y
  if (pattern === 'diagonal') return (x + y) / 2
  if (pattern === 'spiral') {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2)
    return (angle + Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2) / 2
  }
  const px = point ? point.x : grid.width / 2
  const py = point ? point.y : grid.height / 2
  const reach = Math.max(
    Math.hypot(px, py),
    Math.hypot(grid.width - px, py),
    Math.hypot(px, grid.height - py),
    Math.hypot(grid.width - px, grid.height - py),
    1,
  )
  return Math.hypot(grid.cx[index] - px, grid.cy[index] - py) / reach
}

const pixelPath = (x: number, y: number, half: number, radius: number, angle: number) => {
  if (!angle) {
    const x0 = round(x - half)
    const x1 = round(x + half)
    const y0 = round(y - half)
    const y1 = round(y + half)
    if (radius < 0.2) return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`
    const r = round(radius)
    return `M${round(x0 + r)} ${y0}H${round(x1 - r)}A${r} ${r} 0 0 1 ${x1} ${round(y0 + r)}V${round(y1 - r)}A${r} ${r} 0 0 1 ${round(x1 - r)} ${y1}H${round(x0 + r)}A${r} ${r} 0 0 1 ${x0} ${round(y1 - r)}V${round(y0 + r)}A${r} ${r} 0 0 1 ${round(x0 + r)} ${y0}Z`
  }
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const at = (u: number, v: number) =>
    `${round(x + u * cos - v * sin)} ${round(y + u * sin + v * cos)}`
  const h = half
  if (radius < 0.2) return `M${at(-h, -h)}L${at(h, -h)}L${at(h, h)}L${at(-h, h)}Z`
  const r = round(radius)
  const k = h - radius
  return `M${at(-k, -h)}L${at(k, -h)}A${r} ${r} 0 0 1 ${at(h, -k)}L${at(h, k)}A${r} ${r} 0 0 1 ${at(k, h)}L${at(-k, h)}A${r} ${r} 0 0 1 ${at(-h, k)}L${at(-h, -k)}A${r} ${r} 0 0 1 ${at(-k, -h)}Z`
}

const PixelSwap = (props: PixelSwapProps) => {
  const controlled = props.active !== undefined
  const [shown, setShown] = createSignal(
    controlled ? (props.active ?? false) : (props.initialActive ?? false),
  )
  let root!: HTMLDivElement
  const layers: (HTMLDivElement | null)[] = [null, null]
  let shownValue = shown()
  let desiredValue = shown()
  let pointValue: Point | null = null
  let engine: Engine | null = null
  let waiting = false

  const settingsRef: { current: Settings } = { current: {} as Settings }
  // Upstream rebuilt the settings object every render; this tracked effect has
  // the same shape — the engine reads settingsRef.current at frame time.
  createEffect(() => {
    const pattern = props.pattern ?? 'pointer'
    settingsRef.current = {
      pattern: PATTERNS.includes(pattern) ? pattern : 'pointer',
      pixelSize: Math.max(8, Math.round(props.pixelSize ?? 48)),
      gap: Math.max(0, props.gap ?? 0),
      pixelRadius: clamp(props.pixelRadius ?? 0, 0, 50),
      pixelScale: clamp(props.pixelScale ?? 0, 0, 0.9),
      pixelSpin: (clamp(props.pixelSpin ?? 0, -360, 360) * Math.PI) / 180,
      duration: Math.max(0, props.duration ?? 400),
      pixelDuration: Math.max(60, props.pixelDuration ?? 350),
      randomness: clamp(props.randomness ?? 0.2, 0, 1),
      bounce: clamp(props.bounce ?? 0.3, 0, 1),
      onComplete: props.onComplete,
    }
  })

  const setLayer = (index: number, visible: boolean, clip: string) => {
    const layer = layers[index]
    if (!layer) return
    layer.setAttribute('data-visible', String(visible))
    layer.style.clipPath = clip || ''
  }

  const finish = () => {
    if (!engine) return
    engine.running = false
    root?.removeAttribute('data-swapping')
    if (engine.mode === 'intro') {
      setLayer(0, !shownValue, '')
      engine.mode = 'swap'
      if (desiredValue !== shownValue) request(desiredValue, pointValue)
      return
    }
    const target = engine.desired === 1
    setLayer(1, target, '')
    setLayer(0, !target, '')
    shownValue = target
    setShown(target)
    settingsRef.current.onComplete?.(target)
  }

  const frame = (now: number) => {
    if (!engine) return
    const s = settingsRef.current
    const grid = engine.grid
    const { value, velocity, flipAt, target } = engine
    const elapsed = clamp((now - engine.last) / 1000, 0, 1 / 20)
    engine.last = now
    const omega = (Math.PI * 2) / (s.pixelDuration / 1000)
    const zeta = clamp(1 - s.bounce, 0.15, 1)
    const steps = Math.max(1, Math.ceil(elapsed / STEP))
    const dt = elapsed / steps
    const pop = s.pixelScale
    const half = grid.size / 2
    const cover = grid.gap / 2 + 0.5
    let moving = false
    let path = ''

    for (let i = 0; i < grid.count; i++) {
      if (now >= flipAt[i] && target[i] !== engine.desired) {
        target[i] = engine.desired
        if (target[i] === 1 && value[i] < pop) value[i] = pop
      }
      let x = value[i]
      let v = velocity[i]
      const goal = target[i]
      for (let n = 0; n < steps; n++) {
        v += (-omega * omega * (x - goal) - 2 * zeta * omega * v) * dt
        x += v * dt
      }
      if (goal === 0 && x <= pop) {
        x = 0
        v = 0
      }
      if (Math.abs(x - goal) > 0.001 || Math.abs(v) > 0.01 || now < flipAt[i]) moving = true
      else {
        x = goal
        v = 0
      }
      value[i] = x
      velocity[i] = v
      if (x <= 0.002) continue
      const size = Math.min(x * 1.08, 1.25) * (half + cover * smoothstep(0.6, 0.93, x))
      const radius = Math.min(size, (s.pixelRadius / 50) * size * (1 - smoothstep(0.6, 0.93, x)))
      path += pixelPath(grid.cx[i], grid.cy[i], size, radius, s.pixelSpin * (1 - x))
    }

    const layer = engine.mode === 'intro' ? 0 : 1
    setLayer(layer, path !== '', path ? `path('${path}')` : '')

    if (moving) engine.raf = requestAnimationFrame(frame)
    else finish()
  }

  const launch = (mode: Engine['mode'], to: boolean, at: Point | null) => {
    const s = settingsRef.current
    let current: Engine | null = engine
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const width = root?.clientWidth ?? 0
    const height = root?.clientHeight ?? 0
    if (!root || reduce || !width || !height) return false

    const now = performance.now()
    if (!current?.running) {
      const grid = buildGrid(width, height, s.pixelSize, s.gap)
      const start = mode === 'intro' ? 0 : shownValue ? 1 : 0
      current = {
        mode,
        grid,
        value: new Float32Array(grid.count).fill(start),
        velocity: new Float32Array(grid.count),
        flipAt: new Float64Array(grid.count),
        target: new Uint8Array(grid.count).fill(start),
        desired: start,
        last: now,
        running: true,
        raf: engine?.raf ?? 0,
      }
      engine = current
    }
    current.desired = to ? 1 : 0
    const grid = current.grid
    const orders = new Float32Array(grid.count)
    let first = Infinity
    for (let i = 0; i < grid.count; i++) {
      orders[i] = orderOf(grid, i, s.pattern, at) * (1 - s.randomness) + hash(i) * s.randomness
      const settled =
        current.target[i] === current.desired &&
        Math.abs(current.value[i] - current.desired) < 0.001
      if (!settled) first = Math.min(first, orders[i])
    }
    if (first === Infinity) first = 0
    for (let i = 0; i < grid.count; i++)
      current.flipAt[i] = now + Math.max(0, orders[i] - first) * s.duration
    root.setAttribute('data-swapping', '')
    if (mode === 'swap') setLayer(0, true, '')
    cancelAnimationFrame(current.raf)
    current.raf = requestAnimationFrame(frame)
    return true
  }

  const request = (to: boolean, at: Point | null) => {
    if (waiting || (engine?.running && engine.mode === 'intro')) return
    if (!engine?.running && shownValue === to) return
    if (launch('swap', to, at)) return
    setLayer(1, to, '')
    setLayer(0, !to, '')
    shownValue = to
    setShown(to)
    settingsRef.current.onComplete?.(to)
  }

  const ask = (next: boolean, at: Point | null) => {
    desiredValue = next
    pointValue = at
    props.onActiveChange?.(next)
    if (!controlled) request(next, at)
  }

  // Upstream used an iso layout effect that waited for first-layer images;
  // onMount is the Solid equivalent (client-only).
  onMount(() => {
    if (!(props.intro ?? true) || shownValue) return
    const images = [...(layers[0]?.querySelectorAll('img') ?? [])].filter(image => !image.complete)
    let started = false
    let timer: ReturnType<typeof setTimeout> | 0 = 0
    const begin = () => {
      if (started) return
      started = true
      clearTimeout(timer)
      waiting = false
      if (launch('intro', true, null)) return
      setLayer(0, true, '')
      if (desiredValue !== shownValue) request(desiredValue, pointValue)
    }
    setLayer(0, false, '')
    if (!images.length) {
      begin()
      return
    }
    waiting = true
    let left = images.length
    const settle = () => {
      left -= 1
      if (left <= 0) begin()
    }
    images.forEach(image => {
      image.addEventListener('load', settle, { once: true })
      image.addEventListener('error', settle, { once: true })
    })
    timer = setTimeout(begin, 3000)
    onCleanup(() => {
      started = true
      clearTimeout(timer)
      waiting = false
      images.forEach(image => {
        image.removeEventListener('load', settle)
        image.removeEventListener('error', settle)
      })
    })
  })

  // Upstream deps: [active]
  createEffect(() => {
    const active = props.active
    if (active === undefined) return
    desiredValue = active
    untrack(() => request(active, pointValue))
  })

  onCleanup(() => {
    if (!engine) return
    cancelAnimationFrame(engine.raf)
    engine.running = false
  })

  const pointOf = (event: PointerEvent | MouseEvent): Point | null => {
    const rect = root?.getBoundingClientRect()
    if (!rect || (event.detail === 0 && event.clientX === 0 && event.clientY === 0)) return null
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const trigger = () => props.trigger ?? 'hover'
  // Upstream built a conditional handler bag per trigger; a memo keeps the
  // same semantics when the trigger prop changes.
  const handlers = createMemo<JSX.HTMLAttributes<HTMLDivElement>>(() => {
    const bag: JSX.HTMLAttributes<HTMLDivElement> = {}
    if (trigger() === 'hover') {
      bag.onPointerEnter = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') ask(true, pointOf(event))
      }
      bag.onPointerLeave = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') ask(false, pointOf(event))
      }
      bag.onClick = (event: MouseEvent) => {
        const touch = 'pointerType' in event && event.pointerType === 'touch'
        if (event.detail === 0 || touch) ask(!desiredValue, pointOf(event))
      }
      bag.onFocus = (event: FocusEvent) => {
        const el = event.currentTarget as HTMLDivElement | null
        if (event.target === el && el?.matches(':focus-visible')) ask(true, null)
      }
      bag.onBlur = () => ask(false, null)
      bag.tabIndex = 0
    } else if (trigger() === 'click') {
      bag.onClick = (event: MouseEvent) => ask(!desiredValue, pointOf(event))
      bag.onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        ask(!desiredValue, null)
      }
      bag.role = 'button'
      bag.tabIndex = 0
      bag['aria-pressed'] = shown()
    }
    return bag
  })

  return (
    <div
      ref={root}
      class={[ROOT, props.class, props.className].filter(Boolean).join(' ')}
      style={{ 'aspect-ratio': props.aspectRatio ?? '16 / 10', ...props.style }}
      data-active={shown() ? '' : undefined}
      {...handlers()}
    >
      <For each={[props.firstContent, props.secondContent]}>
        {(content, index) => (
          <div
            ref={element => {
              layers[index()] = element
            }}
            class={LAYER}
            style={{ 'z-index': index() }}
            data-visible={String(index() === (shown() ? 1 : 0))}
            aria-hidden={index() !== (shown() ? 1 : 0)}
          >
            {content}
          </div>
        )}
      </For>
    </div>
  )
}

export default PixelSwap
