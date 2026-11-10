// Source: github.com/codse/animata animata/background/interactive-grid.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
// PORT-NOTE: React hooks map to Solid primitives — useLayoutEffect → onMount,
// useState → createSignal, useMemo → createMemo, and the mapped `cells` memo
// becomes a reactive <For> (Solid re-runs the row body when its tracked reads
// change). NodeJS.Timeout → ReturnType<typeof setInterval>. Upstream merges
// classes with cn(); this port template-joins / uses classList, and the
// scale/opacity conflict (scale-90 vs scale-100 in the same class list) is
// resolved by branching the class string instead of relying on tailwind-merge.
import { createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import type { JSX } from 'solid-js'

function plotSquares(width: number, height: number, size: number): { x: number; y: number }[] {
  const squares: { x: number; y: number }[] = []

  const boundary = size * 2
  const used = new Set<number>()

  for (let x = boundary; x < width / 2 - boundary; x += size) {
    for (let y = boundary; y < height - boundary; y += size) {
      // Custom logic to reduce the number of squares
      if (
        used.has(x + y + size) ||
        used.has(x + y - size) ||
        used.has(x + y + size * 4) ||
        used.has(x + y - size * 4)
      ) {
        continue
      }

      used.add(x + y)
      squares.push({ x, y })
    }
  }
  return squares
}

const size = 24 // h-6
const boxClassName =
  'absolute h-6 w-6 rounded-md bg-transparent p-px border border-gray-400/30 border-box group/cell '

function Grid() {
  let containerRef!: HTMLDivElement
  // React: useGridLayout hook (useState + useLayoutEffect + resize listener).
  const [layout, setLayout] = createSignal({ vertical: 0, horizontal: 0 })

  onMount(() => {
    const updateLayout = () => {
      const rect = containerRef.getBoundingClientRect()
      if (!rect) {
        return
      }
      setLayout({
        vertical: Math.floor(rect.height),
        horizontal: Math.floor(rect.width),
      })
    }

    updateLayout()

    // Can be debounced if needed
    window.addEventListener('resize', updateLayout)
    onCleanup(() => window.removeEventListener('resize', updateLayout))
  })

  const squares = createMemo(() => plotSquares(layout().horizontal, layout().vertical, size))
  const [active, setActive] = createSignal(0)
  let timer: ReturnType<typeof setInterval> | undefined

  const onActivate = () => {
    if (timer) {
      clearInterval(timer)
    }

    const set = () => {
      const current = squares()
      const next = current[Math.floor(Math.random() * current.length) % current.length]
      setActive(next.x + next.y)
    }

    set()

    const cycleCount = 5
    let count = 0
    timer = setInterval(() => {
      if (count === cycleCount) {
        clearInterval(timer)
        setActive(0)
        return
      }

      set()
      count++
    }, 1000)
  }
  // Cleanup discipline: upstream leaks this interval on unmount — we clear it.
  onCleanup(() => timer && clearInterval(timer))

  return (
    <div
      ref={containerRef}
      class="absolute inset-0 h-full max-h-96 w-full"
      classList={{ 'top-1/4': layout().vertical > 96 * 4 }}
    >
      <For each={squares()}>
        {({ x, y }, i) => {
          const xPos = () => {
            let pos = x
            if (i() % 2) {
              // Mirror the grid horizontally (50% of the time)
              pos = layout().horizontal - x - size
            }
            return pos
          }
          const shouldHighlight = () => active() - x === x || active() - y === y
          return (
            <button
              type="button"
              aria-label="Highlight grid path"
              style={{ transform: `translate(${xPos()}px, ${y}px)` }}
              onMouseEnter={onActivate}
              onFocus={onActivate}
              class={boxClassName}
            >
              <div
                style={{ 'transition-delay': active() ? `${x + y}ms` : '0ms' }}
                class={`h-full w-full rounded-sm bg-gray-400/30 transition-all duration-700 ${
                  shouldHighlight()
                    ? 'scale-100 opacity-100'
                    : 'scale-90 opacity-0 group-hover/cell:scale-100 group-hover/cell:opacity-100'
                }`}
              />
            </button>
          )
        }}
      </For>
    </div>
  )
}

export default function InteractiveGrid(props: {
  children?: JSX.Element
  class?: string
  /** React parity alias; merges with `class`. */
  className?: string
  contentClassName?: string
}) {
  return (
    <div
      class={`storybook-fix relative h-full w-full overflow-hidden rounded-3xl ${props.class ?? ''} ${props.className ?? ''}`}
      style={{
        'background-image':
          'linear-gradient(123deg, transparent 0%, transparent 36%,rgba(17, 17, 57,0.02) 36%, rgba(17, 17, 87,0.02) 56%,transparent 56%, transparent 100%),linear-gradient(251deg, transparent 0%, transparent 68%,rgba(3, 3, 3,0.02) 68%, rgba(3, 3, 93,0.02) 99%,transparent 99%, transparent 100%),linear-gradient(135deg, rgb(200,215,255),rgb(205,215,255))',
      }}
    >
      <Grid />
      <div class={`relative mx-auto h-full w-fit ${props.contentClassName ?? ''}`}>
        {props.children}
      </div>
    </div>
  )
}
