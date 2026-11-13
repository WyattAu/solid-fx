// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import {
  createMemo,
  createSignal,
  createEffect,
  onCleanup,
  onMount,
  splitProps,
  For,
  Show,
} from 'solid-js'
import type { JSX } from 'solid-js'

export type LighthouseRingVariant = 'rings' | 'bars'

export interface LighthouseScores {
  /** 0-100 */
  performance?: number
  /** 0-100 */
  accessibility?: number
  /** 0-100 */
  bestPractices?: number
  /** 0-100 */
  seo?: number
}

export interface LighthouseRingProps {
  /** Category scores 0-100; missing categories are skipped. */
  scores: LighthouseScores
  /** Diameter of the hero ring in px (bars variant scales from it). @default 160 */
  size?: number
  /** @default 'rings' */
  variant?: LighthouseRingVariant
  class?: string
  /** Solid class alias, merged alongside `class`. */
  className?: string
}

interface Category {
  key: keyof LighthouseScores
  label: string
}

const CATEGORIES: Category[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
]

// Lighthouse score colors: ≥90 green, 50-89 orange, <50 red.
function scoreColor(score: number): string {
  if (score >= 90) return '#0cce6b'
  if (score >= 50) return '#ffa400'
  return '#ff4e42'
}

const clampScore = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

interface Entry {
  label: string
  score: number
}

function entriesOf(scores: LighthouseScores): Entry[] {
  const out: Entry[] = []
  for (const cat of CATEGORIES) {
    const raw = scores[cat.key]
    if (typeof raw !== 'number' || Number.isNaN(raw)) continue
    out.push({ label: cat.label, score: clampScore(raw) })
  }
  return out
}

/** One circular gauge; animates stroke-dashoffset and count-up on mount. */
function ScoreRing(props: {
  label: string
  score: number
  size: number
  delay: number
  hero?: boolean
}) {
  const stroke = () => Math.max(5, props.size * (props.hero ? 0.09 : 0.08))
  const r = () => (props.size - stroke()) / 2 - 1
  const circumference = () => 2 * Math.PI * r()

  const [shown, setShown] = createSignal(0)
  let raf = 0
  onMount(() => {
    const start = performance.now() + props.delay
    const duration = 900
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(props.score)
      return
    }
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(props.score * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  })
  onCleanup(() => cancelAnimationFrame(raf))

  const color = () => scoreColor(props.score)
  const offset = () => circumference() * (1 - shown() / 100)

  return (
    <div class="flex flex-col items-center gap-2">
      <svg
        width={props.size}
        height={props.size}
        viewBox={`0 0 ${props.size} ${props.size}`}
        role="img"
        aria-label={`${props.label} score: ${props.score} out of 100`}
      >
        <circle
          cx={props.size / 2}
          cy={props.size / 2}
          r={r()}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          stroke-width={stroke()}
        />
        <circle
          cx={props.size / 2}
          cy={props.size / 2}
          r={r()}
          fill="none"
          stroke={color()}
          stroke-width={stroke()}
          stroke-linecap="round"
          stroke-dasharray={String(circumference())}
          stroke-dashoffset={String(offset())}
          transform={`rotate(-90 ${props.size / 2} ${props.size / 2})`}
        />
        <text
          x="50%"
          y="52%"
          text-anchor="middle"
          dominant-baseline="central"
          class="fill-zinc-100 font-sans font-bold"
          style={{ 'font-size': `${props.size * (props.hero ? 0.3 : 0.26)}px` }}
        >
          {shown()}
        </text>
      </svg>
      <div class={`font-sans ${props.hero ? 'text-sm' : 'text-xs'} font-medium text-zinc-300`}>
        {props.label}
      </div>
    </div>
  )
}

/** Lighthouse-style score display: hero + category rings, or a category bar list. */
export default function LighthouseRing(props: LighthouseRingProps): JSX.Element {
  const [own, rest] = splitProps(props, ['scores', 'size', 'variant', 'class', 'className'])
  const variant = () => own.variant ?? 'rings'
  const size = () => own.size ?? 160
  const entries = createMemo(() => entriesOf(own.scores))

  const average = createMemo<number | null>(() => {
    const es = entries()
    if (es.length === 0) return null
    return clampScore(es.reduce((sum, e) => sum + e.score, 0) / es.length)
  })

  const [barReady, setBarReady] = createSignal(false)
  createEffect(() => {
    entries()
    setBarReady(false)
    const id = window.setTimeout(() => setBarReady(true), 30)
    onCleanup(() => window.clearTimeout(id))
  })

  return (
    <div
      class={`w-full ${own.class ?? ''} ${own.className ?? ''}`.trim()}
      {...rest}
      aria-label="Lighthouse category scores"
    >
      <div class="rounded-xl border border-white/10 bg-zinc-900/60 p-6">
        <Show
          when={entries().length > 0}
          fallback={
            <div class="text-center text-sm text-zinc-500">
              No scores provided — pass{' '}
              <code class="font-mono text-zinc-400">
                scores.performance / accessibility / bestPractices / seo
              </code>
              .
            </div>
          }
        >
          <Show
            when={variant() === 'rings'}
            fallback={
              <div class="flex flex-col gap-4">
                <For each={entries()}>
                  {e => (
                    <div>
                      <div class="mb-1 flex items-baseline justify-between text-xs">
                        <span class="font-medium text-zinc-200">{e.label}</span>
                        <span
                          class="font-mono font-semibold"
                          style={{ color: scoreColor(e.score) }}
                        >
                          {e.score}
                        </span>
                      </div>
                      <div class="h-2 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          class="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700"
                          style={{
                            width: barReady() ? `${e.score}%` : '0%',
                            'background-color': scoreColor(e.score),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </For>
              </div>
            }
          >
            <div class="flex flex-col items-center gap-6">
              <Show when={average()}>
                {avg => (
                  <ScoreRing label="Overall" score={avg()} size={size()} delay={0} hero={true} />
                )}
              </Show>
              <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
                <For each={entries()}>
                  {(e, i) => (
                    <ScoreRing
                      label={e.label}
                      score={e.score}
                      size={Math.round(size() * 0.55)}
                      delay={120 + i() * 90}
                    />
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}
