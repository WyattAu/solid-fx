// solid-fx Instruments widget — original component (not a port).
import { createSignal } from 'solid-js'
import SternBrocotStepper from './SternBrocotStepper'

function SternBrocotStepperDemo() {
  const [v, setV] = createSignal(Math.PI)
  return (
    <div class="flex w-full flex-wrap items-start justify-center gap-10 p-6">
      <div class="w-64">
        <SternBrocotStepper label="gear ratio" value={v()} onInput={setV} maxDenominator={64} />
        <p class="mt-3 font-mono text-[10px] text-gray-500">
          ω_out = ω_in / ratio = {(100 / Math.max(1e-9, v())).toFixed(4)} Hz from 100 Hz
        </p>
      </div>
      <div class="w-64">
        <SternBrocotStepper
          label="sample stride (coarse den cap 16)"
          value={1.5}
          onInput={setV}
          maxDenominator={16}
          step={0.05}
        />
      </div>
    </div>
  )
}

export default SternBrocotStepperDemo
