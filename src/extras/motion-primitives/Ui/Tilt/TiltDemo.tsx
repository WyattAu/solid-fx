// Source: github.com/ibelick/motion-primitives app/docs/tilt/tilt-card-1.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
// PORT-NOTE: demo image swapped to picsum.photos per the demo contract
// (placeholder images only).
import Tilt from './Tilt'

function TiltDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <Tilt rotationFactor={8} isRevese>
        <div class="flex max-w-[270px] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <img
            src="https://picsum.photos/seed/solid-tilt/540/384"
            alt="Tilt demo artwork"
            class="h-48 w-full object-cover"
          />
          <div class="p-2">
            <h1 class="font-mono leading-snug text-zinc-100">Ghost in the Shell</h1>
            <p class="text-zinc-400">Kôkaku kidôtai</p>
          </div>
        </div>
      </Tilt>
    </div>
  )
}

export default TiltDemo
