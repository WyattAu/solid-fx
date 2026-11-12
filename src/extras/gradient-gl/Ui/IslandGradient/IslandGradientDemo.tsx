// Built with gradient-gl (github.com/metaory/gradient-gl) — MIT.
import IslandGradient from './IslandGradient'

function IslandGradientDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <IslandGradient />
      <p class="absolute inset-x-0 bottom-4 text-center text-xs font-medium tracking-wide text-white/60">
        seed n3.915c — noisy color islands
      </p>
    </div>
  )
}

export default IslandGradientDemo
