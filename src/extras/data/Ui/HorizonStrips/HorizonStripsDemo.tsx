// solid-fx Data widget — original component (not a port).
import { normalSampler, mulberry32 } from '@/lib/num'
import HorizonStrips from './HorizonStrips'

function HorizonStripsDemo() {
  const mk = (seed: number, mu: number, sigma: number, spike?: number) => {
    const g = normalSampler(mulberry32(seed), mu, sigma)
    const values = Array.from({ length: 480 }, g)
    if (spike !== undefined) values[120] = spike
    return values
  }
  return (
    <div class="w-full max-w-md p-6">
      <HorizonStrips
        series={[
          { label: 'cpu-0', values: mk(0x10, 40, 8) },
          { label: 'cpu-1', values: mk(0x11, 55, 12, 99) },
          { label: 'mem-gb', values: mk(0x12, 22, 3) },
          { label: 'io-ms', values: mk(0x13, 8, 5) },
          { label: 'net-mbit', values: mk(0x14, 64, 20) },
        ]}
      />
    </div>
  )
}

export default HorizonStripsDemo
