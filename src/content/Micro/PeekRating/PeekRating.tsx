import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import type { IconSvgObject } from '@/lib/HugeiconsIcon'
import { FavouriteIcon, FlashIcon, StarIcon } from '@hugeicons/core-free-icons'

export type PeekRatingShape = 'star' | 'heart' | 'bolt'

export interface PeekRatingProps {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  onPreview?: (value: number | null) => void
  count?: number
  shape?: PeekRatingShape
  icon?: JSX.Element
  labels?: string[]
  activeColor?: string
  idleColor?: string
  tipColor?: string
  tipTextColor?: string
  size?: number
  lift?: number
  magnify?: number
  riseDuration?: number
  popScale?: number
  showTip?: boolean
  allowClear?: boolean
  readOnly?: boolean
  disabled?: boolean
  ariaLabel?: string
  className?: string
  class?: string
}

interface GestureState {
  hover: number | null
  pressing: boolean
  pointerId: number | null
  settled: boolean
  rect: DOMRect | null
  rtl: boolean
}

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const SHAPES: Record<PeekRatingShape, IconSvgObject> = {
  star: StarIcon,
  heart: FavouriteIcon,
  bolt: FlashIcon,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const PeekRating = (props: PeekRatingProps) => {
  const count = () => props.count ?? 5
  const allowClear = () => props.allowClear ?? true
  const showTip = () => props.showTip ?? true
  const [inner, setInner] = createSignal(props.defaultValue ?? 0)
  const value = () => clamp(props.value ?? inner(), 0, count())
  const interactive = () => !props.readOnly && !props.disabled

  let rootEl: HTMLDivElement | undefined
  let rowEl: HTMLDivElement | undefined
  let tipEl: HTMLSpanElement | undefined
  const starEls: (HTMLElement | null)[] = []
  const liftEls: (HTMLSpanElement | null)[] = []
  const glyphEls: (HTMLSpanElement | null)[] = []
  const st: GestureState = {
    hover: null,
    pressing: false,
    pointerId: null,
    settled: false,
    rect: null,
    rtl: false,
  }

  const paint = () => {
    const { hover, settled, rtl } = st
    const previewing = hover !== null && !settled
    const shown = previewing ? hover + 1 : value()
    const still = reducedMotion()

    for (let i = 0; i < count(); i++) {
      const liftEl = liftEls[i]
      const glyphEl = glyphEls[i]
      if (!liftEl || !glyphEl) continue
      const lifted = previewing && !still && i <= hover
      liftEl.style.transform = lifted
        ? `translateY(${-(props.lift ?? 6)}px) scale(${i === hover ? (props.magnify ?? 1.15) : 1})`
        : 'translateY(0px) scale(1)'
      glyphEl.dataset.lit = String(i < shown)
    }

    const tip = tipEl
    if (!tip) return
    if (previewing && showTip()) {
      const row = rowEl
      const slot = row ? row.clientWidth / count() : (props.size ?? 28)
      const visual = rtl ? count() - 1 - hover : hover
      const wasHidden = tip.dataset.show !== 'true'
      if (wasHidden) tip.style.transition = 'none'
      tip.textContent = props.labels?.[hover] ?? String(hover + 1)
      tip.style.transform = `translate(calc(${slot * (visual + 0.5)}px - 50%), 0)`
      if (wasHidden) {
        void tip.offsetWidth
        tip.style.transition = ''
      }
      tip.dataset.show = 'true'
    } else {
      tip.dataset.show = 'false'
    }
  }

  // Upstream ran paint in a layout effect after every render.
  createEffect(() => paint())

  const setHover = (index: number | null) => {
    if (index === st.hover) return
    st.hover = index
    if (index !== null) st.settled = false
    paint()
    untrack(() => props.onPreview?.(index === null ? null : index + 1))
  }

  const measure = () => {
    const row = rowEl
    if (!row) return
    st.rect = row.getBoundingClientRect()
    st.rtl = getComputedStyle(row).direction === 'rtl'
  }

  const indexAt = (x: number, y: number): number | null => {
    const { rect, pressing, rtl } = st
    if (!rect?.width) return null
    if (pressing && (y < rect.top - (props.size ?? 28) || y > rect.bottom + (props.size ?? 28)))
      return null
    const index = clamp(Math.floor(((x - rect.left) / rect.width) * count()), 0, count() - 1)
    return rtl ? count() - 1 - index : index
  }

  const commit = (next: number, pop = true) => {
    if (props.value === undefined) setInner(next)
    untrack(() => props.onChange?.(next))
    st.settled = true
    paint()
    const glyph = glyphEls[next - 1]
    if (
      pop &&
      next > 0 &&
      (props.popScale ?? 1.3) > 1 &&
      glyph &&
      typeof glyph.animate === 'function' &&
      !reducedMotion()
    ) {
      glyph.getAnimations().forEach(animation => animation.cancel())
      glyph.animate(
        [
          { transform: 'scale(1)', easing: EASE_OUT },
          { transform: `scale(${props.popScale ?? 1.3})`, offset: 0.35, easing: EASE_OUT },
          { transform: 'scale(1)' },
        ],
        { duration: 300 },
      )
    }
  }

  const handlePointerEnter = (e: PointerEvent) => {
    if (!interactive() || e.pointerType !== 'mouse') return
    rootEl?.removeAttribute('data-instant')
    measure()
  }

  const handlePointerDown = (e: PointerEvent) => {
    if (!interactive() || e.button !== 0 || st.pointerId !== null) return
    rootEl?.removeAttribute('data-instant')
    const el = e.currentTarget as HTMLDivElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    st.pointerId = e.pointerId
    st.pressing = true
    measure()
    setHover(indexAt(e.clientX, e.clientY))
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!interactive()) return
    const { pressing, pointerId } = st
    if (e.pointerType !== 'mouse' && !pressing) return
    if (pressing && e.pointerId !== pointerId) return
    if (!pressing && !st.rect) measure()
    setHover(indexAt(e.clientX, e.clientY))
  }

  const endPress = (e: PointerEvent) => {
    const { pressing, pointerId, hover } = st
    if (!pressing || e.pointerId !== pointerId) return
    st.pressing = false
    st.pointerId = null
    if (e.type === 'pointerup' && hover !== null) {
      const next = hover + 1
      commit(allowClear() && next === value() ? 0 : next)
    }
    if (e.pointerType !== 'mouse') setHover(null)
  }

  const handlePointerLeave = () => {
    if (!st.pressing) setHover(null)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!interactive()) return
    const min = allowClear() ? 0 : 1
    let next: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = clamp(value() + 1, min, count())
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = clamp(value() - 1, min, count())
        break
      case 'Home':
        next = 1
        break
      case 'End':
        next = count()
        break
      case 'Backspace':
      case 'Delete':
        if (!allowClear()) return
        next = 0
        break
      case ' ':
      case 'Enter': {
        const index = starEls.indexOf(e.target as HTMLElement)
        if (index === -1) return
        next = allowClear() && index + 1 === value() ? 0 : index + 1
        break
      }
      default:
        return
    }
    e.preventDefault()
    rootEl?.setAttribute('data-instant', 'true')
    st.hover = null
    commit(next, false)
    starEls[Math.max(next, 1) - 1]?.focus()
  }

  onMount(() => {
    const reset = () => {
      st.pressing = false
      st.pointerId = null
      setHover(null)
    }
    const onVisibility = () => {
      if (document.hidden) reset()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', reset)
    onCleanup(() => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', reset)
    })
  })

  const indices = createMemo(() => Array.from({ length: count() }, (_, k) => k))
  const shapeIcon = () => SHAPES[props.shape ?? 'star'] || SHAPES.star
  const tipRoom = () => (interactive() && showTip() ? Math.round((props.size ?? 28) * 0.9) : 0)

  return (
    <div
      ref={rootEl}
      role={props.readOnly ? 'img' : 'radiogroup'}
      aria-label={props.readOnly ? `${value()} of ${count()}` : (props.ariaLabel ?? 'Rating')}
      aria-disabled={props.disabled || undefined}
      class={`group inline-flex font-[inherit] text-inherit aria-disabled:pointer-events-none aria-disabled:opacity-50${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      style={{
        '--pr-active': props.activeColor ?? '#f5b400',
        '--pr-idle': props.idleColor ?? '#52525b',
        '--pr-tip': props.tipColor ?? '#27272a',
        '--pr-tip-text': props.tipTextColor ?? '#f5f5f5',
        '--pr-size': `${props.size ?? 28}px`,
        '--pr-gap': `${Math.round((props.size ?? 28) * 0.22)}px`,
        '--pr-room': `${(props.lift ?? 6) + tipRoom()}px`,
        '--pr-rise': `${props.riseDuration ?? 320}ms`,
        '--pr-ease-out': EASE_OUT,
      }}
      onKeyDown={props.readOnly ? undefined : handleKeyDown}
    >
      <div
        ref={rowEl}
        class="relative inline-flex touch-pan-y select-none items-end pt-[var(--pr-room)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
        onPointerEnter={handlePointerEnter}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onLostPointerCapture={endPress}
        onPointerLeave={handlePointerLeave}
      >
        {interactive() && showTip() ? (
          <span
            ref={(el: HTMLSpanElement) => {
              tipEl = el
            }}
            class="pointer-events-none absolute left-0 top-0 inline-flex h-[calc(var(--pr-size)*0.6)] items-center whitespace-nowrap rounded-full px-[calc(var(--pr-size)*0.3)] text-[length:calc(var(--pr-size)*0.38)] font-semibold leading-none tracking-[0.01em] opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.18)] [background:var(--pr-tip)] [color:var(--pr-tip-text)] [transition:transform_var(--pr-rise)_var(--pr-ease-out),opacity_180ms_ease] data-[show=true]:opacity-100 group-data-[instant=true]:[transition-duration:0ms] motion-reduce:[transition:opacity_180ms_ease]"
            aria-hidden="true"
          />
        ) : null}
        <For each={indices()}>
          {i => {
            const checked = () => value() === i + 1
            const label = () =>
              props.labels?.[i]
                ? `${i + 1} of ${count()}, ${props.labels?.[i]}`
                : `${i + 1} of ${count()}`
            return (
              <Dynamic
                component={props.readOnly ? 'span' : 'button'}
                ref={(el: HTMLElement) => {
                  starEls[i] = el
                }}
                type={props.readOnly ? undefined : 'button'}
                class="m-0 grid h-[calc(var(--pr-size)_+_8px)] w-[calc(var(--pr-size)_+_var(--pr-gap))] touch-manipulation place-items-center border-0 bg-transparent p-0 font-[inherit] text-inherit outline-none [@media(hover:hover)_and_(pointer:fine)]:cursor-pointer [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_color-mix(in_srgb,var(--pr-active)_70%,transparent)]"
                role={props.readOnly ? undefined : 'radio'}
                aria-checked={props.readOnly ? undefined : checked()}
                aria-label={props.readOnly ? undefined : label()}
                aria-hidden={props.readOnly || undefined}
                tabIndex={!interactive() ? -1 : (value() === 0 ? i === 0 : checked()) ? 0 : -1}
              >
                <span
                  ref={(el: HTMLSpanElement) => {
                    liftEls[i] = el
                  }}
                  class="block origin-bottom [transition:transform_var(--pr-rise)_var(--pr-ease-out)] group-data-[instant=true]:[transition-duration:0ms] motion-reduce:transition-none"
                >
                  <span
                    ref={(el: HTMLSpanElement) => {
                      glyphEls[i] = el
                    }}
                    class="block h-[var(--pr-size)] w-[var(--pr-size)] text-[var(--pr-idle)] [transition:color_160ms_ease] data-[lit=true]:text-[var(--pr-active)] group-data-[instant=true]:[transition-duration:0ms] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                  >
                    {/* Upstream passed fill="currentColor"; our lib maps color to
                        both fill and stroke, which renders identically. */}
                    {props.icon ?? (
                      <HugeiconsIcon
                        icon={shapeIcon()}
                        size={props.size ?? 28}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    )}
                  </span>
                </span>
              </Dynamic>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default PeekRating
