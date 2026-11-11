// Source: demo harness derived from github.com/codse/animata animata/background/moving-gradient.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import MovingGradient from './MovingGradient'

function MovingGradientDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <MovingGradient class="rounded-lg">
        <div class="relative z-10 flex flex-col items-center gap-1 px-10 py-8 text-center">
          <h3 class="text-2xl font-bold text-zinc-900">Moving Gradient</h3>
          <p class="text-sm text-zinc-700">The gradient drifts behind the content.</p>
        </div>
      </MovingGradient>
    </div>
  )
}

export default MovingGradientDemo
