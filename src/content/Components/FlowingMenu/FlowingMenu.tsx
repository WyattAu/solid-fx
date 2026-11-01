import { createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js'
import { For } from 'solid-js'
import type { JSX } from 'solid-js'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'

export interface FlowingMenuItem {
  text: string
  link?: string
  image?: string
  marquee?: string
  meta?: string
}

export interface FlowingMenuProps {
  items?: FlowingMenuItem[]
  speed?: number
  direction?: 'left' | 'right' | 'alternate'
  followCursor?: number
  duration?: number
  stretch?: number
  magnet?: number
  bandInset?: number
  bandRadius?: number
  carryContent?: boolean
  textColor?: string
  bgColor?: string
  marqueeBgColor?: string
  marqueeTextColor?: string
  borderColor?: string
  dividers?: boolean
  dimInactive?: boolean
  align?: 'center' | 'left'
  showIndex?: boolean
  showArrow?: boolean
  imageShape?: 'pill' | 'rounded' | 'circle'
  intro?: boolean
  activeIndex?: number
  onItemClick?: (item: FlowingMenuItem, index: number, event: MouseEvent) => void
  ariaLabel?: string
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

interface Row {
  item?: HTMLLIElement | null
  band?: HTMLDivElement | null
  track?: HTMLDivElement | null
}

interface Marquee {
  x: number
  part: number
  spin: number
  covered: boolean
}

interface Metric {
  top: number
  height: number
}

interface Settings {
  speed: number
  direction: 'left' | 'right' | 'alternate'
  followCursor: number
  duration: number
  stretch: number
  magnet: number
  bandInset: number
  bandRadius: number
  carryContent: boolean
  dimInactive: boolean
  onItemClick?: (item: FlowingMenuItem, index: number, event: MouseEvent) => void
}

const ROOT = 'group/fm relative box-border h-full w-full overflow-hidden'
const LIST = 'relative m-0 flex h-full list-none flex-col p-0'
const ITEM = 'group/item relative min-h-14 flex-[1_1_0] overflow-hidden [container-type:size]'
const DIVIDER =
  'pointer-events-none absolute top-0 right-0 left-0 h-px origin-left bg-[var(--flowing-menu-border,rgba(255,255,255,0.14))]'
const LINK =
  'relative box-border grid h-full w-full cursor-pointer grid-cols-[1fr_auto_1fr] items-center gap-4 border-0 bg-transparent px-[clamp(16px,4cqw,40px)] py-0 text-left text-inherit no-underline outline-none transition-opacity duration-[450ms] ease-[ease] [-webkit-tap-highlight-color:transparent] [font:inherit] group-data-[align=left]/fm:grid-cols-[auto_1fr_auto] group-data-[dimmed]/item:opacity-32 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current'
const INDEX =
  'min-w-[1.6em] justify-self-start text-[clamp(11px,12cqh,15px)] tabular-nums opacity-50'
const LABEL =
  'flex items-center gap-[0.28em] justify-self-center overflow-hidden py-[0.06em] text-[clamp(16px,40cqh,140px)] leading-[1.1] font-medium tracking-[-0.035em] whitespace-nowrap group-data-[align=left]/fm:justify-self-start'
const LABEL_TEXT = 'block'
const DOT = 'block h-[0.2em] w-[0.2em] shrink-0 rounded-full bg-current'
const END = 'flex items-center gap-3.5 justify-self-end'
const META = 'text-[clamp(11px,12cqh,15px)] tabular-nums opacity-50'
const ARROW = 'grid place-items-center opacity-55'
const BAND =
  'pointer-events-none invisible absolute inset-0 z-[1] overflow-hidden [clip-path:inset(50%_0_50%_0)]'
const TRACK = 'flex h-full w-max items-center will-change-transform'
const PART = 'flex h-full shrink-0 items-center'
const PART_TEXT =
  'px-[0.4em] text-[clamp(14px,calc(38cqh*var(--flowing-menu-band,1)),130px)] leading-[1.1] font-normal tracking-[-0.025em] whitespace-nowrap'
const IMAGE =
  'mx-[calc(3.5cqh*var(--flowing-menu-band,1))] block aspect-[2.2/1] h-[calc(56cqh*var(--flowing-menu-band,1))] shrink-0 rounded-full bg-cover bg-center group-data-[shape=circle]/fm:aspect-square group-data-[shape=rounded]/fm:aspect-[3/2] group-data-[shape=rounded]/fm:rounded-[calc(10cqh*var(--flowing-menu-band,1))]'
const FLOAT =
  'pointer-events-none invisible absolute inset-0 z-[1] overflow-hidden [clip-path:inset(50%_0_50%_0)]'
const FLOAT_LAYER =
  'absolute top-0 left-0 h-1/4 w-full [container-type:size] will-change-[transform,opacity]'

const DIRECTIONS = ['left', 'right', 'alternate']
const SHAPES = ['pill', 'rounded', 'circle']
const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

function FlowingMenu(props: FlowingMenuProps) {
  let root!: HTMLElement
  let listEl!: HTMLUListElement
  const rows: Row[] = []
  const marquees: (Marquee | null)[] = []
  const metrics: (Metric | null)[] = []
  const band = {
    top: 0,
    bottom: 0,
    vTop: 0,
    vBottom: 0,
    toTop: 0,
    toBottom: 0,
    lead: 1,
    shown: false,
    index: -1,
    rest: 0,
  }
  const cursor = { x: 0, y: null as number | null, t: 0, vx: 0 }
  const engine = { raf: 0, last: 0, timers: [] as ReturnType<typeof setTimeout>[], touched: false }
  const [copies, setCopies] = createSignal<number[]>([])
  let floatEl: HTMLDivElement | undefined
  const layerEls: (HTMLDivElement | null)[] = []
  const layerTracks: (HTMLDivElement | null)[] = []
  const roll = { current: 0, p: 1, dir: 1, slots: [-1, -1], fromOpacity: 0, fromOffset: 0 }
  const [slots, setSlots] = createSignal<number[]>([-1, -1])

  const items = () => props.items ?? []

  const settings = (): Settings => ({
    speed: Math.max(0, props.speed ?? 60),
    direction: DIRECTIONS.includes(props.direction ?? 'left')
      ? (props.direction as Settings['direction'])
      : 'left',
    followCursor: clamp(props.followCursor ?? 0.4, 0, 1),
    duration: Math.max(0.1, props.duration ?? 0.5),
    stretch: clamp(props.stretch ?? 0.6, 0, 1),
    magnet: clamp(props.magnet ?? 0.25, 0, 1),
    bandInset: Math.max(0, props.bandInset ?? 0),
    bandRadius: Math.max(0, props.bandRadius ?? 0),
    carryContent: props.carryContent ?? false,
    dimInactive: props.dimInactive ?? false,
    onItemClick: props.onItemClick,
  })
  let S: Settings = untrack(settings)

  const marqueeAt = (index: number) => {
    if (!marquees[index]) marquees[index] = { x: 0, part: 0, spin: 0, covered: false }
    return marquees[index] as Marquee
  }

  const insetFor = (height: number) => Math.min(S.bandInset, Math.max(0, height / 2 - 2))

  const markRows = () => {
    const b = band
    const dim = S.dimInactive && b.index >= 0
    rows.forEach((row, index) => {
      if (!row?.item) return
      if (index === b.index) row.item.setAttribute('data-current', '')
      else row.item.removeAttribute('data-current')
      if (dim && index !== b.index) row.item.setAttribute('data-dimmed', '')
      else row.item.removeAttribute('data-dimmed')
    })
  }

  const rowHeight = () => metrics.find(Boolean)?.height ?? 0

  const paintFloat = () => {
    const b = band
    const s = S
    const r = roll
    const el = floatEl
    const list = listEl
    if (!el || !list) return
    if (!b.shown || b.bottom - b.top < 0.25) {
      el.style.visibility = 'hidden'
      return
    }
    const height = rowHeight()
    const side = Math.min(s.bandInset, Math.max(0, height / 2 - 2))
    const radius = Math.min(
      s.bandRadius,
      (b.bottom - b.top) / 2,
      Math.max(0, list.clientWidth / 2 - side),
    )
    el.style.visibility = 'visible'
    el.style.clipPath = `inset(${b.top.toFixed(2)}px ${side}px ${(list.clientHeight - b.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`
    const center = (b.top + b.bottom) / 2
    const eased = 1 - (1 - r.p) ** 3
    const travel = height * 0.8 * r.dir
    ;[0, 1].forEach(slot => {
      const layer = layerEls[slot]
      const index = r.slots[slot]
      if (!layer) return
      const isCurrent = slot === r.current
      const visible = index >= 0 && (isCurrent || r.p < 1)
      layer.style.visibility = visible ? 'visible' : 'hidden'
      if (!visible) return
      const offset = isCurrent ? (1 - eased) * travel : r.fromOffset - eased * travel
      const opacity = isCurrent ? eased : r.fromOpacity * (1 - eased)
      layer.style.height = `${height}px`
      layer.style.opacity = opacity.toFixed(3)
      layer.style.transform = `translate3d(0, ${(center - height / 2 + offset).toFixed(2)}px, 0)`
      const state = marqueeAt(index)
      state.covered = true
      const track = layerTracks[slot]
      if (track) track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`
    })
  }

  const paint = () => {
    const b = band
    const s = S
    const height = Math.max(0, b.bottom - b.top)
    rows.forEach((row, index) => {
      const mt = metrics[index]
      if (!row?.band || !mt) return
      const state = marqueeAt(index)
      state.covered = false
      const from = Math.max(b.top, mt.top)
      const to = Math.min(b.bottom, mt.top + mt.height)
      if (s.carryContent || !b.shown || to - from < 0.25) {
        row.band.style.visibility = 'hidden'
      } else {
        const side = Math.min(s.bandInset, Math.max(0, mt.height / 2 - 2))
        const radius = Math.min(
          s.bandRadius,
          height / 2,
          Math.max(0, (row.item?.clientWidth ?? 0) / 2 - side),
        )
        row.band.style.visibility = 'visible'
        row.band.style.clipPath = `inset(${(b.top - mt.top).toFixed(2)}px ${side}px ${(mt.top + mt.height - b.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`
        state.covered = (to - from) / mt.height > 0.04
      }
      if (row.track) row.track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`
    })
    if (s.carryContent) paintFloat()
    else if (floatEl) floatEl.style.visibility = 'hidden'
  }

  const frame = (now: number) => {
    const loop = engine
    loop.raf = 0
    const s = S
    const b = band
    const c = cursor
    const reduced = prefersReduced()
    const elapsed = clamp((now - loop.last) / 1000, 0, 1 / 20)
    loop.last = now
    let busy = false

    if (b.shown) {
      const currentRow = b.index >= 0 ? metrics[b.index] : null
      if (currentRow) {
        const inset = insetFor(currentRow.height)
        const lean =
          c.y === null || reduced
            ? 0
            : clamp(
                (c.y - (currentRow.top + currentRow.height / 2)) * s.magnet,
                -currentRow.height * 0.3,
                currentRow.height * 0.3,
              )
        b.toTop = currentRow.top + inset + lean
        b.toBottom = currentRow.top + currentRow.height - inset + lean
      } else if (b.index < 0) {
        b.toTop = b.toBottom = b.rest
      }
      const gap = (b.toTop + b.toBottom) / 2 - (b.top + b.bottom) / 2
      if (Math.abs(gap) > 2) b.lead = gap > 0 ? 1 : -1
      if (reduced) {
        b.top = b.toTop
        b.bottom = b.toBottom
        b.vTop = b.vBottom = 0
      } else {
        const omega = (Math.PI * 2) / s.duration
        const fast = omega * (1 + 1.1 * s.stretch)
        const slow = omega * (1 - 0.4 * s.stretch)
        const zeta = 1 - 0.3 * s.stretch
        const wTop = b.lead > 0 ? slow : fast
        const wBottom = b.lead > 0 ? fast : slow
        const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)))
        const dt = elapsed / steps
        for (let i = 0; i < steps; i++) {
          b.vTop += (-wTop * wTop * (b.top - b.toTop) - 2 * zeta * wTop * b.vTop) * dt
          b.vBottom +=
            (-wBottom * wBottom * (b.bottom - b.toBottom) - 2 * zeta * wBottom * b.vBottom) * dt
          b.top += b.vTop * dt
          b.bottom += b.vBottom * dt
          if (b.bottom < b.top) {
            const mid = (b.top + b.bottom) / 2
            const v = (b.vTop + b.vBottom) / 2
            b.top = b.bottom = mid
            b.vTop = b.vBottom = v
          }
        }
      }
      const resting =
        Math.abs(b.top - b.toTop) < 0.1 &&
        Math.abs(b.bottom - b.toBottom) < 0.1 &&
        Math.abs(b.vTop) < 2 &&
        Math.abs(b.vBottom) < 2
      if (resting) {
        b.top = b.toTop
        b.bottom = b.toBottom
        b.vTop = b.vBottom = 0
        if (b.index < 0 && b.bottom - b.top < 0.5) b.shown = false
      } else busy = true
    }

    const r = roll
    if (r.p < 1) {
      r.p = reduced ? 1 : Math.min(1, r.p + elapsed / (s.duration * 0.8))
      busy = true
    }

    c.vx *= Math.exp(-elapsed / 0.3)
    const push = clamp(c.vx * s.followCursor * 0.55, -1600, 1600)

    marquees.forEach((state, index) => {
      if (!state) return
      const goal = state.covered ? 1 : 0
      state.spin += (goal - state.spin) * (1 - Math.exp(-elapsed / 0.35))
      if (Math.abs(goal - state.spin) < 0.002) state.spin = goal
      if (!state.covered && state.spin === 0) return
      busy = true
      if (state.part <= 0 || reduced) return
      const flow =
        s.direction === 'alternate' ? (index % 2 ? 1 : -1) : s.direction === 'right' ? 1 : -1
      state.x += (flow * s.speed + push) * state.spin * elapsed
      state.x = (((state.x % state.part) + state.part) % state.part) - state.part
    })

    paint()
    if (busy) loop.raf = requestAnimationFrame(frame)
  }

  const kick = () => {
    const loop = engine
    if (loop.raf || typeof window === 'undefined') return
    loop.last = performance.now()
    loop.raf = requestAnimationFrame(frame)
  }

  const goTo = (index: number, from: 'top' | 'bottom' | 'center') => {
    const mt = metrics[index]
    if (!mt) return
    const b = band
    const inset = insetFor(mt.height)
    const top = mt.top + inset
    const bottom = mt.top + mt.height - inset
    const r = roll
    const showing = r.slots[r.current]
    if (S.carryContent && showing !== index) {
      if (!b.shown || showing < 0) {
        r.slots[r.current] = index
        r.p = 1
      } else {
        const eased = 1 - (1 - r.p) ** 3
        r.fromOpacity = eased
        r.fromOffset = (1 - eased) * mt.height * 0.8 * r.dir
        r.dir = index > showing ? 1 : -1
        r.current = 1 - r.current
        r.slots[r.current] = index
        r.p = 0
      }
      setSlots([...r.slots])
    }
    if (!b.shown) {
      const start = from === 'bottom' ? bottom : from === 'center' ? (top + bottom) / 2 : top
      b.top = b.bottom = start
      b.vTop = b.vBottom = 0
      b.shown = true
    }
    const shift = (top + bottom) / 2 - (b.top + b.bottom) / 2
    if (Math.abs(shift) > 0.5) b.lead = shift > 0 ? 1 : -1
    else b.lead = from === 'bottom' ? -1 : 1
    b.toTop = top
    b.toBottom = bottom
    b.index = index
    markRows()
    kick()
  }

  const release = (toward: 'top' | 'bottom' | 'center') => {
    const b = band
    if (!b.shown) return
    const point =
      toward === 'top' ? b.toTop : toward === 'bottom' ? b.toBottom : (b.toTop + b.toBottom) / 2
    b.lead = toward === 'top' ? -1 : 1
    b.rest = point
    b.toTop = b.toBottom = point
    b.index = -1
    cursor.y = null
    markRows()
    kick()
  }

  const rowAt = (clientY: number) => {
    const list = listEl
    if (!list) return -1
    const y = clientY - list.getBoundingClientRect().top
    return metrics.findIndex(mt => mt && y >= mt.top && y < mt.top + mt.height)
  }

  const halfOf = (clientY: number, index: number): 'top' | 'bottom' => {
    const list = listEl
    const mt = metrics[index]
    if (!list || !mt) return 'top'
    return clientY - list.getBoundingClientRect().top - mt.top < mt.height / 2 ? 'top' : 'bottom'
  }

  const stopIntro = () => {
    const loop = engine
    loop.touched = true
    loop.timers.forEach(clearTimeout)
    loop.timers = []
  }

  const measure = () => {
    const list = listEl
    metrics.length = 0
    rows.forEach(row =>
      metrics.push(row?.item ? { top: row.item.offsetTop, height: row.item.offsetHeight } : null),
    )
    if (list && metrics[0]) {
      const height = metrics[0].height
      const inset = insetFor(height)
      root?.style.setProperty(
        '--flowing-menu-band',
        String(height ? (height - inset * 2) / height : 1),
      )
    }
    const next = rows.map((row, index) => {
      const state = marqueeAt(index)
      const part = row?.track?.firstElementChild
      const width = part?.getBoundingClientRect().width ?? 0
      const total = row?.item?.getBoundingClientRect().width ?? 0
      if (width > 0) {
        state.part = width
        state.x = (((state.x % width) + width) % width) - width
      }
      return width > 0 ? Math.max(2, Math.ceil(total / width) + 1) : 3
    })
    setCopies(current =>
      current.length === next.length &&
      current.every((value: number, index: number) => value === next[index])
        ? current
        : next,
    )
    const b = band
    if (b.shown && b.index >= 0) {
      const mt = metrics[b.index]
      if (mt) {
        const inset = insetFor(mt.height)
        b.toTop = mt.top + inset
        b.toBottom = mt.top + mt.height - inset
      }
    }
    paint()
    kick()
  }

  // Upstream: useIsoLayoutEffect on [items, bandInset] — measure + observers.
  createEffect(() => {
    void props.items
    S = settings()
    untrack(measure)
    const rt = root
    if (!rt || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(rt)
    rows.forEach(row => {
      const part = row?.track?.firstElementChild
      if (part) observer.observe(part)
    })
    onCleanup(() => observer.disconnect())
  })

  // Upstream: useIsoLayoutEffect with no deps — sync row/marquee lengths.
  createEffect(() => {
    S = settings()
    rows.length = items().length
    marquees.length = items().length
    untrack(() => paint())
  })

  onMount(() => {
    if (!props.intro || prefersReduced()) return
    const rt = root
    if (!rt) return
    rt.querySelectorAll('[data-intro-line]').forEach((node, index) => {
      node.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], {
        duration: 900,
        delay: index * 70,
        easing: EASE,
        fill: 'backwards',
      })
    })
    rt.querySelectorAll('[data-intro-fade]').forEach((node, index) => {
      node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 700,
        delay: 200 + index * 40,
        easing: 'ease',
        fill: 'backwards',
      })
    })
    rt.querySelectorAll('[data-intro-rule]').forEach((node, index) => {
      node.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], {
        duration: 1100,
        delay: index * 70,
        easing: EASE,
        fill: 'backwards',
      })
    })
    const loop = engine
    const count = rows.filter(Boolean).length
    const start = 650 + count * 70
    for (let index = 0; index < count; index++) {
      loop.timers.push(
        setTimeout(
          () => {
            if (!loop.touched) goTo(index, 'top')
          },
          start + index * 170,
        ),
      )
    }
    loop.timers.push(
      setTimeout(
        () => {
          if (!loop.touched) release('bottom')
        },
        start + count * 170 + 120,
      ),
    )
    onCleanup(() => {
      loop.timers.forEach(clearTimeout)
      loop.timers = []
    })
  })

  onCleanup(() => cancelAnimationFrame(engine.raf))

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    stopIntro()
    const c = cursor
    const now = performance.now()
    const gap = (now - c.t) / 1000
    if (gap > 0 && gap < 0.1) {
      const instant = (event.clientX - c.x) / gap
      c.vx += (instant - c.vx) * (1 - Math.exp(-gap / 0.08))
    }
    c.x = event.clientX
    c.t = now
    const list = listEl
    if (list) c.y = event.clientY - list.getBoundingClientRect().top
    const index = rowAt(event.clientY)
    if (index >= 0 && index !== band.index) goTo(index, halfOf(event.clientY, index))
    else kick()
  }

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    const list = listEl
    const b = band
    if (!list || b.index < 0) return
    const rect = list.getBoundingClientRect()
    if (event.clientY <= rect.top) release('top')
    else if (event.clientY >= rect.bottom) release('bottom')
    else release(halfOf(event.clientY, b.index))
  }

  const linkHandlers = (item: FlowingMenuItem, index: number) => ({
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      stopIntro()
      goTo(index, halfOf(event.clientY, index))
    },
    onFocus: (event: FocusEvent) => {
      if (!(event.currentTarget as HTMLElement).matches(':focus-visible')) return
      stopIntro()
      goTo(index, 'top')
    },
    onBlur: (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null
      if (next && listEl?.contains(next)) return
      release('bottom')
    },
    onClick: (event: MouseEvent) => untrack(() => S.onItemClick?.(item, index, event)),
  })

  const shape = () => (SHAPES.includes(props.imageShape ?? 'pill') ? props.imageShape : 'pill')
  const copiesFor = (index: number) =>
    Array.from({ length: copies()[index] ?? 3 }, (_, copy) => copy)

  return (
    <nav
      ref={root}
      class={[ROOT, props.class, props.className].filter(Boolean).join(' ')}
      style={
        {
          'background-color': props.bgColor ?? '#120F17',
          color: props.textColor ?? '#ffffff',
          '--flowing-menu-border': props.borderColor ?? 'rgba(255, 255, 255, 0.14)',
          ...props.style,
        } as JSX.CSSProperties
      }
      aria-label={props.ariaLabel ?? 'Menu'}
      data-align={props.align === 'left' ? 'left' : 'center'}
      data-shape={shape()}
    >
      <ul ref={listEl} class={LIST} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <For each={items()}>
          {(item, index) => {
            const i = index()
            const active = () => props.activeIndex !== undefined && props.activeIndex === i
            const handlers = linkHandlers(item, i)
            const content = (
              <>
                <span class={INDEX} data-intro-fade="" aria-hidden="true">
                  {props.showIndex ? String(i + 1).padStart(2, '0') : null}
                </span>
                <span class={LABEL}>
                  <span class={LABEL_TEXT} data-intro-line="">
                    {item.text}
                  </span>
                  {active() && <span class={DOT} aria-hidden="true" />}
                </span>
                <span class={END} data-intro-fade="" aria-hidden="true">
                  {item.meta ? <span class={META}>{item.meta}</span> : null}
                  {props.showArrow ? (
                    <span class={ARROW}>
                      <HugeiconsIcon icon={ArrowUpRight01Icon} size={22} strokeWidth={1.75} />
                    </span>
                  ) : null}
                </span>
              </>
            )
            return (
              <li
                ref={node => {
                  rows[i] = { ...rows[i], item: node }
                }}
                class={ITEM}
              >
                {props.dividers !== false && i > 0 && (
                  <span class={DIVIDER} data-intro-rule="" aria-hidden="true" />
                )}
                {item.link ? (
                  <a
                    class={LINK}
                    href={item.link}
                    aria-current={active() ? 'page' : undefined}
                    {...handlers}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    class={LINK}
                    aria-current={active() ? 'page' : undefined}
                    {...handlers}
                  >
                    {content}
                  </button>
                )}
                <div
                  class={BAND}
                  aria-hidden="true"
                  style={{
                    'background-color': props.marqueeBgColor ?? '#ffffff',
                    color: props.marqueeTextColor ?? '#120F17',
                  }}
                  ref={node => {
                    rows[i] = { ...rows[i], band: node }
                  }}
                >
                  <div
                    class={TRACK}
                    ref={node => {
                      rows[i] = { ...rows[i], track: node }
                    }}
                  >
                    <For each={copiesFor(i)}>
                      {_copy => (
                        <div class={PART}>
                          <span class={PART_TEXT}>{item.marquee ?? item.text}</span>
                          {item.image && (
                            <span
                              class={IMAGE}
                              style={{ 'background-image': `url(${item.image})` }}
                            />
                          )}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </li>
            )
          }}
        </For>
      </ul>
      {props.carryContent && (
        <div
          class={FLOAT}
          aria-hidden="true"
          ref={el => (floatEl = el)}
          style={{
            'background-color': props.marqueeBgColor ?? '#ffffff',
            color: props.marqueeTextColor ?? '#120F17',
          }}
        >
          <For each={[0, 1]}>
            {slot => {
              const item = slots()[slot] >= 0 ? items()[slots()[slot]] : null
              return (
                <div
                  class={FLOAT_LAYER}
                  ref={node => {
                    layerEls[slot] = node
                  }}
                >
                  <div
                    class={TRACK}
                    ref={node => {
                      layerTracks[slot] = node
                    }}
                  >
                    {item && (
                      <For each={copiesFor(slots()[slot])}>
                        {() => (
                          <div class={PART}>
                            <span class={PART_TEXT}>{item.marquee ?? item.text}</span>
                            {item.image && (
                              <span
                                class={IMAGE}
                                style={{ 'background-image': `url(${item.image})` }}
                              />
                            )}
                          </div>
                        )}
                      </For>
                    )}
                  </div>
                </div>
              )
            }}
          </For>
        </div>
      )}
    </nav>
  )
}

export default FlowingMenu
