// solid-fx SEO widget — original component (not a port). Free APIs: none (all computed from props).
import { createMemo, Show, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'

export type CwVitalsVariant = 'rings' | 'bars'

export interface CwVitalsProps {
  /** Largest Contentful Paint in ms. */
  lcp?: number
  /** Interaction to Next Paint in ms. */
  inp?: number
  /** Cumulative Layout Shift (unitless). */
  cls?: number
  /** Time to First Byte in ms. */
  ttfb?: number
  /** First Contentful Paint in ms. */
  fcp?: number
  /** Which gauge style to render. @default 'rings' */
  variant?: CwVitalsVariant
  class?: string
  /** Solid class alias, merged alongside `class`. */
  className?: string
}

type Rating = 'good' | 'ni' | 'poor'

interface MetricDef {
  key: keyof CwVitalsProps
  label: string
  full: string
  /** Upper bound of the "good" range (Google published thresholds). */
  good: number
  /** Upper bound of the "needs improvement" range; beyond is "poor". */
  poor: number
  /** Formats the raw value for display. */
  format: (v: number) => string
}

const MS = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`)

// Thresholds from web.dev's Core Web Vitals / Screenload vitals definitions.
const METRICS: MetricDef[] = [
  {
    key: 'lcp',
    label: 'LCP',
    full: 'Largest Contentful Paint',
    good: 2500,
    poor: 4000,
    format: MS,
  },
  { key: 'inp', label: 'INP', full: 'Interaction to Next Paint', good: 200, poor: 500, format: MS },
  {
    key: 'cls',
    label: 'CLS',
    full: 'Cumulative Layout Shift',
    good: 0.1,
    poor: 0.25,
    format: v => v.toFixed(3),
  },
  { key: 'ttfb', label: 'TTFB', full: 'Time to First Byte', good: 800, poor: 1800, format: MS },
  { key: 'fcp', label: 'FCP', full: 'First Contentful Paint', good: 1800, poor: 3000, format: MS },
]

const RATING_COLOR: Record<Rating, string> = {
  good: '#0d9f6e',
  ni: '#d97706',
  poor: '#e02d3c',
}

const RATING_LABEL: Record<Rating, string> = {
  good: 'Good',
  ni: 'Needs improvement',
  poor: 'Poor',
}

function ratingFor(def: MetricDef, value: number): Rating {
  if (value <= def.good) return 'good'
  if (value <= def.poor) return 'ni'
  return 'poor'
}

interface Reading {
  def: MetricDef
  value: number
  rating: Rating
  /** 0..1 fill: full at the top of the "good" range, empty past "poor". */
  fill: number
  display: string
}

function readingsOf(props: CwVitalsProps): Reading[] {
  const out: Reading[] = []
  for (const def of METRICS) {
    const raw = props[def.key]
    if (typeof raw !== 'number' || Number.isNaN(raw)) continue
    const rating = ratingFor(def, raw)
    const fill =
      rating === 'good'
        ? 1 - (raw / def.good) * 0.3
        : rating === 'ni'
          ? 0.7 - ((raw - def.good) / (def.poor - def.good)) * 0.5
          : 0.2
    out.push({
      def,
      value: raw,
      rating,
      fill: Math.max(0.05, Math.min(1, fill)),
      display: def.format(raw),
    })
  }
  return out
}

/** SVG ring gauge for a single metric. */
function RingGauge(props: { reading: Reading; size: number }) {
  const stroke = () => Math.max(4, props.size * 0.08)
  const r = () => (props.size - stroke()) / 2 - 2
  const c = () => 2 * Math.PI * r()
  const offset = () => c() * (1 - props.reading.fill)
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox={`0 0 ${props.size} ${props.size}`}
      role="img"
      aria-label={`${props.reading.def.full}: ${props.reading.display} (${RATING_LABEL[props.reading.rating]})`}
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
        stroke={RATING_COLOR[props.reading.rating]}
        stroke-width={stroke()}
        stroke-linecap="round"
        stroke-dasharray={String(c())}
        stroke-dashoffset={String(offset())}
        transform={`rotate(-90 ${props.size / 2} ${props.size / 2})`}
        class="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
      />
      <text
        x="50%"
        y="47%"
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-zinc-100 font-sans font-semibold"
        style={{ 'font-size': `${props.size * 0.22}px` }}
      >
        {props.reading.def.label}
      </text>
      <text
        x="50%"
        y="66%"
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-zinc-400 font-sans"
        style={{ 'font-size': `${props.size * 0.11}px` }}
      >
        {props.reading.display}
      </text>
    </svg>
  )
}

/** Horizontal bar with good / needs-improvement threshold labels. */
function BarGauge(props: { reading: Reading }) {
  return (
    <div class="w-full">
      <div class="mb-1 flex items-baseline justify-between text-xs">
        <span class="font-medium text-zinc-200">{props.reading.def.label}</span>
        <span class="font-mono" style={{ color: RATING_COLOR[props.reading.rating] }}>
          {props.reading.display}
        </span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <div
          class="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700"
          style={{
            width: `${Math.round(props.reading.fill * 100)}%`,
            'background-color': RATING_COLOR[props.reading.rating],
          }}
        />
      </div>
      <div class="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>good ≤ {props.reading.def.good}</span>
        <span>poor &gt; {props.reading.def.poor}</span>
      </div>
    </div>
  )
}

/**
 * Core Web Vitals gauge display. Values are measured externally (CrUX,
 * Lighthouse, RUM, …) and passed in; the widget maps them onto Google's
 * published good / needs-improvement / poor thresholds.
 */
export default function CwVitals(props: CwVitalsProps): JSX.Element {
  const [own, rest] = splitProps(props, [
    'lcp',
    'inp',
    'cls',
    'ttfb',
    'fcp',
    'variant',
    'class',
    'className',
  ])
  const variant = () => own.variant ?? 'rings'
  const readings = createMemo(() => readingsOf(own))
  const size = () => 108

  const summary = createMemo<Rating | null>(() => {
    const rs = readings()
    if (rs.length === 0) return null
    if (rs.some(r => r.rating === 'poor')) return 'poor'
    if (rs.some(r => r.rating === 'ni')) return 'ni'
    return 'good'
  })

  return (
    <div
      class={`w-full ${own.class ?? ''} ${own.className ?? ''}`.trim()}
      {...rest}
      aria-label="Core Web Vitals gauges"
    >
      <Show
        when={readings().length > 0}
        fallback={
          <div class="rounded-xl border border-white/10 bg-zinc-900/60 p-6 text-center text-sm text-zinc-500">
            No metrics provided — pass{' '}
            <code class="font-mono text-zinc-400">lcp / inp / cls / ttfb / fcp</code>.
          </div>
        }
      >
        <div class="rounded-xl border border-white/10 bg-zinc-900/60 p-6">
          <div class="mb-4 flex items-center justify-between">
            <div class="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              Core Web Vitals
            </div>
            <Show when={summary()}>
              {s => (
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    color: RATING_COLOR[s()],
                    'background-color': `${RATING_COLOR[s()]}1f`,
                  }}
                >
                  {RATING_LABEL[s()]}
                </span>
              )}
            </Show>
          </div>
          <Show
            when={variant() === 'rings'}
            fallback={
              <div class="flex flex-col gap-4">
                <For each={readings()}>{r => <BarGauge reading={r} />}</For>
              </div>
            }
          >
            <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              <For each={readings()}>{r => <RingGauge reading={r} size={size()} />}</For>
            </div>
          </Show>
          <div class="mt-4 flex flex-wrap gap-4 text-[10px] text-zinc-500">
            <For each={Object.keys(RATING_LABEL) as Rating[]}>
              {r => (
                <span class="flex items-center gap-1.5">
                  <span
                    class="size-2 rounded-full"
                    style={{ 'background-color': RATING_COLOR[r] }}
                  />
                  {RATING_LABEL[r]}
                </span>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
