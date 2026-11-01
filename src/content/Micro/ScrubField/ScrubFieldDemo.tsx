import { createSignal } from 'solid-js'
import ScrubField from './ScrubField'

function ScrubFieldDemo() {
  const [radius, setRadius] = createSignal(24)
  return (
    <div class="flex h-96 w-full flex-col items-start justify-center gap-4 bg-gray-950 p-8 text-white">
      <ScrubField label="Radius" suffix="px" value={radius()} onChange={setRadius} showDirty />
      <ScrubField
        label="Blur"
        suffix="px"
        defaultValue={8}
        min={0}
        max={40}
        step={0.5}
        size="sm"
        accent="#38bdf8"
      />
      <ScrubField
        label="Duration"
        suffix="ms"
        defaultValue={400}
        min={0}
        max={2000}
        step={10}
        size="lg"
        accent="#f5a524"
      />
      <div
        class="rounded-2xl bg-blue-400/20 px-8 py-6 text-lg"
        style={{ 'border-radius': `${radius()}px` }}
      >
        radius: {radius()}px
      </div>
    </div>
  )
}

export default ScrubFieldDemo
