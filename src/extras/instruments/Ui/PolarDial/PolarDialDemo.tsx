// solid-fx Instruments widget — original component (not a port).
import PolarDial from './PolarDial'

function PolarDialDemo() {
  return (
    <div class="flex w-full flex-wrap items-center justify-center gap-8 p-6">
      <PolarDial label="phase offset (single turn)" value={135} />
      <PolarDial
        label="azimuth servo (multi-turn)"
        value={720 + 210}
        turns={3}
        step={15}
        size={150}
      />
    </div>
  )
}

export default PolarDialDemo
