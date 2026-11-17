// solid-fx Instruments widget — original component (not a port).
import { createSignal } from 'solid-js'
import LangevinScrubber from './LangevinScrubber'

function LangevinScrubberDemo() {
  const [t, setT] = createSignal(0.03)
  return (
    <div class="flex w-full flex-col items-center gap-8 p-6">
      <LangevinScrubber
        label="double-well: cold scrub (T ≈ 0 escapes nothing)"
        temperature={0.004}
        width={380}
      />
      <label class="flex items-center gap-2 text-xs text-gray-400">
        shared temperature
        <input
          type="range"
          min={0}
          max={0.2}
          step={0.005}
          value={t()}
          onInput={e => setT(Number(e.currentTarget.value))}
          class="h-1 w-40 cursor-ew-resize appearance-none rounded-full bg-gray-700 accent-sky-400"
        />
        <span class="font-mono text-sky-300">{t().toFixed(3)}</span>
      </label>
      <LangevinScrubber
        label="same well, hot exploration (T anneals between wells)"
        temperature={t()}
        width={380}
      />
    </div>
  )
}

export default LangevinScrubberDemo
