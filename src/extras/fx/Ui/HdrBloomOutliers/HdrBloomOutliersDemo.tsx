// solid-fx FX widget — original component (not a port).
import HdrBloomOutliers from './HdrBloomOutliers'

function HdrBloomOutliersDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <HdrBloomOutliers label="latency cloud (7 outliers > 3σ)" />
      <HdrBloomOutliers
        label="cold bloom (strength 0.4)"
        bloomStrength={0.4}
        seed={0x77}
        outlierCount={4}
        width={380}
        height={240}
      />
    </div>
  )
}

export default HdrBloomOutliersDemo
