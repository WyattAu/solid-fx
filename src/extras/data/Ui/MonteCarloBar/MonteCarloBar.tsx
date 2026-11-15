// solid-fx Data widget — original component (not a port).
// Monte Carlo convergence progress bar: replaces the meaningless spinner with
// the running estimate μ̂ₙ ± SEₙ as samples accumulate, so a user can press
// "Accept & Stop" the moment the interval shrinks inside tolerance.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'
import { createWelford, standardError, type Welford } from '@/lib/num'

export interface MonteCarloBarProps {
  /** Sampler for one draw of the quantity being estimated. */
  sample: () => number
  /** Auto-stop once the standard error drops below this (default 0.05). */
  targetSe?: number
  /** Hard sample cap (default 20 000). */
  maxSamples?: number
  /** Draws per animation tick (default 40). */
  batchPerTick?: number
  /** Tick cadence in ms (default 60). */
  tickMs?: number
  /** Auto-start on mount (default true). */
  running?: boolean
  label?: string
  /** Fired once when accepted (button or auto-stop) with the estimate. */
  onAccept?: (result: { mean: number; se: number; n: number }) => void
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface Snapshot {
  n: number
  mean: number
  se: number
}

export function MonteCarloBar(props: MonteCarloBarProps) {
  const [own, rest] = splitProps(props, [
    'sample',
    'targetSe',
    'maxSamples',
    'batchPerTick',
    'tickMs',
    'running',
    'label',
    'onAccept',
    'class',
    'className',
    'style',
  ])

  const targetSe = () => own.targetSe ?? 0.05
  const maxSamples = () => own.maxSamples ?? 20_000

  const w: Welford = createWelford()
  const [history, setHistory] = createSignal<Snapshot[]>([])
  const [accepted, setAccepted] = createSignal<{ mean: number; se: number; n: number } | null>(null)
  const [paused, setPaused] = createSignal(!(own.running ?? true))
  let timer: ReturnType<typeof setInterval> | undefined

  // Welford is a plain mutable object — JSX reads of w.n/w.mean must ride a
  // reactive dependency (history) to update at all.
  const stats = () => {
    history()
    return { n: w.n, mean: w.mean, se: standardError(w) }
  }

  const push = () => {
    const batch = own.batchPerTick ?? 40
    for (let k = 0; k < batch && w.n < maxSamples(); k++) w.push(own.sample())
    const snap: Snapshot = { n: w.n, mean: w.mean, se: standardError(w) }
    setHistory(h => [...h.slice(-159), snap])
    if ((snap.se <= targetSe() || w.n >= maxSamples()) && !accepted()) {
      const result = { mean: snap.mean, se: snap.se, n: snap.n }
      setAccepted(result)
      own.onAccept?.(result)
      stopTimer()
    }
  }

  const startTimer = () => {
    if (timer !== undefined) return
    timer = setInterval(push, own.tickMs ?? 60)
  }

  const stopTimer = () => {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  onMount(() => {
    if (!paused()) startTimer()
    onCleanup(stopTimer)
  })

  const toggle = () => {
    if (accepted()) return
    setPaused(p => {
      if (p) startTimer()
      else stopTimer()
      return !p
    })
  }

  const accept = () => {
    if (accepted() || w.n === 0) return
    const result = { mean: w.mean, se: standardError(w), n: w.n }
    setAccepted(result)
    own.onAccept?.(result)
    stopTimer()
  }

  // strip geometry: mean line + SE band, both normalized to a fixed viewport
  // (the band narrows visually only when scaled; instead we draw mean ± 4·SE
  // against a per-run scale so convergence reads as band collapse)
  const width = 320
  const height = 44
  const band = () => {
    const h = history()
    if (h.length === 0) return null
    const lo = Math.min(...h.map(s => s.mean - 4 * s.se))
    const hi = Math.max(...h.map(s => s.mean + 4 * s.se))
    const span = hi - lo || 1
    const yOf = (v: number) => height - 4 - ((v - lo) / span) * (height - 8)
    const xOf = (i: number) => (i / Math.max(1, h.length - 1)) * width
    const upper = h.map((s, i) => `${xOf(i).toFixed(1)},${yOf(s.mean + 4 * s.se).toFixed(1)}`)
    const lower = h
      .map((s, i) => `${xOf(i).toFixed(1)},${yOf(s.mean - 4 * s.se).toFixed(1)}`)
      .reverse()
    return {
      area: `M${upper.join(' L')} L${lower.join(' L')} Z`,
      line: h.map((s, i) => `${xOf(i).toFixed(1)},${yOf(s.mean).toFixed(1)}`).join(' '),
      yMean: yOf(h[h.length - 1].mean),
    }
  }

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'Monte Carlo'}</span>
        <span class="font-mono" aria-live="polite">
          {accepted() ? (
            <span class="text-emerald-300">
              accepted μ = {accepted()!.mean.toFixed(4)} ± {accepted()!.se.toFixed(4)} (n ={' '}
              {accepted()!.n.toLocaleString()})
            </span>
          ) : (
            <>
              n = {stats().n.toLocaleString()}
              <span class="mx-1 text-gray-600">·</span>
              μ̂ = {stats().mean.toFixed(4)} ± {stats().se.toFixed(4)}
              <span class="mx-1 text-gray-600">·</span>
              SE target {targetSe()}
            </>
          )}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        class="w-full rounded-md bg-gray-800"
        role="img"
        aria-label="running estimate with shrinking standard-error band"
      >
        {band() && (
          <>
            <path d={band()!.area} fill="oklch(0.62 0.12 235)" opacity="0.25" />
            <polyline
              points={band()!.line}
              fill="none"
              stroke="oklch(0.75 0.12 235)"
              stroke-width="1.2"
            />
            <line
              x1="0"
              x2={width}
              y1={band()!.yMean}
              y2={band()!.yMean}
              stroke="oklch(0.7 0.15 155)"
              stroke-width="0.6"
              stroke-dasharray="3 3"
            />
          </>
        )}
      </svg>
      <div class="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          class="rounded px-2 py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40"
          disabled={!!accepted()}
          onClick={toggle}
        >
          {paused() && !accepted() ? 'resume' : 'pause'}
        </button>
        <button
          type="button"
          class="rounded bg-emerald-700 px-2 py-0.5 text-xs text-emerald-100 outline-none hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-40"
          disabled={!!accepted() || stats().n === 0}
          onClick={accept}
        >
          Accept &amp; Stop
        </button>
        <span class="text-[10px] text-gray-500">
          {history().length > 0
            ? `SE band = μ̂ ± 4·SE over ${history().length} frames`
            : 'sampling…'}
        </span>
      </div>
    </div>
  )
}

export default MonteCarloBar
