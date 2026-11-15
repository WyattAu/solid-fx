// solid-fx Data widget — original component (not a port).
// 24px "profile fingerprint": an N-dim feature vector encoded as tight
// vertical ticks, so an anomalous row breaks alignment across 100 rows in
// under 200ms of pre-attentive scanning.
import type { JSX } from 'solid-js'
import { For, splitProps } from 'solid-js'

export interface ProfileFingerprintProps {
  /** Feature vector; components are normalized per-vector. */
  vector: number[]
  /** Pixel width (default 24 — table-row scale). */
  width?: number
  /** Pixel height (default 12). */
  height?: number
  /** Color for high values (default sky); low values fade toward gray. */
  color?: string
  title?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function ProfileFingerprint(props: ProfileFingerprintProps) {
  const [own, rest] = splitProps(props, [
    'vector',
    'width',
    'height',
    'color',
    'title',
    'class',
    'className',
    'style',
  ])

  const width = () => own.width ?? 24
  const height = () => own.height ?? 12
  const color = () => own.color ?? 'oklch(0.72 0.12 235)'

  const norm = () => {
    const v = own.vector
    if (v.length === 0) return []
    let min = Math.min(...v)
    let max = Math.max(...v)
    if (min === max) {
      min -= 1
      max += 1
    }
    const span = max - min
    return v.map(x => (x - min) / span)
  }

  const n = () => own.vector.length
  const slot = () => width() / Math.max(1, n())
  const barW = () => Math.max(0.8, slot() - 0.6)

  return (
    <svg
      {...rest}
      width={width()}
      height={height()}
      viewBox={`0 0 ${width()} ${height()}`}
      role="img"
      aria-label={own.title ?? `feature fingerprint, ${n()} dimensions`}
      class={`inline-block align-middle ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <title>{own.title ?? 'profile fingerprint'}</title>
      <For each={norm()}>
        {(t, i) => (
          <rect
            x={(i() * slot()).toFixed(2)}
            y={(height() * (1 - t)).toFixed(2)}
            width={barW().toFixed(2)}
            height={Math.max(1, height() * t).toFixed(2)}
            fill={color()}
            opacity={(0.25 + 0.75 * t).toFixed(2)}
            rx="0.4"
          />
        )}
      </For>
    </svg>
  )
}

export default ProfileFingerprint
