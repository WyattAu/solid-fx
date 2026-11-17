// solid-fx Data widget — original component (not a port).
import { For } from 'solid-js'
import { mulberry32 } from '@/lib/num'
import ACFCorrelogram from './ACFCorrelogram'

function series(seed: number, f: (i: number) => number): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: 300 }, (_, i) => f(i) + (rng() - 0.5) * 1.5)
}

function ACFCorrelogramDemo() {
  return (
    <div class="flex w-full flex-col items-center gap-5 p-6">
      <ACFCorrelogram
        label="AR(1) trend — persistent"
        data={series(0x31, i => i * 0.05 + 3 * Math.sin(i / 9))}
      />
      <For each={[0x32, 0x33]}>
        {seed => (
          <ACFCorrelogram
            label={seed === 0x32 ? 'iid noise — white' : 'weekly cycle — periodic'}
            data={series(seed, i => (seed === 0x33 ? 4 * Math.sin((2 * Math.PI * i) / 14) : 0))}
          />
        )}
      </For>
    </div>
  )
}

export default ACFCorrelogramDemo
