// Source: github.com/ibelick/motion-primitives app/docs/glow-effect/glow-effect-basic.tsx@120f64f6ca60348e251f929e9c81f11ccbe45eda. License: MIT.
import GlowEffect from './GlowEffect'

function GlowEffectDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
      <div class="relative inline-flex">
        <GlowEffect
          colors={['#8b5cf6', '#0090FF', '#00C6A2', '#FF5733']}
          blur="soft"
          duration={4}
        />
        <div class="relative rounded-md border border-gray-700 bg-gray-900 px-6 py-3 font-mono text-sm text-gray-100">
          Deploy to production
        </div>
      </div>
    </div>
  )
}

export default GlowEffectDemo
