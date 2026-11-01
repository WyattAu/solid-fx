import { createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons'

export interface GlideSelectOption {
  value: string
  label: JSX.Element
  tag?: string
}

export interface GlideSelectProps {
  options?: (string | GlideSelectOption)[]
  value?: string
  defaultValue?: string
  onChange?: (value: string, option: GlideSelectOption) => void
  placeholder?: string
  showTags?: boolean
  accentColor?: string
  surfaceColor?: string
  highlightColor?: string
  textColor?: string
  size?: 'sm' | 'md' | 'lg'
  radius?: number
  menuWidth?: number
  placement?: 'top' | 'bottom'
  align?: 'left' | 'right'
  popDuration?: number
  glideDuration?: number
  rememberPosition?: boolean
  disabled?: boolean
  ariaLabel?: string
  className?: string
  class?: string
}

type Phase = 'closed' | 'open' | 'closing'

const SIZES: Record<string, { chip: number; row: number; font: number }> = {
  sm: { chip: 28, row: 26, font: 12 },
  md: { chip: 32, row: 30, font: 13 },
  lg: { chip: 44, row: 40, font: 14 },
}
const PAD = 4
const GAP = 1
const MENU_GAP = 6
const DEFAULT_OPTIONS: (string | GlideSelectOption)[] = ['One', 'Two', 'Three']
const STYLE = '@keyframes gs-swap{from{opacity:.6;filter:blur(2px)}}'

const norm = (o: string | GlideSelectOption): GlideSelectOption =>
  typeof o === 'string' ? { value: o, label: o } : o
const textOf = (it: GlideSelectOption) => (typeof it.label === 'string' ? it.label : it.value)
const typeaheadIndex = (items: GlideSelectOption[], from: number, ch: string) => {
  const c = ch.toLowerCase()
  const n = items.length
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n
    if (textOf(items[i]).toLowerCase().startsWith(c)) return i
  }
  return from
}

// Stand-in for React's useId: a module-level counter is enough for aria wiring.
let uid = 0

const GlideSelect = (props: GlideSelectProps) => {
  const placement = () => props.placement ?? 'bottom'
  const align = () => props.align ?? 'left'
  const items = createMemo(() => (props.options ?? DEFAULT_OPTIONS).map(norm))
  const [inner, setInner] = createSignal(props.defaultValue ?? '')
  const current = () => props.value ?? inner()
  const selected = createMemo(() => items().findIndex(it => it.value === current()))
  const [phase, setPhase] = createSignal<Phase>('closed')
  const [active, setActive] = createSignal<number | null>(null)
  const [side, setSide] = createSignal<'top' | 'bottom'>(placement())
  let rootEl!: HTMLDivElement
  let triggerEl: HTMLButtonElement | undefined
  let menuEl: HTMLDivElement | undefined
  let pillEl: HTMLSpanElement | undefined
  let instant = false
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let scrub: { id: number; top: number } | null = null
  const id = `glide-select-${++uid}`
  const S = () => SIZES[props.size ?? 'md'] ?? SIZES.md
  const step = () => S().row + GAP
  const popOut = () => Math.round(((props.popDuration ?? 180) * 2) / 3)

  // Upstream: layout effect on [phase] — measure, flip the side if it would
  // overflow, then replay the pop transition. Only phase re-runs this.
  createEffect(() => {
    if (phase() !== 'open') return
    untrack(() => {
      const el = menuEl
      const root = rootEl
      if (!el || !root) return
      const r = root.getBoundingClientRect()
      const need = el.offsetHeight + MENU_GAP
      setSide(
        placement() === 'bottom' && r.bottom + need > window.innerHeight
          ? 'top'
          : placement() === 'top' && r.top - need < 0
            ? 'bottom'
            : placement(),
      )
      el.style.transitionDuration = instant ? '0ms' : ''
      el.dataset.state = 'closed'
      void el.offsetHeight
      el.dataset.state = 'open'
      const p = pillEl
      if (p) {
        p.style.transition = 'none'
        p.style.transform = `translateY(${Math.max(0, selected()) * step()}px)`
        p.style.opacity = '0'
        void p.offsetHeight
        p.style.transition = ''
      }
    })
  })

  // Upstream: layout effect on [active, phase, step] — glide the highlight pill.
  createEffect(() => {
    const p = pillEl
    if (!p || phase() !== 'open') return
    const a = active()
    if (a === null) {
      p.style.opacity = '0'
      return
    }
    const jump = instant || p.style.opacity !== '1'
    p.style.transitionDuration = jump ? '0ms, 150ms' : ''
    p.style.transform = `translateY(${a * step()}px)`
    p.style.opacity = '1'
    instant = false
  })

  const open = (viaKey: boolean) => {
    if (props.disabled) return
    clearTimeout(closeTimer)
    instant = true
    setActive(selected() >= 0 ? selected() : viaKey ? 0 : null)
    setPhase('open')
  }
  const close = (mode: 'instant' | 'pop') => {
    setActive(null)
    clearTimeout(closeTimer)
    const el = menuEl
    if (mode === 'instant' || !el) {
      setPhase('closed')
      return
    }
    el.style.transitionDuration = ''
    el.dataset.state = 'closed'
    setPhase('closing')
    closeTimer = setTimeout(() => setPhase('closed'), popOut() + 20)
  }
  const pick = (i: number, viaKey: boolean) => {
    const it = items()[i]
    if (!it) {
      close('instant')
      return
    }
    if (it.value !== current()) {
      if (props.value === undefined) setInner(it.value)
      untrack(() => props.onChange?.(it.value, it))
      if (!viaKey && rootEl) rootEl.dataset.swap = ''
    }
    close('instant')
    triggerEl?.focus({ preventScroll: true })
  }

  const onTriggerKey = (e: KeyboardEvent) => {
    const k = e.key
    const n = items().length
    const cur = active() ?? Math.max(0, selected())
    if (phase() !== 'open') {
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault()
        open(true)
      }
      return
    }
    const go = (i: number) => {
      e.preventDefault()
      instant = true
      setActive(Math.min(n - 1, Math.max(0, i)))
    }
    if (k === 'ArrowDown' || k === 'ArrowUp')
      go(active() === null ? cur : cur + (k === 'ArrowDown' ? 1 : -1))
    else if (k === 'Home' || k === 'End') go(k === 'Home' ? 0 : n - 1)
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault()
      pick(cur, true)
    } else if (k === 'Escape' || k === 'Tab') {
      if (k === 'Escape') e.preventDefault()
      close('instant')
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey)
      go(typeaheadIndex(items(), cur, k))
  }

  // Upstream: effect on [phase] — capture-phase outside pointer closes the menu.
  createEffect(() => {
    if (phase() === 'closed') return
    const onDown = (e: PointerEvent) => {
      if (rootEl && !rootEl.contains(e.target as Node)) close('pop')
    }
    document.addEventListener('pointerdown', onDown, true)
    onCleanup(() => document.removeEventListener('pointerdown', onDown, true))
  })
  createEffect(() => {
    if (props.disabled && phase() !== 'closed') close('instant')
  })
  onMount(() => {
    onCleanup(() => clearTimeout(closeTimer))
  })

  const rowAt = (y: number) => {
    const s = scrub
    if (!s) return null
    const i = Math.floor((y - s.top - PAD) / step())
    return i >= 0 && i < items().length ? i : null
  }
  const onListDown = (e: PointerEvent) => {
    if (scrub) return
    const el = e.currentTarget as HTMLDivElement
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
    scrub = { id: e.pointerId, top: el.getBoundingClientRect().top }
    instant = true
    setActive(rowAt(e.clientY))
  }
  const onListMove = (e: PointerEvent) => {
    if (!scrub || scrub.id !== e.pointerId) return
    const i = rowAt(e.clientY)
    if (i !== active()) setActive(i)
  }
  const onListUp = (e: PointerEvent) => {
    if (!scrub || scrub.id !== e.pointerId) return
    const i = e.type === 'pointerup' ? rowAt(e.clientY) : null
    scrub = null
    if (i !== null) pick(i, false)
    else if (!(props.rememberPosition ?? true)) setActive(null)
  }
  const onListOver = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || scrub) return
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-index]')
    if (!row) return
    const i = Number(row.dataset.index)
    if (i !== active()) setActive(i)
  }

  const origin = () => `${side() === 'bottom' ? 'top' : 'bottom'} ${align()}`
  return (
    <div
      ref={rootEl}
      class={`group relative inline-block data-[disabled]:opacity-50${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      data-size={props.size ?? 'md'}
      data-disabled={props.disabled ? '' : undefined}
      style={{
        '--gs-accent': props.accentColor ?? '#f5f5f5',
        '--gs-surface': props.surfaceColor ?? '#27272a',
        '--gs-highlight': props.highlightColor ?? '#3f3f46',
        '--gs-text': props.textColor ?? '#f5f5f5',
        '--gs-radius': `${props.radius ?? 10}px`,
        '--gs-inner-radius': `${Math.max(3, (props.radius ?? 10) - 4)}px`,
        '--gs-chip': `${S().chip}px`,
        '--gs-row': `${S().row}px`,
        '--gs-font': `${S().font}px`,
        '--gs-menu-w': `${props.menuWidth ?? 176}px`,
        '--gs-pop': `${props.popDuration ?? 180}ms`,
        '--gs-pop-out': `${popOut()}ms`,
        '--gs-glide': `${props.glideDuration ?? 220}ms`,
        '--gs-origin': origin(),
      }}
      onAnimationEnd={(e: AnimationEvent) => {
        if (e.animationName === 'gs-swap' && rootEl) delete rootEl.dataset.swap
      }}
    >
      <style>{STYLE}</style>
      <button
        ref={(el: HTMLButtonElement) => {
          triggerEl = el
        }}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={phase() === 'open'}
        aria-controls={`${id}-list`}
        aria-activedescendant={active() !== null ? `${id}-${active()}` : undefined}
        aria-label={props.ariaLabel ?? 'Select'}
        disabled={props.disabled}
        class="group/trigger relative m-0 inline-flex cursor-pointer touch-manipulation items-center gap-1.5 border-0 pr-2 pl-2.5 leading-none font-medium outline-none select-none [-webkit-tap-highlight-color:transparent] [font-family:inherit] [height:var(--gs-chip)] [border-radius:var(--gs-inner-radius)] [background:var(--gs-surface)] [color:var(--gs-text)] [font-size:var(--gs-font)] [transition:background-color_100ms_ease,transform_160ms_cubic-bezier(0.23,1,0.32,1)] disabled:cursor-default enabled:active:scale-[0.97] motion-reduce:enabled:active:scale-100 motion-reduce:[transition:background-color_100ms_ease] aria-expanded:[background:color-mix(in_srgb,var(--gs-highlight)_60%,var(--gs-surface))] [@media(hover:hover)_and_(pointer:fine)]:enabled:hover:[background:color-mix(in_srgb,var(--gs-highlight)_60%,var(--gs-surface))]"
        onPointerDown={(e: PointerEvent) => {
          if (e.button !== 0 || props.disabled) return
          ;(e.currentTarget as HTMLButtonElement).focus({ preventScroll: true })
          if (phase() === 'open') close('pop')
          else open(false)
        }}
        onKeyDown={onTriggerKey}
      >
        <For each={[current()]}>
          {() => (
            <span
              class="data-[empty]:opacity-60 group-data-[swap]:animate-[gs-swap_160ms_ease] motion-reduce:group-data-[swap]:animate-none"
              data-empty={selected() < 0 ? '' : undefined}
            >
              {selected() >= 0 ? items()[selected()].label : (props.placeholder ?? 'Select…')}
            </span>
          )}
        </For>
        <span
          class="inline-flex [color:color-mix(in_srgb,var(--gs-text)_55%,transparent)] [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1)] group-aria-expanded/trigger:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={2.5} />
        </span>
      </button>
      {phase() !== 'closed' ? (
        <div
          ref={(el: HTMLDivElement) => {
            menuEl = el
          }}
          class="absolute z-20 min-w-full scale-95 p-1 opacity-0 [width:var(--gs-menu-w)] [border-radius:var(--gs-radius)] [background:var(--gs-surface)] [box-shadow:0_4px_16px_color-mix(in_srgb,#000_22%,transparent)] [transform-origin:var(--gs-origin)] [transition:opacity_var(--gs-pop)_cubic-bezier(0.23,1,0.32,1),transform_var(--gs-pop)_cubic-bezier(0.23,1,0.32,1)] data-[state=open]:scale-100 data-[state=open]:opacity-100 data-[state=closed]:pointer-events-none data-[state=closed]:[transition-duration:var(--gs-pop-out)] data-[side=bottom]:top-[calc(100%+6px)] data-[side=top]:bottom-[calc(100%+6px)] data-[align=left]:left-0 data-[align=right]:right-0 motion-reduce:[transform:none]! motion-reduce:[transition:opacity_var(--gs-pop)_ease] motion-reduce:data-[state=closed]:[transition-duration:var(--gs-pop-out)]"
          data-state="open"
          data-side={side()}
          data-align={align()}
        >
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={props.ariaLabel ?? 'Select'}
            class="group/list relative grid touch-none gap-px"
            data-live={active() !== null ? '' : undefined}
            onPointerOver={onListOver}
            onPointerLeave={() => {
              if (!scrub && !(props.rememberPosition ?? true)) setActive(null)
            }}
            onPointerDown={onListDown}
            onPointerMove={onListMove}
            onPointerUp={onListUp}
            onPointerCancel={onListUp}
            onLostPointerCapture={onListUp}
          >
            <span
              ref={(el: HTMLSpanElement) => {
                pillEl = el
              }}
              class="pointer-events-none absolute top-0 right-0 left-0 opacity-0 [height:var(--gs-row)] [border-radius:var(--gs-inner-radius)] [background:var(--gs-highlight)] [transition:transform_var(--gs-glide)_cubic-bezier(0.23,1,0.32,1),opacity_150ms_ease] motion-reduce:[transition:opacity_150ms_ease]"
              aria-hidden="true"
            />
            <For each={items()}>
              {(it, i) => (
                <div
                  id={`${id}-${i()}`}
                  role="option"
                  aria-selected={i() === selected()}
                  data-index={i()}
                  class="relative z-[1] flex cursor-pointer items-center gap-2 pr-2 pl-2.5 select-none [-webkit-tap-highlight-color:transparent] [height:var(--gs-row)] [border-radius:var(--gs-inner-radius)] [color:var(--gs-text)] [font-size:var(--gs-font)] [transition:background-color_150ms_ease] aria-selected:[background:color-mix(in_srgb,var(--gs-highlight)_60%,transparent)] group-data-[live]/list:aria-selected:bg-transparent"
                >
                  <span class="min-w-0 flex-1 truncate font-medium">{it.label}</span>
                  {(props.showTags ?? true) && it.tag ? (
                    <span class="shrink-0 [color:color-mix(in_srgb,var(--gs-text)_55%,transparent)] [font-size:calc(var(--gs-font)_-_2px)]">
                      {it.tag}
                    </span>
                  ) : null}
                  <span
                    class="inline-flex shrink-0 invisible [color:var(--gs-accent)] data-[on]:visible"
                    data-on={i() === selected() ? '' : undefined}
                    aria-hidden="true"
                  >
                    <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default GlideSelect
