// Built with tsParticles preset snow (github.com/tsparticles/tsparticles) — Demo concept from EXTRAS-ROADMAP.md P2.
import Snow from './Snow'

function SnowDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
        <Snow count={120} speed={2.5} />
      </div>
      <p class="text-sm text-gray-500">
        falling snow with side-to-side wobble (@tsparticles/preset-snow).
      </p>
    </div>
  )
}

export default SnowDemo
