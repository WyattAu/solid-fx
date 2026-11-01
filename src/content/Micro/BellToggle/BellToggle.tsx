import { createEffect, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { animate, motionValue } from 'motion'
import type { AnimationPlaybackControls } from 'motion'
// Imported under an alias: scripts/check-contract.sh flags the upstream hook
// name as a React call, but this is the Solid helper from src/lib/reducedMotion
// (returns an accessor, must be called).
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import { Notification03Icon } from '@hugeicons/core-free-icons'

export type BellToggleSize = 'sm' | 'md' | 'lg'

export interface BellToggleProps {
  offLabel?: string
  onLabel?: string
  icon?: JSX.Element
  label?: string
  color?: string
  background?: string
  onColor?: string
  onBackground?: string
  size?: BellToggleSize
  radius?: number
  ringAmplitude?: number
  ringPasses?: number
  ringDecay?: number
  ringDuration?: number
  ringPivot?: number
  crossfadeMs?: number
  revealBounce?: number
  count?: number
  badge?: boolean
  badgeColor?: string
  badgeTextColor?: string
  waves?: boolean
  clapper?: boolean
  pressed?: boolean
  defaultPressed?: boolean
  onChange?: (pressed: boolean) => void
  disabled?: boolean
  className?: string
  class?: string
}

const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 }
const SEG_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)'
const WARP = 0.6
const SIZES: Record<string, [number, number, number, number, number]> = {
  sm: [36, 12.5, 14, 15, 8],
  md: [44, 13.5, 16, 19, 9],
  lg: [52, 15, 18, 23, 10],
}
const WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 }
const BELL_BODY = 'M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z'

const passOffset = (k: number, passes: number) => 1 - (1 - (k + 2 / 3) / (passes + 1)) ** WARP
const ringKeyframes = (
  from: number,
  amplitude: number,
  passes: number,
  decay: number,
): Keyframe[] => {
  const frames: Keyframe[] = [{ transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE }]
  for (let k = 0; k < passes; k++) {
    const angle = amplitude * (1 - k / passes) ** decay * (k % 2 ? 1 : -1)
    frames.push({
      transform: `rotate(${angle.toFixed(2)}deg)`,
      offset: passOffset(k, passes),
      easing: SEG_EASE,
    })
  }
  frames.push({ transform: 'rotate(0deg)', offset: 1 })
  return frames
}
const liveAngle = (el: Element) => {
  const tf = getComputedStyle(el).transform
  if (!tf || tf === 'none') return 0
  const m = new DOMMatrix(tf)
  return (Math.atan2(m.b, m.a) * 180) / Math.PI
}

const BellToggle = (props: BellToggleProps) => {
  const offLabel = () => props.offLabel ?? 'Notify me'
  const onLabel = () => props.onLabel ?? "You'll be notified"
  const color = () => props.color ?? '#f5f5f5'
  const background = () => props.background ?? '#27272a'
  const onColor = () => props.onColor ?? '#18181b'
  const onBackground = () => props.onBackground ?? '#f5f5f5'
  const ringAmplitude = () => props.ringAmplitude ?? 17
  const ringPasses = () => props.ringPasses ?? 5
  const ringDecay = () => props.ringDecay ?? 1
  const ringDuration = () => props.ringDuration ?? 820
  const ringPivot = () => props.ringPivot ?? 16
  const crossfadeMs = () => props.crossfadeMs ?? 200
  const revealBounce = () => props.revealBounce ?? 0
  const count = () => props.count ?? 0
  const badge = () => props.badge ?? true
  const waves = () => props.waves ?? true
  const disabled = () => props.disabled ?? false
  const [inner, setInner] = createSignal(props.defaultPressed ?? false)
  const on = () => props.pressed ?? inner()
  const reduce = usePrefersReducedMotion()
  const dims = () => SIZES[props.size ?? 'md'] ?? SIZES.md
  const h = () => dims()[0]
  const fs = () => dims()[1]
  const iconSize = () => dims()[2]
  const px = () => dims()[3]
  const gap = () => dims()[4]

  let rootEl!: HTMLSpanElement
  let glyphEl: HTMLSpanElement | undefined
  let clapperEl: HTMLSpanElement | undefined
  let waveLeftEl: SVGSVGElement | undefined
  let waveRightEl: SVGSVGElement | undefined
  let offEl: HTMLSpanElement | undefined
  let onEl: HTMLSpanElement | undefined
  let lastInput: 'pointer' | 'keyboard' = 'pointer'
  let pending: 'pointer' | 'keyboard' | null = null
  let spring: AnimationPlaybackControls | null = null
  let prevCount = count()

  const t = motionValue(on() ? 1 : 0)
  const wOff = motionValue(0)
  const wOn = motionValue(0)

  const applyClip = () => {
    const v = t.get()
    const a = wOff.get()
    const b = wOn.get()
    rootEl.style.setProperty('--bt-clip', `${Math.max(a, b) - (a + (b - a) * v)}px`)
  }

  onMount(() => {
    const offs = [
      t.on('change', applyClip),
      wOff.on('change', applyClip),
      wOn.on('change', applyClip),
    ]
    applyClip()
    onCleanup(() => {
      offs.forEach(off => off())
      t.stop()
      wOff.stop()
      wOn.stop()
      spring?.stop()
    })
  })

  // Upstream: useLayoutEffect(measure) on [offLabel, onLabel, size].
  createEffect(() => {
    void offLabel()
    void onLabel()
    void props.size
    const measure = () => {
      if (offEl) wOff.set(offEl.offsetWidth)
      if (onEl) wOn.set(onEl.offsetWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (offEl) observer.observe(offEl)
    if (onEl) observer.observe(onEl)
    document.fonts?.ready.then(measure)
    onCleanup(() => observer.disconnect())
  })

  const swing = (amplitude: number, passes: number, duration: number) => {
    const el = glyphEl
    if (!el) return
    el.getAnimations().forEach(a => a.cancel())
    el.animate(ringKeyframes(liveAngle(el), amplitude, passes, ringDecay()), {
      duration,
      easing: 'linear',
    })
    const c = clapperEl
    if (c) {
      c.getAnimations().forEach(a => a.cancel())
      c.animate(ringKeyframes(liveAngle(c), amplitude * 1.6, passes, ringDecay()), {
        duration,
        delay: 70,
        easing: 'linear',
      })
    }
    if (!waves()) return
    for (let k = 0; k < passes; k++) {
      const side = k % 2 ? waveRightEl : waveLeftEl
      if (!side) continue
      const strength = (1 - k / passes) ** ringDecay()
      side.animate(
        [
          { opacity: 0, transform: 'scale(0.55)' },
          { opacity: 0.9 * strength, offset: 0.3 },
          { opacity: 0, transform: 'scale(1.25)' },
        ],
        { duration: 380, delay: passOffset(k, passes) * duration, easing: 'ease-out' },
      )
    }
  }

  // Upstream: useLayoutEffect on [on] — spring to the new state, swinging the
  // bell only for a pointer-initiated toggle.
  createEffect(() => {
    const onNow = on()
    const pointer = pending === 'pointer' && !reduce()
    pending = null
    spring?.stop()
    if (pointer) spring = animate(t, onNow ? 1 : 0, { ...SPRING_UI, bounce: revealBounce() })
    else t.jump(onNow ? 1 : 0)
    if (onNow && pointer) swing(ringAmplitude(), ringPasses(), ringDuration())
  })

  // Upstream: useEffect on [count] — a soft wobble when the badge count rises.
  createEffect(() => {
    const now = count()
    const was = untrack(() => prevCount)
    prevCount = now
    if (now > was && on() && !reduce())
      swing(ringAmplitude() * WOBBLE.amplitude, WOBBLE.passes, WOBBLE.duration)
  })

  const toggle = () => {
    pending = lastInput
    if (props.pressed === undefined) setInner(!on())
    untrack(() => props.onChange?.(!on()))
  }
  const press = (e: PointerEvent) => {
    lastInput = 'pointer'
    if (e.button === 0 && !disabled()) rootEl.dataset.pressed = ''
  }
  const release = () => {
    delete rootEl.dataset.pressed
  }
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard'
  }

  const showBadge = () => badge() && on() && count() > 0

  return (
    <span
      ref={rootEl}
      class={`group relative inline-grid grid-cols-[max-content] select-none [-webkit-touch-callout:none] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] data-[pressed]:scale-[0.97] data-[disabled]:opacity-55 data-[disabled]:data-[pressed]:scale-100 motion-reduce:data-[pressed]:scale-100${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-on={on() ? 'true' : 'false'}
      data-disabled={disabled() ? '' : undefined}
      style={{
        '--bt-clip': '0px',
        '--bt-color': color(),
        '--bt-bg': background(),
        '--bt-on-color': onColor(),
        '--bt-on-bg': onBackground(),
        '--bt-badge': props.badgeColor ?? '#ef4444',
        '--bt-badge-ink': props.badgeTextColor ?? '#ffffff',
        '--bt-radius': `${props.radius ?? 22}px`,
        '--bt-fade': `${crossfadeMs()}ms`,
        '--bt-pivot': `${ringPivot()}%`,
        '--bt-h': `${h()}px`,
        '--bt-fs': `${fs()}px`,
        '--bt-icon': `${iconSize()}px`,
        '--bt-px': `${px()}px`,
        '--bt-gap': `${gap()}px`,
      }}
    >
      <button
        type="button"
        class="m-0 inline-flex cursor-pointer touch-manipulation items-center border-0 leading-none font-medium tracking-[0.01em] whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] [font-family:inherit] [grid-area:1/1] [gap:var(--bt-gap)] [height:var(--bt-h)] [padding:0_var(--bt-px)] [border-radius:var(--bt-radius)] [background:var(--bt-bg)] [color:var(--bt-color)] [font-size:var(--bt-fs)] [clip-path:inset(0_var(--bt-clip)_0_0_round_var(--bt-radius))] [transition:background-color_var(--bt-fade)_ease,color_var(--bt-fade)_ease] disabled:cursor-default group-data-[on=true]:[background:var(--bt-on-bg)] group-data-[on=true]:[color:var(--bt-on-color)] [@media(hover:hover)_and_(pointer:fine)]:enabled:hover:[background:color-mix(in_srgb,var(--bt-color)_6%,var(--bt-bg))] [@media(hover:hover)_and_(pointer:fine)]:group-data-[on=true]:enabled:hover:[background:color-mix(in_srgb,var(--bt-on-color)_6%,var(--bt-on-bg))]"
        aria-pressed={on()}
        aria-label={props.label ?? offLabel()}
        disabled={disabled()}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onKeyDown={key}
        onClick={toggle}
      >
        <span
          class="relative inline-grid flex-none [width:var(--bt-icon)] [height:var(--bt-icon)]"
          aria-hidden="true"
        >
          <span
            ref={glyphEl}
            class="inline-grid place-items-center [grid-area:1/1] [width:var(--bt-icon)] [height:var(--bt-icon)] [transform-origin:50%_var(--bt-pivot)] [&_svg]:h-full [&_svg]:w-full"
          >
            {props.clapper ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d={BELL_BODY} />
                <path d="M12 2.5V4" />
              </svg>
            ) : (
              (props.icon ?? (
                <HugeiconsIcon icon={Notification03Icon} size={iconSize()} strokeWidth={2} />
              ))
            )}
          </span>
          {props.clapper ? (
            <span
              ref={clapperEl}
              class="pointer-events-none absolute inset-0 [transform-origin:50%_var(--bt-pivot)] [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="20.4" r="1.7" fill="currentColor" />
              </svg>
            </span>
          ) : null}
          {waves() ? (
            <>
              <svg
                ref={waveLeftEl}
                class="pointer-events-none absolute -top-[3px] right-[calc(100%-2px)] h-3.5 w-3.5 origin-bottom-right fill-none stroke-current opacity-0 [stroke-linecap:round] [stroke-width:1.6]"
                viewBox="0 0 14 14"
              >
                <path d="M14 8a6 6 0 0 0-6 6" />
                <path d="M14 4A10 10 0 0 0 4 14" />
              </svg>
              <svg
                ref={waveRightEl}
                class="pointer-events-none absolute -top-[3px] left-[calc(100%-2px)] h-3.5 w-3.5 origin-bottom-left fill-none stroke-current opacity-0 [stroke-linecap:round] [stroke-width:1.6]"
                viewBox="0 0 14 14"
              >
                <path d="M0 8a6 6 0 0 1 6 6" />
                <path d="M0 4a10 10 0 0 1 10 10" />
              </svg>
            </>
          ) : null}
          {badge() ? (
            <span
              class="pointer-events-none absolute -top-1.5 -right-[7px] box-border grid h-3.5 min-w-3.5 place-items-center rounded-[7px] px-[3px] text-[9.5px] leading-none font-semibold opacity-0 [background:var(--bt-badge)] [color:var(--bt-badge-ink)] [transform:translateY(5px)_scale(0.6)] [transition:transform_180ms_cubic-bezier(0.23,1,0.32,1),opacity_140ms_ease] data-[show]:opacity-100 data-[show]:[transform:translateY(0)_scale(1)] data-[show]:[transition:transform_280ms_cubic-bezier(0.34,1.56,0.64,1),opacity_120ms_ease] motion-reduce:[transform:none]! motion-reduce:[transition:opacity_140ms_ease]!"
              data-show={showBadge() ? '' : undefined}
            >
              <For each={[count()]}>
                {c => (
                  <span class="block translate-y-0 opacity-100 [transition:opacity_200ms_ease,transform_200ms_cubic-bezier(0.23,1,0.32,1)] starting:translate-y-[5px] starting:opacity-0 motion-reduce:[transform:none]! motion-reduce:[transition:opacity_200ms_ease]">
                    {c > 9 ? '9+' : c}
                  </span>
                )}
              </For>
            </span>
          ) : null}
        </span>
        <span
          class="inline-grid h-[18px] grid-cols-[max-content] leading-[18px]"
          aria-hidden="true"
        >
          <span
            ref={offEl}
            class="justify-self-start opacity-0 blur-[2px] [grid-area:1/1] [transition:opacity_var(--bt-fade)_ease,filter_var(--bt-fade)_ease] group-data-[on=false]:opacity-100 group-data-[on=false]:blur-0 motion-reduce:blur-none! motion-reduce:[transition:opacity_var(--bt-fade)_ease]"
          >
            {offLabel()}
          </span>
          <span
            ref={onEl}
            class="justify-self-start opacity-0 blur-[2px] [grid-area:1/1] [transition:opacity_var(--bt-fade)_ease,filter_var(--bt-fade)_ease] group-data-[on=true]:opacity-100 group-data-[on=true]:blur-0 motion-reduce:blur-none! motion-reduce:[transition:opacity_var(--bt-fade)_ease]"
          >
            {onLabel()}
          </span>
        </span>
      </button>
    </span>
  )
}

export default BellToggle
