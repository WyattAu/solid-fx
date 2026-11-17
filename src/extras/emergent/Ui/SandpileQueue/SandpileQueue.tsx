// solid-fx Emergent widget — original component (not a port).
// Abelian sandpile priority queue: incoming tasks drop onto the busiest
// cell; at capacity a cell topples into its neighbors, and the avalanche
// cascade exposes self-organized criticality in any backlog (research
// 04 #10). Deterministic per seed (Bak–Tang–Wiesenfeld rules).
import type { JSX } from 'solid-js'
import { createSignal, For, onCleanup, onMount, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface SandpileQueueProps {
  /** Grid side length (default 14). */
  cells?: number
  /** Topple capacity per cell (default 4 — the classic BTW rule). */
  capacity?: number
  /** Auto-drop cadence in ms (default 400; 0 = manual only). */
  autoDropMs?: number
  /** RNG seed (default 1). */
  seed?: number
  /** Cell size in px (default 22). */
  cellSize?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

export function SandpileQueue(props: SandpileQueueProps) {
  const [own, rest] = splitProps(props, [
    'cells',
    'capacity',
    'autoDropMs',
    'seed',
    'cellSize',
    'label',
    'class',
    'className',
    'style',
  ])

  const cells = () => own.cells ?? 14
  const capacity = () => own.capacity ?? 4
  const cellSize = () => own.cellSize ?? 22

  const grid = (): number[] => new Array(cells() * cells()).fill(0)
  const state = grid()
  const [version, setVersion] = createSignal(0)
  const [avalanche, setAvalanche] = createSignal(0)
  const [totalDrops, setTotalDrops] = createSignal(0)
  const rng = mulberry32((own.seed ?? 1) >>> 0)
  let timer: ReturnType<typeof setInterval> | undefined

  // drop one grain on a deterministic "busy-biased" cell and resolve the
  // avalanche; returns the cascade size
  const drop = (): number => {
    const n = cells()
    // 70% of tasks land on the current max cell (priority-queue behavior),
    // 30% anywhere — both deterministic under the seeded stream
    let idx = 0
    if (rng() < 0.7) {
      let max = -1
      for (let i = 0; i < state.length; i++) {
        if (state[i] > max) {
          max = state[i]
          idx = i
        }
      }
    } else {
      idx = Math.floor(rng() * state.length) % state.length
    }
    state[idx] += 1
    let cascade = 0
    // resolve topples (BFS queue; the abelian property makes order irrelevant)
    const topple = [idx]
    while (topple.length > 0) {
      const i = topple.pop() as number
      if (state[i] < capacity()) continue
      cascade += 1
      state[i] -= capacity()
      const x = i % n
      const y = Math.floor(i / n)
      if (x > 0) {
        state[i - 1] += 1
        if (state[i - 1] >= capacity()) topple.push(i - 1)
      }
      if (x < n - 1) {
        state[i + 1] += 1
        if (state[i + 1] >= capacity()) topple.push(i + 1)
      }
      if (y > 0) {
        state[i - n] += 1
        if (state[i - n] >= capacity()) topple.push(i - n)
      }
      if (y < n - 1) {
        state[i + n] += 1
        if (state[i + n] >= capacity()) topple.push(i + n)
      }
    }
    setAvalanche(cascade)
    setTotalDrops(t => t + 1)
    setVersion(v => v + 1)
    return cascade
  }

  onMount(() => {
    const ms = own.autoDropMs ?? 400
    if (ms > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(() => drop(), ms)
    }
    onCleanup(() => {
      if (timer !== undefined) clearInterval(timer)
    })
  })

  const levelColor = (v: number): string => {
    if (v <= 0) return 'oklch(0.2 0.01 250)'
    const t = Math.min(1, v / capacity())
    return `oklch(${(0.45 + t * 0.3).toFixed(2)} ${(t * 0.15).toFixed(3)} 30)`
  }

  return (
    <figure
      {...rest}
      class={`inline-block ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="grid" style={{ 'grid-template-columns': `repeat(${cells()}, ${cellSize()}px)` }}>
        <For each={state.slice(0, cells() * cells())}>
          {(_, i) => {
            void version() // reactive dependency on the sandpile state
            return (
              <div
                class="flex items-center justify-center border border-gray-900 font-mono text-[9px] text-gray-200"
                style={{
                  width: `${cellSize()}px`,
                  height: `${cellSize()}px`,
                  background: levelColor(state[i()]),
                }}
                title={`cell ${i()} · load ${state[i()]}`}
              >
                {state[i()] > 0 ? state[i()] : ''}
              </div>
            )
          }}
        </For>
      </div>
      <figcaption class="mt-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'sandpile backlog'}</span>
        <span class="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          drops {totalDrops()} · last cascade {avalanche()}
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => drop()}
          >
            + task
          </button>
        </span>
      </figcaption>
    </figure>
  )
}

export default SandpileQueue
