// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import MonteCarloBar from './MonteCarloBar'

// Demo: seeded Monte Carlo estimates with visible SE convergence —
// deterministic, so "Accept & Stop" lands the same number for everyone.
function MonteCarloBarDemo() {
  const rng = mulberry32(0xa11ce)
  const halfNormal = normalSampler(rng, 0, 1)
  const shifted = normalSampler(mulberry32(0xb0b), 2, 5)
  return (
    <div class="flex w-full max-w-xl flex-col gap-5 p-6">
      <MonteCarloBar label="E[|N(0,1)|] — true value 0.7979" sample={halfNormal} targetSe={0.004} />
      <MonteCarloBar label="E[N(2,5)] — true value 2" sample={shifted} targetSe={0.1} />
    </div>
  )
}

export default MonteCarloBarDemo
