// solid-fx Instruments widget — original component (not a port).
import { createSignal } from 'solid-js'
import SeedBadge from './SeedBadge'

// Demo: a seeded generative thumbnail proves the reproducibility contract —
// the same hex seed always paints the identical strip, across users.
import { mulberry32 } from '@/lib/num'
import { For } from 'solid-js'

function sampleStrip(seed: number): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: 40 }, () => rng())
}

function SeedBadgeDemo() {
  const [seed, setSeed] = createSignal(0x8f2a)
  const [values, setValues] = createSignal<number[]>(sampleStrip(0x8f2a))

  const apply = (s: number) => {
    setSeed(s)
    setValues(sampleStrip(s))
  }

  return (
    <div class="flex w-full flex-col items-center justify-center gap-4 p-6">
      <SeedBadge label="gallery" seed={seed()} onSeedChange={apply} />
      <div class="flex h-12 w-64 items-end gap-px" aria-hidden="true">
        <For each={values()}>
          {v => (
            <div class="flex-1 rounded-sm bg-sky-400/70" style={{ height: `${20 + v * 80}%` }} />
          )}
        </For>
      </div>
      <p class="font-mono text-xs text-gray-500">
        deterministic: seed #{seed().toString(16)} → identical strip everywhere
      </p>
    </div>
  )
}

export default SeedBadgeDemo
