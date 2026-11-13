// Source: demo harness derived from github.com/codse/animata animata/preloader/vertical-tiles.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import VerticalTiles from './VerticalTiles'

function VerticalTilesDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 p-8">
      <VerticalTiles
        tileClassName="bg-linear-to-r from-zinc-100 to-zinc-300"
        minTileWidth={32}
        animationDuration={0.5}
        animationDelay={1}
        stagger={0.05}
      >
        <div class="flex h-72 w-full items-center justify-center bg-zinc-800">
          <p class="text-2xl font-extrabold text-white">Welcome to our amazing website!</p>
        </div>
      </VerticalTiles>
    </div>
  )
}

export default VerticalTilesDemo
