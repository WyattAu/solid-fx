// solid-fx Instruments widget — original component (not a port).
// Schmitt-trigger dual-threshold slider: a higher Trigger handle and a lower
// Reset handle on one track, with the deadband shaded between them. Makes
// chatter-free alerting rules and control loops tangible: the rule only
// fires crossing Trigger, and only clears below Reset.
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

export interface HysteresisSliderProps {
  /** Track minimum (default 0). */
  min?: number
  /** Track maximum (default 100). */
  max?: number
  /** Initial trigger (upper) threshold; clamped into [min, max]. */
  trigger?: number
  /** Initial reset (lower) threshold; clamped below trigger. */
  reset?: number
  /** Minimum separation maintained between reset and trigger. */
  minGap?: number
  /** Keyboard/scrub step size (default: 1% of range). */
  step?: number
  /** Range axis label (e.g. "CPU %"). */
  label?: string
  /** Continuous updates while either handle moves. */
  onInput?: (reset: number, trigger: number) => void
  /** Fired on release (and after keyboard moves). */
  onChange?: (reset: number, trigger: number) => void
  /** Solid class alias, merged alongside `className`. */
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function HysteresisSlider(props: HysteresisSliderProps) {
  const [own, rest] = splitProps(props, [
    'min',
    'max',
    'trigger',
    'reset',
    'minGap',
    'step',
    'label',
    'onInput',
    'onChange',
    'class',
    'className',
    'style',
  ])

  const min = () => own.min ?? 0
  const max = () => own.max ?? 100
  const range = () => max() - min()
  const minGap = () => own.minGap ?? range() * 0.05
  const step = () => own.step ?? range() * 0.01

  const clamp = (v: number) => Math.min(max(), Math.max(min(), v))
  const snapGap = (resetValue: number, triggerValue: number) =>
    Math.max(resetValue, Math.min(triggerValue - minGap(), resetValue + range()))

  const [trigger, setTrigger] = createSignal(clamp(own.trigger ?? max() * 0.8))
  const [reset, setReset] = createSignal(
    Math.min(clamp(own.reset ?? max() * 0.3), trigger() - minGap()),
  )

  const [dragging, setDragging] = createSignal<'reset' | 'trigger' | null>(null)
  let track!: HTMLDivElement

  const pct = (v: number) => ((v - min()) / range()) * 100

  const valueAt = (clientX: number) => {
    const rect = track.getBoundingClientRect()
    const frac = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width
    return clamp(min() + frac * range())
  }

  const apply = (which: 'reset' | 'trigger', value: number) => {
    if (which === 'trigger') {
      const t = Math.max(value, reset() + minGap())
      setTrigger(clamp(t))
    } else {
      const r = snapGap(clamp(value), trigger())
      setReset(r)
    }
    own.onInput?.(reset(), trigger())
  }

  const commit = () => own.onChange?.(reset(), trigger())

  const onPointerDown = (which: 'reset' | 'trigger') => (event: PointerEvent) => {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    setDragging(which)
    apply(which, valueAt(event.clientX))
  }

  const onPointerMove = (event: PointerEvent) => {
    const which = dragging()
    if (!which) return
    apply(which, valueAt(event.clientX))
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    setDragging(null)
    commit()
  }

  const onKeyDown = (which: 'reset' | 'trigger') => (event: KeyboardEvent) => {
    const current = which === 'trigger' ? trigger() : reset()
    let next: number | null = null
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step()
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step()
    if (event.key === 'Home') next = min()
    if (event.key === 'End') next = max()
    if (next === null) return
    event.preventDefault()
    apply(which, next)
    commit()
  }

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {own.label !== undefined && (
        <div class="mb-1.5 flex items-baseline justify-between text-xs text-gray-400">
          <span>{own.label}</span>
          <span class="font-mono text-gray-300">
            reset <span class="text-sky-300">{reset().toFixed(1)}</span>
            <span class="mx-1 text-gray-600">·</span>
            trigger <span class="text-amber-300">{trigger().toFixed(1)}</span>
          </span>
        </div>
      )}
      <div
        ref={track}
        class="relative h-8 rounded-md bg-gray-800"
        role="group"
        aria-label={own.label ?? 'Hysteresis thresholds'}
      >
        {/* deadband */}
        <div
          class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-600/70"
          style={{ left: `${pct(reset())}%`, width: `${pct(trigger()) - pct(reset())}%` }}
        />
        {/* reset handle */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: arrow keys in onKeyDown */}
        <div
          role="slider"
          tabindex={0}
          aria-label={`${own.label ?? 'threshold'} reset`}
          aria-valuemin={min()}
          aria-valuemax={max()}
          aria-valuenow={Math.round(reset() * 100) / 100}
          class={`absolute top-1/2 h-6 w-1.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            dragging() === 'reset' ? 'bg-sky-200' : 'bg-sky-400'
          }`}
          style={{ left: `${pct(reset())}%` }}
          onPointerDown={onPointerDown('reset')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown('reset')}
        />
        {/* trigger handle */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: arrow keys in onKeyDown */}
        <div
          role="slider"
          tabindex={0}
          aria-label={`${own.label ?? 'threshold'} trigger`}
          aria-valuemin={min()}
          aria-valuemax={max()}
          aria-valuenow={Math.round(trigger() * 100) / 100}
          class={`absolute top-1/2 h-6 w-1.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            dragging() === 'trigger' ? 'bg-amber-200' : 'bg-amber-400'
          }`}
          style={{ left: `${pct(trigger())}%` }}
          onPointerDown={onPointerDown('trigger')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown('trigger')}
        />
      </div>
    </div>
  )
}

export default HysteresisSlider
