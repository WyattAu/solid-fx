// solid-fx Instruments widget — original component (not a port).
// Deterministic RNG seed + rewind pill for stochastic/generative widgets:
// the die rolls a fresh seed, the hex chip guarantees bit-identical
// cross-user reproduction, and the history popover restores recent seeds.
import type { JSX } from 'solid-js'
import { createSignal, For, Show, splitProps } from 'solid-js'

export interface SeedBadgeProps {
  /** Initial seed (default: crypto random). */
  seed?: number
  /** History depth kept for the rewind popover (default 5). */
  depth?: number
  label?: string
  /** Fired whenever the active seed changes (die or history restore). */
  onSeedChange?: (seed: number) => void
  /** Solid class alias, merged alongside `className`. */
  class?: string
  className?: string
  style?: JSX.CSSProperties
}

const freshSeed = (): number => {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0]
  }
  return (Math.random() * 0x100000000) >>> 0
}

const hex = (seed: number) => (seed & 0xffff).toString(16).padStart(4, '0').toUpperCase()

export function SeedBadge(props: SeedBadgeProps) {
  const [own, rest] = splitProps(props, [
    'seed',
    'depth',
    'label',
    'onSeedChange',
    'class',
    'className',
    'style',
  ])

  const depth = () => own.depth ?? 5
  const [seed, setSeed] = createSignal(own.seed ?? freshSeed())
  const [history, setHistory] = createSignal<number[]>([])
  const [open, setOpen] = createSignal(false)

  const activate = (next: number) => {
    const current = seed()
    if (next === current) return
    setHistory(h => [current, ...h.filter(s => s !== next)].slice(0, depth()))
    setSeed(next)
    setOpen(false)
    own.onSeedChange?.(next)
  }

  const reroll = () => activate(freshSeed())

  return (
    <div
      {...rest}
      class={`relative inline-flex select-none items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-1 py-0.5 text-xs ${own.class ?? ''} ${own.className ?? ''}`}
      style={own.style}
    >
      {own.label !== undefined && <span class="pl-1.5 text-gray-400">{own.label}</span>}
      {/* hex chip: opens history / restores */}
      <button
        type="button"
        class="rounded-full px-1.5 py-0.5 font-mono text-gray-200 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-label={`seed ${hex(seed())} — show history`}
        aria-expanded={open()}
        title={`seed: ${seed()} (bit-identical repro)`}
        onClick={() => setOpen(o => !o)}
      >
        #{hex(seed())}
      </button>
      {/* die: fresh seed */}
      <button
        type="button"
        class="rounded-full px-1.5 py-0.5 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-label="roll a new seed"
        title="new seed"
        onClick={reroll}
      >
        <svg
          viewBox="0 0 16 16"
          class="h-3.5 w-3.5 fill-none stroke-gray-300"
          aria-hidden="true"
          stroke-width="1.2"
        >
          <rect x="2" y="2" width="12" height="12" rx="2.5" />
          <circle cx="5.5" cy="5.5" r="0.9" class="fill-gray-300" />
          <circle cx="10.5" cy="10.5" r="0.9" class="fill-gray-300" />
          <circle cx="8" cy="8" r="0.9" class="fill-gray-300" />
        </svg>
      </button>
      {/* rewind: re-apply last seed (emits unchanged seed for re-render) */}
      <button
        type="button"
        class="rounded-full px-1.5 py-0.5 outline-none hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40"
        aria-label="replay current seed"
        title="re-emit current seed"
        onClick={() => own.onSeedChange?.(seed())}
      >
        <svg
          viewBox="0 0 16 16"
          class="h-3.5 w-3.5 fill-none stroke-gray-300"
          aria-hidden="true"
          stroke-width="1.2"
        >
          <path d="M3 8 a5 5 0 1 1 1.5 3.6" stroke-linecap="round" />
          <path d="M3 12.5 V8.8 h3.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <Show when={open() && history().length > 0}>
        <div class="absolute top-full left-0 z-20 mt-1 w-max rounded-md border border-gray-700 bg-gray-900 py-1 shadow-xl">
          <div class="px-2 pb-1 text-[10px] tracking-wide text-gray-500 uppercase">
            recent seeds
          </div>
          <For each={history()}>
            {s => (
              <button
                type="button"
                class="block w-full px-2 py-1 text-left font-mono text-gray-300 outline-none hover:bg-gray-800 focus-visible:bg-gray-800 focus-visible:outline-none"
                onClick={() => activate(s)}
              >
                #{hex(s)}
                <span class="ml-2 text-[10px] text-gray-500">{s}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default SeedBadge
