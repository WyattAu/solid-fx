// Source: demo harness derived from github.com/codse/animata animata/background/interactive-grid.stories.tsx@25c27e5a874c60a56dcc1609df3b2c4f5f8456f8. License: MIT.
import InteractiveGrid from './InteractiveGrid'

function InteractiveGridDemo() {
  return (
    <div class="h-96 w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <InteractiveGrid>
        <div class="pointer-events-none flex h-full max-w-sm flex-col items-center justify-center text-center text-zinc-800">
          <h1 class="text-4xl font-bold">Hello there!</h1>
          <p class="text-base text-balance">
            Hover over the small squares to see the animation ripple across the grid.
          </p>
        </div>
      </InteractiveGrid>
    </div>
  )
}

export default InteractiveGridDemo
