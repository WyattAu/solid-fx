// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import BulletViolinKpi from './BulletViolinKpi'

function BulletViolinKpiDemo() {
  const latency = normalSampler(mulberry32(0x51f), 42, 6)
  const history = Array.from({ length: 220 }, latency)
  const gmv = normalSampler(mulberry32(0x78), 5.1, 0.35)
  const history2 = Array.from({ length: 220 }, () => Math.exp(gmv()))
  return (
    <div class="flex w-full flex-col gap-5 p-6">
      <BulletViolinKpi
        label="p99 latency"
        unit=" ms"
        history={history}
        target={[30, 55]}
        yesterday={history[history.length - 2] ?? 40}
        live={49.7}
      />
      <BulletViolinKpi
        label="checkout GMV"
        unit=" €"
        history={history2}
        target={[120, 260]}
        yesterday={232}
        live={189}
      />
    </div>
  )
}

export default BulletViolinKpiDemo
