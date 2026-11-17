// solid-fx Instruments widget — original component (not a port).
// PSD-guarded correlation matrix editor: three pairwise correlation sliders
// with live positive-semi-definiteness checking (cyclic Jacobi on the same
// kernel). Dragging past the feasible set is detected immediately and a
// one-click repair projects onto the nearest PSD matrix (research 02 #103).
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'
import { copyStateUrl, readStateFromHash } from '@/lib/urlState'
import { jacobiEigen } from '@/lib/num'

export interface PSDCorrelationEditorProps {
  /** Initial pairwise correlations [ρ_ab, ρ_ac, ρ_bc] (default [0.3, −0.2, 0.6]). */
  initial?: [number, number, number]
  labels?: [string, string, string]
  label?: string
  onInput?: (matrix: number[][]) => void
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const buildMatrix = (a: number, b: number, c: number): number[][] => [
  [1, a, b],
  [a, 1, c],
  [b, c, 1],
]

export function PSDCorrelationEditor(props: PSDCorrelationEditorProps) {
  const [own, rest] = splitProps(props, [
    'initial',
    'labels',
    'label',
    'onInput',
    'class',
    'className',
    'style',
  ])

  const labels = () => own.labels ?? ['A', 'B', 'C']
  const [ab, setAb] = createSignal(own.initial?.[0] ?? 0.3)
  const [ac, setAc] = createSignal(own.initial?.[1] ?? -0.2)
  const [bc, setBc] = createSignal(own.initial?.[2] ?? 0.6)
  const [shared, setShared] = createSignal('')

  // URL-state pattern: restore from #hash when a share link is opened
  void readStateFromHash<{ ab: number; ac: number; bc: number }>().then(state => {
    if (!state) return
    if (Number.isFinite(state.ab)) setAb(Math.round(state.ab * 1000) / 1000)
    if (Number.isFinite(state.ac)) setAc(Math.round(state.ac * 1000) / 1000)
    if (Number.isFinite(state.bc)) setBc(Math.round(state.bc * 1000) / 1000)
  })

  const matrix = () => buildMatrix(ab(), ac(), bc())

  const minEigen = () => jacobiEigen(matrix()).values[0]
  const isPSD = () => minEigen() >= -1e-9

  const repair = () => {
    // project onto the PSD cone: clamp eigenvalues, rescale to unit diagonal
    const { values, vectors } = jacobiEigen(matrix())
    const n = values.length
    const lam = values.map(v => Math.max(v, 1e-6))
    const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        let acc = 0
        for (let k = 0; k < n; k++) acc += vectors[k][i] * lam[k] * vectors[k][j]
        m[i][j] = acc
      }
    // rescale to correlation form
    const scale = m.map((_row, i) => 1 / Math.sqrt(Math.abs(m[i][i]) || 1e-12))
    const corr: number[][] = m.map((row, i) =>
      row.map((v, j) => Math.max(-1, Math.min(1, v * scale[i] * scale[j]))),
    )
    setAb(Math.round(corr[0][1] * 1000) / 1000)
    setAc(Math.round(corr[0][2] * 1000) / 1000)
    setBc(Math.round(corr[1][2] * 1000) / 1000)
    own.onInput?.(matrix())
  }

  const slider = (label: string, value: () => number, set: (v: number) => void) => (
    <label class="flex items-center gap-2 text-[11px] text-gray-300">
      <span class="w-8">{label}</span>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={value()}
        onInput={e => {
          set(Number(e.currentTarget.value))
          own.onInput?.(matrix())
        }}
        class="h-1 flex-1 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
      />
      <span class="w-10 text-right font-mono text-sky-300">{value().toFixed(2)}</span>
    </label>
  )

  const verdictColor = () => (isPSD() ? 'oklch(0.35 0.08 155)' : 'oklch(0.4 0.12 30)')

  return (
    <div
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-2 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'correlation matrix'}</span>
        <span
          class="rounded-full px-2 py-0.5 font-mono text-[10px]"
          style={{ background: verdictColor(), color: 'oklch(0.95 0.02 250)' }}
          aria-live="polite"
        >
          {isPSD() ? 'PSD ✓' : `not PSD (min λ = ${minEigen().toFixed(3)})`}
        </span>
      </div>
      <div class="space-y-1.5">
        {slider(`${labels()[0]}·${labels()[1]}`, ab, setAb)}
        {slider(`${labels()[0]}·${labels()[2]}`, ac, setAc)}
        {slider(`${labels()[1]}·${labels()[2]}`, bc, setBc)}
      </div>
      <button
        type="button"
        class="mb-2 mr-2 rounded bg-gray-800 px-2 py-0.5 text-[11px] text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
        onClick={async () => {
          const url = await copyStateUrl({ ab: ab(), ac: ac(), bc: bc() })
          setShared(url)
        }}
      >
        copy share link
      </button>
      {shared() && <span class="mr-2 text-[10px] text-emerald-400">link copied</span>}
      {isPSD() ? (
        <p class="mt-2 text-[10px] text-gray-500">
          min eigenvalue {minEigen().toFixed(4)} — the matrix is a valid covariance.
        </p>
      ) : (
        <button
          type="button"
          class="mt-2 rounded bg-amber-700 px-2 py-0.5 text-[11px] text-amber-100 outline-none hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400"
          onClick={repair}
        >
          repair to nearest PSD matrix
        </button>
      )}
    </div>
  )
}

export default PSDCorrelationEditor
