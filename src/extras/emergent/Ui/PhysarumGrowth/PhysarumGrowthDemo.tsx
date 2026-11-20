// solid-fx Emergent widget — original component (not a port).
import PhysarumGrowth from './PhysarumGrowth'

function PhysarumGrowthDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <PhysarumGrowth label="transport network (1400 agents)" />
      <PhysarumGrowth
        label="sparse web (600 agents, faster decay)"
        agents={600}
        decay={0.14}
        seed={0x77}
        width={360}
        height={260}
      />
    </div>
  )
}

export default PhysarumGrowthDemo
