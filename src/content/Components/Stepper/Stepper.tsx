import { createEffect, createSignal, Index, onCleanup, onMount, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'

export interface StepProps {
  children?: JSX.Element
  title?: JSX.Element
  description?: JSX.Element
  icon?: JSX.Element
}

interface StepIndicatorProps {
  step: number
  currentStep: number
  onStepClick: (step: number) => void
}

interface StepperProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'className' | 'style'> {
  children?: JSX.Element
  step?: number
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  indicator?: 'numbers' | 'dots' | 'bars'
  orientation?: 'horizontal' | 'vertical'
  transition?: 'slide' | 'fade' | 'none'
  linear?: boolean
  disableStepIndicators?: boolean
  renderStepIndicator?: (props: StepIndicatorProps) => JSX.Element
  showFooter?: boolean
  backButtonText?: string
  nextButtonText?: string
  completeButtonText?: string
  backButtonProps?: JSX.ButtonHTMLAttributes<HTMLButtonElement>
  nextButtonProps?: JSX.ButtonHTMLAttributes<HTMLButtonElement>
  completedContent?: JSX.Element
  theme?: 'dark' | 'light'
  accentColor?: string
  frame?: boolean
  radius?: number
  width?: number | string
  className?: string
  class?: string
  stepCircleContainerClassName?: string
  stepContainerClassName?: string
  contentClassName?: string
  footerClassName?: string
  style?: JSX.CSSProperties
}

interface RegisteredStep {
  get title(): JSX.Element | undefined
  get description(): JSX.Element | undefined
  get icon(): JSX.Element | undefined
  content: () => JSX.Element
}

interface View {
  step: number
  previous: number | null
  direction: number
  id: number
}

// SOLID-CONSTRAINT: upstream introspects <Step> children via React.Children to read
// their title/description/icon props. Solid creates child components eagerly,
// so <Step> instead registers itself into the enclosing <Stepper> through a
// module-level registrar while the Stepper reads its children; content stays
// lazy and only the active pane is mounted, matching upstream.
let registrar: ((step: RegisteredStep) => void) | null = null

const THEMES: Record<string, JSX.CSSProperties> = {
  dark: {
    '--stepper-frame': 'rgba(38, 35, 46, 0.66)',
    '--stepper-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--stepper-frame-shadow':
      '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--stepper-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--stepper-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--stepper-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--stepper-well': 'rgba(255, 255, 255, 0.07)',
    '--stepper-track': 'rgba(255, 255, 255, 0.1)',
    '--stepper-ink': '#f4f4f5',
    '--stepper-muted': 'rgba(244, 244, 245, 0.55)',
    '--stepper-faint': 'rgba(255, 255, 255, 0.22)',
    '--stepper-ring': 'rgba(244, 244, 245, 0.3)',
    '--stepper-solid': '#f4f4f5',
    '--stepper-solid-ink': '#18181b',
    '--stepper-hover': 'brightness(1.12)',
    '--stepper-hover-fill': 'rgba(255, 255, 255, 0.04)',
    '--stepper-solid-hover': 'brightness(0.9)',
    '--stepper-press': 'brightness(0.85)',
  },
  light: {
    '--stepper-frame': 'rgba(240, 240, 243, 0.8)',
    '--stepper-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--stepper-frame-shadow':
      '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--stepper-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--stepper-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--stepper-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--stepper-well': 'rgba(24, 24, 27, 0.05)',
    '--stepper-track': 'rgba(24, 24, 27, 0.08)',
    '--stepper-ink': '#27272a',
    '--stepper-muted': 'rgba(39, 39, 42, 0.55)',
    '--stepper-faint': 'rgba(24, 24, 27, 0.16)',
    '--stepper-ring': 'rgba(24, 24, 27, 0.28)',
    '--stepper-solid': '#27272a',
    '--stepper-solid-ink': '#ffffff',
    '--stepper-hover': 'brightness(0.97)',
    '--stepper-hover-fill': 'rgba(24, 24, 27, 0.035)',
    '--stepper-solid-hover': 'brightness(1.3)',
    '--stepper-press': 'brightness(0.92)',
  },
}

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)'
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const size = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

const readableOn = (color: string) => {
  let hex = String(color || '')
    .trim()
    .replace('#', '')
  if (hex.length === 3) hex = hex.replace(/./g, c => c + c)
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff'
  const [r, g, b] = [0, 2, 4].map(index => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff'
}

const ease = () =>
  typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)'

const INK = 'text-[color:var(--stepper-ink)]'
const MUTED = 'text-[color:var(--stepper-muted)]'
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--stepper-ink)]'
const ROOT_CLASS =
  'relative box-border flex w-[min(100%,var(--stepper-width))] max-w-full min-w-0 rounded-[var(--stepper-radius)] text-[color:var(--stepper-ink)] [-webkit-tap-highlight-color:transparent] [--stepper-tile-radius:max(4px,calc(var(--stepper-well-radius)-4px))] [--stepper-well-radius:max(6px,calc(var(--stepper-radius)-8px))]'
const FRAMED_CLASS =
  '[--stepper-bleed:20px] [--stepper-inset:12px] [--stepper-pad:8px] p-[var(--stepper-pad)] [background:var(--stepper-frame)] [box-shadow:var(--stepper-frame-shadow)] backdrop-blur-[20px] backdrop-saturate-[1.6]'
const BARE_CLASS = '[--stepper-bleed:8px] [--stepper-inset:0px] [--stepper-pad:0px]'
const RIM_CLASS =
  'pointer-events-none absolute inset-0 z-[2] rounded-[inherit] [box-shadow:inset_0_0_0_1px_var(--stepper-frame-edge),inset_0_1px_0_var(--stepper-frame-highlight)]'
const TRACK_CLASS =
  'relative flex gap-1 rounded-[var(--stepper-well-radius)] p-1 [background:var(--stepper-well)]'
const GLIDER_CLASS =
  'pointer-events-none absolute top-0 left-0 rounded-[var(--stepper-tile-radius)] opacity-0 [background:var(--stepper-tile)] [box-shadow:inset_0_0_0_1px_var(--stepper-tile-edge),inset_0_1px_0_var(--stepper-tile-highlight),var(--stepper-tile-shadow)]'
const SEGMENT_CLASS = `relative box-border flex min-w-0 cursor-pointer rounded-[var(--stepper-tile-radius)] border-none bg-transparent font-[inherit] ${MUTED} [transition:background-color_0.2s_ease] disabled:cursor-default [@media(hover:hover)]:[&:not(:disabled):hover]:[background:var(--stepper-hover-fill)] ${FOCUS}`
const SEGMENT_ROW = 'h-10 flex-[1_1_auto] items-center justify-center gap-2 px-2.5'
const SEGMENT_RAIL = 'h-auto flex-none items-start justify-start gap-2.5 p-2.5'
const BADGE_CLASS = `grid h-[22px] w-[22px] flex-none place-items-center rounded-full text-[11.5px] leading-none font-semibold tabular-nums ${MUTED} [box-shadow:inset_0_0_0_1px_var(--stepper-faint)] [transition:background-color_0.15s_ease,box-shadow_0.15s_ease,color_0.15s_ease] data-[status=active]:text-[color:var(--stepper-ink)] data-[status=active]:[box-shadow:inset_0_0_0_1.5px_var(--stepper-ink)] data-[status=complete]:text-[color:var(--stepper-solid-ink)] data-[status=complete]:[background:var(--stepper-solid)] data-[status=complete]:[box-shadow:none]`
const TITLE_CLASS =
  'overflow-hidden text-[13px] leading-[1.2] font-semibold text-ellipsis whitespace-nowrap transition-colors duration-200'
const DESCRIPTION_CLASS = `overflow-hidden text-[12px] leading-[1.35] text-ellipsis whitespace-nowrap ${MUTED}`
const DOT_CLASS = `group/dot grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full border-none bg-transparent p-0 disabled:cursor-default ${FOCUS}`
const DOT_MARK_CLASS =
  'h-2 w-2 rounded-full [background:var(--stepper-faint)] [transition:background-color_0.25s_ease,transform_0.45s_var(--stepper-spring)] data-[status=active]:[background:var(--stepper-solid)] data-[status=active]:[transform:scale(1.3)] data-[status=complete]:[background:var(--stepper-muted)] motion-reduce:[transition-duration:0.01ms] [@media(hover:hover)]:group-[:not(:disabled):hover]/dot:[transform:scale(1.3)]'
const BAR_CLASS = `group/bar flex h-[18px] flex-1 cursor-pointer items-center border-none bg-transparent p-0 disabled:cursor-default ${FOCUS}`
const BAR_TRACK_CLASS =
  'relative h-1 w-full overflow-hidden rounded-[4px] [background:var(--stepper-track)] [@media(hover:hover)]:group-[:not(:disabled):hover]/bar:[background:var(--stepper-faint)]'
const BAR_FILL_CLASS =
  'absolute inset-0 origin-left [background:var(--stepper-solid)] [transform:scaleX(0)] [transition:transform_560ms_var(--stepper-spring)] data-[filled]:[transform:none] motion-reduce:[transition-duration:0.01ms]'
const VIEWPORT_CLASS = 'relative -my-1.5 mx-[calc(var(--stepper-bleed)*-1)] overflow-hidden'
const PANE_CLASS = 'box-border px-[var(--stepper-bleed)] py-1.5 outline-none'
const LEAVING_CLASS = 'pointer-events-none absolute top-0 right-0 left-0'
const FOOTER_WRAP_CLASS =
  'group/footer grid grid-rows-[1fr] [transition:grid-template-rows_480ms_var(--stepper-spring),opacity_0.2s_ease] data-[hidden]:pointer-events-none data-[hidden]:grid-rows-[0fr] data-[hidden]:opacity-0 motion-reduce:[transition-duration:0.01ms]'
const FOOTER_CLIP_CLASS = 'min-h-0 group-data-[hidden]/footer:overflow-hidden'
const FOOTER_CLASS = 'flex items-center justify-between gap-3 pt-5'
const BUTTON_CLASS = `inline-flex h-[38px] flex-none cursor-pointer items-center gap-1.5 rounded-[max(8px,calc(var(--stepper-radius)*0.5))] border-none px-3.5 font-[inherit] text-[13.5px] leading-none font-semibold [transition:filter_0.2s_ease,transform_0.2s_ease,opacity_0.2s_ease] disabled:cursor-not-allowed disabled:opacity-40 active:enabled:[filter:var(--stepper-press)] active:enabled:[transform:scale(0.96)] active:enabled:duration-0 ${FOCUS}`
const BACK_CLASS = `pl-2.5 ${INK} [background:var(--stepper-tile)] [box-shadow:inset_0_0_0_1px_var(--stepper-tile-edge),inset_0_1px_0_var(--stepper-tile-highlight),var(--stepper-tile-shadow)] hover:enabled:[filter:var(--stepper-hover)] data-[hidden]:invisible data-[hidden]:opacity-0 data-[hidden]:[transition:opacity_0.2s_ease,visibility_0s_0.2s]`
const NEXT_CLASS =
  'ml-auto pr-[11px] text-[color:var(--stepper-solid-ink)] [background:var(--stepper-solid)] [box-shadow:0_4px_12px_-6px_rgba(0,0,0,0.5)] hover:enabled:[filter:var(--stepper-solid-hover)]'

function Check() {
  let ref!: HTMLSpanElement

  onMount(() => {
    const path = ref?.querySelector('path') as SVGPathElement | null
    if (!path || typeof path.animate !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    path.style.strokeDasharray = '24'
    path.animate([{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], {
      duration: 360,
      easing: SETTLE,
    })
  })

  return (
    <span ref={ref} class="grid place-items-center">
      <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.4} />
    </span>
  )
}

export function Step(props: StepProps) {
  if (registrar) {
    registrar({
      get title() {
        return props.title
      },
      get description() {
        return props.description
      },
      get icon() {
        return props.icon
      },
      content: () => <div class="min-w-0">{props.children}</div>,
    })
    return null
  }
  // Standalone <Step> outside a <Stepper> renders its wrapper as upstream does.
  return <div class="min-w-0">{props.children}</div>
}

export default function Stepper(props: StepperProps) {
  const [own, rest] = splitProps(props, [
    'children',
    'step',
    'initialStep',
    'onStepChange',
    'onFinalStepCompleted',
    'indicator',
    'orientation',
    'transition',
    'linear',
    'disableStepIndicators',
    'renderStepIndicator',
    'showFooter',
    'backButtonText',
    'nextButtonText',
    'completeButtonText',
    'backButtonProps',
    'nextButtonProps',
    'completedContent',
    'theme',
    'accentColor',
    'frame',
    'radius',
    'width',
    'className',
    'class',
    'stepCircleContainerClassName',
    'stepContainerClassName',
    'contentClassName',
    'footerClassName',
    'style',
  ])

  const steps: RegisteredStep[] = []
  registrar = step => steps.push(step)
  const _childrenItems = own.children
  registrar = null
  const total = steps.length
  const controlled = () => typeof own.step === 'number'
  const [internal, setInternal] = createSignal(own.initialStep ?? 1)
  const current = () =>
    clamp(Math.round(controlled() ? (own.step as number) : internal()), 1, total + 1)
  const completed = () => current() > total
  const vertical = () => own.orientation === 'vertical'
  const kind = () => (vertical() ? 'numbers' : (own.indicator ?? 'numbers'))
  const labelled = steps.some(entry => !!entry.title)

  const [compact, setCompact] = createSignal(false)
  const [tight, setTight] = createSignal(false)
  let tightRef = false
  const rail = () => vertical() && !compact()
  const [reached, setReached] = createSignal(current())
  createEffect(() => {
    if (current() > reached()) setReached(current())
  })

  const [view, setView] = createSignal<View>({
    step: current(),
    previous: null,
    direction: 1,
    id: 0,
  })
  createEffect(() => {
    const cur = current()
    if (view().step !== cur) {
      setView(state => ({
        step: cur,
        previous: state.step,
        direction: cur > state.step ? 1 : -1,
        id: state.id + 1,
      }))
    }
  })

  let rootRef!: HTMLDivElement
  let trackRef!: HTMLDivElement
  let gliderRef!: HTMLSpanElement
  const markerRefs: (HTMLElement | null)[] = []
  const titleRefs: (HTMLSpanElement | null)[] = []
  let viewportRef!: HTMLDivElement
  let paneRef!: HTMLDivElement
  let leavingRef!: HTMLDivElement
  let height = 0
  const labelWidths: number[] = []
  let placed = false

  const go = (target: number) => {
    const next = clamp(target, 1, total + 1)
    if (next === current()) return
    if (!controlled()) setInternal(next)
    if (next > total) own.onFinalStepCompleted?.()
    else own.onStepChange?.(next)
  }

  const reachable = (number: number) =>
    !(own.disableStepIndicators ?? false) &&
    number !== current() &&
    (!(own.linear ?? false) || number <= Math.min(reached(), total))

  createEffect(() => {
    // Upstream deps: [vertical, labelled, frame, total, kind]
    const root = rootRef
    if (!root) return
    const verticalNow = vertical()
    void labelled
    void own.frame
    void total
    void kind()
    const measure = () => {
      const folded = verticalNow && root.clientWidth < 520
      setCompact(folded)
      const track = trackRef
      if (!track || !labelled || (verticalNow && !folded)) {
        tightRef = false
        setTight(false)
        return
      }
      const segments = markerRefs.slice(0, total)
      if (!tightRef) {
        segments.forEach((segment, index) => {
          const title = titleRefs[index]
          labelWidths[index] = title && segment?.contains(title) ? title.scrollWidth + 8 : 0
        })
      }
      const badges = segments.reduce(
        (sum, segment) =>
          sum + (segment?.firstElementChild?.getBoundingClientRect().width ?? 22) + 20,
        0,
      )
      const labels = labelWidths.slice(0, total).reduce((sum, value) => sum + (value || 0), 0)
      const room = track.clientWidth - 8 - 4 * Math.max(0, total - 1)
      const nextTight = badges + labels > room + 0.5
      tightRef = nextTight
      setTight(nextTight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    onCleanup(() => observer.disconnect())
  })

  onMount(() => {
    const viewport = viewportRef
    if (!viewport) return
    height = viewport.offsetHeight
    const observer = new ResizeObserver(() => {
      height = viewport.offsetHeight
    })
    observer.observe(viewport)
    onCleanup(() => observer.disconnect())
  })

  createEffect(() => {
    // Upstream deps: [view.id]
    const state = view()
    if (state.id === 0) return
    const viewport = viewportRef
    const pane = paneRef
    const leaving = leavingRef
    const id = state.id
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const transition = own.transition ?? 'slide'
    const mode = transition === 'none' ? 'none' : reduced ? 'fade' : transition
    const finish = () => setView(s => (s.id === id ? { ...s, previous: null } : s))
    if (leaving && pane && leaving.contains(document.activeElement))
      pane.focus({ preventScroll: true })
    if (!viewport || typeof viewport.animate !== 'function' || mode === 'none') {
      finish()
      return
    }
    for (const element of [viewport, pane, leaving])
      element?.getAnimations().forEach(animation => animation.cancel())
    const from = height
    const to = viewport.offsetHeight
    const spring = ease()
    if (Math.abs(from - to) > 0.5) {
      viewport.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: reduced ? 200 : 560,
        easing: reduced ? SETTLE : spring,
      })
    }
    const axis = vertical() ? 'Y' : 'X'
    const shift = mode === 'slide' ? 36 : 0
    if (pane) {
      if (shift) {
        pane.animate(
          [{ transform: `translate${axis}(${state.direction * shift}px)` }, { transform: 'none' }],
          {
            duration: 560,
            easing: spring,
          },
        )
      }
      pane.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], {
        duration: 420,
        easing: 'ease-out',
      })
    }
    if (leaving) {
      leaving.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140,
        easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
        fill: 'forwards',
      })
      const exit = leaving.animate(
        [{ transform: 'none' }, { transform: `translate${axis}(${-state.direction * shift}px)` }],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      )
      exit.onfinish = finish
    } else finish()
  })

  createEffect(() => {
    // Upstream deps: [current, total, completed, kind, labelled, vertical, compact, tight]
    const track = trackRef
    const glider = gliderRef
    if (!track || !glider) return
    const cur = current()
    const isCompleted = completed()
    void total
    void kind()
    void labelled
    void vertical()
    void compact()
    void tight()
    const place = (animate: boolean) => {
      const segment = markerRefs[Math.min(cur, total) - 1]
      if (!segment) return
      const spring = ease()
      glider.style.transition = animate
        ? `transform 560ms ${spring}, width 560ms ${spring}, height 560ms ${spring}, opacity 200ms ease`
        : 'opacity 200ms ease'
      glider.style.transform = `translate3d(${segment.offsetLeft}px, ${segment.offsetTop}px, 0)`
      glider.style.width = `${segment.offsetWidth}px`
      glider.style.height = `${segment.offsetHeight}px`
      glider.style.opacity = isCompleted ? '0' : '1'
    }
    place(placed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    placed = true
    const observer = new ResizeObserver(() => place(false))
    observer.observe(track)
    onCleanup(() => observer.disconnect())
  })

  const paneContent = (number: number | null) =>
    number === null || number > total
      ? (own.completedContent ?? null)
      : (steps[number - 1]?.content() ?? null)
  const accentVars = (): Record<string, string> =>
    own.accentColor
      ? { '--stepper-solid': own.accentColor, '--stepper-solid-ink': readableOn(own.accentColor) }
      : {}

  const badge = (
    entry: RegisteredStep,
    number: number,
    status: 'complete' | 'active' | 'upcoming',
  ) => (
    <span class={BADGE_CLASS} data-status={status}>
      {status === 'complete' ? (
        <Check />
      ) : entry.icon ? (
        <span class="grid place-items-center">{entry.icon}</span>
      ) : (
        number
      )}
    </span>
  )

  const header = () => {
    if (kind() === 'dots') {
      return (
        <div class="flex justify-center gap-[2px]">
          <Index each={steps}>
            {(entry, index) => {
              const number = index + 1
              const status = () =>
                completed() || number < current()
                  ? 'complete'
                  : number === current()
                    ? 'active'
                    : 'upcoming'
              return (
                <button
                  type="button"
                  class={DOT_CLASS}
                  data-status={status()}
                  aria-label={
                    entry().title ? `Step ${number}: ${String(entry().title)}` : `Step ${number}`
                  }
                  aria-current={number === current() ? 'step' : undefined}
                  disabled={!reachable(number)}
                  onClick={() => go(number)}
                >
                  <span class={DOT_MARK_CLASS} data-status={status()} />
                </button>
              )
            }}
          </Index>
        </div>
      )
    }
    if (kind() === 'bars') {
      return (
        <div class="flex gap-1.5">
          <Index each={steps}>
            {(entry, index) => {
              const number = index + 1
              const filled = () => completed() || number <= current()
              return (
                <button
                  type="button"
                  class={BAR_CLASS}
                  data-status={
                    completed() || number < current()
                      ? 'complete'
                      : number === current()
                        ? 'active'
                        : 'upcoming'
                  }
                  aria-label={
                    entry().title ? `Step ${number}: ${String(entry().title)}` : `Step ${number}`
                  }
                  aria-current={number === current() ? 'step' : undefined}
                  disabled={!reachable(number)}
                  onClick={() => go(number)}
                >
                  <span class={BAR_TRACK_CLASS}>
                    <span class={BAR_FILL_CLASS} data-filled={filled() ? '' : undefined} />
                  </span>
                </button>
              )
            }}
          </Index>
        </div>
      )
    }
    return (
      <div
        ref={trackRef}
        class={`${TRACK_CLASS} ${rail() ? 'flex-1 flex-col' : ''}`}
        data-layout={rail() ? 'rail' : 'row'}
      >
        <span ref={gliderRef} class={GLIDER_CLASS} aria-hidden="true" />
        <Index each={steps}>
          {(entry, index) => {
            const number = index + 1
            const status = () =>
              completed() || number < current()
                ? 'complete'
                : number === current()
                  ? 'active'
                  : 'upcoming'
            const title = entry().title
            const text = () =>
              !!title &&
              !(tight() && !rail()) && (
                <span
                  class={`flex min-w-0 flex-col gap-[2px] text-left ${rail() ? 'pt-[3px]' : ''}`}
                >
                  <span
                    ref={(element: HTMLSpanElement) => {
                      titleRefs[index] = element
                    }}
                    class={`${TITLE_CLASS} ${status() === 'upcoming' ? MUTED : INK}`}
                    data-status={status()}
                  >
                    {title}
                  </span>
                  {rail() && entry().description && (
                    <span class={DESCRIPTION_CLASS}>{entry().description}</span>
                  )}
                </span>
              )
            const ref = (element: HTMLElement) => {
              markerRefs[index] = element
            }
            if (own.renderStepIndicator) {
              return (
                <div
                  ref={ref}
                  class={`${SEGMENT_CLASS} ${rail() ? SEGMENT_RAIL : SEGMENT_ROW}`}
                  data-status={status()}
                >
                  {own.renderStepIndicator({
                    step: number,
                    currentStep: current(),
                    onStepClick: clicked => go(clicked),
                  })}
                  {text()}
                </div>
              )
            }
            return (
              <button
                ref={ref}
                type="button"
                class={`${SEGMENT_CLASS} ${rail() ? SEGMENT_RAIL : SEGMENT_ROW}`}
                data-status={status()}
                aria-label={
                  typeof title === 'string' ? `Step ${number}: ${title}` : `Step ${number}`
                }
                aria-current={number === current() ? 'step' : undefined}
                disabled={!reachable(number)}
                onClick={() => go(number)}
              >
                {badge(entry(), number, status())}
                {text()}
              </button>
            )
          }}
        </Index>
      </div>
    )
  }

  const { class: backClass = '', onClick: onBackClick, ...backRest } = own.backButtonProps ?? {}
  const { class: nextClass = '', onClick: onNextClick, ...nextRest } = own.nextButtonProps ?? {}
  // Solid handler unions may be a single handler or an array of them.
  const fireClick = (handler: unknown, event: MouseEvent) => {
    if (Array.isArray(handler)) handler.forEach(fn => fn(event))
    else (handler as ((event: MouseEvent) => void) | undefined)?.(event)
  }

  return (
    <div
      {...rest}
      ref={rootRef}
      class={`${ROOT_CLASS} ${rail() ? 'flex-row items-stretch' : 'flex-col'} ${(own.frame ?? true) ? FRAMED_CLASS : BARE_CLASS} ${own.stepCircleContainerClassName ?? ''} ${own.class ?? ''} ${own.className ?? ''}`
        .replace(/\s+/g, ' ')
        .trim()}
      data-completed={completed() ? '' : undefined}
      style={
        {
          ...(THEMES[own.theme ?? 'dark'] ?? THEMES.dark),
          '--stepper-radius': `${Math.max(0, own.radius ?? 24)}px`,
          '--stepper-spring': SPRING,
          '--stepper-width': size(own.width ?? 440),
          ...accentVars(),
          ...own.style,
        } as JSX.CSSProperties
      }
    >
      <div
        class={`${kind() === 'numbers' ? '' : 'px-[var(--stepper-inset)] pt-[var(--stepper-inset)]'} ${rail() ? 'flex w-[212px] max-w-[42%] flex-none' : ''} ${own.stepContainerClassName ?? ''}`
          .replace(/\s+/g, ' ')
          .trim()}
      >
        {header()}
      </div>
      <div
        class={`flex min-w-0 flex-col ${rail() ? 'flex-1 pt-[var(--stepper-inset)] pr-[var(--stepper-inset)] pb-[var(--stepper-inset)] pl-5' : 'px-[var(--stepper-inset)] pt-5 pb-[var(--stepper-inset)]'}`}
      >
        <div
          ref={viewportRef}
          class={`${VIEWPORT_CLASS} ${own.contentClassName ?? ''}`.trim()}
          aria-live="polite"
        >
          {view().previous !== null && (
            <div ref={leavingRef} class={`${PANE_CLASS} ${LEAVING_CLASS}`} aria-hidden="true">
              {paneContent(view().previous)}
            </div>
          )}
          <div ref={paneRef} class={PANE_CLASS} tabIndex={-1}>
            {paneContent(view().step)}
          </div>
        </div>
        {(own.showFooter ?? true) && (
          <div
            class={FOOTER_WRAP_CLASS}
            data-hidden={completed() ? '' : undefined}
            aria-hidden={completed() ? 'true' : undefined}
          >
            <div class={FOOTER_CLIP_CLASS}>
              <div class={`${FOOTER_CLASS} ${own.footerClassName ?? ''}`.trim()}>
                <button
                  type="button"
                  {...backRest}
                  class={`${BUTTON_CLASS} ${BACK_CLASS} ${backClass}`.trim()}
                  data-hidden={current() <= 1 ? '' : undefined}
                  tabIndex={completed() ? -1 : backRest.tabIndex}
                  onClick={event => {
                    fireClick(onBackClick, event)
                    if (!event.defaultPrevented) go(current() - 1)
                  }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  <span>{own.backButtonText ?? 'Back'}</span>
                </button>
                <button
                  type="button"
                  {...nextRest}
                  class={`${BUTTON_CLASS} ${NEXT_CLASS} ${nextClass}`.trim()}
                  tabIndex={completed() ? -1 : nextRest.tabIndex}
                  onClick={event => {
                    fireClick(onNextClick, event)
                    if (!event.defaultPrevented) go(current() + 1)
                  }}
                >
                  <span>
                    {current() === total
                      ? (own.completeButtonText ?? 'Complete')
                      : (own.nextButtonText ?? 'Continue')}
                  </span>
                  <HugeiconsIcon
                    icon={current() === total ? Tick02Icon : ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {(own.frame ?? true) && <span class={RIM_CLASS} aria-hidden="true" />}
    </div>
  )
}
