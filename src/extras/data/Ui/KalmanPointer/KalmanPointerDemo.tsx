// solid-fx Data widget — original component (not a port).
import { For } from 'solid-js'
import KalmanPointer from './KalmanPointer'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function KalmanPointerDemo() {
  const configs = [
    { label: 'responsive (q 0.05, r 1)', processNoise: 0.05, measurementNoise: 1 },
    { label: 'smooth (q 0.01, r 4)', processNoise: 0.01, measurementNoise: 4 },
  ]
  return (
    <div class="flex w-full flex-col items-center gap-8 p-6">
      <For each={configs}>
        {c => (
          <KalmanPointer
            label={c.label}
            processNoise={c.processNoise}
            measurementNoise={c.measurementNoise}
          />
        )}
      </For>
      <p class="max-w-md text-center text-xs text-gray-500">
        dim = raw pointer · bright = Kalman-filtered. Move the pointer over a canvas to drive it
        directly.
      </p>
    </div>
  )
}

export default KalmanPointerDemo
