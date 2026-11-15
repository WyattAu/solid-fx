// solid-fx Instruments widget — original component (not a port).
// Row-stochastic Markov transition grid: every cell is a vertical micro-bar.
// Dragging a cell adjusts its probability while sibling cells in the row
// rescale to preserve Σⱼ Pᵢⱼ = 1 — impossible states are unreachable. The
// stationary distribution π is recomputed live by power iteration and shown
// along the bottom margin.
import type { JSX } from 'solid-js'
import { createSignal, For, splitProps } from 'solid-js'

export interface MarkovTransitionGridProps {
  /** State labels (default A/B/C). */
  states?: string[]
  /** Initial row-stochastic matrix; defaults to uniform 1/n rows. */
  transition?: number[][]
  /** Cell size in px (default 44). */
  cellSize?: number
  /** Fired (debounced to drag end) with the current matrix. */
  onChange?: (matrix: number[][]) => void
  /** Fired continuously while dragging. */
  onInput?: (matrix: number[][]) => void
  /** Solid class alias, merged alongside `className`. */
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

/** Power iteration for the stationary distribution of a row-stochastic matrix. */
function stationary(matrix: number[][]): number[] {
  const n = matrix.length
  let pi = Array.from({ length: n }, () => 1 / n)
  for (let iter = 0; iter < 64; iter++) {
    const next = Array.from({ length: n }, (_, j) => {
      let acc = 0
      for (let i = 0; i < n; i++) acc += pi[i] * matrix[i][j]
      return acc
    })
    const total = next.reduce((a, b) => a + b, 0)
    if (total <= 0) return pi
    pi = next.map(v => v / total)
  }
  return pi
}

const uniformRows = (n: number): number[][] =>
  Array.from({ length: n }, () => Array.from({ length: n }, () => 1 / n))

export function MarkovTransitionGrid(props: MarkovTransitionGridProps) {
  const [own, rest] = splitProps(props, [
    'states',
    'transition',
    'cellSize',
    'onChange',
    'onInput',
    'class',
    'className',
    'style',
  ])

  const states = () => own.states ?? ['A', 'B', 'C']
  const n = () => states().length
  const cell = () => own.cellSize ?? 44

  const initial = (): number[][] => {
    const given = own.transition
    if (given && given.length === n()) return given.map(row => normalizeRow(row))
    return uniformRows(n())
  }

  const [matrix, setMatrix] = createSignal<number[][]>(initial())
  const pi = () => stationary(matrix())

  const [drag, setDrag] = createSignal<{
    row: number
    col: number
    startY: number
    snapshot: number[][]
  } | null>(null)

  const normalizeRow = (row: number[]): number[] => {
    const sum = row.reduce((a, b) => a + b, 0)
    if (sum <= 0) return row.map(() => 1 / row.length)
    return row.map(v => v / sum)
  }

  const setCell = (row: number, col: number, raw: number) => {
    setMatrix(current => {
      const next = current.map(r => r.slice())
      // 100 px of travel ≈ the full 0→1 register; clamp inside it
      next[row][col] = Math.min(1, Math.max(0.001, raw))
      next[row] = normalizeRow(next[row])
      return next
    })
    own.onInput?.(matrix())
  }

  const onPointerDown = (row: number, col: number) => (event: PointerEvent) => {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    setDrag({ row, col, startY: event.clientY, snapshot: matrix().map(r => r.slice()) })
  }

  const onPointerMove = (event: PointerEvent) => {
    const d = drag()
    if (!d) return
    const start = d.snapshot[d.row][d.col]
    setCell(d.row, d.col, start - (event.clientY - d.startY) * 0.005)
  }

  const onCellKeyDown = (row: number, col: number) => (event: KeyboardEvent) => {
    let delta: number | null = null
    if (event.key === 'ArrowUp') delta = 0.01
    if (event.key === 'ArrowDown') delta = -0.01
    if (event.key === 'PageUp') delta = 0.1
    if (event.key === 'PageDown') delta = -0.1
    if (delta === null) return
    event.preventDefault()
    setCell(row, col, matrix()[row][col] + delta)
    own.onChange?.(matrix())
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!drag()) return
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    setDrag(null)
    own.onChange?.(matrix())
  }

  // chroma/lightness scale: p=0 → near-black slate, p=1 → vivid sky
  const cellColor = (p: number) => {
    const l = 0.22 + 0.38 * p
    const c = 0.02 + 0.1 * p
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} 235)`
  }

  return (
    <div
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="flex">
        <div style={{ width: '24px' }} />
        <For each={states()}>
          {s => (
            <div
              class="text-center text-[10px] tracking-wide text-gray-500 uppercase"
              style={{ width: `${cell()}px` }}
            >
              {s}
            </div>
          )}
        </For>
        <div style={{ width: '24px' }} />
      </div>
      <div class="flex items-start">
        {/* row labels */}
        <div class="flex flex-col" style={{ width: '24px', 'padding-top': `${cell() / 2 - 6}px` }}>
          <For each={states()}>
            {s => (
              <div class="text-[10px] leading-none text-gray-500" style={{ height: `${cell()}px` }}>
                {s}
              </div>
            )}
          </For>
        </div>
        {/* transition cells */}
        <div
          class="flex flex-col gap-px"
          role="grid"
          aria-label="Markov transition matrix (drag cells vertically)"
        >
          <For each={matrix()}>
            {(row, i) => (
              <div class="flex gap-px">
                <For each={row}>
                  {(p, j) => (
                    <>
                      {/* biome-ignore lint/a11y/useFocusableInteractive: draggable
                        cell with arrow-key editing in onCellKeyDown */}
                      <div
                        role="gridcell"
                        tabindex={0}
                        aria-label={`P(${states()[i()]}→${states()[j()]}) = ${p.toFixed(3)}`}
                        class="relative cursor-ns-resize overflow-hidden rounded-sm bg-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        style={{ width: `${cell()}px`, height: `${cell()}px` }}
                        title={`P(${states()[i()]}→${states()[j()]}) = ${p.toFixed(3)} — drag ↕`}
                        onPointerDown={onPointerDown(i(), j())}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onKeyDown={onCellKeyDown(i(), j())}
                      >
                        <div
                          class="absolute bottom-0 left-0 w-full"
                          style={{ height: `${p * 100}%`, background: cellColor(p) }}
                        />
                        <span class="absolute top-0.5 left-0.5 font-mono text-[9px] text-gray-300">
                          {p.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
        {/* stationary distribution π along the right margin */}
        <div
          class="ml-1 flex flex-col justify-between"
          style={{ height: `${n() * cell() + (n() - 1)}px` }}
        >
          <For each={pi()}>
            {p => (
              <div class="flex items-center gap-1" style={{ height: `${cell()}px` }}>
                <div class="h-1 w-6 rounded-full bg-gray-700">
                  <div class="h-1 rounded-full bg-emerald-400" style={{ width: `${p * 100}%` }} />
                </div>
                <span class="font-mono text-[9px] text-gray-400">{p.toFixed(2)}</span>
              </div>
            )}
          </For>
        </div>
      </div>
      <div class="mt-1 text-[10px] text-gray-500">
        π = stationary distribution (power iteration) · drag cells ↕ to move probability mass
      </div>
    </div>
  )
}

export default MarkovTransitionGrid
