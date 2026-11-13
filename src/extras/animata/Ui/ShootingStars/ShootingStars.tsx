// Source: github.com/codse/animata animata/background/shooting-stars.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: upstream imports ./shooting-stars.css; the two @keyframes are
// inlined in an enclosing <style> element (keyframes can't ship as Tailwind
// classes). React state/refs map to Solid signals + closure lets; lists render
// via <For>; ResizeObserver + rAF are disposed in onCleanup. The className
// merge is a template join, equivalent to upstream's cn() for plain strings.
import type { JSX } from 'solid-js'
import { For, createSignal, onCleanup, onMount } from 'solid-js'

interface Star {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  angle: number
  len: number
  width: number
  duration: number
  delay: number
  grad: GradId
}

interface Dot {
  id: number
  x: number
  y: number
  r: number
  o: number
}

type GradId = 'ss-white' | 'ss-blue' | 'ss-warm'
const ACCENTS: GradId[] = ['ss-blue', 'ss-warm']

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function makeStar(id: number, w: number, h: number, firstRun: boolean): Star {
  const angle = rand(15, 31) // one diagonal direction (down-right) + variance
  const rad = (angle * Math.PI) / 180
  const len = rand(60, 200)
  // Keep the whole streak + glow off-screen at spawn so it animates IN, never pops mid-view.
  const margin = len + 48
  // Travel far enough to cross the container and exit off the bottom-right.
  const diag = Math.hypot(w, h)
  const travel = diag + margin * 2 + rand(0, diag * 0.3)
  // Down-right movers enter from the top or left edge — start the head just past it.
  const fromTop = Math.random() < w / (w + h)
  const x = fromTop ? rand(-0.15 * w, 0.85 * w) : -margin - rand(0, 0.2 * w)
  const y = fromTop ? -margin - rand(0, 0.2 * h) : rand(-0.15 * h, 0.6 * h)
  return {
    id,
    x,
    y,
    dx: Math.cos(rad) * travel,
    dy: Math.sin(rad) * travel,
    angle,
    len,
    width: rand(1, 2.4),
    duration: rand(1.3, 3.6),
    delay: firstRun ? rand(0, 4) : rand(0, 1.8),
    grad: Math.random() < 0.82 ? 'ss-white' : ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
  }
}

interface ShootingStarsProps {
  children?: JSX.Element
  /** React parity alias; merges with `class`. */
  className?: string
  class?: string
}

const shootingStarsStyles = `
@keyframes ss-shoot {
  0% {
    transform: translate(0px, 0px);
    opacity: 0;
  }
  6% {
    opacity: 1;
  }
  82% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy));
    opacity: 0;
  }
}

@keyframes ss-twinkle {
  0%, 100% {
    opacity: var(--o);
  }
  50% {
    opacity: calc(var(--o) * 0.25);
  }
}
`

export default function ShootingStars(props: ShootingStarsProps) {
  const [stars, setStars] = createSignal<Star[]>([])
  const [dots, setDots] = createSignal<Dot[]>([])
  let containerEl!: HTMLDivElement
  let dims = { w: 0, h: 0 }
  let nextId = 0

  onMount(() => {
    const el = containerEl
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let seeded = false

    const seed = () => {
      const r = el.getBoundingClientRect()
      dims = { w: r.width, h: r.height }
      const { w, h } = dims
      if (!w || !h) return
      seeded = true

      const dotCount = Math.min(90, Math.max(24, Math.round((w * h) / 14000)))
      setDots(
        Array.from({ length: dotCount }, (_, i) => ({
          id: i,
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.4, 1.3),
          o: rand(0.15, 0.7),
        })),
      )

      if (reduced) {
        setStars([])
        return
      }
      const starCount = Math.min(30, Math.max(12, Math.round(w / 95)))
      setStars(Array.from({ length: starCount }, () => makeStar(nextId++, w, h, true)))
    }

    const seedFrame = requestAnimationFrame(() => seed())
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      dims = { w: r.width, h: r.height }
      // If we mounted at 0×0 (hidden tab, collapsed/lazy panel), seed once the
      // container actually has a size — otherwise the sky stays empty.
      if (!seeded && r.width && r.height) {
        requestAnimationFrame(() => seed())
      }
    })
    ro.observe(el)
    onCleanup(() => {
      cancelAnimationFrame(seedFrame)
      ro.disconnect()
    })
  })

  const recycle = (id: number) => {
    const { w, h } = dims
    if (!w || !h) return
    setStars(prev => prev.map(s => (s.id === id ? makeStar(nextId++, w, h, false) : s)))
  }

  return (
    <div class={`relative w-full overflow-hidden ${props.class ?? ''} ${props.className ?? ''}`}>
      <style>{shootingStarsStyles}</style>
      <div
        ref={containerEl}
        class="absolute inset-0 z-0 bg-linear-to-b from-indigo-950 to-[#05050f]"
      >
        <div
          class="absolute inset-x-0 top-1/4 h-3/4 opacity-40"
          style={{
            background:
              'radial-gradient(55% 50% at 50% 45%, rgba(76,82,180,0.4) 0%, rgba(20,22,60,0.22) 45%, rgba(5,5,15,0) 100%)',
          }}
        />

        <svg class="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="ss-white" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
            </linearGradient>
            <linearGradient id="ss-blue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#9ec1ff" stop-opacity="0" />
              <stop offset="100%" stop-color="#cfe0ff" stop-opacity="1" />
            </linearGradient>
            <linearGradient id="ss-warm" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffd9a8" stop-opacity="0" />
              <stop offset="100%" stop-color="#ffe9cf" stop-opacity="1" />
            </linearGradient>
            <radialGradient id="ss-glow">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>
          </defs>

          <For each={dots()}>
            {d => (
              <circle
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill="#fff"
                style={{
                  '--o': d.o,
                  opacity: d.o,
                  animation: `ss-twinkle ${4 + (d.id % 5)}s ease-in-out ${d.id % 7}s infinite`,
                }}
              />
            )}
          </For>

          <For each={stars()}>
            {s => (
              <g transform={`translate(${s.x} ${s.y})`}>
                <g
                  onAnimationEnd={() => recycle(s.id)}
                  style={{
                    '--dx': `${s.dx}px`,
                    '--dy': `${s.dy}px`,
                    opacity: 0,
                    animation: `ss-shoot ${s.duration}s cubic-bezier(0.4, 0, 0.7, 1) ${s.delay}s forwards`,
                  }}
                >
                  <g transform={`rotate(${s.angle})`}>
                    <rect
                      x={-s.len}
                      y={-s.width / 2}
                      width={s.len}
                      height={s.width}
                      rx={s.width / 2}
                      fill={`url(#${s.grad})`}
                    />
                    {/* soft glow + bright core at the head — pure paint, no filter */}
                    <circle cx={0} cy={0} r={Math.max(5, s.width * 3.5)} fill="url(#ss-glow)" />
                    <circle cx={0} cy={0} r={Math.max(1.4, s.width * 1.05)} fill="#ffffff" />
                  </g>
                </g>
              </g>
            )}
          </For>
        </svg>
      </div>

      <div class="relative z-10 h-full w-full">{props.children}</div>
    </div>
  )
}
