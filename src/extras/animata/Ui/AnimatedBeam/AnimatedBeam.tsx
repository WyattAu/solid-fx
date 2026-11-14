// Source: github.com/codse/animata animata/background/animated-beam.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream imports ./animated-beam.css; the @keyframes + reduced-motion
// block are inlined in an enclosing <style> element (keyframes can't ship as
// Tailwind classes). The lane Array.from().map renders via <For>; the upstream
// root's `full-content` marker class (a storybook-preview hook, no intrinsic
// styling) is dropped. Upstream merges classes with cn(); this port
// template-joins, equivalent for the plain strings passed here.
import type { JSX } from 'solid-js'
import { For } from 'solid-js'

const animatedBeamStyles = `
.ab-beam {
  height: 100%;
}
@keyframes meteor {
  0% {
    transform: translateY(-20%) translateX(-50%);
    opacity: 0;
  }
  12% {
    opacity: var(--opacity, 1);
  }
  88% {
    opacity: var(--opacity, 1);
  }
  100% {
    transform: translateY(300%) translateX(-50%);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ab-beam {
    animation: none !important;
    opacity: 0 !important;
  }
}
`

// Deterministic 0–1 pseudo-random from an integer — same on server and client,
// so each beam gets its own length/speed/etc. without a hydration mismatch.
const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const lerp = (min: number, max: number, t: number) => min + (max - min) * t

// Enough 40px lanes to cover wide screens; extras are clipped by overflow-hidden,
// so the line count stays responsive without measuring the container.
const LANES = 64
const LANE_INDEXES = Array.from({ length: LANES }, (_, i) => i)

function Beam(props: { index: number }) {
  // Every dimension is varied per beam and exposed as a CSS variable.
  // ~30% are quick zips (1.2–3.2s); the rest drift slowly (6–14s).
  const index = props.index
  const fast = prand(index + 91) < 0.3
  const duration = fast ? lerp(1.2, 3.2, prand(index)) : lerp(6, 14, prand(index))
  const delay = lerp(0, 9, prand(index + 13))
  const length = Math.round(lerp(24, 84, prand(index + 29))) // streak length
  const width = Math.round(lerp(3, 7, prand(index + 53)))
  // fast streaks read brighter, like real meteors
  const opacity = fast ? lerp(0.8, 1, prand(index + 71)) : lerp(0.35, 0.9, prand(index + 71))

  return (
    <div
      class="ab-beam"
      style={{
        '--duration': `${duration.toFixed(2)}s`,
        '--delay': `${delay.toFixed(2)}s`,
        '--length': `${length}px`,
        '--opacity': opacity.toFixed(2),
        width: `${width}px`,
        transform: 'translateY(-20%)',
        // `backwards` shows the 0% keyframe (opacity 0) during the delay, so a
        // beam never peeks at its resting position before its run begins.
        animation: 'meteor var(--duration) var(--delay) ease-in-out infinite backwards',
      }}
    >
      <div
        class="w-full"
        style={{
          height: 'var(--length)',
          'clip-path': 'polygon(54% 0, 54% 0, 60% 100%, 40% 100%)',
        }}
      >
        <div class="h-full w-full bg-linear-to-b from-neutral-50/50 via-neutral-100 via-75% to-neutral-50" />
      </div>
    </div>
  )
}

function Background() {
  return (
    <div class="absolute inset-0 z-0 flex flex-row justify-center overflow-hidden bg-linear-to-t from-indigo-900 to-indigo-950">
      {/* soft glow */}
      <div
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%,#072a39 0%,rgb(7,42,57) 50%,rgba(7,42,57,0) 100%)',
        }}
        class="absolute inset-0 top-1/2 h-full w-full rounded-full opacity-40"
      />

      {/* fixed-width lanes → constant 40px spacing, clipped to whatever fits */}
      <For each={LANE_INDEXES}>
        {(i) => (
          <div class="flex h-full w-10 shrink-0 justify-center">
            <div class="relative h-full w-px rotate-12 bg-gray-100/10">
              {/* beam rides this diagonal line; ~30% of lanes get one */}
              {prand(i + 7) < 0.3 && <Beam index={i + 1} />}
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

interface AnimatedBeamProps {
  children?: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
}

export default function AnimatedBeam(props: AnimatedBeamProps) {
  return (
    <div class={`relative w-full overflow-hidden ${props.class ?? ''} ${props.className ?? ''}`}>
      <style>{animatedBeamStyles}</style>
      <Background />
      <div class="relative h-full w-full">{props.children}</div>
    </div>
  )
}
