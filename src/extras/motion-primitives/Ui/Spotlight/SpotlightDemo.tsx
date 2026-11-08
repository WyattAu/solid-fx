// Source: github.com/ibelick/motion-primitives app/docs/spotlight/spotlight-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import Spotlight from './Spotlight'

function SpotlightDemo() {
  return (
    <div class="relative flex aspect-video h-[200px] w-full items-center justify-center rounded-sm border border-zinc-800 bg-zinc-950">
      <Spotlight
        class="bg-zinc-500 blur-2xl"
        size={64}
        springOptions={{
          bounce: 0.3,
          duration: 0.1,
        }}
      />
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-zinc-800 bg-zinc-950 p-2">
        <p class="font-mono text-sm uppercase tracking-widest text-zinc-100">Spotlight</p>
      </div>
    </div>
  )
}

export default SpotlightDemo
