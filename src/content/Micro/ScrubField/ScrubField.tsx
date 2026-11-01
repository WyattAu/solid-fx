import { createEffect, createSignal, createUniqueId, onCleanup, onMount, untrack } from 'solid-js'
import { animate, motionValue } from 'motion'
import { useReducedMotion as usePrefersReducedMotion } from '@/lib/reducedMotion'

export type ScrubFieldSize = 'sm' | 'md' | 'lg'

export interface ScrubFieldProps {
  label?: string
  suffix?: string
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  size?: ScrubFieldSize
  sensitivity?: number
  rubberReach?: number
  returnDuration?: number
  coarseMultiplier?: number
  fineMultiplier?: number
  showDelta?: boolean
  showDirty?: boolean
  showFill?: boolean
  accent?: string
  chipColor?: string
  disabled?: boolean
  onChange?: (value: number) => void
  onCommit?: (value: number) => void
  className?: string
  class?: string
}

interface DragState {
  id: number
  x: number
  raw: number
  mult: number
  moved: boolean
  before: number
  slack: number
  left: number
}

type Modifiers = { shiftKey: boolean; altKey: boolean }

const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 }
const LEAN = 4
const SIZES: Record<
  ScrubFieldSize,
  { height: number; font: number; radius: number; width: number }
> = {
  sm: { height: 28, font: 12, radius: 6, width: 104 },
  md: { height: 34, font: 13, radius: 8, width: 128 },
  lg: { height: 44, font: 16, radius: 10, width: 160 },
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const decimalsOf = (n: number) => {
  const s = String(n)
  const i = s.indexOf('.')
  return i < 0 ? 0 : s.length - i - 1
}
const onColor = (hex: string) => {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6)
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return '#ffffff'
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000
  return yiq >= 128 ? '#111111' : '#ffffff'
}

const ScrubField = (props: ScrubFieldProps) => {
  const id = createUniqueId()
  const reduce = usePrefersReducedMotion()
  const _controlled = () => props.value !== undefined
  const [value, setValue] = createSignal<number>(
    props.value !== undefined ? props.value : (props.defaultValue ?? 24),
  )
  const [dragging, setDragging] = createSignal(false)
  const [draft, setDraft] = createSignal<string | null>(null)
  const display = motionValue(value())
  let chipEl!: HTMLDivElement
  let inputEl!: HTMLInputElement
  let fillEl: HTMLSpanElement | undefined
  let ghostEl: HTMLSpanElement | undefined
  let drag: DragState | null = null
  let valueNow = value()
  let typing = false
  let moved = false
  let esc: ((e: KeyboardEvent) => void) | null = null
  let mounted = false

  const min = () => props.min ?? 0
  const max = () => props.max ?? 100
  const step = () => props.step ?? 1
  const baseDecimals = () => decimalsOf(step())
  const fineDecimals = () => Math.min(6, baseDecimals() + decimalsOf(props.fineMultiplier ?? 0.1))
  const preset = () => SIZES[props.size ?? 'md'] ?? SIZES.md
  const reach = () => ((props.rubberReach ?? 8) / 100) * Math.max(max() - min(), Number.EPSILON)

  const fmt = (v: number) => {
    const scaled = v * 10 ** baseDecimals()
    return v.toFixed(Math.abs(scaled - Math.round(scaled)) < 1e-6 ? baseDecimals() : fineDecimals())
  }
  const signed = (d: number) => (d < 0 ? '−' : '+') + fmt(Math.abs(d))

  const bend = (raw: number) =>
    reach() ? Math.sign(raw) * reach() * Math.log1p(Math.abs(raw) / reach()) : 0
  const unbend = (over: number) =>
    reach() ? Math.sign(over) * reach() * Math.expm1(Math.abs(over) / reach()) : 0
  const toShown = (raw: number) => {
    const c = clamp(raw, min(), max())
    return c + bend(raw - c)
  }
  const toRaw = (shown: number) => {
    const c = clamp(shown, min(), max())
    return c + unbend(shown - c)
  }
  const multiplierOf = (e: Modifiers) =>
    e.shiftKey ? (props.coarseMultiplier ?? 10) : e.altKey ? (props.fineMultiplier ?? 0.1) : 1

  const commit = (next: number) => {
    const rounded = clamp(Number(next.toFixed(fineDecimals())), min(), max())
    if (rounded === valueNow) return
    valueNow = rounded
    setValue(rounded)
    untrack(() => props.onChange?.(rounded))
  }

  // Upstream: useMotionValueEvent(display) + useTransform(lean) + useTransform(fill)
  // all collapsed into one change pass that writes the DOM directly.
  const writeVisuals = (d: number) => {
    const lean =
      reduce() || !reach() ? 0 : clamp((d - clamp(d, min(), max())) / reach(), -1, 1) * LEAN
    if (chipEl) chipEl.style.transform = `translateX(${lean}px)`
    if (fillEl)
      fillEl.style.transform = `scaleX(${(clamp(d, min(), max()) - min()) / Math.max(max() - min(), Number.EPSILON)})`
  }

  const adopt = (next: number) => {
    valueNow = next
    setValue(next)
    display.jump(next)
    writeVisuals(next)
    if (!typing && inputEl) inputEl.value = fmt(next)
  }

  onMount(() => {
    const off = display.on('change', (d: number) => {
      if (!typing && inputEl) inputEl.value = fmt(d)
      if (chipEl) chipEl.dataset.over = d < min() || d > max() ? 'true' : 'false'
      writeVisuals(d)
    })
    writeVisuals(display.get())
    onCleanup(() => {
      off()
      display.stop()
    })
  })

  createEffect(() => {
    const vp = props.value
    if (vp === undefined) return
    untrack(() => {
      if (!drag && vp !== valueNow) adopt(clamp(vp, min(), max()))
    })
  })
  createEffect(() => {
    const dv = props.defaultValue ?? 24
    untrack(() => {
      if (!mounted) {
        mounted = true
        return
      }
      if (!drag) adopt(clamp(dv, min(), max()))
    })
  })
  createEffect(() => {
    void baseDecimals()
    void fineDecimals()
    untrack(() => {
      if (!typing && inputEl) inputEl.value = fmt(valueNow)
    })
  })

  const handlePointerDown = (e: PointerEvent) => {
    const el = e.currentTarget as HTMLDivElement
    if (props.disabled || drag || e.button !== 0 || typing) return
    if (e.pointerType !== 'touch') e.preventDefault()
    display.stop()
    moved = false
    drag = {
      id: e.pointerId,
      x: e.clientX,
      raw: toRaw(display.get()),
      mult: multiplierOf(e),
      moved: false,
      before: valueNow,
      slack: e.pointerType === 'touch' ? 8 : 3,
      left: chipEl ? chipEl.getBoundingClientRect().left : 0,
    }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') end(true)
    }
    window.addEventListener('keydown', esc)
  }

  const handlePointerMove = (e: PointerEvent) => {
    const g = drag
    if (!g || e.pointerId !== g.id) return
    if (!g.moved) {
      if (Math.abs(e.clientX - g.x) < g.slack) return
      g.moved = true
      moved = true
      g.x = e.clientX
      setDragging(true)
      document.documentElement.style.cursor = 'ew-resize'
    }
    const m = multiplierOf(e)
    if (m !== g.mult) {
      g.mult = m
      g.raw = toRaw(display.get())
      g.x = e.clientX
    }
    const sensitivity = props.sensitivity ?? 2
    const raw = g.raw + Math.round((e.clientX - g.x) / sensitivity) * step() * m
    const shown = toShown(raw)
    display.set(shown)
    commit(clamp(raw, min(), max()))
    if (ghostEl) {
      ghostEl.style.translate = `calc(${e.clientX - g.left}px - 50%) -100%`
      ghostEl.textContent = signed(shown - g.before)
    }
  }

  function end(cancel = false) {
    const g = drag
    if (!g) return
    drag = null
    setDragging(false)
    document.documentElement.style.cursor = ''
    if (esc) {
      window.removeEventListener('keydown', esc)
      esc = null
    }
    if (cancel) {
      commit(g.before)
      display.jump(g.before)
      writeVisuals(g.before)
      return
    }
    if (!g.moved) {
      inputEl?.focus()
      return
    }
    const bound = clamp(display.get(), min(), max())
    if (display.get() !== bound) {
      if (reduce()) display.jump(bound)
      else animate(display, bound, { ...SPRING_UI, duration: (props.returnDuration ?? 300) / 1000 })
    }
    if (g.moved && valueNow !== g.before) untrack(() => props.onCommit?.(valueNow))
  }

  const leaveTyping = () => {
    typing = false
    setDraft(null)
    if (inputEl) inputEl.value = fmt(valueNow)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const el = e.currentTarget as HTMLInputElement
    const draftNow = draft()
    const typedNumber = draftNow !== null && draftNow.trim() !== '' ? Number(draftNow) : NaN
    const from = Number.isNaN(typedNumber) ? valueNow : typedNumber
    const deltas: Record<string, number> = {
      ArrowUp: step() * multiplierOf(e),
      ArrowDown: -step() * multiplierOf(e),
      PageUp: step() * (props.coarseMultiplier ?? 10),
      PageDown: -step() * (props.coarseMultiplier ?? 10),
    }
    const delta = deltas[e.key]
    if (delta !== undefined || e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      leaveTyping()
      commit(delta !== undefined ? from + delta : e.key === 'Home' ? min() : max())
      display.jump(valueNow)
      writeVisuals(valueNow)
      if (inputEl) inputEl.value = fmt(valueNow)
      untrack(() => props.onCommit?.(valueNow))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      el.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      leaveTyping()
      el.blur()
    }
  }

  const handleFocus = (e: FocusEvent) => {
    const el = e.currentTarget as HTMLInputElement
    typing = true
    setDraft(el.value)
    el.select()
  }

  const handleBlur = () => {
    const draftNow = draft()
    const n = draftNow === null ? NaN : parseFloat(draftNow.replace(/[^\d.-]/g, ''))
    if (!Number.isNaN(n)) {
      commit(n)
      untrack(() => props.onCommit?.(valueNow))
    }
    leaveTyping()
    display.jump(valueNow)
    writeVisuals(valueNow)
  }

  onMount(() => {
    onCleanup(() => {
      document.documentElement.style.cursor = ''
      if (esc) window.removeEventListener('keydown', esc)
    })
  })

  const dirty = () => (props.showDirty ?? false) && value() !== props.defaultValue

  return (
    <div
      ref={chipEl}
      class={`group relative inline-flex h-[var(--sf-h)] w-[var(--sf-w)] items-center gap-1 rounded-[var(--sf-r)] pl-1 pr-2 leading-none select-none isolate [font-family:inherit] [font-size:var(--sf-fs)] [background:var(--sf-chip)] [box-shadow:0_0_0_1px_transparent] cursor-ew-resize touch-pan-y data-[typing=true]:cursor-text data-[disabled=true]:cursor-default [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [transition:background-color_200ms_ease,box-shadow_200ms_ease] data-[dirty=true]:[box-shadow:0_0_0_1px_color-mix(in_srgb,var(--sf-accent)_55%,transparent)] data-[dirty=true]:[transition-duration:0ms] data-[typing=true]:[background:color-mix(in_srgb,currentColor_7%,var(--sf-chip))] data-[disabled=true]:opacity-50${props.class ? ` ${props.class}` : ''}${props.className ? ` ${props.className}` : ''}`}
      data-dirty={dirty() ? 'true' : 'false'}
      data-dragging={dragging() ? 'true' : 'false'}
      data-typing={draft() !== null ? 'true' : 'false'}
      data-disabled={props.disabled ? 'true' : 'false'}
      data-over="false"
      aria-disabled={props.disabled || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => end()}
      onPointerCancel={() => end(true)}
      onLostPointerCapture={() => end()}
      style={{
        '--sf-accent': props.accent ?? '#f5f5f5',
        '--sf-chip': props.chipColor ?? '#27272a',
        '--sf-ghost-ink': onColor(props.accent ?? '#f5f5f5'),
        '--sf-h': `${preset().height}px`,
        '--sf-fs': `${preset().font}px`,
        '--sf-r': `${preset().radius}px`,
        '--sf-w': `${preset().width}px`,
        '--sf-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {(props.showFill ?? true) ? (
        <span
          class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
          aria-hidden="true"
        >
          <span
            ref={el => {
              fillEl = el
            }}
            class="absolute inset-0 origin-left [background:color-mix(in_srgb,var(--sf-accent)_16%,transparent)]"
          />
        </span>
      ) : null}
      <label
        for={id}
        class="inline-flex h-full cursor-[inherit] items-center whitespace-nowrap rounded-[calc(var(--sf-r)-2px)] px-1.5 font-medium [color:color-mix(in_srgb,currentColor_55%,transparent)] [transition:color_120ms_ease,transform_160ms_var(--sf-ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-data-[disabled=false]:group-hover:[color:color-mix(in_srgb,currentColor_85%,transparent)] group-data-[disabled=false]:group-data-[typing=false]:group-active:[transform:scale(0.96)] group-data-[disabled=false]:group-data-[typing=false]:group-active:[color:currentColor] group-data-[dragging=true]:[transform:scale(0.96)] group-data-[dragging=true]:[color:currentColor] motion-reduce:[transition:color_120ms_ease] motion-reduce:group-data-[dragging=true]:[transform:none] motion-reduce:group-data-[disabled=false]:group-data-[typing=false]:group-active:[transform:none]"
        onClick={e => {
          if (moved) e.preventDefault()
        }}
      >
        {props.label ?? 'Radius'}
      </label>
      <input
        ref={el => {
          inputEl = el
          el.value = fmt(valueNow)
        }}
        id={id}
        class="m-0 w-full min-w-0 flex-1 cursor-[inherit] border-0 bg-transparent p-0 text-right font-medium tabular-nums outline-0 [color:inherit] [font-family:inherit] [font-size:inherit] [transition:color_120ms_ease] group-data-[typing=true]:cursor-text group-data-[over=true]:[color:color-mix(in_srgb,currentColor_55%,transparent)]"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={value()}
        aria-valuemin={min()}
        aria-valuemax={max()}
        aria-valuetext={`${fmt(value())}${props.suffix ? ` ${props.suffix}` : ''}`}
        disabled={props.disabled}
        onFocus={handleFocus}
        onInput={e => setDraft((e.currentTarget as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      {props.suffix ? (
        <span
          class="font-medium [color:color-mix(in_srgb,currentColor_45%,transparent)]"
          aria-hidden="true"
        >
          {props.suffix}
        </span>
      ) : null}
      {(props.showDelta ?? true) ? (
        <span
          ref={el => {
            ghostEl = el
          }}
          class="pointer-events-none absolute -top-1.5 left-0 origin-bottom whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] leading-[1.4] font-semibold tabular-nums opacity-0 [color:var(--sf-ghost-ink)] [translate:0_-100%] [scale:0.95] [background:var(--sf-accent)] [transition:opacity_125ms_var(--sf-ease-out),scale_125ms_var(--sf-ease-out)] group-data-[dragging=true]:opacity-100 group-data-[dragging=true]:[scale:1] motion-reduce:[scale:1] motion-reduce:[transition:opacity_200ms_ease]"
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}

export default ScrubField
