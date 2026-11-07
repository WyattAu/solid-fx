// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Demo concept from EXTRAS-ROADMAP.md P2.

import type { ConfettiHandle } from './Confetti'
import Confetti from './Confetti'

function ConfettiDemo() {
  let handle: ConfettiHandle | undefined

  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <div class="relative h-48 w-full overflow-hidden rounded-xl border border-gray-800">
        <Confetti
          ref={h => {
            handle = h
          }}
          colors={['#818cf8', '#f472b6', '#facc15', '#4ade80']}
          shapes={['square', 'circle', 'star']}
          particleCount={70}
          spread={70}
        />
      </div>
      <button
        type="button"
        class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        onClick={() => void handle?.fire()}
      >
        fire another burst
      </button>
    </div>
  )
}

export default ConfettiDemo
