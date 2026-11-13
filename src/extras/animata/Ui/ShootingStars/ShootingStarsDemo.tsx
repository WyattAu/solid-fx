// Source: demo harness derived from github.com/codse/animata animata/background/shooting-stars.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import ShootingStars from './ShootingStars'

function ShootingStarsDemo() {
  return (
    <ShootingStars class="h-96 w-full rounded-lg border border-gray-800">
      <div class="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
        <span class="text-2xl font-semibold text-white">Shooting stars</span>
        <span class="max-w-xs text-xs text-neutral-400">
          Streaks of random length and speed cross a twinkling night sky, recycling forever
        </span>
      </div>
    </ShootingStars>
  )
}

export default ShootingStarsDemo
