// Built with tsParticles (github.com/tsparticles/tsparticles) — MIT. Demo concept from EXTRAS-ROADMAP.md P2.
import Emojis from './Emojis'

function EmojisDemo() {
  return (
    <div class="flex h-96 w-full flex-col gap-4 p-4">
      <div class="relative h-64 w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
        <Emojis emojis={['🚀', '🛸', '🪐', '☄️', '🌙', '⭐']} count={36} size={22} speed={2.5} />
      </div>
      <p class="text-sm text-gray-500">
        emoji particles via the slim bundle&apos;s emoji shape — pass any set of characters through
        the `emojis` prop.
      </p>
    </div>
  )
}

export default EmojisDemo
