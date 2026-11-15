// solid-fx Instruments widget — original component (not a port).
// Half-life staleness "decay halo": a freshness ring synced to a real
// timestamp whose luminance and saturation decay smoothly as data ages past
// its configured half-life. Replaces binary green "Live" dots with a
// calibrated sense of how stale a feed is.
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, splitProps } from 'solid-js'

export interface DecayHaloBadgeProps {
  /** Epoch ms of the last real packet/update. */
  timestamp: number
  /** Age at which freshness halves (default 60 000 ms). */
  halfLifeMs?: number
  /** Label rendered beside the dot (default "live"). */
  label?: string
  /** Text shown once freshness < 2% (default "stale"). */
  staleLabel?: string
  /** Poll cadence in ms (default 1000). */
  tickMs?: number
  /** Solid class alias, merged alongside `className`. */
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function DecayHaloBadge(props: DecayHaloBadgeProps) {
  const [own, rest] = splitProps(props, [
    'timestamp',
    'halfLifeMs',
    'label',
    'staleLabel',
    'tickMs',
    'class',
    'className',
    'style',
  ])

  const halfLife = () => own.halfLifeMs ?? 60_000
  const [now, setNow] = createSignal(Date.now())

  onMount(() => {
    const tick = setInterval(() => setNow(Date.now()), own.tickMs ?? 1000)
    onCleanup(() => clearInterval(tick))
  })

  const ageMs = () => Math.max(0, now() - own.timestamp)
  // 0.5^(age/halfLife): 1 at the packet, 0.5 after one half-life, → 0
  const freshness = () => 0.5 ** (ageMs() / halfLife())
  const stale = () => freshness() < 0.02

  // Green → slate: hue 142 → 220, saturation 71% → 8%, lightness eases down.
  const color = () => {
    const f = freshness()
    const hue = 220 + (142 - 220) * f
    const sat = 8 + 63 * f
    const light = 42 + 10 * f
    return `oklch(${(light / 100).toFixed(3)} ${(sat / 100).toFixed(3)} ${hue.toFixed(1)})`
  }

  const text = () => (stale() ? (own.staleLabel ?? 'stale') : (own.label ?? 'live'))

  const ageText = () => {
    const s = Math.floor(ageMs() / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m`
    return `${Math.floor(m / 60)}h`
  }

  return (
    <span
      {...rest}
      class={`inline-flex select-none items-center gap-1.5 text-xs ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      title={`last packet ${ageText()} ago · freshness ${(freshness() * 100).toFixed(0)}%`}
    >
      <svg viewBox="0 0 20 20" class="h-4 w-4 -rotate-90" aria-hidden="true">
        {/* full track */}
        <circle cx="10" cy="10" r="7" fill="none" stroke="oklch(0.3 0.02 250)" stroke-width="2" />
        {/* freshness arc */}
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke={color()}
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray={`${(freshness() * 44).toFixed(1)} 44`}
        />
        {/* core dot */}
        <circle cx="10" cy="10" r="3" fill={color()} />
      </svg>
      <span style={{ color: stale() ? 'oklch(0.6 0.02 250)' : color() }} aria-live="polite">
        {text()}
        <span class="ml-1 text-gray-500">{ageText()}</span>
      </span>
    </span>
  )
}

export default DecayHaloBadge
