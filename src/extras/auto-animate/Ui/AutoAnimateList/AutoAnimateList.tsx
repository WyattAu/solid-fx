// solid-fx Data widget — original component (not a port).
// Auto-animated list: the @formkit/auto-animate engine observes the <ul>
// and FLIP-animates insertions, removals and moves automatically (research:
// vetted engine — MIT). Runs via Solid's native `use:` directive.
import { autoAnimate } from '@formkit/auto-animate'
import type { JSX } from 'solid-js'
import { createSignal, For, splitProps } from 'solid-js'
import { mulberry32 } from '@/lib/num'

export interface AutoAnimateListProps {
  /** Initial item labels (default: three servers). */
  items?: string[]
  /** RNG seed for generated names (default 1). */
  seed?: number
  /** Transition duration in ms (default 250). */
  duration?: number
  /** Easing (default 'ease-out'). */
  easing?: string
  label?: string
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const SITES = [
  'edge-fra',
  'edge-ams',
  'core-iad',
  'core-sfo',
  'edge-nrt',
  'edge-syd',
  'core-fra',
  'edge-gru',
]

export function AutoAnimateList(props: AutoAnimateListProps) {
  const [own, rest] = splitProps(props, [
    'items',
    'seed',
    'duration',
    'easing',
    'label',
    'class',
    'className',
    'style',
  ])

  const rng = mulberry32((own.seed ?? 1) >>> 0)
  const [items, setItems] = createSignal<string[]>(
    own.items ?? ['core-iad', 'edge-fra', 'edge-syd'],
  )
  const [counter, setCounter] = createSignal(0)

  const add = () => {
    setCounter(c => c + 1)
    const base = SITES[Math.floor(rng() * SITES.length)]
    setItems(list => [...list, `${base}-${String(counter()).padStart(2, '0')}`])
  }

  const remove = () => {
    setItems(list =>
      list.length > 1 ? list.filter((_, i) => i !== Math.floor(rng() * list.length)) : list,
    )
  }

  const shuffle = () => {
    setItems(list => {
      const next = list.slice()
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    })
  }

  return (
    <div
      {...rest}
      class={`inline-block select-none ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      <div class="mb-1.5 flex items-baseline justify-between text-xs text-gray-400">
        <span>{own.label ?? 'fleet members'}</span>
        <span class="flex items-center gap-1.5">
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={add}
          >
            + add
          </button>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={shuffle}
          >
            shuffle
          </button>
          <button
            type="button"
            class="rounded bg-gray-800 px-1.5 py-0.5 text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
            disabled={items().length <= 1}
            onClick={remove}
          >
            − remove
          </button>
        </span>
      </div>
      <ul
        ref={el =>
          autoAnimate(el, { duration: own.duration ?? 250, easing: own.easing ?? 'ease-out' })
        }
        class="w-64 space-y-1.5 rounded-lg border border-gray-800 bg-gray-900 p-2"
      >
        <For each={items()}>
          {item => (
            <li class="flex items-center gap-2 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-gray-200">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span class="font-mono">{item}</span>
            </li>
          )}
        </For>
      </ul>
      <p class="mt-1 text-[10px] text-gray-500">
        add / shuffle / remove — the FLIP engine animates every reflow ({items().length} items)
      </p>
    </div>
  )
}

export default AutoAnimateList
