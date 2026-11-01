import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

export type DodgeAxis = 'both' | 'x' | 'y'
export type DodgeWall = 'clamp' | 'bounce'
export type DodgeFieldState = { dodges: number; gave: boolean; caught: boolean; fleeing: boolean }

export interface DodgeFieldProps {
  children?: JSX.Element | ((state: DodgeFieldState) => JSX.Element)
  taunts?: string[]
  notice?: string
  inkColor?: string
  contrastColor?: string
  fieldHeight?: number
  reach?: number
  radius?: number
  falloff?: number
  fleeDuration?: number
  returnDuration?: number
  returnBounce?: number
  axis?: DodgeAxis
  wall?: DodgeWall
  patience?: number
  disabled?: boolean
  onDodge?: (count: number) => void
  onRelent?: () => void
  onCatch?: () => void
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

const COUNT_LINE = 0.55
const DEAD_ZONE = 6
const CAUGHT_HOLD_MS = 760
const INSET = 12
const DEFAULT_TAUNTS = ['Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay']

const wallIt = (t: number, room: number, wall: DodgeWall) => {
  if (wall === 'bounce') {
    if (t > room) return Math.max(-room, 2 * room - t)
    if (t < -room) return Math.min(room, -2 * room - t)
    return t
  }
  return Math.min(room, Math.max(-room, t))
}
const bearingOf = (dx: number, dy: number, d: number, axis: DodgeAxis) => {
  if (axis === 'x') return { x: Math.sign(dx) || 1, y: 0 }
  if (axis === 'y') return { x: 0, y: Math.sign(dy) || 1 }
  return { x: dx / d, y: dy / d }
}

const DodgeField = (props: DodgeFieldProps) => {
  const taunts = () => props.taunts ?? DEFAULT_TAUNTS
  const inkColor = () => props.inkColor ?? '#f5f5f5'
  const contrastColor = () => props.contrastColor ?? '#18181b'
  const fieldHeight = () => props.fieldHeight ?? 240
  const reach = () => props.reach ?? 72
  const radius = () => props.radius ?? 120
  const falloff = () => props.falloff ?? 2
  const fleeDuration = () => props.fleeDuration ?? 130
  const returnDuration = () => props.returnDuration ?? 620
  const returnBounce = () => props.returnBounce ?? 0.1
  const axis = () => props.axis ?? 'both'
  const wall = () => props.wall ?? 'clamp'
  const patience = () => props.patience ?? 4

  let fieldEl: HTMLDivElement | undefined
  let moverEl: HTMLDivElement | undefined
  const x = motionValue(0)
  const y = motionValue(0)
  const reduce = usePrefersReducedMotion()
  const [fine, setFine] = createSignal(true)
  const [inside, setInside] = createSignal(false)
  const [dodges, setDodges] = createSignal(0)
  const [caught, setCaught] = createSignal(false)
  const gave = () => dodges() >= Math.max(1, patience())
  const still = () => gave() || caught() || (props.disabled ?? false) || !!reduce()

  let px = 0
  let py = 0
  let hasPointer = false
  const bearing = { x: 1, y: 0 }
  let armed = true
  const room = { x: 0, y: 0 }
  let raf = 0
  let hold: ReturnType<typeof setTimeout> | undefined

  const applyTransform = () => {
    moverEl?.style.setProperty('transform', `translate(${x.get()}px, ${y.get()}px)`)
  }

  onMount(() => {
    const offs = [x.on('change', applyTransform), y.on('change', applyTransform)]
    applyTransform()
    onCleanup(() => {
      offs.forEach(off => off())
      x.stop()
      y.stop()
      clearTimeout(hold)
    })
  })

  // Upstream: useEffect(measure, []) — ResizeObserver on field + mover.
  onMount(() => {
    const field = fieldEl
    const mover = moverEl
    if (!field || !mover) return
    const measure = () => {
      room.x = Math.max(0, (field.clientWidth - mover.offsetWidth) / 2 - INSET)
      room.y = Math.max(0, (field.clientHeight - mover.offsetHeight) / 2 - INSET)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(field)
    observer.observe(mover)
    onCleanup(() => observer.disconnect())
  })

  const frame = () => {
    raf = 0
    const field = fieldEl
    if (!field) return
    const L = {
      reach: reach(),
      radius: radius(),
      falloff: falloff(),
      axis: axis(),
      wall: wall(),
      still: untrack(still),
      inside: untrack(inside),
      reduce: reduce(),
    }
    const rect = field.getBoundingClientRect()
    const zoom = rect.width / (field.offsetWidth || rect.width) || 1
    const dx = hasPointer ? (px - (rect.left + rect.width / 2)) / zoom : Infinity
    const dy = hasPointer ? (py - (rect.top + rect.height / 2)) / zoom : Infinity
    const d = Math.hypot(dx, dy)
    const isInside = d <= L.radius
    if (!isInside && !L.inside) return
    if (!L.still) {
      if (d < L.radius * COUNT_LINE) {
        if (armed) {
          armed = false
          setDodges(n => n + 1)
        }
      } else if (d > L.radius) {
        armed = true
      }
    }
    if (Number.isFinite(d) && d > DEAD_ZONE) {
      const b = bearingOf(dx, dy, d, L.axis)
      bearing.x = b.x
      bearing.y = b.y
    }
    const flee = isInside && !L.still ? (1 - d / L.radius) ** L.falloff : 0
    const tx = wallIt(-bearing.x * flee * L.reach, room.x, L.wall)
    const ty = wallIt(-bearing.y * flee * L.reach, room.y, L.wall)
    if (L.reduce) {
      x.jump(0)
      y.jump(0)
    } else {
      const cfg =
        flee > 0
          ? { type: 'spring' as const, duration: fleeDuration() / 1000, bounce: 0 }
          : { type: 'spring' as const, duration: returnDuration() / 1000, bounce: returnBounce() }
      animate(x, tx, cfg)
      animate(y, ty, cfg)
    }
    if (isInside !== L.inside) setInside(isInside)
  }

  // Upstream: useEffect on [disabled, frame] — media query sync + listeners.
  createEffect(() => {
    const disabled = props.disabled ?? false
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(query.matches)
    sync()
    query.addEventListener('change', sync)
    if (query.matches && !disabled) {
      const tick = () => {
        if (!raf) raf = requestAnimationFrame(frame)
      }
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return
        px = e.clientX
        py = e.clientY
        hasPointer = true
        tick()
      }
      const onLeave = () => {
        hasPointer = false
        tick()
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('scroll', tick, { passive: true, capture: true })
      document.addEventListener('pointerleave', onLeave)
      window.addEventListener('blur', onLeave)
      onCleanup(() => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('scroll', tick, { capture: true })
        document.removeEventListener('pointerleave', onLeave)
        window.removeEventListener('blur', onLeave)
        cancelAnimationFrame(raf)
        raf = 0
      })
    }
    onCleanup(() => query.removeEventListener('change', sync))
  })

  // Upstream: useEffect on [still] — kick a frame when stillness changes.
  createEffect(() => {
    still()
    if (!raf) raf = requestAnimationFrame(frame)
  })
  createEffect(() => {
    const d = dodges()
    if (d) untrack(() => props.onDodge?.(d))
  })
  createEffect(() => {
    if (gave()) untrack(() => props.onRelent?.())
  })

  const handleClick = () => {
    setCaught(true)
    untrack(() => props.onCatch?.())
    clearTimeout(hold)
    hold = setTimeout(() => {
      setCaught(false)
      setDodges(0)
      armed = false
    }, CAUGHT_HOLD_MS)
  }

  const state = (): DodgeFieldState => ({
    dodges: dodges(),
    gave: gave(),
    caught: caught(),
    fleeing: inside() && !still(),
  })
  const index = () =>
    gave() || caught() ? taunts().length - 1 : Math.min(dodges(), Math.max(0, taunts().length - 2))

  // Built once so the taunt spans persist and their data-[active] transitions
  // animate (upstream re-rendered in place; Solid achieves the same by keeping
  // the default content static while its attributes stay reactive).
  const defaultContent = (
    <button
      type="button"
      class="m-0 inline-flex h-[52px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 px-7 text-[18px] leading-none font-medium tracking-[-0.012em] select-none [font-family:inherit] [-webkit-tap-highlight-color:transparent] [background:color-mix(in_srgb,var(--df-ink)_8%,transparent)] [color:color-mix(in_srgb,var(--df-ink)_72%,transparent)] [transition:transform_160ms_var(--df-ease-out),background-color_220ms_ease,color_220ms_ease] active:[transform:scale(0.97)] motion-reduce:active:[transform:none] motion-reduce:[transition:background-color_220ms_ease,color_220ms_ease] [@media(hover:hover)_and_(pointer:fine)]:hover:[color:color-mix(in_srgb,var(--df-ink)_90%,transparent)] group-data-[relented=true]:[color:var(--df-ink)] group-data-[relented=true]:hover:[color:var(--df-ink)] group-data-[caught=true]:[background:var(--df-ink)] group-data-[caught=true]:[color:var(--df-contrast)] group-data-[caught=true]:hover:[color:var(--df-contrast)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[3px] focus-visible:[outline-color:color-mix(in_srgb,var(--df-ink)_60%,transparent)]"
      aria-label={taunts()[0]}
    >
      <span class="grid">
        <For each={taunts()}>
          {(taunt, i) => (
            <span
              class="[grid-area:1/1] whitespace-nowrap [transition:opacity_200ms_ease,filter_200ms_ease] data-[active=false]:opacity-0 data-[active=false]:[filter:blur(2px)] motion-reduce:data-[active=false]:[filter:none]"
              data-active={i() === index() ? 'true' : 'false'}
              aria-hidden="true"
            >
              {taunt}
            </span>
          )}
        </For>
      </span>
    </button>
  )

  const content = createMemo<JSX.Element>(() => {
    const c = props.children
    if (typeof c === 'function') return c(state())
    if (c) return c
    return defaultContent
  })

  return (
    <div
      ref={fieldEl}
      class={`relative grid w-full place-items-center [height:var(--df-height)]${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-coarse={fine() ? undefined : ''}
      data-flat={reduce() ? '' : undefined}
      style={{
        '--df-ink': inkColor(),
        '--df-contrast': contrastColor(),
        '--df-height': `${fieldHeight()}px`,
        '--df-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        ...props.style,
      }}
    >
      <div
        ref={moverEl}
        class="group inline-grid [will-change:transform]"
        data-fled={inside() && !still() ? 'true' : 'false'}
        data-relented={gave() ? 'true' : 'false'}
        data-caught={caught() ? 'true' : 'false'}
        onClick={handleClick}
      >
        {content()}
      </div>
      {!fine() && props.notice ? (
        <p class="pointer-events-none absolute inset-x-0 bottom-3 m-0 text-center text-[12px] [color:color-mix(in_srgb,var(--df-ink)_55%,transparent)]">
          {props.notice}
        </p>
      ) : null}
    </div>
  )
}

export default DodgeField
