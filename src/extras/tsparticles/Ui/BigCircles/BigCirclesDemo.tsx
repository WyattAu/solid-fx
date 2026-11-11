// Built with tsParticles preset big circles (github.com/tsparticles/tsparticles) — Demo concept from EXTRAS-ROADMAP.md P2.
import BigCircles from './BigCircles'

function BigCirclesDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
        <BigCircles count={40} sizeMin={90} sizeMax={220} speed={12} />
      </div>
      <p class="text-sm text-gray-500">
        large soft rainbow circles drifting upward (@tsparticles/preset-big-circles).
      </p>
    </div>
  )
}

export default BigCirclesDemo
