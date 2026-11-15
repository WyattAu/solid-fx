// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import ParetoFrontier from './ParetoFrontier'

// Demo: 80 seeded "configurations" (cost, throughput) — the efficient
// frontier is the buy-list; everything shaded is dominated.
function ParetoFrontierDemo() {
  const rng = mulberry32(0x1776)
  const cost = normalSampler(rng, 40, 12)
  const throughput = normalSampler(rng, 900, 260)
  const points = Array.from({ length: 80 }, () => {
    const c = Math.max(5, cost())
    // efficient points trend upward: throughput correlates with cost
    return { x: c, y: throughput() + c * 18 }
  })
  return (
    <div class="flex w-full justify-center p-6">
      <ParetoFrontier
        points={points}
        labels={['cost €', 'req/s']}
        label="deployment sizing"
        size={320}
      />
    </div>
  )
}

export default ParetoFrontierDemo
