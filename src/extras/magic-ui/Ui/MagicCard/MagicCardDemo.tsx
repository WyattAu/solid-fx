// Source: github.com/magicuidesign/magicui apps/www/registry/example/magic-card-demo.tsx@1ac985adca3cdfab9b1739253fd14209687c4e9c. License: MIT.
// Upstream demo wraps a shadcn Card + icon; replaced with an equivalent
// self-contained stage showing both gradient and orb modes.
import MagicCard from './MagicCard'

function MagicCardDemo() {
  return (
    <div class="flex h-96 w-full flex-col items-center justify-center gap-6 bg-gray-950 p-8 text-white">
      <MagicCard class="w-[350px] rounded-xl" gradientSize={280}>
        <div class="flex flex-col gap-2 rounded-xl bg-gray-900 p-6">
          <h3 class="text-lg font-semibold">Gradient mode</h3>
          <p class="text-sm text-gray-400">Hover to light the border gradient and spotlight.</p>
        </div>
      </MagicCard>
      <MagicCard mode="orb" class="w-[350px] rounded-xl">
        <div class="flex flex-col gap-2 rounded-xl bg-gray-900 p-6">
          <h3 class="text-lg font-semibold">Orb mode</h3>
          <p class="text-sm text-gray-400">A spring-damped glow orb follows the pointer.</p>
        </div>
      </MagicCard>
    </div>
  )
}

export default MagicCardDemo
