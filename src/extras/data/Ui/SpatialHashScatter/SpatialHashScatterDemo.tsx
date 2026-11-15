// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import SpatialHashScatter from './SpatialHashScatter'

// Demo: 50,000 seeded points in three overlapping clusters + uniform noise —
// hover finds the nearest point with no per-query allocation (CSR hash).
function SpatialHashScatterDemo() {
  const rng = mulberry32(0xbeef)
  const cluster = (cx: number, cy: number, n: number): Array<{ x: number; y: number }> => {
    const gx = normalSampler(rng, cx, 14)
    const gy = normalSampler(rng, cy, 11)
    return Array.from({ length: n }, () => ({ x: gx(), y: gy() }))
  }
  const points = [
    ...cluster(30, 20, 18000),
    ...cluster(60, 55, 16000),
    ...cluster(20, 70, 12000),
    ...Array.from({ length: 4000 }, () => ({ x: rng() * 100, y: rng() * 100 })),
  ]
  return (
    <div class="flex w-full justify-center p-6">
      <SpatialHashScatter
        points={points}
        labels={['mm', 'mm']}
        label="laser metrology frame (50k pts)"
      />
    </div>
  )
}

export default SpatialHashScatterDemo
