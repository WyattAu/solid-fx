import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

export type RubberSegmentSize = 'sm' | 'md' | 'lg'
export type RubberSegmentItem = string | { value: string; label: JSX.Element; icon?: JSX.Element }

export interface RubberSegmentProps {
  items: RubberSegmentItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string, index: number) => void
  trackColor?: string
  thumbColor?: string
  textColor?: string
  activeTextColor?: string
  size?: RubberSegmentSize
  radius?: number
  inset?: number
  equalSlots?: boolean
  stretch?: number
  squash?: number
  speed?: number
  glide?: number
  draggable?: boolean
  disabled?: boolean
  className?: string
  class?: string
  'aria-label'?: string
}

type Slot = { l: number; r: number }
type Sample = [number, number]
type Drag = {
  id: number
  x0: number
  slot: number
  onThumb: boolean
  live: boolean
  offset: number
  w: number
  hist: Sample[]
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 }
const SPRING_MOMENTUM = { type: 'spring' as const, duration: 0.4, bounce: 0.2 }
const SPRING_RELAX = { type: 'spring' as const, duration: 0.16, bounce: 0 }
const DILATE = 0.19
const HANDOFF = 0.15
const FLICK = 110
const MAX_VELOCITY = 2000
const DEADZONE = 4
const SLOP = 10
const RUBBER = 0.55
const SIZES: Record<RubberSegmentSize, { height: number; font: number; pad: number; min: number }> =
  {
    sm: { height: 28, font: 12, pad: 10, min: 36 },
    md: { height: 36, font: 13, pad: 14, min: 44 },
    lg: { height: 44, font: 14, pad: 18, min: 48 },
  }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const rubber = (over: number, dim: number) =>
  (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over))
const project = (v: number, glide: number) => {
  const d = 1 - 0.1 * 0.05 ** (glide / 100)
  return ((v / 1000) * d) / (1 - d)
}
const velocityOf = (hist: Sample[], now: number) => {
  const recent = hist.filter(([t]) => now - t <= 100)
  if (recent.length < 2) return 0
  const [t0, x0] = recent[0]
  const [t1, x1] = recent[recent.length - 1]
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0
}
const nearestSlot = (slots: Slot[], x: number) => {
  let best = 0
  for (let i = 1; i < slots.length; i++) {
    if (
      Math.abs((slots[i].l + slots[i].r) / 2 - x) <
      Math.abs((slots[best].l + slots[best].r) / 2 - x)
    )
      best = i
  }
  return best
}

const RubberSegment = (props: RubberSegmentProps) => {
  const list = createMemo(() =>
    (props.items ?? []).map(item =>
      typeof item === 'string' ? { value: item, label: item } : item,
    ),
  )
  const [inner, setInner] = createSignal<string | undefined>(
    props.defaultValue ??
      (props.items ?? []).map(it => (typeof it === 'string' ? { value: it, label: it } : it))[0]
        ?.value,
  )
  const current = () => (props.value !== undefined ? props.value : inner())
  const index = createMemo(() =>
    Math.max(
      0,
      list().findIndex(item => item.value === current()),
    ),
  )
  const reduce = usePrefersReducedMotion()

  let trackEl!: HTMLDivElement
  let thumbEl!: HTMLDivElement
  const itemEls: (HTMLButtonElement | null)[] = []
  const slots: Slot[] = []
  let box: DOMRect | null = null
  let committed = index()
  let handoff: ReturnType<typeof setTimeout> | undefined
  let drag: Drag | null = null
  let gen = 0

  const edgeL = motionValue(0)
  const edgeR = motionValue(0)
  const innerW = motionValue(0)
  const clip = motionValue('')
  const thumbRadius = () => Math.max(0, (props.radius ?? 10) - (props.inset ?? 3))
  const writeClip = () =>
    clip.set(
      `inset(0 ${Math.max(0, innerW.get() - edgeR.get())}px 0 ${Math.max(0, edgeL.get())}px round ${thumbRadius()}px)`,
    )

  const inset = () => props.inset ?? 3
  const speed = () => props.speed ?? 1
  const t = (seconds: number) => seconds / speed()

  function jumpTo(i: number) {
    const s = slots[i]
    if (!s) return
    clearTimeout(handoff)
    gen += 1
    edgeL.jump(s.l)
    edgeR.jump(s.r)
    writeClip()
  }

  function measure() {
    const track = trackEl
    if (!track) return
    const rect = track.getBoundingClientRect()
    box = rect
    slots.length = 0
    list().forEach((_, i) => {
      const el = itemEls[i]
      if (!el) {
        slots.push({ l: 0, r: 0 })
        return
      }
      const r = el.getBoundingClientRect()
      slots.push({ l: r.left - rect.left - inset(), r: r.right - rect.left - inset() })
    })
    innerW.set(rect.width - inset() * 2)
    jumpTo(committed)
  }

  // Upstream layout effect on [listKey, size, inset, equalSlots].
  createEffect(() => {
    void list()
      .map(item => item.value)
      .join('|')
    void props.size
    void props.inset
    void props.equalSlots
    untrack(() => measure())
    const observer = new ResizeObserver(() => measure())
    if (trackEl) observer.observe(trackEl)
    if (typeof document !== 'undefined' && document.fonts)
      document.fonts.ready.then(() => measure())
    onCleanup(() => observer.disconnect())
  })

  // Upstream effect without deps: follow committed index when not dragging.
  createEffect(() => {
    const idx = index()
    untrack(() => {
      if (!drag && committed !== idx) {
        committed = idx
        jumpTo(idx)
      }
    })
  })

  onMount(() => {
    const offs = [
      edgeL.on('change', writeClip),
      edgeR.on('change', writeClip),
      innerW.on('change', writeClip),
    ]
    writeClip()
    const offClip = clip.on('change', v => {
      if (thumbEl) thumbEl.style.clipPath = v
    })
    onCleanup(() => {
      offs.forEach(off => off())
      offClip()
      clearTimeout(handoff)
      edgeL.stop()
      edgeR.stop()
      innerW.stop()
      clip.stop()
    })
  })

  function commit(i: number) {
    committed = i
    if (i === index()) return
    if (props.value === undefined) setInner(list()[i].value)
    untrack(() => props.onChange?.(list()[i].value, i))
  }

  function land(to: number, v: number | null, flick: boolean, withSquash: boolean) {
    const b = slots[to]
    if (!b) return
    const g = ++gen
    const squash = props.squash ?? 3
    const dir = Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1
    const [lead, leadTo, trail, trailTo] =
      dir > 0 ? [edgeR, b.r, edgeL, b.l] : [edgeL, b.l, edgeR, b.r]
    const velocityFor = (mv: typeof edgeL) =>
      clamp(v === null ? mv.getVelocity() : v, -MAX_VELOCITY, MAX_VELOCITY)
    animate(lead, leadTo, {
      ...(flick ? SPRING_MOMENTUM : SPRING_UI),
      duration: t(flick ? 0.4 : 0.3),
      velocity: velocityFor(lead),
    })
    const trailVelocity = velocityFor(trail)
    if (!withSquash || squash <= 0) {
      animate(trail, trailTo, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity })
      return
    }
    const first = animate(trail, trailTo + dir * squash, {
      ...SPRING_UI,
      duration: t(0.3),
      velocity: trailVelocity,
    })
    onCleanup(() => first.stop())
    first.then(() => {
      if (gen === g) {
        const relax = animate(trail, trailTo, { ...SPRING_RELAX, duration: t(0.16) })
        onCleanup(() => relax.stop())
      }
    })
  }

  function travel(from: number, to: number) {
    const a = slots[from]
    const b = slots[to]
    if (!a || !b) return
    clearTimeout(handoff)
    gen += 1
    if (reduce()) {
      edgeL.jump(b.l)
      edgeR.jump(b.r)
      writeClip()
      return
    }
    const u = (props.stretch ?? 100) / 100
    const tween = { duration: t(DILATE), ease: EASE_OUT }
    const c1 = animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l) * u, tween)
    const c2 = animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r) * u, tween)
    onCleanup(() => {
      c1.stop()
      c2.stop()
    })
    handoff = setTimeout(() => land(to, null, false, true), t(HANDOFF) * 1000)
  }

  const localX = (e: { clientX: number }) => e.clientX - (box ? box.left : 0) - inset()

  function handlePointerDown(e: PointerEvent, i: number) {
    if (props.disabled || drag || e.button !== 0) return
    const el = e.currentTarget as HTMLButtonElement
    box = trackEl?.getBoundingClientRect() ?? null
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    const x = localX(e)
    const onThumb = (props.draggable ?? true) && x >= edgeL.get() && x <= edgeR.get()
    drag = {
      id: e.pointerId,
      x0: x,
      slot: i,
      onThumb,
      live: false,
      offset: 0,
      w: 0,
      hist: [[e.timeStamp, x]],
    }
    if (onThumb) {
      clearTimeout(handoff)
      gen += 1
      edgeL.stop()
      edgeR.stop()
    } else if (!reduce()) {
      el.dataset.pressed = ''
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const d = drag
    if (!d || e.pointerId !== d.id || !d.onThumb) return
    const x = localX(e)
    d.hist.push([e.timeStamp, x])
    if (d.hist.length > 8) d.hist.shift()
    if (!d.live) {
      if (Math.abs(x - d.x0) < DEADZONE) return
      d.live = true
      d.offset = x - edgeL.get()
      d.w = edgeR.get() - edgeL.get()
      if (trackEl) trackEl.dataset.held = ''
    }
    const width = innerW.get()
    const l = x - d.offset
    const maxL = width - d.w
    if (reduce()) {
      const c = clamp(l, 0, maxL)
      edgeL.set(c)
      edgeR.set(c + d.w)
    } else if (l < 0) {
      edgeL.set(0)
      edgeR.set(d.w - rubber(-l, d.w))
    } else if (l > maxL) {
      edgeR.set(width)
      edgeL.set(maxL + rubber(l - maxL, d.w))
    } else {
      edgeL.set(l)
      edgeR.set(l + d.w)
    }
  }

  function release() {
    const d = drag as Drag
    drag = null
    if (trackEl) delete trackEl.dataset.held
    const el = itemEls[d.slot]
    if (el) delete el.dataset.pressed
    return d
  }

  function handlePointerUp(e: PointerEvent) {
    const d = drag
    if (!d || e.pointerId !== d.id) return
    release()
    const x = localX(e)
    if (!d.live) {
      if (Math.abs(x - d.x0) <= SLOP && d.slot !== committed) {
        const from = committed
        commit(d.slot)
        travel(from, d.slot)
      }
      return
    }
    const v = velocityOf(d.hist, e.timeStamp)
    const flick = Math.abs(v) > FLICK
    let to = nearestSlot(slots, (edgeL.get() + edgeR.get()) / 2 + project(v, props.glide ?? 75))
    if (flick && to === committed) to = clamp(to + Math.sign(v), 0, list().length - 1)
    commit(to)
    if (reduce()) jumpTo(to)
    else land(to, v, flick, flick)
  }

  function handlePointerCancel(e: PointerEvent) {
    const d = drag
    if (!d || e.pointerId !== d.id) return
    release()
    if (!d.live) return
    if (reduce()) jumpTo(committed)
    else land(committed, null, false, false)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (props.disabled) return
    const last = list().length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(last, index() + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, index() - 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    if (next === index()) return
    commit(next)
    jumpTo(next)
    itemEls[next]?.focus()
  }

  const preset = () => SIZES[props.size ?? 'md'] ?? SIZES.md

  return (
    <div
      ref={trackEl}
      role="radiogroup"
      aria-label={props['aria-label'] ?? 'Segmented control'}
      aria-disabled={props.disabled || undefined}
      data-equal={(props.equalSlots ?? true) ? '' : undefined}
      data-draggable={(props.draggable ?? true) && !props.disabled ? '' : undefined}
      class={`group relative inline-grid grid-flow-col auto-cols-auto align-middle select-none touch-pan-y [font-family:inherit] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] p-[var(--rs-inset)] rounded-[var(--rs-radius)] [background:var(--rs-track)] data-[equal]:auto-cols-[minmax(0,1fr)] data-[held]:cursor-grabbing aria-disabled:pointer-events-none aria-disabled:opacity-50${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      style={{
        '--rs-track': props.trackColor ?? '#27272a',
        '--rs-thumb': props.thumbColor ?? '#fafafa',
        '--rs-ink': props.textColor ?? '#fafafa',
        '--rs-ink-active': props.activeTextColor ?? '#18181b',
        '--rs-radius': `${props.radius ?? 10}px`,
        '--rs-inset': `${inset()}px`,
        '--rs-thumb-radius': `${thumbRadius()}px`,
        '--rs-h': `${preset().height}px`,
        '--rs-font': `${preset().font}px`,
        '--rs-pad': `${preset().pad}px`,
        '--rs-min': `${preset().min}px`,
        '--rs-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
    >
      <For each={list()}>
        {(item, i) => (
          <button
            ref={el => {
              itemEls[i()] = el
            }}
            type="button"
            role="radio"
            aria-checked={i() === index()}
            tabIndex={i() === index() ? 0 : -1}
            disabled={props.disabled}
            class="inline-flex h-[calc(var(--rs-h)-var(--rs-inset)*2)] min-w-[var(--rs-min)] items-center justify-center gap-1.5 m-0 border-0 bg-transparent px-[var(--rs-pad)] py-0 rounded-[var(--rs-thumb-radius)] [font:inherit] text-[length:var(--rs-font)] font-medium leading-none whitespace-nowrap outline-none [transition:opacity_160ms_ease,transform_160ms_var(--rs-ease-out)] motion-reduce:[transition:opacity_160ms_ease] cursor-pointer [color:var(--rs-ink)] opacity-70 aria-checked:cursor-default group-data-[draggable]:aria-checked:cursor-grab group-data-[held]:cursor-grabbing data-[pressed]:[transform:scale(0.96)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:[outline-color:var(--rs-thumb)] [@media(hover:hover)_and_(pointer:fine)]:[&[aria-checked=false]:hover]:opacity-90"
            onPointerDown={e => handlePointerDown(e, i())}
            onKeyDown={handleKeyDown}
          >
            {item.icon}
            {item.label}
          </button>
        )}
      </For>
      <div
        ref={el => {
          thumbEl = el
          writeClip()
          el.style.clipPath = clip.get()
        }}
        class="pointer-events-none absolute inset-[var(--rs-inset)] grid grid-flow-col auto-cols-auto group-data-[equal]:auto-cols-[minmax(0,1fr)] [background:var(--rs-thumb)] [color:var(--rs-ink-active)]"
        aria-hidden="true"
      >
        <For each={list()}>
          {item => (
            <span class="inline-flex h-[calc(var(--rs-h)-var(--rs-inset)*2)] min-w-[var(--rs-min)] items-center justify-center gap-1.5 m-0 border-0 bg-transparent px-[var(--rs-pad)] py-0 rounded-[var(--rs-thumb-radius)] [font:inherit] text-[length:var(--rs-font)] font-medium leading-none whitespace-nowrap outline-none [transition:opacity_160ms_ease,transform_160ms_var(--rs-ease-out)] motion-reduce:[transition:opacity_160ms_ease] cursor-default [color:inherit]">
              {item.icon}
              {item.label}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

export default RubberSegment
