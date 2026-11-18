// solid-fx FX widget — original component (not a port).
// Confetti burst over the canvas-confetti engine (ISC — see
// LICENSE-SOURCES.md). Fires on click and/or on mount; respects
// prefers-reduced-motion via the engine's own disable flag.
import type { JSX } from 'solid-js'
import { onMount, splitProps } from 'solid-js'
import confetti from 'canvas-confetti'

export interface ConfettiBurstProps {
  /** Button label (default "celebrate"). */
  label?: string
  /** Particle count per burst (default 80). */
  particleCount?: number
  /** Burst spread in degrees (default 70). */
  spread?: number
  /** Burst colors (default: amber/sky/emerald/rose). */
  colors?: string[]
  /** Fire once on mount (default false). */
  fireOnMount?: boolean
  /** Reduced-motion handling (default true — no confetti). */
  disableForReducedMotion?: boolean
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function ConfettiBurst(props: ConfettiBurstProps) {
  const [own, rest] = splitProps(props, [
    'label',
    'particleCount',
    'spread',
    'colors',
    'fireOnMount',
    'disableForReducedMotion',
    'class',
    'className',
    'style',
  ])

  const burst = (origin?: { x: number; y: number }) => {
    confetti({
      particleCount: own.particleCount ?? 80,
      spread: own.spread ?? 70,
      startVelocity: 38,
      origin: origin ?? { x: 0.5, y: 0.6 },
      colors: own.colors ?? ['#fbbf24', '#38bdf8', '#34d399', '#fb7185'],
      disableForReducedMotion: own.disableForReducedMotion ?? true,
    })
  }

  onMount(() => {
    if (own.fireOnMount) burst()
  })

  return (
    <button
      type="button"
      {...rest}
      class={`rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-100 outline-none transition-colors hover:border-gray-500 hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-sky-400 ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
      onClick={e => {
        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
        burst({
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        })
      }}
    >
      {own.label ?? 'celebrate'}
    </button>
  )
}

export default ConfettiBurst
