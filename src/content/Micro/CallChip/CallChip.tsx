import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'
import HugeiconsIcon from '@/lib/HugeiconsIcon'
import {
  CommandLineIcon,
  File02Icon,
  PencilEdit01Icon,
  RefreshIcon,
  Search01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'

export type CallChipStatus = 'idle' | 'running' | 'done' | 'error'
export type CallChipIcon = 'terminal' | 'file' | 'search' | 'edit'

export interface CallChipProps {
  icon?: CallChipIcon | JSX.Element
  name?: string
  argument?: string
  status?: CallChipStatus
  expectedMs?: number
  size?: number
  radius?: number
  color?: string
  surfaceColor?: string
  progressColor?: string
  progressOpacity?: number
  doneColor?: string
  errorColor?: string
  washOpacity?: number
  shake?: number
  showTimer?: boolean
  onRetry?: () => void
  className?: string
  class?: string
  style?: JSX.CSSProperties
}

type Glyph = 'tool' | 'check' | 'retry'

const HOLD_AT = 0.9
const SHAKE = [0, -1, 1, -0.66, 0.66, -0.33, 0]
const ICONS: Record<CallChipIcon, typeof CommandLineIcon> = {
  terminal: CommandLineIcon,
  file: File02Icon,
  search: Search01Icon,
  edit: PencilEdit01Icon,
}
const WORDS: Record<CallChipStatus, string> = {
  running: 'running',
  done: 'done',
  error: 'failed',
  idle: 'queued',
}

const fmt = (ms: number) => (ms < 10000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`)
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const glyphOf = (s: CallChipStatus): Glyph =>
  s === 'done' ? 'check' : s === 'error' ? 'retry' : 'tool'

const CallChip = (props: CallChipProps) => {
  const name = () => props.name ?? 'bash'
  const argument = () => props.argument ?? 'npm test'
  const status = () => props.status ?? 'running'
  const size = () => props.size ?? 34
  const expectedMs = () => props.expectedMs ?? 2500
  const shakeAmount = () => props.shake ?? 6
  const showTimer = () => props.showTimer ?? true

  let rootEl: HTMLSpanElement | undefined
  let fillEl: HTMLSpanElement | undefined
  let timerEl: HTMLSpanElement | undefined
  let fraction = 0
  const clock = { ms: 0 }
  let shakeAnim: Animation | null = null
  const [mounted, setMounted] = createSignal(false)
  const [pressed, setPressed] = createSignal(false)
  const [announce, setAnnounce] = createSignal('')
  const [roll, setRoll] = createSignal<{ cur: Glyph; prev: Glyph | null }>({
    cur: glyphOf(status()),
    prev: null,
  })

  // Upstream mutated roll during render; a derived signal has the same shape:
  // cur becomes prev whenever the status glyph changes.
  createEffect(() => {
    const g = glyphOf(status())
    setRoll(prev => (g !== prev.cur ? { cur: g, prev: prev.cur } : prev))
  })

  const setFraction = (f: number, instant: boolean) => {
    const fill = fillEl
    if (!fill) return
    fraction = f
    if (instant) fill.style.transition = 'none'
    fill.style.transform = `scaleX(${f})`
    if (instant) {
      void fill.getBoundingClientRect()
      fill.style.transition = ''
    }
  }
  const apply = (s: CallChipStatus, animate: boolean) => {
    if (s === 'running') {
      shakeAnim?.cancel()
      setFraction(0, true)
      if (animate) setFraction(HOLD_AT, false)
    } else if (s === 'done') {
      setFraction(1, !animate)
    } else if (s === 'error') {
      const fill = fillEl
      const live = fill ? new DOMMatrix(getComputedStyle(fill).transform).a : fraction
      setFraction(Math.min(1, Math.max(0, live)), true)
      if (animate && shakeAmount() > 0 && !reduceMotion() && rootEl) {
        shakeAnim = rootEl.animate(
          SHAKE.map(k => ({
            transform: `translateX(${k * shakeAmount()}px)`,
            easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
          })),
          { duration: 450, composite: 'add' },
        )
      }
    } else setFraction(0, true)
  }

  onMount(() => {
    setMounted(true)
    onCleanup(() => shakeAnim?.cancel())
  })

  // Upstream: mount apply (useEffect) + useLayoutEffect on [status] — one
  // effect covers both (Solid effects run after the DOM is ready).
  createEffect(() => {
    apply(status(), true)
  })

  createEffect(() => {
    const s = status()
    const write = (ms: number) => {
      clock.ms = ms
      if (timerEl) timerEl.textContent = fmt(ms)
    }
    if (s !== 'running') {
      if ((s === 'idle' || !clock.ms) && timerEl) timerEl.textContent = '—'
      return
    }
    const startedAt = performance.now()
    write(0)
    if (reduceMotion()) {
      const id = setInterval(() => write(performance.now() - startedAt), 100)
      onCleanup(() => {
        clearInterval(id)
        write(performance.now() - startedAt)
      })
    } else {
      let raf = 0
      const tick = () => {
        write(performance.now() - startedAt)
        raf = requestAnimationFrame(tick)
      }
      tick()
      onCleanup(() => {
        cancelAnimationFrame(raf)
        write(performance.now() - startedAt)
      })
    }
  })

  createEffect(() => {
    const s = status()
    const ms = showTimer() && clock.ms ? Math.round(clock.ms) : 0
    const when = s === 'done' && ms ? ` in ${ms} ms` : s === 'error' && ms ? ` after ${ms} ms` : ''
    setAnnounce(`${name()} ${argument()}, ${WORDS[s] ?? s}${when}`)
  })

  const font = () => Math.max(11, Math.round(size() * 0.38))
  const glyphState = (g: Glyph) => (g === roll().cur ? 'in' : g === roll().prev ? 'out' : undefined)
  const toolIcon = () =>
    typeof props.icon === 'string' ? (ICONS[props.icon as CallChipIcon] ?? ICONS.terminal) : null
  const iconSize = () => font() + 2
  const glyphWrapClass =
    'absolute inset-0 grid place-items-center opacity-0 blur-[3px] [transform:translateY(70%)] data-[state=in]:opacity-100 data-[state=in]:blur-0 data-[state=in]:[transform:none] data-[state=in]:[transition:opacity_240ms_cubic-bezier(0.23,1,0.32,1),transform_240ms_cubic-bezier(0.23,1,0.32,1),filter_240ms_cubic-bezier(0.23,1,0.32,1)] data-[state=out]:[transform:translateY(-70%)] data-[state=out]:[transition:opacity_160ms_cubic-bezier(0.23,1,0.32,1),transform_160ms_cubic-bezier(0.23,1,0.32,1),filter_160ms_cubic-bezier(0.23,1,0.32,1)] group-data-[status=done]:data-[state=in]:[color:var(--cc-done)] group-data-[status=error]:data-[state=in]:[color:var(--cc-error)] motion-reduce:[transform:none]! motion-reduce:[filter:none]! group-not-data-[mounted]:transition-none!'

  return (
    <span
      ref={rootEl}
      role="status"
      aria-busy={status() === 'running' || undefined}
      data-status={status()}
      data-mounted={mounted() ? '' : undefined}
      data-pressed={pressed() ? '' : undefined}
      class={`group relative box-border inline-flex items-center overflow-hidden leading-none whitespace-nowrap select-none [-webkit-touch-callout:none] [height:var(--cc-size)] [padding:0_var(--cc-pad)] [gap:var(--cc-gap)] [border-radius:var(--cc-radius)] [background:var(--cc-surface)] [color:var(--cc-color)] [font-size:var(--cc-font)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)] data-[status=error]:cursor-pointer data-[pressed]:scale-[0.97] motion-reduce:data-[pressed]:scale-100${props.className ? ` ${props.className}` : ''}${props.class ? ` ${props.class}` : ''}`}
      style={{
        '--cc-size': `${size()}px`,
        '--cc-font': `${font()}px`,
        '--cc-pad': `${Math.round(size() * 0.35)}px`,
        '--cc-gap': `${Math.round(font() * 0.55)}px`,
        '--cc-radius': `${props.radius ?? 10}px`,
        '--cc-color': props.color ?? 'currentColor',
        '--cc-surface': props.surfaceColor ?? '#27272a',
        '--cc-progress': props.progressColor ?? 'currentColor',
        '--cc-progress-pct': `${(props.progressOpacity ?? 0.08) * 100}%`,
        '--cc-done': props.doneColor ?? '#22c55e',
        '--cc-error': props.errorColor ?? '#ef4444',
        '--cc-wash-pct': `${(props.washOpacity ?? 0.14) * 100}%`,
        '--cc-expected': `${expectedMs()}ms`,
        ...props.style,
      }}
    >
      <span
        ref={fillEl}
        class="pointer-events-none absolute inset-0 origin-left scale-x-0 [clip-path:inset(0_0_0_0)] [background:color-mix(in_srgb,var(--cc-progress)_var(--cc-progress-pct),transparent)] group-data-[status=running]:[transition:transform_var(--cc-expected)_linear] group-data-[status=done]:[clip-path:inset(100%_0_0_0)] group-data-[status=done]:[background:color-mix(in_srgb,var(--cc-done)_var(--cc-wash-pct),transparent)] group-data-[status=done]:[transition:transform_200ms_cubic-bezier(0.23,1,0.32,1),background-color_120ms_ease,clip-path_400ms_cubic-bezier(0.23,1,0.32,1)_200ms] group-data-[status=error]:[background:color-mix(in_srgb,var(--cc-error)_var(--cc-wash-pct),transparent)] group-data-[status=error]:[transition:background-color_200ms_ease] motion-reduce:group-data-[status=done]:[clip-path:inset(0_0_0_0)] motion-reduce:group-data-[status=done]:[transition:background-color_120ms_ease] group-not-data-[mounted]:transition-none!"
        aria-hidden="true"
      />
      <span
        class="relative flex-none overflow-hidden [width:calc(var(--cc-font)+2px)] [height:calc(var(--cc-font)+2px)]"
        aria-hidden="true"
      >
        <span class={glyphWrapClass} data-state={glyphState('tool')}>
          {toolIcon() ? (
            <HugeiconsIcon
              icon={toolIcon() as typeof CommandLineIcon}
              size={iconSize()}
              strokeWidth={1.8}
            />
          ) : (
            props.icon
          )}
        </span>
        <span class={glyphWrapClass} data-state={glyphState('check')}>
          <HugeiconsIcon icon={Tick02Icon} size={iconSize()} strokeWidth={2.2} />
        </span>
        <span class={glyphWrapClass} data-state={glyphState('retry')}>
          <HugeiconsIcon icon={RefreshIcon} size={iconSize()} strokeWidth={2} />
        </span>
      </span>
      <span class="relative font-medium" aria-hidden="true">
        {name()}
      </span>
      <span class="relative opacity-[0.72]" aria-hidden="true">
        {argument()}
      </span>
      {showTimer() ? (
        <span
          ref={el => {
            timerEl = el
          }}
          class="relative min-w-[6ch] text-right tabular-nums opacity-50"
          aria-hidden="true"
        >
          0 ms
        </span>
      ) : null}
      {status() === 'error' && props.onRetry ? (
        <button
          type="button"
          class="absolute -inset-[5px] m-0 cursor-pointer touch-manipulation appearance-none border-0 bg-transparent p-0 outline-none [border-radius:var(--cc-radius)] [-webkit-tap-highlight-color:transparent]"
          aria-label={`Retry ${name()} ${argument()}`}
          onClick={() => props.onRetry?.()}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        />
      ) : null}
      <span class="sr-only">{announce()}</span>
    </span>
  )
}

export default CallChip
