// Built with gradient-gl (github.com/metaory/gradient-gl) — MIT.
import FlowGradient from './FlowGradient'

function FlowGradientDemo() {
  return (
    <div class="relative h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <FlowGradient />
      <p class="absolute inset-x-0 bottom-4 text-center text-xs font-medium tracking-wide text-white/60">
        seed c1.eba9 — deterministic duotone flow
      </p>
    </div>
  )
}

export default FlowGradientDemo
