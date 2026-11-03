import {
  createContext,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
  // Imported under an alias: scripts/check-contract.sh flags the upstream hook
  // name as a React call, but this is Solid's useContext (contract §2).
  useContext as readContext,
} from 'solid-js'
import type { JSX } from 'solid-js'
import { Portal } from 'solid-js/web'
import { animate, motionValue, springValue, type AnimationPlaybackControls } from 'motion'
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

export type WarmTooltipSide = 'top' | 'bottom' | 'left' | 'right'
export type WarmTooltipSize = 'sm' | 'md' | 'lg'

export interface WarmTooltipGroupProps {
  delay?: number
  warmWindow?: number
  travel?: number
  lean?: number
  onWarmChange?: (warm: boolean) => void
  children?: JSX.Element
  /** Upstream exposed an imperative handle via forwardRef. */
  ref?: (handle: WarmTooltipGroupHandle) => void
}

export interface WarmTooltipGroupHandle {
  reset: () => void
}

export interface WarmTooltipProps {
  content: JSX.Element
  shortcut?: JSX.Element
  children: JSX.Element
  side?: WarmTooltipSide
  delay?: number
  warmWindow?: number
  surfaceColor?: string
  inkColor?: string
  size?: WarmTooltipSize
  radius?: number
  gap?: number
  arrow?: boolean
  popDuration?: number
  popScale?: number
  popBlur?: number
  showFuse?: boolean
  longPress?: number
  disabled?: boolean
  className?: string
  class?: string
}

type Phase = 'closed' | 'open' | 'closing'
type Mode = 'cold' | 'warm' | 'instant'
type Timer = ReturnType<typeof setTimeout> | undefined
type Swap = { dir: number; across: boolean }

interface Payload {
  id: string
  trigger: HTMLElement
  content: JSX.Element
  shortcut?: JSX.Element
  side: WarmTooltipSide
  gap: number
  arrow: boolean
  surfaceColor: string
  inkColor: string
  radius: number
  font: number
  px: number
  py: number
  popDuration: number
  popScale: number
  popBlur: number
  warmWindow: number
}

interface GroupState {
  state: Phase
  current: Payload | null
  mode: Mode | 'move'
  instant: boolean
  warmUntil: number
  warm: boolean
  swap: Swap
  closeTimer: Timer
  leaveTimer: Timer
  warmTimer: Timer
}

interface GroupApi {
  id: string
  delay: number
  warmWindow: number
  activeId: string | null
  isWarm: () => boolean
  show: (payload: Payload, mode: Mode) => void
  hide: (tooltipId: string, instant?: boolean) => void
  reset: () => void
}

interface TriggerState {
  open: Timer
  press: Timer
  press0: { x: number; y: number; id: number } | null
  suppressClick: boolean
}

type TriggerProps = Required<Omit<WarmTooltipProps, 'delay' | 'warmWindow' | 'shortcut'>> &
  Pick<WarmTooltipProps, 'delay' | 'warmWindow' | 'shortcut'>

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const LEAN_SPRING = { stiffness: 260, damping: 22, mass: 0.4 }
const FULL_LEAN_SPEED = 1200
const SIGN: Record<WarmTooltipSide, number> = { top: 1, bottom: -1, left: -1, right: 1 }
const ORIGIN: Record<WarmTooltipSide, string> = {
  top: 'center bottom',
  bottom: 'center top',
  left: 'right center',
  right: 'left center',
}
const SIZES: Record<WarmTooltipSize, { font: number; px: number; py: number }> = {
  sm: { font: 11.5, px: 8, py: 5 },
  md: { font: 12.5, px: 10, py: 6 },
  lg: { font: 13.5, px: 12, py: 7 },
}
const MARGIN = 8
const HOLD_SLOP = 10
const SWAP = 0.14
const SWAP_SHIFT = 10
const RISE = 4
const GRACE = 80

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
const horizontal = (side: WarmTooltipSide) => side === 'top' || side === 'bottom'

const anchorOf = (rect: DOMRect, side: WarmTooltipSide, gap: number): [number, number] => {
  if (side === 'top') return [rect.left + rect.width / 2, rect.top - gap]
  if (side === 'bottom') return [rect.left + rect.width / 2, rect.bottom + gap]
  if (side === 'left') return [rect.left - gap, rect.top + rect.height / 2]
  return [rect.right + gap, rect.top + rect.height / 2]
}

const layoutOf = (x: number, y: number, width: number, height: number, side: WarmTooltipSide) => {
  if (horizontal(side)) {
    const X = clamp(x - width / 2, MARGIN, Math.max(MARGIN, window.innerWidth - MARGIN - width))
    return { X, Y: side === 'top' ? y - height : y }
  }
  const Y = clamp(y - height / 2, MARGIN, Math.max(MARGIN, window.innerHeight - MARGIN - height))
  return { X: side === 'left' ? x - width : x, Y }
}

// Solid has no useId; a module counter gives the same unique-per-instance ids.
let uidCounter = 0
const nextId = () => `warm-tooltip-${++uidCounter}`

const GroupContext = createContext<GroupApi | null>(null)

export const WarmTooltipGroup = (props: WarmTooltipGroupProps) => {
  const reduce = usePrefersReducedMotion()
  const id = nextId()
  const [current, setCurrent] = createSignal<Payload | null>(null)
  const [state, setState] = createSignal<Phase>('closed')
  const st: GroupState = {
    state: 'closed',
    current: null,
    mode: 'cold',
    instant: false,
    warmUntil: -Infinity,
    warm: false,
    swap: { dir: 0, across: false },
    closeTimer: undefined,
    leaveTimer: undefined,
    warmTimer: undefined,
  }
  const [textEl, setTextEl] = createSignal<HTMLSpanElement | null>(null)
  let overlayEl: HTMLSpanElement | null = null
  let surfaceEl: HTMLSpanElement | null = null
  let arrowEl: HTMLSpanElement | null = null
  let prevSwapId: string | null = null
  let presenceAnim: AnimationPlaybackControls | null = null
  // Upstream AnimatePresence overlaps the exiting and entering content layers
  // (both `absolute inset-0` inside the surface). The same stack is modeled
  // here: `layers` holds every payload still rendered; exiting ones animate
  // out and remove themselves on complete.
  const [layers, setLayers] = createSignal<Payload[]>([])
  const wrapEls = new Map<string, HTMLSpanElement>()
  const exitAnims = new Map<string, AnimationPlaybackControls>()

  // Upstream: useMotionValue network (ax/ay/w/h/presence + useVelocity + lean
  // spring). The values stay motion values; the derived transforms are written
  // imperatively from a rAF loop below (write()).
  const ax = motionValue(0)
  const ay = motionValue(0)
  const w = motionValue(0)
  const h = motionValue(0)
  const presence = motionValue(0)
  const speedSrc = motionValue(0)
  const leanUnit = springValue(speedSrc, LEAN_SPRING)
  const leanDeg = () => (reduce() ? 0 : (props.lean ?? 0))

  const write = () => {
    const overlay = overlayEl
    const surface = surfaceEl
    if (!overlay || !surface) return
    const c = st.current
    const side = c ? c.side : 'top'
    const x = ax.get()
    const y = ay.get()
    const width = w.get()
    const height = h.get()
    const { X, Y } = layoutOf(x, y, width, height, side)
    overlay.style.transform = `translate(${X}px, ${Y}px)`
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
    if (arrowEl) {
      const at = horizontal(side) ? clamp(x - X, 10, width - 10) : clamp(y - Y, 10, height - 10)
      if (horizontal(side)) {
        arrowEl.style.left = `${at}px`
        arrowEl.style.top = ''
      } else {
        arrowEl.style.top = `${at}px`
        arrowEl.style.left = ''
      }
    }
    if (reduce() || !c) {
      surface.style.transform = ''
      surface.style.opacity = ''
      surface.style.filter = ''
      return
    }
    const p = presence.get()
    const lean = leanUnit.get()
    const scale = c.popScale + (1 - c.popScale) * p
    const rise = (1 - p) * RISE * SIGN[side] * (side === 'left' ? -1 : 1)
    const rotate = lean * leanDeg() * SIGN[side]
    const tx = horizontal(side) ? 0 : rise
    const ty = horizontal(side) ? rise : 0
    surface.style.transform = `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`
    surface.style.opacity = String(p)
    surface.style.filter = `blur(${c.popBlur * (1 - p)}px)`
  }

  let raf = 0
  let lastAx = 0
  let lastAy = 0
  let lastLoopT = 0
  const tickLoop = (nowAt: number) => {
    if (st.state === 'closed') {
      raf = 0
      return
    }
    const c = st.current
    const curX = ax.get()
    const curY = ay.get()
    if (c && lastLoopT !== 0) {
      const dt = Math.max(1, nowAt - lastLoopT) / 1000
      const vx = (curX - lastAx) / dt
      const vy = (curY - lastAy) / dt
      const v = !horizontal(c.side) ? vy : vx
      speedSrc.set(clamp(-v / FULL_LEAN_SPEED, -1, 1))
    }
    lastAx = curX
    lastAy = curY
    lastLoopT = nowAt
    write()
    raf = requestAnimationFrame(tickLoop)
  }
  createEffect(() => {
    if (state() === 'closed') return
    lastAx = ax.get()
    lastAy = ay.get()
    lastLoopT = 0
    if (!raf) raf = requestAnimationFrame(tickLoop)
    onCleanup(() => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
  })

  const isWarm = () => st.state !== 'closed' || now() < st.warmUntil
  const notify = () => {
    const next = isWarm()
    if (next === st.warm) return
    st.warm = next
    props.onWarmChange?.(next)
  }

  const finishClose = () => {
    st.state = 'closed'
    st.current = null
    setState('closed')
    setCurrent(null)
    notify()
  }

  const show = (payload: Payload, mode: Mode) => {
    clearTimeout(st.closeTimer)
    clearTimeout(st.leaveTimer)
    const prev = st.current
    const fresh = st.state === 'closed'
    if (prev && prev.id !== payload.id) {
      const [px, py] = anchorOf(prev.trigger.getBoundingClientRect(), prev.side, prev.gap)
      const [nx, ny] = anchorOf(payload.trigger.getBoundingClientRect(), payload.side, payload.gap)
      const across = !horizontal(payload.side)
      st.swap = { dir: Math.sign(across ? ny - py : nx - px) || 1, across }
    } else {
      st.swap = { dir: 0, across: !horizontal(payload.side) }
    }
    st.mode = fresh ? mode : mode === 'instant' ? 'instant' : 'move'
    st.instant = mode === 'instant'
    st.current = payload
    st.state = 'open'
    if (fresh) {
      // Reopen after a full close: the old portal (and its layers) is gone.
      exitAnims.forEach(a => a.stop())
      exitAnims.clear()
      setLayers([payload])
    } else if (prev && prev.id !== payload.id) {
      // Content swap: exit every stale layer, stack the new one on top.
      exitAnims.get(payload.id)?.stop()
      exitAnims.delete(payload.id)
      layers().forEach(layer => {
        if (layer.id !== payload.id) exitLayer(layer)
      })
      setLayers(arr => (arr.some(l => l.id === payload.id) ? arr : [...arr, payload]))
    } else if (!layers().some(l => l.id === payload.id)) {
      setLayers([payload])
    }
    setCurrent(payload)
    setState('open')
    notify()
  }

  // Upstream LAYER "exit" variant: the old content layer animates out to the
  // opposite shift + blur while the new one animates in (AnimatePresence
  // default mode="sync"), then unmounts on complete.
  const exitLayer = (layer: Payload) => {
    exitAnims.get(layer.id)?.stop()
    const el = wrapEls.get(layer.id)
    if (!el) {
      setLayers(arr => arr.filter(l => l !== layer))
      return
    }
    const { dir, across } = st.swap
    const x1 = across ? 0 : -SWAP_SHIFT * dir
    const y1 = across ? -SWAP_SHIFT * dir : 0
    const controls = animate(
      el,
      { opacity: 0, transform: `translate(${x1}px, ${y1}px)`, filter: 'blur(3px)' },
      { duration: reduce() ? 0 : SWAP, ease: EASE_OUT },
    )
    exitAnims.set(layer.id, controls)
    void controls.then(() => {
      if (exitAnims.get(layer.id) !== controls) return
      exitAnims.delete(layer.id)
      setLayers(arr => arr.filter(l => l !== layer))
    })
  }

  const beginClose = (instantClose: boolean) => {
    const c = st.current
    if (!c || st.state !== 'open') return
    st.state = 'closing'
    setState('closing')
    st.warmUntil = now() + c.warmWindow
    clearTimeout(st.warmTimer)
    st.warmTimer = setTimeout(notify, c.warmWindow + 1)
    if (instantClose) {
      presence.jump(0)
      finishClose()
      return
    }
    const closeMs = Math.round(c.popDuration * 0.8)
    presenceAnim?.stop()
    presenceAnim = animate(presence, 0, { duration: closeMs / 1000, ease: EASE_OUT })
    st.closeTimer = setTimeout(finishClose, closeMs)
  }

  const hide = (tooltipId: string, instantClose?: boolean) => {
    const c = st.current
    if (!c || c.id !== tooltipId || st.state !== 'open') return
    clearTimeout(st.leaveTimer)
    if (instantClose || st.instant) {
      beginClose(true)
      return
    }
    st.leaveTimer = setTimeout(() => beginClose(false), GRACE)
  }

  const reset = () => {
    if (st.current) hide(st.current.id, true)
    st.warmUntil = -Infinity
    clearTimeout(st.warmTimer)
    notify()
  }

  const group: GroupApi = {
    id,
    get delay() {
      return props.delay ?? 400
    },
    get warmWindow() {
      return props.warmWindow ?? 300
    },
    get activeId() {
      return current()?.id ?? null
    },
    isWarm,
    show: (payload, mode) => show(payload, mode),
    hide: (tooltipId, instantClose) => hide(tooltipId, instantClose),
    reset: () => reset(),
  }

  onMount(() => {
    if (typeof props.ref === 'function') props.ref({ reset })
  })

  // Upstream useLayoutEffect on [current, state]: measure + position/spring.
  createEffect(() => {
    const c = current()
    const phase = state()
    const text = textEl()
    if (!c || !text || phase !== 'open') return
    const [tx, ty] = anchorOf(c.trigger.getBoundingClientRect(), c.side, c.gap)
    const tw = text.offsetWidth + c.px * 2
    const th = text.offsetHeight + c.py * 2
    const mode = st.mode
    const reduced = reduce()
    // Enter half of upstream's AnimatePresence (the keyed motion.span's
    // "enter" -> "show" variants) — runs in every mode, like upstream.
    const freshWrap = wrapEls.get(c.id)
    if (prevSwapId !== c.id && freshWrap && st.swap.dir !== 0) {
      const { dir, across } = st.swap
      const x0 = across ? 0 : SWAP_SHIFT * dir
      const y0 = across ? SWAP_SHIFT * dir : 0
      const swapAnim = animate(
        freshWrap,
        {
          opacity: [0, 1],
          transform: [`translate(${x0}px, ${y0}px)`, 'translate(0px, 0px)'],
          filter: ['blur(3px)', 'blur(0px)'],
        },
        { duration: reduced ? 0 : SWAP, ease: EASE_OUT },
      )
      onCleanup(() => swapAnim.stop())
    }
    prevSwapId = c.id
    const travel = props.travel ?? 320
    if (mode === 'move' && !reduced && travel > 0) {
      const spring = { type: 'spring' as const, duration: travel / 1000, bounce: 0.1 }
      const anims = [
        animate(ax, tx, spring),
        animate(ay, ty, spring),
        animate(w, tw, spring),
        animate(h, th, spring),
        animate(presence, 1, { duration: 0.12, ease: EASE_OUT }),
      ]
      onCleanup(() => anims.forEach(a => a.stop()))
      write()
      return
    }
    ax.jump(tx)
    ay.jump(ty)
    w.jump(tw)
    h.jump(th)
    if (mode === 'cold') {
      presence.jump(0)
      presenceAnim?.stop()
      presenceAnim = animate(presence, 1, { duration: c.popDuration / 1000, ease: EASE_OUT })
      // No per-effect cleanup here: upstream let this animation run past effect
      // re-runs (a beginClose() animation replaces presenceAnim). Stopping it on
      // re-run would freeze the close fade. Disposal happens in onCleanup below.
    } else {
      presence.jump(1)
    }
    write()
  })

  createEffect(() => {
    if (state() === 'closed') return
    let followRaf = 0
    const follow = () => {
      cancelAnimationFrame(followRaf)
      followRaf = requestAnimationFrame(() => {
        const c = st.current
        if (!c) return
        const [tx, ty] = anchorOf(c.trigger.getBoundingClientRect(), c.side, c.gap)
        ax.jump(tx)
        ay.jump(ty)
      })
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden' && st.current) hide(st.current.id, true)
    }
    window.addEventListener('scroll', follow, { capture: true, passive: true })
    window.addEventListener('resize', follow)
    document.addEventListener('visibilitychange', onHidden)
    onCleanup(() => {
      cancelAnimationFrame(followRaf)
      window.removeEventListener('scroll', follow, { capture: true })
      window.removeEventListener('resize', follow)
      document.removeEventListener('visibilitychange', onHidden)
    })
  })

  onCleanup(() => {
    clearTimeout(st.closeTimer)
    clearTimeout(st.leaveTimer)
    clearTimeout(st.warmTimer)
    presenceAnim?.stop()
    exitAnims.forEach(a => a.stop())
    ax.stop()
    ay.stop()
    w.stop()
    h.stop()
    presence.stop()
    speedSrc.stop()
    leanUnit.stop()
  })

  return (
    <GroupContext.Provider value={group}>
      {props.children}
      <Show when={state() !== 'closed' && current()}>
        {c => (
          <Portal>
            <span
              ref={el => {
                overlayEl = el
                onCleanup(() => {
                  if (overlayEl === el) overlayEl = null
                })
              }}
              id={id}
              role="tooltip"
              class="pointer-events-none fixed top-0 left-0 z-[9999] block [font-family:inherit]"
              data-side={c().side}
              style={{
                '--wt-surface': c().surfaceColor,
                '--wt-ink': c().inkColor,
                '--wt-radius': `${c().radius}px`,
                '--wt-font': `${c().font}px`,
                '--wt-origin': ORIGIN[c().side],
              }}
            >
              <span
                ref={el => {
                  surfaceEl = el
                  onCleanup(() => {
                    if (surfaceEl === el) surfaceEl = null
                  })
                }}
                class="absolute inset-0 rounded-[var(--wt-radius)] [background:var(--wt-surface)] [color:var(--wt-ink)] [box-shadow:0_1px_2px_rgba(0,0,0,0.12),0_8px_24px_-8px_rgba(0,0,0,0.45)] [transform-origin:var(--wt-origin)] contrast-more:[box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--wt-ink)_40%,transparent)]"
                style={{ opacity: 0 }}
              >
                <span class="absolute inset-0">
                  <For each={layers()}>
                    {layer => (
                      <span
                        ref={el => {
                          wrapEls.set(layer.id, el)
                          onCleanup(() => {
                            if (wrapEls.get(layer.id) === el) wrapEls.delete(layer.id)
                          })
                        }}
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <span
                          ref={el => {
                            setTextEl(el)
                          }}
                          class="inline-flex items-center gap-[7px] whitespace-nowrap font-medium leading-[1.2] tracking-[-0.01em] [font-size:var(--wt-font)]"
                        >
                          {layer.content}
                          {layer.shortcut ? (
                            <kbd class="inline-flex h-[1.55em] items-center rounded-[0.4em] px-[0.45em] text-[0.86em] font-medium tracking-[0.02em] tabular-nums [font-family:inherit] [background:color-mix(in_srgb,var(--wt-ink)_9%,transparent)] [box-shadow:inset_0_-1px_0_color-mix(in_srgb,var(--wt-ink)_12%,transparent)] [color:color-mix(in_srgb,var(--wt-ink)_72%,transparent)]">
                              {layer.shortcut}
                            </kbd>
                          ) : null}
                        </span>
                      </span>
                    )}
                  </For>
                </span>
                {c().arrow ? (
                  <span
                    ref={el => {
                      arrowEl = el
                      onCleanup(() => {
                        if (arrowEl === el) arrowEl = null
                      })
                    }}
                    class="absolute -m-1 h-2 w-2 rounded-[2px] [background:var(--wt-surface)] [transform:rotate(45deg)] data-[side=top]:bottom-[1px] data-[side=bottom]:top-[1px] data-[side=left]:right-[1px] data-[side=right]:left-[1px]"
                    data-side={c().side}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </span>
          </Portal>
        )}
      </Show>
    </GroupContext.Provider>
  )
}

const Trigger = (p: TriggerProps) => {
  // Upstream did the same cast: Trigger only renders under a provider.
  const group = readContext(GroupContext) as GroupApi
  const id = nextId()
  let triggerEl: HTMLSpanElement | null = null
  const [fuse, setFuse] = createSignal<'idle' | 'arming'>('idle')
  const [pressing, setPressing] = createSignal(false)
  const t: TriggerState = { open: undefined, press: undefined, press0: null, suppressClick: false }
  const preset = () => SIZES[p.size] || SIZES.md
  const coldDelay = () => p.delay ?? group.delay
  const active = () => group.activeId === id

  const payload = (): Payload => ({
    id,
    trigger: triggerEl as HTMLSpanElement,
    content: p.content,
    shortcut: p.shortcut,
    side: p.side,
    gap: p.gap,
    arrow: p.arrow,
    surfaceColor: p.surfaceColor,
    inkColor: p.inkColor,
    radius: p.radius,
    font: preset().font,
    px: preset().px,
    py: preset().py,
    popDuration: p.popDuration,
    popScale: p.popScale,
    popBlur: p.popBlur,
    warmWindow: p.warmWindow ?? group.warmWindow,
  })

  const hide = (instantClose?: boolean) => {
    clearTimeout(t.open)
    setFuse('idle')
    group.hide(id, instantClose)
  }

  const arm = () => {
    if (group.isWarm()) {
      group.show(payload(), 'warm')
      return
    }
    setFuse('arming')
    t.open = setTimeout(() => {
      setFuse('idle')
      group.show(payload(), 'cold')
    }, coldDelay())
  }

  const cancelPress = () => {
    clearTimeout(t.press)
    if (!t.press0) return
    t.press0 = null
    setPressing(false)
    setFuse('idle')
  }

  createEffect(() => {
    if (!p.disabled) return
    untrack(() => {
      cancelPress()
      hide(true)
    })
  })

  createEffect(() => {
    if (!active()) return
    const onOutside = (e: PointerEvent) => {
      if (triggerEl && !triggerEl.contains(e.target as Node)) hide(false)
    }
    document.addEventListener('pointerdown', onOutside, true)
    onCleanup(() => document.removeEventListener('pointerdown', onOutside, true))
  })

  // SOLID-ADAPTATION: upstream used onClickCapture; Solid has no capture-prop,
  // so the same capture-phase listener is attached manually (identical behavior).
  createEffect(() => {
    const el = triggerEl
    if (!el || p.disabled) return
    const onClickCapture = (e: MouseEvent) => {
      if (!t.suppressClick) return
      t.suppressClick = false
      e.preventDefault()
      e.stopPropagation()
    }
    el.addEventListener('click', onClickCapture, true)
    onCleanup(() => el.removeEventListener('click', onClickCapture, true))
  })

  // Upstream cloneElement'd `aria-describedby` onto its single child element.
  // Solid JSX cannot be cloned, so the same value is written onto the child's
  // DOM node (group id while active, the caller's original value otherwise).
  // Non-element children were invalid upstream (cloneElement threw); here they
  // simply pass through untouched.
  let originalDescribed: string | null = null
  let describedCaptured = false
  createEffect(() => {
    const child = p.children as unknown
    if (!(child instanceof HTMLElement)) return
    if (!describedCaptured) {
      describedCaptured = true
      originalDescribed = child.getAttribute('aria-describedby')
    }
    const value = active() ? group.id : originalDescribed
    if (value) child.setAttribute('aria-describedby', value)
    else child.removeAttribute('aria-describedby')
  })

  onCleanup(() => {
    clearTimeout(t.open)
    clearTimeout(t.press)
  })

  const handlers: JSX.HTMLAttributes<HTMLSpanElement> = p.disabled
    ? {}
    : {
        onPointerEnter: (e: PointerEvent) => {
          if (e.pointerType !== 'touch' && e.buttons === 0) arm()
        },
        onPointerLeave: (e: PointerEvent) => {
          if (e.pointerType !== 'touch') hide(false)
        },
        onPointerDown: (e: PointerEvent) => {
          if (e.pointerType === 'mouse') {
            hide(false)
            return
          }
          try {
            ;(e.currentTarget as HTMLSpanElement).setPointerCapture(e.pointerId)
          } catch {}
          t.press0 = { x: e.clientX, y: e.clientY, id: e.pointerId }
          setPressing(true)
          setFuse('arming')
          t.press = setTimeout(() => {
            t.suppressClick = true
            t.press0 = null
            setPressing(false)
            setFuse('idle')
            group.show(payload(), 'cold')
          }, p.longPress)
        },
        onPointerMove: (e: PointerEvent) => {
          const press = t.press0
          if (
            press &&
            press.id === e.pointerId &&
            Math.hypot(e.clientX - press.x, e.clientY - press.y) > HOLD_SLOP
          )
            cancelPress()
        },
        onPointerUp: () => cancelPress(),
        onPointerCancel: () => cancelPress(),
        onContextMenu: (e: MouseEvent) => {
          if (t.press0) e.preventDefault()
        },
        onFocus: (e: FocusEvent) => {
          if ((e.target as HTMLElement).matches?.(':focus-visible'))
            group.show(payload(), 'instant')
        },
        onBlur: () => hide(true),
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Escape') hide(true)
        },
      }

  return (
    <span
      ref={el => {
        triggerEl = el
      }}
      class={`relative inline-flex align-middle touch-manipulation [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent] data-[pressing]:select-none${p.class ? ` ${p.class}` : ''}${p.className ? ` ${p.className}` : ''}`}
      data-pressing={pressing() ? '' : undefined}
      style={{
        '--wt-surface': p.surfaceColor,
        '--wt-fuse-ms': `${pressing() ? p.longPress : coldDelay()}ms`,
        '--wt-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }}
      {...handlers}
    >
      {/* SOLID-ADAPTATION: upstream cloneElement'd `aria-describedby` onto the
          child; the effect above writes the same attribute onto the child's DOM
          node (group id while active, original value otherwise). */}
      {p.children}
      {p.showFuse ? (
        <span
          class="pointer-events-none absolute inset-x-1 h-[2px] rounded-[1px] origin-left opacity-0 [transform:scaleX(0)] [background:var(--wt-surface)] [transition:transform_125ms_var(--wt-ease-out),opacity_125ms_var(--wt-ease-out)] data-[side=top]:-top-1 data-[side=bottom]:-bottom-1 data-[side=left]:inset-y-1 data-[side=left]:inset-x-auto data-[side=left]:h-auto data-[side=left]:w-[2px] data-[side=left]:origin-top data-[side=left]:[transform:scaleY(0)] data-[side=left]:-left-1 data-[side=right]:inset-y-1 data-[side=right]:inset-x-auto data-[side=right]:h-auto data-[side=right]:w-[2px] data-[side=right]:origin-top data-[side=right]:[transform:scaleY(0)] data-[side=right]:-right-1 data-[fuse=arming]:opacity-100 data-[fuse=arming]:[transform:scaleX(1)] data-[fuse=arming]:[transition:transform_var(--wt-fuse-ms)_linear,opacity_80ms_var(--wt-ease-out)] data-[side=left]:data-[fuse=arming]:[transform:scaleY(1)] data-[side=right]:data-[fuse=arming]:[transform:scaleY(1)]"
          data-side={p.side}
          data-fuse={fuse()}
          aria-hidden="true"
        />
      ) : null}
    </span>
  )
}

const WarmTooltip = (props: WarmTooltipProps) => {
  const context = readContext(GroupContext)
  const forwarded: TriggerProps = {
    content: props.content,
    shortcut: props.shortcut,
    children: props.children,
    side: props.side ?? 'top',
    delay: props.delay,
    warmWindow: props.warmWindow,
    surfaceColor: props.surfaceColor ?? '#f5f5f5',
    inkColor: props.inkColor ?? '#18181b',
    size: props.size ?? 'md',
    radius: props.radius ?? 8,
    gap: props.gap ?? 8,
    arrow: props.arrow ?? true,
    popDuration: props.popDuration ?? 160,
    popScale: props.popScale ?? 0.94,
    popBlur: props.popBlur ?? 4,
    showFuse: props.showFuse ?? false,
    longPress: props.longPress ?? 500,
    disabled: props.disabled ?? false,
    className: props.className ?? '',
    class: props.class ?? '',
  }
  if (context) return <Trigger {...forwarded} />
  return (
    <WarmTooltipGroup delay={props.delay} warmWindow={props.warmWindow}>
      <Trigger {...forwarded} />
    </WarmTooltipGroup>
  )
}

export default WarmTooltip
