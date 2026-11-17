// solid-fx Data widget — original component (not a port).
// Bitset-accelerated faceted search: 100k rows encoded as one Uint32Array
// bitmask per attribute; toggling facets ANDs masks with popcount totals in
// about a millisecond, all client-side (research 03 #61).
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, splitProps } from 'solid-js'
import { bitsetAnd, bitsetCount, mulberry32 } from '@/lib/num'

export interface BitsetFacetsProps {
  /** Row count (default 100_000). */
  rows?: number
  /** RNG seed for the generated attribute masks (default 1). */
  seed?: number
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

interface Facet {
  key: string
  mask: Uint32Array
}

const WORDS = (rows: number) => Math.ceil(rows / 32)

export function BitsetFacets(props: BitsetFacetsProps) {
  const [own, rest] = splitProps(props, ['rows', 'seed', 'label', 'class', 'className', 'style'])

  const rows = () => own.rows ?? 100_000
  const words = WORDS(rows())

  // generate attribute masks from one seeded stream (bit i = row i has attr)
  const rng = mulberry32((own.seed ?? 1) >>> 0)
  const mkMask = (p: number): Uint32Array => {
    const m = new Uint32Array(words)
    for (let i = 0; i < rows(); i++) if (rng() < p) m[i >>> 5] |= 1 << (i & 31)
    return m
  }

  const facets: Facet[] = [
    { key: 'region=EU', mask: mkMask(0.4) },
    { key: 'region=US', mask: mkMask(0.35) },
    { key: 'tier=pro', mask: mkMask(0.22) },
    { key: 'active=true', mask: mkMask(0.65) },
    { key: 'churned=true', mask: mkMask(0.12) },
    { key: 'beta=true', mask: mkMask(0.08) },
  ]

  const [selected, setSelected] = createSignal<number[]>([2, 3]) // pro + active

  // AND the selected masks; count via popcount (SWAR). Recomputes only when
  // the selection changes.
  const result = createMemo(() => {
    const sel = selected()
    if (sel.length === 0) return { count: rows(), ms: 0 }
    const acc = new Uint32Array(words)
    acc.set(facets[sel[0]].mask)
    const t0 = performance.now()
    for (let k = 1; k < sel.length; k++) bitsetAnd(acc, facets[sel[k]].mask, acc)
    const count = bitsetCount(acc)
    return { count, ms: performance.now() - t0 }
  })

  const toggle = (idx: number) => {
    setSelected(sel =>
      sel.includes(idx) ? sel.filter(s => s !== idx) : [...sel, idx].sort((x, y) => x - y),
    )
  }

  const selectivity = () => ((result().count / rows()) * 100).toFixed(2)

  return (
    <div
      {...rest}
      class={`select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-2 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? `facets over ${rows().toLocaleString()} rows`}</span>
        <span class="font-mono" aria-live="polite">
          <span class="text-sky-300">{result().count.toLocaleString()}</span> rows · {selectivity()}
          % · {result().ms.toFixed(2)} ms
        </span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <For each={facets}>
          {(f, idx) => {
            const on = () => selected().includes(idx())
            const ownCount = bitsetCount(f.mask)
            return (
              <button
                type="button"
                class={`rounded-full border px-2 py-0.5 font-mono text-[10px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  on()
                    ? 'border-sky-500 bg-sky-900/60 text-sky-200'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500'
                }`}
                aria-pressed={on()}
                onClick={() => toggle(idx())}
              >
                {f.key}
                <span class="ml-1 text-gray-500">{ownCount.toLocaleString()}</span>
              </button>
            )
          }}
        </For>
      </div>
      <p class="mt-2 text-[10px] text-gray-500">
        masks AND'ed over {WORDS(rows()).toLocaleString()} Uint32 words · popcount totals
      </p>
    </div>
  )
}

export default BitsetFacets
