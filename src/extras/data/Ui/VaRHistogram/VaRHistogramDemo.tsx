// solid-fx Data widget — original component (not a port).
// Demo: heavy-tailed returns (t-distribution via normal ratio) — the VaR
// cutoff lands in the fat left tail where a Gaussian model would not.
import { For } from 'solid-js'
import { mulberry32, normalSampler } from '@/lib/num'
import VaRHistogram from './VaRHistogram'

function t3Returns(): number[] {
  const rng = mulberry32(0x71)
  const n = normalSampler(rng, 0, 1)
  const out: number[] = []
  for (let i = 0; i < 60_000; i++) {
    // Student-t(3) via normal / sqrt(chi2_3/3) approximated by gamma mix
    const w = n() * n() * 0.2 + 1
    out.push(n() / Math.sqrt(w) / 0.9)
  }
  return out
}

function VaRHistogramDemo() {
  const returns = t3Returns()
  return (
    <div class="flex w-full flex-col items-center gap-6 p-6">
      <For each={[60, 24]}>
        {bins => (
          <VaRHistogram
            label={`t(3) returns · ${bins} bins`}
            samples={returns}
            bins={bins}
            varAlpha={0.05}
            width={440}
            height={150}
          />
        )}
      </For>
    </div>
  )
}

export default VaRHistogramDemo
