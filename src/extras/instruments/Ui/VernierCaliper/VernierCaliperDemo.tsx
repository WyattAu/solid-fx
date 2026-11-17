// solid-fx Instruments widget — original component (not a port).
import VernierCaliper from './VernierCaliper'

function VernierCaliperDemo() {
  return (
    <div class="flex w-full flex-col items-center gap-8 p-6">
      <VernierCaliper
        label="optical alignment (µm gear)"
        value={2.5}
        range={10}
        fineStep={0.0001}
        width={360}
      />
      <p class="max-w-md text-center text-xs text-gray-500">
        drag along the track to scrub · pull downward mid-drag to downshift the gear into
        micro-precision without releasing
      </p>
    </div>
  )
}

export default VernierCaliperDemo
