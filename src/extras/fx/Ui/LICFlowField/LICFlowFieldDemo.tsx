// solid-fx FX widget — original component (not a port).
import LICFlowField from './LICFlowField'

function LICFlowFieldDemo() {
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <LICFlowField label="vortex + source + saddle" />
      <LICFlowField
        label="vortex-dominated (dipole)"
        vortex={1.8}
        source={0.1}
        saddle={0.1}
        width={380}
        height={250}
        seed={0x42}
      />
    </div>
  )
}

export default LICFlowFieldDemo
