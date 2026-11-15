// solid-fx Instruments widget — original component (not a port).
// Multi-detent safety slide-rail: a drag control with spring-loaded detents
// (Validate → Stage → Commit). Releasing before the final detent snaps back
// to zero; committing requires deliberately parking the thumb on the last
// notch. Replaces "type DELETE to confirm" modals with a mechanical gesture.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, splitProps } from 'solid-js'

export interface DetentSlideRailProps {
  /** Detent labels left-to-right; the last one is the commit notch (default: Validate/Stage/Commit). */
  stages?: string[]
  /** Fired when the thumb reaches and holds the final detent. */
  onCommit?: (stage: string) => void
  /** Fired when passing each intermediate detent while dragging. */
  onStage?: (stage: string, index: number) => void
  /** Rail caption. */
  label?: string
  /** Solid class alias, merged alongside `className`. */
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function DetentSlideRail(props: DetentSlideRailProps) {
  const [own, rest] = splitProps(props, [
    'stages',
    'onCommit',
    'onStage',
    'label',
    'class',
    'className',
    'style',
  ])

  const stages = () => own.stages ?? ['Validate', 'Stage', 'Commit']
  const detents = () => stages().length
  const fracFor = (index: number) => (detents() === 1 ? 1 : index / (detents() - 1))

  const [frac, setFrac] = createSignal(0)
  const [armed, setArmed] = createSignal(false) // parked on the final detent
  const [committed, setCommitted] = createSignal(false)
  const [dragging, setDragging] = createSignal(false)
  let rail!: HTMLDivElement
  let confirmTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (confirmTimer !== undefined) clearTimeout(confirmTimer)
  })

  const nearestDetent = (f: number) => Math.round(f * (detents() - 1))

  const valueAt = (clientX: number) => {
    const rect = rail.getBoundingClientRect()
    const inset = 16 // thumb half-width padding so the grip stays inside
    const usable = Math.max(1, rect.width - inset * 2)
    return Math.min(1, Math.max(0, (clientX - rect.left - inset) / usable))
  }

  const flashCommitted = (stage: string) => {
    setCommitted(true)
    props.onCommit?.(stage)
    confirmTimer = setTimeout(() => {
      setCommitted(false)
      setArmed(false)
      setFrac(0)
    }, 900)
  }

  const onPointerDown = (event: PointerEvent) => {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    setDragging(true)
    const f = valueAt(event.clientX)
    setFrac(f)
    setArmed(nearestDetent(f) === detents() - 1 && f > 0.92)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging()) return
    const f = valueAt(event.clientX)
    setFrac(f)
    const detent = nearestDetent(f)
    const nearEnd = detent === detents() - 1 && Math.abs(f - 1) < 0.08
    if (nearEnd !== armed()) {
      setArmed(nearEnd)
      if (nearEnd) props.onStage?.(stages()[detents() - 1], detents() - 1)
    } else if (detent < detents() - 1) {
      props.onStage?.(stages()[detent], detent)
    }
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging()) return
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    setDragging(false)
    if (armed()) {
      flashCommitted(stages()[detents() - 1])
    } else {
      setFrac(0)
    }
  }

  const keyboard = (event: KeyboardEvent) => {
    const current = nearestDetent(frac())
    let next = current
    if (event.key === 'ArrowRight') next = Math.min(detents() - 1, current + 1)
    else if (event.key === 'ArrowLeft') next = Math.max(0, current - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = detents() - 1
    else if (event.key === 'Enter' || event.key === ' ') {
      if (armed()) {
        event.preventDefault()
        flashCommitted(stages()[detents() - 1])
      }
      return
    } else return
    event.preventDefault()
    const f = fracFor(next)
    setFrac(f)
    setArmed(next === detents() - 1)
    if (next < detents() - 1) props.onStage?.(stages()[next], next)
  }

  const activeIndex = () => {
    const d = nearestDetent(frac())
    return committed() ? detents() - 1 : Math.min(detents() - 1, d)
  }

  const stateText = () => {
    if (committed()) return 'committed ✓'
    if (armed()) return 'release snaps back — hold to commit'
    if (dragging()) return 'drag to the last notch…'
    return 'ready'
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
          <span class={armed() ? 'text-rose-300' : ''}>{stateText()}</span>
        </div>
      )}
      {/* biome-ignore lint/a11y/useFocusableInteractive: custom slider —
            keyboard operation in `keyboard` (arrows/Home/End/Enter) */}
      <div
        ref={rail}
        class="relative h-10 rounded-lg bg-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        role="slider"
        tabindex={0}
        aria-label={own.label ?? 'detent slide rail'}
        aria-valuemin={0}
        aria-valuemax={detents() - 1}
        aria-valuenow={activeIndex()}
        aria-valuetext={stages()[activeIndex()]}
        onKeyDown={keyboard}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* filled progress */}
        <div
          class={`absolute inset-y-1 left-1 rounded-md transition-colors duration-150 ${
            committed() ? 'bg-emerald-600' : armed() ? 'bg-rose-600' : 'bg-sky-700'
          }`}
          style={{ width: `calc(${frac() * 100}% - 8px)` }}
        />
        {/* detent notches + labels */}
        {stages().map((stage, index) => (
          <div
            class="absolute top-0 flex h-full flex-col items-center justify-center"
            style={{ left: `${fracFor(index) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div
              class={`absolute h-full w-px ${index <= activeIndex() ? 'bg-gray-500' : 'bg-gray-700'}`}
            />
            <span
              class={`relative z-10 rounded px-1.5 text-[10px] font-medium tracking-wide uppercase ${
                index <= activeIndex() ? 'text-gray-100' : 'text-gray-500'
              }`}
            >
              {stage}
            </span>
          </div>
        ))}
        {/* thumb */}
        <div
          class={`absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-md shadow-lg ${
            committed()
              ? 'bg-emerald-400'
              : armed()
                ? 'bg-rose-400'
                : 'bg-gray-300 active:cursor-grabbing'
          }`}
          style={{ left: `calc(16px + ${frac()} * (100% - 32px))` }}
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4 fill-gray-800" aria-hidden="true">
            <path
              d="M5 3 L10 8 L5 13"
              stroke="currentColor"
              stroke-width="1.6"
              fill="none"
              stroke-linecap="round"
            />
            <path
              d="M9 3 L14 8 L9 13"
              stroke="currentColor"
              stroke-width="1.6"
              fill="none"
              stroke-linecap="round"
              class="opacity-50"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default DetentSlideRail
