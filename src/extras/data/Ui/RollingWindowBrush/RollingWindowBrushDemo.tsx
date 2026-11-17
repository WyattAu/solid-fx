// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import RollingWindowBrush from './RollingWindowBrush'

// Demo: regime-switching series — drag the window across the 2024-Q3 break.
function RollingWindowBrushDemo() {
  const rng = mulberry32(0x99)
  const drift = normalSampler(rng, 0, 0.6)
  const data: number[] = []
  let level = 100
  for (let i = 0; i < 600; i++) {
    level += drift() * (i > 380 ? 2.2 : 1)
    data.push(level)
  }
  return (
    <div class="flex w-full justify-center p-6">
      <RollingWindowBrush data={data} label="level series with a mid-run break" width={480} />
    </div>
  )
}

export default RollingWindowBrushDemo
